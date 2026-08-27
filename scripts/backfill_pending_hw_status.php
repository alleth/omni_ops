#!/usr/bin/php -q
<?php
/**
 * One-time backfill: set hw_tbl.hw_status = 'Pending' for any hardware
 * record that already has a PENDING PULL_OUT/RELOCATION request against it.
 *
 * Why this is needed: RequestTblController::add() only started flipping
 * hw_status to 'Pending' on request creation as of the fix that added this
 * script. Any request that was already sitting PENDING before that fix
 * shipped was created under the old code path, so its hardware is still
 * sitting at 'On Site' (or whatever it was) with nothing to correct it —
 * this script is that one-time correction. New requests going forward don't
 * need it; RequestTblController::add() handles them itself.
 *
 * Matching hw_tbl for each pending request:
 *   1. request_tbl.hw_id, if set and it still resolves — this is how new
 *      requests link to hardware, and is unambiguous when present.
 *   2. Otherwise, fall back to request_tbl.asset_num / serial_num against
 *      hw_tbl.hw_asset_num / hw_serial_num, restricted to hardware currently
 *      reading as On Site. Requires whichever of the two fields aren't
 *      placeholder values (see ASSET_SERIAL_PLACEHOLDERS in
 *      MasterfileInventory.js — this list is kept in sync with it) to match
 *      exactly; if both fields are usable both must match, if only one is
 *      usable that one must match ALONE against exactly one hw_tbl row.
 *      A request with no usable field, or a fallback match that resolves to
 *      more than one hw_tbl row (ambiguous — asset/serial numbers aren't
 *      guaranteed unique across sites), is left unresolved and reported for
 *      manual review rather than guessed at.
 *
 * Safe to re-run: only touches hardware whose hw_status currently reads as
 * "on site" (see isOnSiteStatus() in MasterfileInventory.js for the same
 * normalization) — hardware already 'Pending', 'Pullout', or anything else
 * is left untouched and reported as skipped, not overwritten.
 *
 * Usage:
 *   php scripts/backfill_pending_hw_status.php            # apply the change
 *   php scripts/backfill_pending_hw_status.php --dry-run   # preview only
 */

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/config/bootstrap.php';

use Cake\ORM\TableRegistry;

$dryRun = in_array('--dry-run', $argv, true);

$RequestTbl = TableRegistry::getTableLocator()->get('RequestTbl');
$HwTbl = TableRegistry::getTableLocator()->get('HwTbl');

// Same set RequestTblController::add() acts on.
$requestTypes = ['PULL_OUT', 'RELOCATION'];
// Same normalization Inventory/Dashboard/Reports/Landing use to decide
// whether a unit currently reads as "on site".
$onSiteStatuses = ['On Site', 'Onsite', 'on site', 'onsite', 'ON SITE', 'ONSITE'];
// Mirrors ASSET_SERIAL_PLACEHOLDERS in MasterfileInventory.js.
$placeholders = [
    'N/A', 'NA', 'NONE', 'NO TAG', 'NO PE', 'REMOVED', 'UNREADABLE',
    'NOT_APPLICABLE', 'TAG_REMOVED_UNREADABLE', 'UNREADABLE_MISSING',
    'NULL', 'NOT SET', '',
];
$isPlaceholder = function ($v) use ($placeholders) {
    return in_array(strtoupper(trim((string)$v)), $placeholders, true);
};
$isOnSite = function ($hw) use ($onSiteStatuses) {
    return in_array($hw->hw_status, $onSiteStatuses, true);
};

$pendingRequests = $RequestTbl->find()
    ->where([
        'status' => 'PENDING',
        'request_type IN' => $requestTypes,
    ])
    ->all();

$totalRequests = 0;
$updated = 0;
$skippedNotOnSite = 0;
$unresolved = 0;
$ambiguous = 0;
$skippedDuplicateRequest = 0;
$seenHwIds = [];

foreach ($pendingRequests as $request) {
    $totalRequests++;
    $hw = null;
    $matchedVia = null;

    // 1. hw_id, if it still resolves.
    if (!empty($request->hw_id)) {
        try {
            $hw = $HwTbl->get($request->hw_id);
            $matchedVia = 'hw_id';
        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            $hw = null; // fall through to the asset/serial fallback below
        }
    }

    // 2. asset_num / serial_num fallback against On Site hw_tbl rows.
    if (!$hw) {
        $assetUsable = !$isPlaceholder($request->asset_num);
        $serialUsable = !$isPlaceholder($request->serial_num);

        if (!$assetUsable && !$serialUsable) {
            echo "UNRESOLVED  request #{$request->request_id}: no hw_id, and asset_num/serial_num are both missing or placeholder values\n";
            $unresolved++;
            continue;
        }

        // Deliberately NOT filtering by hw_status here (unlike the hw_id path
        // above) -- doing so at the SQL level would silently conflate "no
        // hw_tbl row has this asset/serial at all" with "it matches, but it's
        // already Pending/Pullout/something else, so there's nothing to do"
        // into one ambiguous "no match" bucket. Matching on identity first
        // and checking status after (same as the hw_id path) keeps those
        // two cases distinguishable below.
        $conditions = [];
        if ($assetUsable && $serialUsable) {
            $conditions['hw_asset_num'] = trim($request->asset_num);
            $conditions['hw_serial_num'] = trim($request->serial_num);
        } elseif ($assetUsable) {
            $conditions['hw_asset_num'] = trim($request->asset_num);
        } else {
            $conditions['hw_serial_num'] = trim($request->serial_num);
        }

        $candidates = $HwTbl->find()->where($conditions)->all()->toArray();

        if (count($candidates) === 0) {
            echo "UNRESOLVED  request #{$request->request_id}: no hw_tbl row at all matches asset_num='{$request->asset_num}' serial_num='{$request->serial_num}' -- check for a typo/formatting mismatch\n";
            $unresolved++;
            continue;
        }
        if (count($candidates) > 1) {
            $ids = implode(', ', array_map(fn($c) => $c->hw_id, $candidates));
            echo "AMBIGUOUS   request #{$request->request_id}: asset_num='{$request->asset_num}' serial_num='{$request->serial_num}' matches multiple hw_tbl rows (hw_id: {$ids}) -- skipping, needs manual review\n";
            $ambiguous++;
            continue;
        }

        $hw = $candidates[0];
        $matchedVia = 'asset/serial';
    }

    // A hw_id (or asset/serial match) can appear on more than one pending
    // request only in edge cases (e.g. data predating the duplicate-request
    // guard); once its hw_status is set, later rows for the same hw_id are
    // no-ops. Reported (not silently skipped) so every scanned request is
    // accounted for in the summary counts.
    if (isset($seenHwIds[$hw->hw_id])) {
        echo "SKIP        hw_id {$hw->hw_id} (request #{$request->request_id}, matched via {$matchedVia}): already handled by an earlier PENDING request against the same hardware (request #{$seenHwIds[$hw->hw_id]})\n";
        $skippedDuplicateRequest++;
        continue;
    }
    $seenHwIds[$hw->hw_id] = $request->request_id;

    if (!$isOnSite($hw)) {
        echo "SKIP        hw_id {$hw->hw_id} (request #{$request->request_id}, matched via {$matchedVia}): hw_status is '{$hw->hw_status}', not On Site — leaving as-is\n";
        $skippedNotOnSite++;
        continue;
    }

    echo ($dryRun ? "WOULD UPDATE " : "UPDATE      ") . "hw_id {$hw->hw_id} (request #{$request->request_id}, {$request->request_type}, matched via {$matchedVia}): '{$hw->hw_status}' -> 'Pending'\n";

    if (!$dryRun) {
        $hw->hw_status = 'Pending';
        $hw->updated_at = date('Y-m-d H:i:s');
        if (!$HwTbl->save($hw)) {
            echo "  !! save failed for hw_id {$hw->hw_id}: " . json_encode($hw->getErrors()) . "\n";
            continue;
        }
    }

    $updated++;
}

echo "\n";
echo "PENDING requests scanned: {$totalRequests}\n";
echo ($dryRun ? 'Would update' : 'Updated') . ": {$updated}\n";
echo "Skipped (hw_status not On Site): {$skippedNotOnSite}\n";
echo "Skipped (duplicate PENDING request against same hardware): {$skippedDuplicateRequest}\n";
echo "Ambiguous (multiple asset/serial matches): {$ambiguous}\n";
echo "Unresolved (no match found): {$unresolved}\n";

if ($dryRun) {
    echo "\nDry run only — no changes were written. Re-run without --dry-run to apply.\n";
}

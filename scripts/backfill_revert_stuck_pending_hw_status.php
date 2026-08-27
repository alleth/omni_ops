#!/usr/bin/php -q
<?php
/**
 * One-time backfill: revert hw_tbl.hw_status from 'Pending' back to
 * 'On Site' for hardware whose only PULL_OUT/RELOCATION request(s) are
 * CANCELED or REJECTED -- i.e. hardware left stranded at 'Pending' with no
 * live request left to explain it.
 *
 * Why this is needed: RequestTblController::add() flips hw_status to
 * 'Pending' the moment a PULL_OUT/RELOCATION request is created (see
 * scripts/backfill_pending_hw_status.php for the forward-direction
 * backfill of that). Reverting it back on cancel/reject was only added
 * later -- to cancelRequestCore() (dev/src/utils/requestActions.js) and the
 * reject handler in RequestDetailModal.js -- via updateHardwareStatusForRequest().
 * Any request that was CANCELED or REJECTED before that revert code shipped
 * never had its hardware's hw_status touched, so it's still sitting at
 * 'Pending' indefinitely: invisible in every "On Site" view (Inventory,
 * Hardware Management, Reports, the public Landing page) with nothing left
 * in request_tbl to explain why. This script is that one-time correction.
 * New cancellations/rejections going forward don't need it -- the app
 * handles them itself.
 *
 * Matching hw_tbl (status = 'Pending') to a request, per row:
 *   1. request_tbl.hw_id, if any PULL_OUT/RELOCATION request references this
 *      hardware -- this is how new requests link to hardware, and is
 *      unambiguous when present.
 *   2. Otherwise, fall back to hw_tbl.hw_asset_num / hw_serial_num against
 *      request_tbl.asset_num / serial_num, mirroring the reverse-direction
 *      fallback in backfill_pending_hw_status.php. Placeholder values (see
 *      ASSET_SERIAL_PLACEHOLDERS in MasterfileInventory.js -- this list is
 *      kept in sync with it) are never used to match.
 *
 * For whichever requests match (either path), a hw row is only reverted if
 * NONE of them are still PENDING or APPROVED -- either means the 'Pending'
 * status is currently legitimate (an active request, or an approval that
 * should have moved it to 'Pullout' instead, which is a different bug this
 * script isn't the fix for) and the row is left alone and reported.
 * A hw_id with no matching request at all is left unresolved and reported
 * for manual review rather than guessed at.
 *
 * Safe to re-run: only touches hardware whose hw_status currently reads
 * 'Pending' -- hardware already reverted (or anything else) is no longer a
 * candidate on the next run.
 *
 * Usage:
 *   php scripts/backfill_revert_stuck_pending_hw_status.php            # apply
 *   php scripts/backfill_revert_stuck_pending_hw_status.php --dry-run   # preview only
 */

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/config/bootstrap.php';

use Cake\ORM\TableRegistry;

$dryRun = in_array('--dry-run', $argv, true);

$RequestTbl = TableRegistry::getTableLocator()->get('RequestTbl');
$HwTbl = TableRegistry::getTableLocator()->get('HwTbl');

// Same set RequestTblController::add() acts on.
$requestTypes = ['PULL_OUT', 'RELOCATION'];
// Statuses that mean the 'Pending' hw_status is currently legitimate (or at
// least not this script's problem to fix) -- leave those hw rows alone.
$activeStatuses = ['PENDING', 'APPROVED'];
// Mirrors ASSET_SERIAL_PLACEHOLDERS in MasterfileInventory.js.
$placeholders = [
    'N/A', 'NA', 'NONE', 'NO TAG', 'NO PE', 'REMOVED', 'UNREADABLE',
    'NOT_APPLICABLE', 'TAG_REMOVED_UNREADABLE', 'UNREADABLE_MISSING',
    'NULL', 'NOT SET', '',
];
$isPlaceholder = function ($v) use ($placeholders) {
    return in_array(strtoupper(trim((string)$v)), $placeholders, true);
};

$stuckHardware = $HwTbl->find()
    ->where(['hw_status' => 'Pending'])
    ->all();

$totalHw = 0;
$reverted = 0;
$skippedStillActive = 0;
$unresolved = 0;

foreach ($stuckHardware as $hw) {
    $totalHw++;
    $matchedVia = null;

    // 1. Any PULL_OUT/RELOCATION request referencing this hw_id.
    $requests = $RequestTbl->find()
        ->where([
            'hw_id' => $hw->hw_id,
            'request_type IN' => $requestTypes,
        ])
        ->orderDesc('created_at')
        ->all()
        ->toArray();
    if (!empty($requests)) {
        $matchedVia = 'hw_id';
    }

    // 2. asset_num / serial_num fallback (legacy rows created before hw_id
    //    linking existed on the request side).
    if (empty($requests)) {
        $assetUsable = !$isPlaceholder($hw->hw_asset_num);
        $serialUsable = !$isPlaceholder($hw->hw_serial_num);

        if (!$assetUsable && !$serialUsable) {
            echo "UNRESOLVED  hw_id {$hw->hw_id}: no PULL_OUT/RELOCATION request references it by hw_id, and hw_asset_num/hw_serial_num are both missing or placeholder values\n";
            $unresolved++;
            continue;
        }

        $conditions = ['request_type IN' => $requestTypes];
        if ($assetUsable && $serialUsable) {
            $conditions['asset_num'] = trim($hw->hw_asset_num);
            $conditions['serial_num'] = trim($hw->hw_serial_num);
        } elseif ($assetUsable) {
            $conditions['asset_num'] = trim($hw->hw_asset_num);
        } else {
            $conditions['serial_num'] = trim($hw->hw_serial_num);
        }

        $requests = $RequestTbl->find()
            ->where($conditions)
            ->orderDesc('created_at')
            ->all()
            ->toArray();

        if (empty($requests)) {
            echo "UNRESOLVED  hw_id {$hw->hw_id}: no request_tbl row at all matches asset_num='{$hw->hw_asset_num}' serial_num='{$hw->hw_serial_num}' -- check for a typo/formatting mismatch, or a hw_id link that predates this hardware's request\n";
            $unresolved++;
            continue;
        }

        $matchedVia = 'asset/serial';
    }

    $activeMatch = null;
    foreach ($requests as $r) {
        if (in_array(strtoupper($r->status ?? ''), $activeStatuses, true)) {
            $activeMatch = $r;
            break;
        }
    }

    if ($activeMatch) {
        echo "SKIP        hw_id {$hw->hw_id} (matched via {$matchedVia}): request #{$activeMatch->request_id} is still {$activeMatch->status} -- the 'Pending' hw_status is either legitimate or a different bug, not this script's job\n";
        $skippedStillActive++;
        continue;
    }

    // Everything matched is terminal (CANCELED/REJECTED) -- the most recent
    // one (already sorted DESC) is just for the log line.
    $latest = $requests[0];

    echo ($dryRun ? "WOULD REVERT " : "REVERT      ") . "hw_id {$hw->hw_id} (matched via {$matchedVia}, most recent: request #{$latest->request_id}, {$latest->request_type}, {$latest->status}): 'Pending' -> 'On Site'\n";

    if (!$dryRun) {
        $hw->hw_status = 'On Site';
        $hw->updated_at = date('Y-m-d H:i:s');
        if (!$HwTbl->save($hw)) {
            echo "  !! save failed for hw_id {$hw->hw_id}: " . json_encode($hw->getErrors()) . "\n";
            continue;
        }
    }

    $reverted++;
}

echo "\n";
echo "Hardware currently at hw_status='Pending': {$totalHw}\n";
echo ($dryRun ? 'Would revert' : 'Reverted') . " to 'On Site': {$reverted}\n";
echo "Skipped (a request against it is still PENDING/APPROVED): {$skippedStillActive}\n";
echo "Unresolved (no matching request found): {$unresolved}\n";

if ($dryRun) {
    echo "\nDry run only — no changes were written. Re-run without --dry-run to apply.\n";
}

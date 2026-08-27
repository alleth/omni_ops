#!/usr/bin/php -q
<?php
/**
 * One-time cleanup: delete the uploaded attachment (pullout/relocation form)
 * for every request that's already sitting CANCELED, and clear its
 * attachment_path.
 *
 * Why this is needed: RequestTblController::update() only started deleting a
 * request's attachment automatically on the PENDING/REJECTED -> CANCELED
 * transition as of the fix that added this script. Any request that was
 * already CANCELED before that fix shipped never had this run against it, so
 * its attachment is still sitting on disk with attachment_path still pointing
 * at it -- this script is that one-time correction. New cancellations going
 * forward don't need it; RequestTblController::update() handles them itself.
 *
 * THIS DELETES FILES. It is NOT reversible -- there is no backup step. Always
 * run with --dry-run first and read the output before running for real.
 *
 * Safe to re-run: only acts on rows where attachment_path is still set, so a
 * second run after a successful first run finds nothing left to do.
 *
 * Usage:
 *   php scripts/backfill_delete_canceled_attachments.php            # apply
 *   php scripts/backfill_delete_canceled_attachments.php --dry-run   # preview only
 */

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/config/bootstrap.php';

use Cake\ORM\TableRegistry;

$dryRun = in_array('--dry-run', $argv, true);

$RequestTbl = TableRegistry::getTableLocator()->get('RequestTbl');

$canceledWithAttachment = $RequestTbl->find()
    ->where([
        'status' => 'CANCELED',
        'attachment_path IS NOT' => null,
        'attachment_path !=' => '',
    ])
    ->all();

$totalRequests = 0;
$deleted = 0;
$missingFileCleared = 0;
$failed = 0;

foreach ($canceledWithAttachment as $request) {
    $totalRequests++;

    $attachmentPath = $request->attachment_path;
    $fullPath = WWW_ROOT . ltrim(str_replace('/', DS, $attachmentPath), DS);
    $fileExists = is_file($fullPath);

    if ($dryRun) {
        if ($fileExists) {
            echo "WOULD DELETE  request #{$request->request_id}: {$attachmentPath} (and clear attachment_path)\n";
        } else {
            echo "WOULD CLEAR   request #{$request->request_id}: attachment_path='{$attachmentPath}' but file no longer exists on disk -- would just clear the stale path\n";
        }
        continue;
    }

    if ($fileExists) {
        if (@unlink($fullPath)) {
            echo "DELETED       request #{$request->request_id}: {$attachmentPath}\n";
        } else {
            echo "!! FAILED to delete file for request #{$request->request_id}: {$attachmentPath} -- leaving attachment_path as-is so this can be retried\n";
            $failed++;
            continue;
        }
    } else {
        echo "CLEARED       request #{$request->request_id}: attachment_path='{$attachmentPath}' was already missing from disk -- clearing the stale path\n";
        $missingFileCleared++;
    }

    $request->attachment_path = null;
    if (!$RequestTbl->save($request)) {
        echo "!! FAILED to clear attachment_path for request #{$request->request_id}: " . json_encode($request->getErrors()) . "\n";
        $failed++;
        continue;
    }

    if ($fileExists) {
        $deleted++;
    }
}

echo "\n";
echo "CANCELED requests with an attachment on file: {$totalRequests}\n";
if ($dryRun) {
    echo "Dry run only — no files were deleted and no database rows were changed. Re-run without --dry-run to apply.\n";
} else {
    echo "Files deleted (attachment_path cleared): {$deleted}\n";
    echo "Stale paths cleared (file was already missing): {$missingFileCleared}\n";
    echo "Failed: {$failed}\n";
}

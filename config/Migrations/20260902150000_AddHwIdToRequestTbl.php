<?php
declare(strict_types=1);

use Migrations\AbstractMigration;

/**
 * Adds `request_tbl.hw_id` as a tracked migration.
 *
 * This column already exists on the local dev DB — it was added by hand
 * (raw ALTER TABLE, no migration) when the hw_id-linked hardware-status
 * lifecycle (RequestTblController::add() flipping hw_status to 'Pending',
 * and the cancel/reject revert in requestActions.js reading request.hw_id)
 * was built. Because no migration ever existed for it, `migrations migrate`
 * against the VM never applied it — so the VM's request_tbl silently never
 * had this column at all (not a stale-schema-cache issue, confirmed by
 * clearing tmp/cache/models/myapp_cake_model_default_request_tbl and
 * re-reading: hw_id still absent). Every request row in production is
 * missing hw_id as a result, which is what made the cancel/reject revert
 * path (`if (request.hw_id && ...)`  in requestActions.js) a permanent
 * no-op for every real request — hardware stayed stuck at 'Pending' after
 * cancel/reject instead of reverting to 'On Site'. See
 * scripts/backfill_request_tbl_hw_id.php (links existing rows via
 * asset_num/serial_num) and scripts/backfill_revert_stuck_pending_hw_status.php
 * (reverts hardware left stranded at 'Pending' by this gap) — both must be
 * run once against the VM after this migration lands there.
 */
class AddHwIdToRequestTbl extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('request_tbl');

        if (!$table->hasColumn('hw_id')) {
            $table->addColumn('hw_id', 'biginteger', [
                'null'    => true,
                'default' => null,
                'after'   => 'request_id',
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        $table = $this->table('request_tbl');
        if ($table->hasColumn('hw_id')) {
            $table->removeColumn('hw_id');
        }
        $table->update();
    }
}

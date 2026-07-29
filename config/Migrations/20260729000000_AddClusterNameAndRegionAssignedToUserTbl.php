<?php
declare(strict_types=1);

use Migrations\AbstractMigration;

/**
 * `region_assigned` and `cluster_name` on `user_tbl` were added by hand on some
 * environments and never captured in a migration, so environments that never got
 * the manual change (e.g. a freshly provisioned VM) are missing them entirely.
 * UserTblController::index() explicitly selects `cluster_name`, which throws a
 * DB error (500) on any environment lacking the column; ADM/SPV role scoping
 * also silently breaks since `cluster_name`/`region_assigned` come back null.
 * Guarded so it's a no-op on environments that already have the columns.
 */
class AddClusterNameAndRegionAssignedToUserTbl extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('user_tbl');

        if (!$table->hasColumn('region_assigned')) {
            $table->addColumn('region_assigned', 'string', [
                'limit'   => 35,
                'null'    => true,
                'default' => null,
                'after'   => 'lname',
            ]);
        }

        if (!$table->hasColumn('cluster_name')) {
            $table->addColumn('cluster_name', 'string', [
                'limit'   => 45,
                'null'    => true,
                'default' => null,
                'after'   => 'user_type',
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        // Intentionally a no-op: these columns predate migration tracking on some
        // environments (including local dev) and hold live admin/region-scoping
        // data, so an automatic rollback must not drop them.
    }
}

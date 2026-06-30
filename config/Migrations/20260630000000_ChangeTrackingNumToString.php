<?php
declare(strict_types=1);

use Migrations\AbstractMigration;

/**
 * Tracking numbers (e.g. courier waybill numbers) are alphanumeric and frequently
 * exceed the signed INT range, so an INT column silently truncated or rejected them
 * — leaving the Hardware Inventory pull-out modal with no tracking number to show.
 * Widen the column to a string so the value is stored and displayed verbatim.
 */
class ChangeTrackingNumToString extends AbstractMigration
{
    public function up(): void
    {
        $this->table('request_tbl')
            ->changeColumn('tracking_num', 'string', [
                'limit'   => 100,
                'null'    => true,
                'default' => null,
            ])
            ->update();
    }

    public function down(): void
    {
        $this->table('request_tbl')
            ->changeColumn('tracking_num', 'integer', [
                'null'    => true,
                'default' => null,
            ])
            ->update();
    }
}

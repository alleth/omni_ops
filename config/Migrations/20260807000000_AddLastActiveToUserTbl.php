<?php
declare(strict_types=1);

use Migrations\AbstractMigration;

/**
 * Adds `last_active` to `user_tbl` for the Users tab online/offline indicator.
 * Stamped on login and on each frontend heartbeat (see UserTblController::
 * heartbeat(), called periodically from MasterfileLayout while a session is
 * open). "Online" is derived client-side as last_active within the last few
 * minutes — there's no separate boolean column to keep in sync.
 */
class AddLastActiveToUserTbl extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('user_tbl');

        if (!$table->hasColumn('last_active')) {
            $table->addColumn('last_active', 'datetime', [
                'null'    => true,
                'default' => null,
                'after'   => 'lockout_until',
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        $table = $this->table('user_tbl');
        if ($table->hasColumn('last_active')) {
            $table->removeColumn('last_active');
        }
        $table->update();
    }
}

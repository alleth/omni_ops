<?php
declare(strict_types=1);

use Migrations\AbstractMigration;

/**
 * Adds a single `hw_antivi_meta` column to hold antivirus version, virus
 * definition date, and last-verified timestamp as JSON — one extra column
 * instead of three, so the existing `hw_antivi` column (product name) and
 * every report/search/filter that already reads it are untouched.
 *
 * Shape: {"version":"22.4.1","def_date":"2026-07-30","last_checked":"2026-08-06T06:00:00.000Z"}
 * `last_checked` is stamped automatically by the frontend whenever the
 * Hardware Management "Antivirus Updates" sub-view is saved — that save is
 * treated as the "check" event, so there's no separate manual field for it.
 */
class AddHwAntiviMetaToHwTbl extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('hw_tbl');

        if (!$table->hasColumn('hw_antivi_meta')) {
            $table->addColumn('hw_antivi_meta', 'text', [
                'null'    => true,
                'default' => null,
                'after'   => 'hw_antivi',
            ]);
        }

        $table->update();
    }

    public function down(): void
    {
        $table = $this->table('hw_tbl');
        if ($table->hasColumn('hw_antivi_meta')) {
            $table->removeColumn('hw_antivi_meta');
        }
        $table->update();
    }
}

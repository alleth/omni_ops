<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * RegionTblFixture
 */
class RegionTblFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public $table = 'region_tbl';
    /**
     * Init method
     *
     * @return void
     */
    public function init(): void
    {
        $this->records = [
            [
                'region_id' => 1,
                'region_name' => 'Lorem ipsum dolor sit a',
                'cluster_name' => 'Lorem ipsum dolor sit amet',
            ],
        ];
        parent::init();
    }
}

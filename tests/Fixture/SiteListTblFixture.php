<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * SiteListTblFixture
 */
class SiteListTblFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public $table = 'site_list_tbl';
    /**
     * Init method
     *
     * @return void
     */
    public function init(): void
    {
        $this->records = [
            [
                'site_id' => 1,
                'site_code' => 'Lorem ips',
                'site_name' => 'Lorem ipsum dolor sit amet',
                'site_address' => 'Lorem ipsum dolor sit amet',
                'region_id' => 'Lorem ips',
                'office_type' => 'Lorem ipsum dolor sit amet',
                'site_partnership' => 'Lorem ipsum dolor sit amet',
                'trxn_catered' => 'Lorem ipsum dolor sit amet',
                'cluster_name' => 'Lorem ipsum dolor sit amet',
            ],
        ];
        parent::init();
    }
}

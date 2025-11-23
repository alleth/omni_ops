<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * HwTblFixture
 */
class HwTblFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public $table = 'hw_tbl';
    /**
     * Init method
     *
     * @return void
     */
    public function init(): void
    {
        $this->records = [
            [
                'hw_id' => 1,
                'region_name' => 'Lorem ipsum dolor sit a',
                'site_code' => 'Lorem ips',
                'major_type' => 'Lorem ipsum dolor sit amet',
                'sub_major_type' => 'Lorem ipsum dolor sit amet',
                'item_desc' => 'Lorem ipsum dolor sit amet',
                'hw_brand_name' => 'Lorem ipsum dolor sit a',
                'hw_model' => 'Lorem ipsum dolor sit a',
                'hw_asset_num' => 'Lorem ipsum',
                'hw_serial_num' => 'Lorem ipsum dolor sit amet',
                'hw_date_acq' => 'Lorem ips',
                'hw_acq_val' => 'Lorem ips',
                'hw_status' => 'Lorem ipsum dolor sit a',
                'hw_host_name' => 'Lorem ipsum dolor sit amet',
                'hw_ip_add' => 'Lorem ipsum dolor sit amet',
                'hw_mac_add' => 'Lorem ipsum dolor sit amet',
                'hw_user_name' => 'Lorem ipsum dolor sit amet',
                'hw_primary_role' => 'Lorem ipsum dolor sit amet',
                'hw_memory' => 'Lorem ipsum dolor sit amet',
                'hdd_capacity' => 'Lorem ipsum dolor sit amet',
                'hdd_free_space' => 'Lorem ipsum dolor sit amet',
                'hdd_health' => 'Lorem ipsum dolor sit amet',
                'os_type' => 'Lorem ipsum dolor sit amet',
                'core_buid' => 'Lorem ipsum dolor sit amet',
                'rsu_fac' => 'Lorem ipsum dolor sit amet',
                'mv_dto' => 'Lorem ipsum dolor sit amet',
                'mv_maint' => 'Lorem ipsum dolor sit amet',
                'ims_aiu' => 'Lorem ipsum dolor sit amet',
                'dl_dto' => 'Lorem ipsum dolor sit amet',
                'dl_maint' => 'Lorem ipsum dolor sit amet',
                'dotnet' => 'Lorem ipsum dolor sit amet',
                'hw_antivi' => 'Lorem ipsum dolor sit amet',
                'ports_num' => 'Lorem ips',
                'ports_working' => 'Lorem ips',
                'ports_deffect' => 'Lorem ips',
                'hw_utilities' => 'Lorem ipsum dolor sit amet',
                'user_id' => 1,
            ],
        ];
        parent::init();
    }
}

<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * HwTbl Entity
 *
 * @property int $hw_id
 * @property string $region_name
 * @property string $site_code
 * @property string|null $major_type
 * @property string|null $sub_major_type
 * @property string|null $item_desc
 * @property string $hw_brand_name
 * @property string $hw_model
 * @property string $hw_asset_num
 * @property string $hw_serial_num
 * @property string $hw_date_acq
 * @property string $hw_acq_val
 * @property string $hw_status
 * @property string $hw_host_name
 * @property string $hw_ip_add
 * @property string $hw_mac_add
 * @property string $hw_user_name
 * @property string $hw_primary_role
 * @property string|null $hw_memory
 * @property string|null $hdd_capacity
 * @property string|null $hdd_free_space
 * @property string|null $hdd_health
 * @property string|null $os_type
 * @property string|null $core_buid
 * @property string|null $rsu_fac
 * @property string|null $mv_dto
 * @property string|null $mv_maint
 * @property string|null $ims_aiu
 * @property string|null $dl_dto
 * @property string|null $dl_maint
 * @property string|null $dotnet
 * @property string|null $hw_antivi
 * @property string|null $ports_num
 * @property string|null $ports_working
 * @property string|null $ports_deffect
 * @property string|null $hw_utilities
 * @property int $user_id
 */
class HwTbl extends Entity
{
    /**
     * Fields that can be mass assigned using newEntity() or patchEntity().
     *
     * Note that when '*' is set to true, this allows all unspecified fields to
     * be mass assigned. For security purposes, it is advised to set '*' to false
     * (or remove it), and explicitly make individual fields accessible as needed.
     *
     * @var array<string, bool>
     */
    protected $_accessible = [
        'region_name' => true,
        'site_code' => true,
        'major_type' => true,
        'sub_major_type' => true,
        'item_desc' => true,
        'hw_brand_name' => true,
        'hw_model' => true,
        'hw_asset_num' => true,
        'hw_serial_num' => true,
        'hw_date_acq' => true,
        'hw_acq_val' => true,
        'hw_status' => true,
        'hw_host_name' => true,
        'hw_ip_add' => true,
        'hw_mac_add' => true,
        'hw_user_name' => true,
        'hw_primary_role' => true,
        'hw_memory' => true,
        'hdd_capacity' => true,
        'hdd_free_space' => true,
        'hdd_health' => true,
        'os_type' => true,
        'core_buid' => true,
        'rsu_fac' => true,
        'mv_dto' => true,
        'mv_maint' => true,
        'ims_aiu' => true,
        'dl_dto' => true,
        'dl_maint' => true,
        'dotnet' => true,
        'hw_antivi' => true,
        'ports_num' => true,
        'ports_working' => true,
        'ports_deffect' => true,
        'hw_utilities' => true,
        'user_id' => true,
    ];
}

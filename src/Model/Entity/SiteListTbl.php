<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * SiteListTbl Entity
 *
 * @property int $site_id
 * @property string $site_code
 * @property string $site_name
 * @property string $site_address
 * @property string $region_id
 * @property string|null $office_type
 * @property string|null $site_partnership
 * @property string|null $trxn_catered
 * @property string|null $cluster_name
 */
class SiteListTbl extends Entity
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
        'site_code' => true,
        'site_name' => true,
        'site_address' => true,
        'region_id' => true,
        'office_type' => true,
        'site_partnership' => true,
        'trxn_catered' => true,
        'cluster_name' => true,
    ];
}

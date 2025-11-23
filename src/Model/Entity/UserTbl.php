<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * UserTbl Entity
 *
 * @property int $id
 * @property string|null $fname
 * @property string|null $lname
 * @property string|null $region_assigned
 * @property string|null $user_type
 * @property string|null $cluster_name
 * @property string|null $user_name
 * @property string|null $user_pass
 * @property string|null $profile_picture
 * @property int $failed_attempts
 * @property \Cake\I18n\FrozenTime|null $lockout_until
 */
class UserTbl extends Entity
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
        'fname' => true,
        'lname' => true,
        'region_assigned' => true,
        'user_type' => true,
        'cluster_name' => true,
        'user_name' => true,
        'user_pass' => true,
        'profile_picture' => true,
        'failed_attempts' => true,
        'lockout_until' => true,
    ];
}

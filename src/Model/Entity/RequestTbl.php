<?php
declare(strict_types=1);

namespace App\Model\Entity;

use Cake\ORM\Entity;

/**
 * RequestTbl Entity
 *
 * @property int $request_id
 * @property string|null $request_type
 * @property \Cake\I18n\FrozenTime|null $requested_by
 * @property int|null $requested_at
 * @property string|null $status
 * @property int|null $approved_by
 * @property \Cake\I18n\FrozenTime|null $approved_at
 * @property string|null $approval_remarks
 * @property string|null $site_code
 * @property string|null $asset_num
 * @property string|null $serial_num
 * @property string|null $item_desc
 * @property string|null $hw_brand_name
 * @property string|null $hw_model
 * @property int|null $quantity
 * @property string|null $remarks
 * @property string $attachment_path
 * @property int|null $sr_num
 * @property string|null $sr_date
 * @property string|null $return_date
 * @property string|null $delivery_method
 * @property int|null $tracking_num
 * @property string|null $delivered_by
 * @property string|null $pickup_date
 * @property string|null $date_transfer
 * @property string|null $transfer_from_name
 * @property string|null $transfer_to_name
 * @property string|null $destination_site
 * @property \Cake\I18n\FrozenTime|null $created_at
 * @property \Cake\I18n\FrozenTime|null $updated_at
 * @property int|null $hw_id                // ← added for documentation clarity
 */
class RequestTbl extends Entity
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
        'request_type' => true,
        'requested_by' => true,
        'requested_at' => true,
        'status' => true,
        'approved_by' => true,
        'approved_at' => true,
        'approval_remarks' => true,
        'site_code' => true,
        'asset_num' => true,
        'serial_num' => true,
        'item_desc' => true,
        'hw_brand_name' => true,
        'hw_model' => true,
        'quantity' => true,
        'remarks' => true,
        'attachment_path' => true,
        'sr_num' => true,
        'sr_date' => true,
        'return_date' => true,
        'delivery_method' => true,
        'tracking_num' => true,
        'delivered_by' => true,
        'pickup_date' => true,
        'date_transfer' => true,
        'transfer_from_name' => true,
        'transfer_to_name' => true,
        'destination_site' => true,
        'created_at' => true,
        'updated_at' => true,
        'hw_id' => true,                    // ← THIS LINE WAS ADDED
    ];
}

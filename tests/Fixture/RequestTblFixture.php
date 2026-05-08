<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * RequestTblFixture
 */
class RequestTblFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public $table = 'request_tbl';
    /**
     * Init method
     *
     * @return void
     */
    public function init(): void
    {
        $this->records = [
            [
                'request_id' => 1,
                'request_type' => 'Lorem ipsum dolor sit amet',
                'requested_by' => '2026-02-17 13:12:04',
                'requested_at' => 1,
                'status' => 'Lorem ipsum dolor sit amet',
                'approved_by' => 1,
                'approved_at' => '2026-02-17 13:12:04',
                'approval_remarks' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
                'site_code' => 'Lorem ipsum dolor sit amet',
                'asset_num' => 'Lorem ipsum dolor sit amet',
                'serial_num' => 'Lorem ipsum dolor sit amet',
                'item_desc' => 'Lorem ipsum dolor sit amet',
                'hw_brand_name' => 'Lorem ipsum dolor sit amet',
                'hw_model' => 'Lorem ipsum dolor sit amet',
                'quantity' => 1,
                'remarks' => 'Lorem ipsum dolor sit amet, aliquet feugiat. Convallis morbi fringilla gravida, phasellus feugiat dapibus velit nunc, pulvinar eget sollicitudin venenatis cum nullam, vivamus ut a sed, mollitia lectus. Nulla vestibulum massa neque ut et, id hendrerit sit, feugiat in taciti enim proin nibh, tempor dignissim, rhoncus duis vestibulum nunc mattis convallis.',
                'attachment_path' => 'Lorem ipsum dolor sit amet',
                'sr_num' => 1,
                'sr_date' => 'Lorem ipsum dolor sit a',
                'return_date' => 'Lorem ipsum dolor sit a',
                'delivery_method' => 'Lorem ipsum dolor sit a',
                'tracking_num' => 1,
                'delivered_by' => 'Lorem ipsum dolor sit amet',
                'pickup_date' => 'Lorem ipsum dolor sit a',
                'date_transfer' => 'Lorem ipsum dolor sit a',
                'transfer_from_name' => 'Lorem ipsum dolor sit amet',
                'transfer_to_name' => 'Lorem ipsum dolor sit amet',
                'destination_site' => 'Lorem ipsum dolor sit a',
                'created_at' => '2026-02-17 13:12:04',
                'updated_at' => '2026-02-17 13:12:04',
            ],
        ];
        parent::init();
    }
}

<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * ItemBrandFixture
 */
class ItemBrandFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public $table = 'item_brand';
    /**
     * Init method
     *
     * @return void
     */
    public function init(): void
    {
        $this->records = [
            [
                'id' => 1,
                'item_desc' => 'Lorem ipsum dolor sit a',
                'brand' => 'Lorem ipsum dolor sit a',
            ],
        ];
        parent::init();
    }
}

<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * ItemDescriptionFixture
 */
class ItemDescriptionFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public $table = 'item_description';
    /**
     * Init method
     *
     * @return void
     */
    public function init(): void
    {
        $this->records = [
            [
                'item_id' => 1,
                'item_desc' => 'Lorem ipsum dolor sit a',
                'sub_major_type' => 'Lorem ipsum dolor sit a',
            ],
        ];
        parent::init();
    }
}

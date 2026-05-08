<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * ItemModelsFixture
 */
class ItemModelsFixture extends TestFixture
{
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
                'model' => 'Lorem ipsum dolor sit a',
            ],
        ];
        parent::init();
    }
}

<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\ItemBrandTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\ItemBrandTable Test Case
 */
class ItemBrandTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\ItemBrandTable
     */
    protected $ItemBrand;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected $fixtures = [
        'app.ItemBrand',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('ItemBrand') ? [] : ['className' => ItemBrandTable::class];
        $this->ItemBrand = $this->getTableLocator()->get('ItemBrand', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->ItemBrand);

        parent::tearDown();
    }

    /**
     * Test validationDefault method
     *
     * @return void
     * @uses \App\Model\Table\ItemBrandTable::validationDefault()
     */
    public function testValidationDefault(): void
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}

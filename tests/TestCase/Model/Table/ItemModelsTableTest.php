<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\ItemModelsTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\ItemModelsTable Test Case
 */
class ItemModelsTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\ItemModelsTable
     */
    protected $ItemModels;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected $fixtures = [
        'app.ItemModels',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('ItemModels') ? [] : ['className' => ItemModelsTable::class];
        $this->ItemModels = $this->getTableLocator()->get('ItemModels', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->ItemModels);

        parent::tearDown();
    }

    /**
     * Test validationDefault method
     *
     * @return void
     * @uses \App\Model\Table\ItemModelsTable::validationDefault()
     */
    public function testValidationDefault(): void
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}

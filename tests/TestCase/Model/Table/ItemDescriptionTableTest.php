<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\ItemDescriptionTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\ItemDescriptionTable Test Case
 */
class ItemDescriptionTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\ItemDescriptionTable
     */
    protected $ItemDescription;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected $fixtures = [
        'app.ItemDescription',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('ItemDescription') ? [] : ['className' => ItemDescriptionTable::class];
        $this->ItemDescription = $this->getTableLocator()->get('ItemDescription', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->ItemDescription);

        parent::tearDown();
    }

    /**
     * Test validationDefault method
     *
     * @return void
     * @uses \App\Model\Table\ItemDescriptionTable::validationDefault()
     */
    public function testValidationDefault(): void
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}

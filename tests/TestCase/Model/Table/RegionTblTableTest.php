<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\RegionTblTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\RegionTblTable Test Case
 */
class RegionTblTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\RegionTblTable
     */
    protected $RegionTbl;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected $fixtures = [
        'app.RegionTbl',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('RegionTbl') ? [] : ['className' => RegionTblTable::class];
        $this->RegionTbl = $this->getTableLocator()->get('RegionTbl', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->RegionTbl);

        parent::tearDown();
    }

    /**
     * Test validationDefault method
     *
     * @return void
     * @uses \App\Model\Table\RegionTblTable::validationDefault()
     */
    public function testValidationDefault(): void
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}

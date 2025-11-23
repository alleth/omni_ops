<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\HwTblTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\HwTblTable Test Case
 */
class HwTblTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\HwTblTable
     */
    protected $HwTbl;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected $fixtures = [
        'app.HwTbl',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('HwTbl') ? [] : ['className' => HwTblTable::class];
        $this->HwTbl = $this->getTableLocator()->get('HwTbl', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->HwTbl);

        parent::tearDown();
    }

    /**
     * Test validationDefault method
     *
     * @return void
     * @uses \App\Model\Table\HwTblTable::validationDefault()
     */
    public function testValidationDefault(): void
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}

<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\RequestTblTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\RequestTblTable Test Case
 */
class RequestTblTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\RequestTblTable
     */
    protected $RequestTbl;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected $fixtures = [
        'app.RequestTbl',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('RequestTbl') ? [] : ['className' => RequestTblTable::class];
        $this->RequestTbl = $this->getTableLocator()->get('RequestTbl', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->RequestTbl);

        parent::tearDown();
    }

    /**
     * Test validationDefault method
     *
     * @return void
     * @uses \App\Model\Table\RequestTblTable::validationDefault()
     */
    public function testValidationDefault(): void
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}

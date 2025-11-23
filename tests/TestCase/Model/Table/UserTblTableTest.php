<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\UserTblTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\UserTblTable Test Case
 */
class UserTblTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\UserTblTable
     */
    protected $UserTbl;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected $fixtures = [
        'app.UserTbl',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('UserTbl') ? [] : ['className' => UserTblTable::class];
        $this->UserTbl = $this->getTableLocator()->get('UserTbl', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->UserTbl);

        parent::tearDown();
    }

    /**
     * Test validationDefault method
     *
     * @return void
     * @uses \App\Model\Table\UserTblTable::validationDefault()
     */
    public function testValidationDefault(): void
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}

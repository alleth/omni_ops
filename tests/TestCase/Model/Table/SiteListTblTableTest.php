<?php
declare(strict_types=1);

namespace App\Test\TestCase\Model\Table;

use App\Model\Table\SiteListTblTable;
use Cake\TestSuite\TestCase;

/**
 * App\Model\Table\SiteListTblTable Test Case
 */
class SiteListTblTableTest extends TestCase
{
    /**
     * Test subject
     *
     * @var \App\Model\Table\SiteListTblTable
     */
    protected $SiteListTbl;

    /**
     * Fixtures
     *
     * @var array<string>
     */
    protected $fixtures = [
        'app.SiteListTbl',
    ];

    /**
     * setUp method
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $config = $this->getTableLocator()->exists('SiteListTbl') ? [] : ['className' => SiteListTblTable::class];
        $this->SiteListTbl = $this->getTableLocator()->get('SiteListTbl', $config);
    }

    /**
     * tearDown method
     *
     * @return void
     */
    protected function tearDown(): void
    {
        unset($this->SiteListTbl);

        parent::tearDown();
    }

    /**
     * Test validationDefault method
     *
     * @return void
     * @uses \App\Model\Table\SiteListTblTable::validationDefault()
     */
    public function testValidationDefault(): void
    {
        $this->markTestIncomplete('Not implemented yet.');
    }
}

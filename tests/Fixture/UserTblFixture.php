<?php
declare(strict_types=1);

namespace App\Test\Fixture;

use Cake\TestSuite\Fixture\TestFixture;

/**
 * UserTblFixture
 */
class UserTblFixture extends TestFixture
{
    /**
     * Table name
     *
     * @var string
     */
    public $table = 'user_tbl';
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
                'fname' => 'Lorem ipsum dolor sit a',
                'lname' => 'Lorem ipsum dolor sit a',
                'region_assigned' => 'Lorem ipsum dolor sit amet',
                'user_type' => 'Lorem ipsum dolor sit a',
                'cluster_name' => 'Lorem ipsum dolor sit amet',
                'user_name' => 'Lorem ipsum dolor sit a',
                'user_pass' => 'Lorem ipsum dolor sit amet',
                'profile_picture' => 'Lorem ipsum dolor sit amet',
                'failed_attempts' => 1,
                'lockout_until' => 1762519630,
            ],
        ];
        parent::init();
    }
}

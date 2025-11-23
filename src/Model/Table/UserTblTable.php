<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * UserTbl Model
 *
 * @method \App\Model\Entity\UserTbl newEmptyEntity()
 * @method \App\Model\Entity\UserTbl newEntity(array $data, array $options = [])
 * @method \App\Model\Entity\UserTbl[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\UserTbl get($primaryKey, $options = [])
 * @method \App\Model\Entity\UserTbl findOrCreate($search, ?callable $callback = null, $options = [])
 * @method \App\Model\Entity\UserTbl patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\UserTbl[] patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\UserTbl|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\UserTbl saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\UserTbl[]|\Cake\Datasource\ResultSetInterface|false saveMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\UserTbl[]|\Cake\Datasource\ResultSetInterface saveManyOrFail(iterable $entities, $options = [])
 * @method \App\Model\Entity\UserTbl[]|\Cake\Datasource\ResultSetInterface|false deleteMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\UserTbl[]|\Cake\Datasource\ResultSetInterface deleteManyOrFail(iterable $entities, $options = [])
 */
class UserTblTable extends Table
{
    /**
     * Initialize method
     *
     * @param array $config The configuration for the Table.
     * @return void
     */
    public function initialize(array $config): void
    {
        parent::initialize($config);

        $this->setTable('user_tbl');
        $this->setDisplayField('id');
        $this->setPrimaryKey('id');
    }

    /**
     * Default validation rules.
     *
     * @param \Cake\Validation\Validator $validator Validator instance.
     * @return \Cake\Validation\Validator
     */
    public function validationDefault(Validator $validator): Validator
    {
        $validator
            ->scalar('fname')
            ->maxLength('fname', 25)
            ->allowEmptyString('fname');

        $validator
            ->scalar('lname')
            ->maxLength('lname', 25)
            ->allowEmptyString('lname');

        $validator
            ->scalar('region_assigned')
            ->maxLength('region_assigned', 35)
            ->allowEmptyString('region_assigned');

        $validator
            ->scalar('user_type')
            ->maxLength('user_type', 25)
            ->allowEmptyString('user_type');

        $validator
            ->scalar('cluster_name')
            ->maxLength('cluster_name', 45)
            ->allowEmptyString('cluster_name');

        $validator
            ->scalar('user_name')
            ->maxLength('user_name', 25)
            ->allowEmptyString('user_name');

        $validator
            ->scalar('user_pass')
            ->maxLength('user_pass', 255)
            ->allowEmptyString('user_pass');

        $validator
            ->scalar('profile_picture')
            ->maxLength('profile_picture', 125)
            ->allowEmptyFile('profile_picture');

        $validator
            ->integer('failed_attempts')
            ->notEmptyString('failed_attempts');

        $validator
            ->dateTime('lockout_until')
            ->allowEmptyDateTime('lockout_until');

        return $validator;
    }
}

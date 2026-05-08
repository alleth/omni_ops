<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * ItemDescription Model
 *
 * @method \App\Model\Entity\ItemDescription newEmptyEntity()
 * @method \App\Model\Entity\ItemDescription newEntity(array $data, array $options = [])
 * @method \App\Model\Entity\ItemDescription[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\ItemDescription get($primaryKey, $options = [])
 * @method \App\Model\Entity\ItemDescription findOrCreate($search, ?callable $callback = null, $options = [])
 * @method \App\Model\Entity\ItemDescription patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\ItemDescription[] patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\ItemDescription|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\ItemDescription saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\ItemDescription[]|\Cake\Datasource\ResultSetInterface|false saveMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemDescription[]|\Cake\Datasource\ResultSetInterface saveManyOrFail(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemDescription[]|\Cake\Datasource\ResultSetInterface|false deleteMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemDescription[]|\Cake\Datasource\ResultSetInterface deleteManyOrFail(iterable $entities, $options = [])
 */
class ItemDescriptionTable extends Table
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

        $this->setTable('item_description');
        $this->setDisplayField('item_desc');
        $this->setPrimaryKey('item_id');
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
            ->scalar('item_desc')
            ->maxLength('item_desc', 25)
            ->requirePresence('item_desc', 'create')
            ->notEmptyString('item_desc');

        $validator
            ->scalar('sub_major_type')
            ->maxLength('sub_major_type', 25)
            ->requirePresence('sub_major_type', 'create')
            ->notEmptyString('sub_major_type');

        return $validator;
    }
}

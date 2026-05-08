<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * ItemModels Model
 *
 * @method \App\Model\Entity\ItemModel newEmptyEntity()
 * @method \App\Model\Entity\ItemModel newEntity(array $data, array $options = [])
 * @method \App\Model\Entity\ItemModel[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\ItemModel get($primaryKey, $options = [])
 * @method \App\Model\Entity\ItemModel findOrCreate($search, ?callable $callback = null, $options = [])
 * @method \App\Model\Entity\ItemModel patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\ItemModel[] patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\ItemModel|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\ItemModel saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\ItemModel[]|\Cake\Datasource\ResultSetInterface|false saveMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemModel[]|\Cake\Datasource\ResultSetInterface saveManyOrFail(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemModel[]|\Cake\Datasource\ResultSetInterface|false deleteMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemModel[]|\Cake\Datasource\ResultSetInterface deleteManyOrFail(iterable $entities, $options = [])
 */
class ItemModelsTable extends Table
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

        $this->setTable('item_models');
        $this->setDisplayField('item_desc');
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
            ->scalar('item_desc')
            ->maxLength('item_desc', 25)
            ->requirePresence('item_desc', 'create')
            ->notEmptyString('item_desc');

        $validator
            ->scalar('brand')
            ->maxLength('brand', 25)
            ->requirePresence('brand', 'create')
            ->notEmptyString('brand');

        $validator
            ->scalar('model')
            ->maxLength('model', 25)
            ->requirePresence('model', 'create')
            ->notEmptyString('model');

        return $validator;
    }
}

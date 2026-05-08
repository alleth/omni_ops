<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * ItemBrand Model
 *
 * @method \App\Model\Entity\ItemBrand newEmptyEntity()
 * @method \App\Model\Entity\ItemBrand newEntity(array $data, array $options = [])
 * @method \App\Model\Entity\ItemBrand[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\ItemBrand get($primaryKey, $options = [])
 * @method \App\Model\Entity\ItemBrand findOrCreate($search, ?callable $callback = null, $options = [])
 * @method \App\Model\Entity\ItemBrand patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\ItemBrand[] patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\ItemBrand|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\ItemBrand saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\ItemBrand[]|\Cake\Datasource\ResultSetInterface|false saveMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemBrand[]|\Cake\Datasource\ResultSetInterface saveManyOrFail(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemBrand[]|\Cake\Datasource\ResultSetInterface|false deleteMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\ItemBrand[]|\Cake\Datasource\ResultSetInterface deleteManyOrFail(iterable $entities, $options = [])
 */
class ItemBrandTable extends Table
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

        $this->setTable('item_brand');
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

        return $validator;
    }
}

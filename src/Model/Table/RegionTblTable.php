<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * RegionTbl Model
 *
 * @method \App\Model\Entity\RegionTbl newEmptyEntity()
 * @method \App\Model\Entity\RegionTbl newEntity(array $data, array $options = [])
 * @method \App\Model\Entity\RegionTbl[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\RegionTbl get($primaryKey, $options = [])
 * @method \App\Model\Entity\RegionTbl findOrCreate($search, ?callable $callback = null, $options = [])
 * @method \App\Model\Entity\RegionTbl patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\RegionTbl[] patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\RegionTbl|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\RegionTbl saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\RegionTbl[]|\Cake\Datasource\ResultSetInterface|false saveMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\RegionTbl[]|\Cake\Datasource\ResultSetInterface saveManyOrFail(iterable $entities, $options = [])
 * @method \App\Model\Entity\RegionTbl[]|\Cake\Datasource\ResultSetInterface|false deleteMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\RegionTbl[]|\Cake\Datasource\ResultSetInterface deleteManyOrFail(iterable $entities, $options = [])
 */
class RegionTblTable extends Table
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

        $this->setTable('region_tbl');
        $this->setDisplayField('region_name');
        $this->setPrimaryKey('region_id');
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
            ->scalar('region_name')
            ->maxLength('region_name', 25)
            ->requirePresence('region_name', 'create')
            ->notEmptyString('region_name');

        $validator
            ->scalar('cluster_name')
            ->maxLength('cluster_name', 35)
            ->allowEmptyString('cluster_name');

        return $validator;
    }
}

<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * SiteListTbl Model
 *
 * @method \App\Model\Entity\SiteListTbl newEmptyEntity()
 * @method \App\Model\Entity\SiteListTbl newEntity(array $data, array $options = [])
 * @method \App\Model\Entity\SiteListTbl[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\SiteListTbl get($primaryKey, $options = [])
 * @method \App\Model\Entity\SiteListTbl patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\SiteListTbl[] patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\SiteListTbl|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\SiteListTbl saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 */
class SiteListTblTable extends Table
{
    public function initialize(array $config): void
    {
        parent::initialize($config);

        $this->setTable('site_list_tbl');
        $this->setDisplayField('site_code');
        $this->setPrimaryKey('site_id');

        /**
         * IMPORTANT:
         * - Mass assignment (_accessible) DOES NOT belong here
         * - It must be defined in the Entity (SiteListTbl.php)
         * - Leaving it here will NOT allow fields to update
         */
    }

    public function validationDefault(Validator $validator): Validator
    {
        $validator
            ->scalar('site_code')
            ->maxLength('site_code', 11)
            ->requirePresence('site_code', 'create')
            ->notEmptyString('site_code');

        $validator
            ->scalar('site_name')
            ->maxLength('site_name', 75)
            ->requirePresence('site_name', 'create')
            ->notEmptyString('site_name');

        $validator
            ->scalar('site_address')
            ->maxLength('site_address', 250)
            ->allowEmptyString('site_address');

        $validator
            ->scalar('region_id')
            ->maxLength('region_id', 11)
            ->requirePresence('region_id', 'create')
            ->notEmptyString('region_id');

        $validator
            ->scalar('office_type')
            ->maxLength('office_type', 75)
            ->allowEmptyString('office_type');

        $validator
            ->scalar('site_partnership')
            ->maxLength('site_partnership', 75)
            ->allowEmptyString('site_partnership');

        $validator
            ->scalar('trxn_catered')
            ->maxLength('trxn_catered', 150)
            ->allowEmptyString('trxn_catered');

        $validator
            ->scalar('cluster_name')
            ->maxLength('cluster_name', 150)
            ->allowEmptyString('cluster_name');

        // Enforce physical_site_count is either 1 or 2
        $validator
            ->integer('physical_site_count')
            ->allowEmptyString('physical_site_count')
            ->add('physical_site_count', 'validRange', [
                'rule' => function ($value) {
                    return $value === 1 || $value === 2;
                },
                'message' => 'Dual Server Set-up must be 1 (No) or 2 (Yes)',
            ]);

        $validator
            ->integer('node_count')
            ->allowEmptyString('node_count');

        $validator
            ->integer('node_working')
            ->allowEmptyString('node_working');

        $validator
            ->integer('node_defective')
            ->allowEmptyString('node_defective');

        return $validator;
    }
}

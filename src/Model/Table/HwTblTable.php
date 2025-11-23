<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * HwTbl Model
 *
 * @method \App\Model\Entity\HwTbl newEmptyEntity()
 * @method \App\Model\Entity\HwTbl newEntity(array $data, array $options = [])
 * @method \App\Model\Entity\HwTbl[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\HwTbl get($primaryKey, $options = [])
 * @method \App\Model\Entity\HwTbl findOrCreate($search, ?callable $callback = null, $options = [])
 * @method \App\Model\Entity\HwTbl patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\HwTbl[] patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\HwTbl|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\HwTbl saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\HwTbl[]|\Cake\Datasource\ResultSetInterface|false saveMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\HwTbl[]|\Cake\Datasource\ResultSetInterface saveManyOrFail(iterable $entities, $options = [])
 * @method \App\Model\Entity\HwTbl[]|\Cake\Datasource\ResultSetInterface|false deleteMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\HwTbl[]|\Cake\Datasource\ResultSetInterface deleteManyOrFail(iterable $entities, $options = [])
 */
class HwTblTable extends Table
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

        $this->setTable('hw_tbl');
        $this->setDisplayField('region_name');
        $this->setPrimaryKey('hw_id');
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
            ->scalar('site_code')
            ->maxLength('site_code', 11)
            ->requirePresence('site_code', 'create')
            ->notEmptyString('site_code');

        $validator
            ->scalar('major_type')
            ->maxLength('major_type', 75)
            ->allowEmptyString('major_type');

        $validator
            ->scalar('sub_major_type')
            ->maxLength('sub_major_type', 75)
            ->allowEmptyString('sub_major_type');

        $validator
            ->scalar('item_desc')
            ->maxLength('item_desc', 85)
            ->allowEmptyString('item_desc');

        $validator
            ->scalar('hw_brand_name')
            ->maxLength('hw_brand_name', 25)
            ->requirePresence('hw_brand_name', 'create')
            ->notEmptyString('hw_brand_name');

        $validator
            ->scalar('hw_model')
            ->maxLength('hw_model', 25)
            ->requirePresence('hw_model', 'create')
            ->notEmptyString('hw_model');

        $validator
            ->scalar('hw_asset_num')
            ->maxLength('hw_asset_num', 13)
            ->requirePresence('hw_asset_num', 'create')
            ->notEmptyString('hw_asset_num');

        $validator
            ->scalar('hw_serial_num')
            ->maxLength('hw_serial_num', 30)
            ->requirePresence('hw_serial_num', 'create')
            ->notEmptyString('hw_serial_num');

        $validator
            ->scalar('hw_date_acq')
            ->maxLength('hw_date_acq', 11)
            ->requirePresence('hw_date_acq', 'create')
            ->notEmptyString('hw_date_acq');

        $validator
            ->scalar('hw_acq_val')
            ->maxLength('hw_acq_val', 11)
            ->requirePresence('hw_acq_val', 'create')
            ->notEmptyString('hw_acq_val');

        $validator
            ->scalar('hw_status')
            ->maxLength('hw_status', 25)
            ->requirePresence('hw_status', 'create')
            ->notEmptyString('hw_status');

        $validator
            ->scalar('hw_host_name')
            ->maxLength('hw_host_name', 35)
            ->requirePresence('hw_host_name', 'create')
            ->notEmptyString('hw_host_name');

        $validator
            ->scalar('hw_ip_add')
            ->maxLength('hw_ip_add', 35)
            ->requirePresence('hw_ip_add', 'create')
            ->notEmptyString('hw_ip_add');

        $validator
            ->scalar('hw_mac_add')
            ->maxLength('hw_mac_add', 35)
            ->requirePresence('hw_mac_add', 'create')
            ->notEmptyString('hw_mac_add');

        $validator
            ->scalar('hw_user_name')
            ->maxLength('hw_user_name', 35)
            ->requirePresence('hw_user_name', 'create')
            ->notEmptyString('hw_user_name');

        $validator
            ->scalar('hw_primary_role')
            ->maxLength('hw_primary_role', 50)
            ->requirePresence('hw_primary_role', 'create')
            ->notEmptyString('hw_primary_role');

        $validator
            ->scalar('hw_memory')
            ->maxLength('hw_memory', 45)
            ->allowEmptyString('hw_memory');

        $validator
            ->scalar('hdd_capacity')
            ->maxLength('hdd_capacity', 45)
            ->allowEmptyString('hdd_capacity');

        $validator
            ->scalar('hdd_free_space')
            ->maxLength('hdd_free_space', 45)
            ->allowEmptyString('hdd_free_space');

        $validator
            ->scalar('hdd_health')
            ->maxLength('hdd_health', 65)
            ->allowEmptyString('hdd_health');

        $validator
            ->scalar('os_type')
            ->maxLength('os_type', 65)
            ->allowEmptyString('os_type');

        $validator
            ->scalar('core_buid')
            ->maxLength('core_buid', 35)
            ->allowEmptyString('core_buid');

        $validator
            ->scalar('rsu_fac')
            ->maxLength('rsu_fac', 45)
            ->allowEmptyString('rsu_fac');

        $validator
            ->scalar('mv_dto')
            ->maxLength('mv_dto', 45)
            ->allowEmptyString('mv_dto');

        $validator
            ->scalar('mv_maint')
            ->maxLength('mv_maint', 45)
            ->allowEmptyString('mv_maint');

        $validator
            ->scalar('ims_aiu')
            ->maxLength('ims_aiu', 45)
            ->allowEmptyString('ims_aiu');

        $validator
            ->scalar('dl_dto')
            ->maxLength('dl_dto', 45)
            ->allowEmptyString('dl_dto');

        $validator
            ->scalar('dl_maint')
            ->maxLength('dl_maint', 45)
            ->allowEmptyString('dl_maint');

        $validator
            ->scalar('dotnet')
            ->maxLength('dotnet', 45)
            ->allowEmptyString('dotnet');

        $validator
            ->scalar('hw_antivi')
            ->maxLength('hw_antivi', 45)
            ->allowEmptyString('hw_antivi');

        $validator
            ->scalar('ports_num')
            ->maxLength('ports_num', 11)
            ->allowEmptyString('ports_num');

        $validator
            ->scalar('ports_working')
            ->maxLength('ports_working', 11)
            ->allowEmptyString('ports_working');

        $validator
            ->scalar('ports_deffect')
            ->maxLength('ports_deffect', 11)
            ->allowEmptyString('ports_deffect');

        $validator
            ->scalar('hw_utilities')
            ->maxLength('hw_utilities', 250)
            ->allowEmptyString('hw_utilities');

        $validator
            ->integer('user_id')
            ->requirePresence('user_id', 'create')
            ->notEmptyString('user_id');

        return $validator;
    }
}

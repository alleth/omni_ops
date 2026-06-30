<?php
declare(strict_types=1);

namespace App\Model\Table;

use Cake\ORM\Query;
use Cake\ORM\RulesChecker;
use Cake\ORM\Table;
use Cake\Validation\Validator;

/**
 * RequestTbl Model
 *
 * @method \App\Model\Entity\RequestTbl newEmptyEntity()
 * @method \App\Model\Entity\RequestTbl newEntity(array $data, array $options = [])
 * @method \App\Model\Entity\RequestTbl[] newEntities(array $data, array $options = [])
 * @method \App\Model\Entity\RequestTbl get($primaryKey, $options = [])
 * @method \App\Model\Entity\RequestTbl findOrCreate($search, ?callable $callback = null, $options = [])
 * @method \App\Model\Entity\RequestTbl patchEntity(\Cake\Datasource\EntityInterface $entity, array $data, array $options = [])
 * @method \App\Model\Entity\RequestTbl[] patchEntities(iterable $entities, array $data, array $options = [])
 * @method \App\Model\Entity\RequestTbl|false save(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\RequestTbl saveOrFail(\Cake\Datasource\EntityInterface $entity, $options = [])
 * @method \App\Model\Entity\RequestTbl[]|\Cake\Datasource\ResultSetInterface|false saveMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\RequestTbl[]|\Cake\Datasource\ResultSetInterface saveManyOrFail(iterable $entities, $options = [])
 * @method \App\Model\Entity\RequestTbl[]|\Cake\Datasource\ResultSetInterface|false deleteMany(iterable $entities, $options = [])
 * @method \App\Model\Entity\RequestTbl[]|\Cake\Datasource\ResultSetInterface deleteManyOrFail(iterable $entities, $options = [])
 */
class RequestTblTable extends Table
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

        $this->setTable('request_tbl');
        $this->setDisplayField('attachment_path');
        $this->setPrimaryKey('request_id');
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
            ->scalar('request_type')
            ->maxLength('request_type', 50)
            ->allowEmptyString('request_type');

        $validator
            ->allowEmptyString('requested_by');

        $validator
            ->dateTime('requested_at')
            ->allowEmptyDateTime('requested_at');

        $validator
            ->scalar('status')
            ->allowEmptyString('status');

        $validator
            ->allowEmptyString('approved_by');

        $validator
            ->dateTime('approved_at')
            ->allowEmptyDateTime('approved_at');

        $validator
            ->scalar('approval_remarks')
            ->allowEmptyString('approval_remarks');

        $validator
            ->scalar('site_code')
            ->maxLength('site_code', 50)
            ->allowEmptyString('site_code');

        $validator
            ->scalar('asset_num')
            ->maxLength('asset_num', 100)
            ->allowEmptyString('asset_num');

        $validator
            ->scalar('serial_num')
            ->maxLength('serial_num', 100)
            ->allowEmptyString('serial_num');

        $validator
            ->scalar('item_desc')
            ->maxLength('item_desc', 255)
            ->allowEmptyString('item_desc');

        $validator
            ->scalar('hw_brand_name')
            ->maxLength('hw_brand_name', 100)
            ->allowEmptyString('hw_brand_name');

        $validator
            ->scalar('hw_model')
            ->maxLength('hw_model', 100)
            ->allowEmptyString('hw_model');

        $validator
            ->integer('quantity')
            ->allowEmptyString('quantity');

        $validator
            ->scalar('remarks')
            ->allowEmptyString('remarks');

        $validator
            ->scalar('attachment_path')
            ->maxLength('attachment_path', 455)
    //      ->requirePresence('attachment_path', 'create')
            ->notEmptyString('attachment_path');

        $validator
            ->integer('sr_num')
            ->allowEmptyString('sr_num');

        $validator
            ->scalar('sr_date')
            ->maxLength('sr_date', 25)
            ->allowEmptyString('sr_date');

        $validator
            ->scalar('return_date')
            ->maxLength('return_date', 25)
            ->allowEmptyString('return_date');

        $validator
            ->scalar('delivery_method')
            ->maxLength('delivery_method', 25)
            ->allowEmptyString('delivery_method');

        $validator
            ->scalar('tracking_num')
            ->maxLength('tracking_num', 100)
            ->allowEmptyString('tracking_num');

        $validator
            ->scalar('delivered_by')
            ->maxLength('delivered_by', 45)
            ->allowEmptyString('delivered_by');

        $validator
            ->scalar('pickup_date')
            ->maxLength('pickup_date', 25)
            ->allowEmptyString('pickup_date');

        $validator
            ->scalar('date_transfer')
            ->maxLength('date_transfer', 25)
            ->allowEmptyString('date_transfer');

        $validator
            ->scalar('transfer_from_name')
            ->maxLength('transfer_from_name', 45)
            ->allowEmptyString('transfer_from_name');

        $validator
            ->scalar('transfer_to_name')
            ->maxLength('transfer_to_name', 45)
            ->allowEmptyString('transfer_to_name');

        $validator
            ->scalar('destination_site')
            ->maxLength('destination_site', 25)
            ->allowEmptyString('destination_site');

        $validator
            ->dateTime('created_at')
            ->allowEmptyDateTime('created_at');

        $validator
            ->dateTime('updated_at')
            ->allowEmptyDateTime('updated_at');

        return $validator;
    }
}

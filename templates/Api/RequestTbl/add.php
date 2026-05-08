<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\RequestTbl $requestTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('List Request Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="requestTbl form content">
            <?= $this->Form->create($requestTbl) ?>
            <fieldset>
                <legend><?= __('Add Request Tbl') ?></legend>
                <?php
                    echo $this->Form->control('request_type');
                    echo $this->Form->control('requested_by', ['empty' => true]);
                    echo $this->Form->control('requested_at');
                    echo $this->Form->control('status');
                    echo $this->Form->control('approved_by');
                    echo $this->Form->control('approved_at', ['empty' => true]);
                    echo $this->Form->control('approval_remarks');
                    echo $this->Form->control('site_code');
                    echo $this->Form->control('asset_num');
                    echo $this->Form->control('serial_num');
                    echo $this->Form->control('item_desc');
                    echo $this->Form->control('hw_brand_name');
                    echo $this->Form->control('hw_model');
                    echo $this->Form->control('quantity');
                    echo $this->Form->control('remarks');
                    echo $this->Form->control('attachment_path');
                    echo $this->Form->control('sr_num');
                    echo $this->Form->control('sr_date');
                    echo $this->Form->control('return_date');
                    echo $this->Form->control('delivery_method');
                    echo $this->Form->control('tracking_num');
                    echo $this->Form->control('delivered_by');
                    echo $this->Form->control('pickup_date');
                    echo $this->Form->control('date_transfer');
                    echo $this->Form->control('transfer_from_name');
                    echo $this->Form->control('transfer_to_name');
                    echo $this->Form->control('destination_site');
                    echo $this->Form->control('created_at', ['empty' => true]);
                    echo $this->Form->control('updated_at', ['empty' => true]);
                ?>
            </fieldset>
            <?= $this->Form->button(__('Submit')) ?>
            <?= $this->Form->end() ?>
        </div>
    </div>
</div>

<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\HwTbl $hwTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $hwTbl->hw_id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $hwTbl->hw_id), 'class' => 'side-nav-item']
            ) ?>
            <?= $this->Html->link(__('List Hw Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="hwTbl form content">
            <?= $this->Form->create($hwTbl) ?>
            <fieldset>
                <legend><?= __('Edit Hw Tbl') ?></legend>
                <?php
                    echo $this->Form->control('region_name');
                    echo $this->Form->control('site_code');
                    echo $this->Form->control('major_type');
                    echo $this->Form->control('sub_major_type');
                    echo $this->Form->control('item_desc');
                    echo $this->Form->control('hw_brand_name');
                    echo $this->Form->control('hw_model');
                    echo $this->Form->control('hw_asset_num');
                    echo $this->Form->control('hw_serial_num');
                    echo $this->Form->control('hw_date_acq');
                    echo $this->Form->control('hw_acq_val');
                    echo $this->Form->control('hw_status');
                    echo $this->Form->control('hw_host_name');
                    echo $this->Form->control('hw_ip_add');
                    echo $this->Form->control('hw_mac_add');
                    echo $this->Form->control('hw_user_name');
                    echo $this->Form->control('hw_primary_role');
                    echo $this->Form->control('hw_memory');
                    echo $this->Form->control('hdd_capacity');
                    echo $this->Form->control('hdd_free_space');
                    echo $this->Form->control('hdd_health');
                    echo $this->Form->control('os_type');
                    echo $this->Form->control('core_buid');
                    echo $this->Form->control('rsu_fac');
                    echo $this->Form->control('mv_dto');
                    echo $this->Form->control('mv_maint');
                    echo $this->Form->control('ims_aiu');
                    echo $this->Form->control('dl_dto');
                    echo $this->Form->control('dl_maint');
                    echo $this->Form->control('dotnet');
                    echo $this->Form->control('hw_antivi');
                    echo $this->Form->control('ports_num');
                    echo $this->Form->control('ports_working');
                    echo $this->Form->control('ports_deffect');
                    echo $this->Form->control('hw_utilities');
                    echo $this->Form->control('user_id');
                ?>
            </fieldset>
            <?= $this->Form->button(__('Submit')) ?>
            <?= $this->Form->end() ?>
        </div>
    </div>
</div>

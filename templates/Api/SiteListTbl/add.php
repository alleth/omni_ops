<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\SiteListTbl $siteListTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('List Site List Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="siteListTbl form content">
            <?= $this->Form->create($siteListTbl) ?>
            <fieldset>
                <legend><?= __('Add Site List Tbl') ?></legend>
                <?php
                    echo $this->Form->control('site_code');
                    echo $this->Form->control('site_name');
                    echo $this->Form->control('site_address');
                    echo $this->Form->control('region_id');
                    echo $this->Form->control('office_type');
                    echo $this->Form->control('site_partnership');
                    echo $this->Form->control('trxn_catered');
                    echo $this->Form->control('cluster_name');
                ?>
            </fieldset>
            <?= $this->Form->button(__('Submit')) ?>
            <?= $this->Form->end() ?>
        </div>
    </div>
</div>

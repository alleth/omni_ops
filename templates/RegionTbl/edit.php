<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\RegionTbl $regionTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $regionTbl->region_id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $regionTbl->region_id), 'class' => 'side-nav-item']
            ) ?>
            <?= $this->Html->link(__('List Region Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="regionTbl form content">
            <?= $this->Form->create($regionTbl) ?>
            <fieldset>
                <legend><?= __('Edit Region Tbl') ?></legend>
                <?php
                    echo $this->Form->control('region_name');
                    echo $this->Form->control('cluster_name');
                ?>
            </fieldset>
            <?= $this->Form->button(__('Submit')) ?>
            <?= $this->Form->end() ?>
        </div>
    </div>
</div>

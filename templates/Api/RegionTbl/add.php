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
            <?= $this->Html->link(__('List Region Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="regionTbl form content">
            <?= $this->Form->create($regionTbl) ?>
            <fieldset>
                <legend><?= __('Add Region Tbl') ?></legend>
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

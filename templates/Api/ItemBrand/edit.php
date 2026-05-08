<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\ItemBrand $itemBrand
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $itemBrand->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $itemBrand->id), 'class' => 'side-nav-item']
            ) ?>
            <?= $this->Html->link(__('List Item Brand'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="itemBrand form content">
            <?= $this->Form->create($itemBrand) ?>
            <fieldset>
                <legend><?= __('Edit Item Brand') ?></legend>
                <?php
                    echo $this->Form->control('item_desc');
                    echo $this->Form->control('brand');
                ?>
            </fieldset>
            <?= $this->Form->button(__('Submit')) ?>
            <?= $this->Form->end() ?>
        </div>
    </div>
</div>

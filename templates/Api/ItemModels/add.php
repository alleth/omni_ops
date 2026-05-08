<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\ItemModel $itemModel
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('List Item Models'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="itemModels form content">
            <?= $this->Form->create($itemModel) ?>
            <fieldset>
                <legend><?= __('Add Item Model') ?></legend>
                <?php
                    echo $this->Form->control('item_desc');
                    echo $this->Form->control('brand');
                    echo $this->Form->control('model');
                ?>
            </fieldset>
            <?= $this->Form->button(__('Submit')) ?>
            <?= $this->Form->end() ?>
        </div>
    </div>
</div>

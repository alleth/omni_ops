<?php
/**
 * @var \App\View\AppView $this
 * @var \Cake\Datasource\EntityInterface $itemDescription
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('List Item Description'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="itemDescription form content">
            <?= $this->Form->create($itemDescription) ?>
            <fieldset>
                <legend><?= __('Add Item Description') ?></legend>
                <?php
                    echo $this->Form->control('item_desc');
                    echo $this->Form->control('sub_major_type');
                ?>
            </fieldset>
            <?= $this->Form->button(__('Submit')) ?>
            <?= $this->Form->end() ?>
        </div>
    </div>
</div>

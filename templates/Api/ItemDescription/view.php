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
            <?= $this->Html->link(__('Edit Item Description'), ['action' => 'edit', $itemDescription->item_id], ['class' => 'side-nav-item']) ?>
            <?= $this->Form->postLink(__('Delete Item Description'), ['action' => 'delete', $itemDescription->item_id], ['confirm' => __('Are you sure you want to delete # {0}?', $itemDescription->item_id), 'class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('List Item Description'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('New Item Description'), ['action' => 'add'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="itemDescription view content">
            <h3><?= h($itemDescription->item_desc) ?></h3>
            <table>
                <tr>
                    <th><?= __('Item Desc') ?></th>
                    <td><?= h($itemDescription->item_desc) ?></td>
                </tr>
                <tr>
                    <th><?= __('Sub Major Type') ?></th>
                    <td><?= h($itemDescription->sub_major_type) ?></td>
                </tr>
                <tr>
                    <th><?= __('Item Id') ?></th>
                    <td><?= $this->Number->format($itemDescription->item_id) ?></td>
                </tr>
            </table>
        </div>
    </div>
</div>

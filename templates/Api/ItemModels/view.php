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
            <?= $this->Html->link(__('Edit Item Model'), ['action' => 'edit', $itemModel->id], ['class' => 'side-nav-item']) ?>
            <?= $this->Form->postLink(__('Delete Item Model'), ['action' => 'delete', $itemModel->id], ['confirm' => __('Are you sure you want to delete # {0}?', $itemModel->id), 'class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('List Item Models'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('New Item Model'), ['action' => 'add'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="itemModels view content">
            <h3><?= h($itemModel->item_desc) ?></h3>
            <table>
                <tr>
                    <th><?= __('Item Desc') ?></th>
                    <td><?= h($itemModel->item_desc) ?></td>
                </tr>
                <tr>
                    <th><?= __('Brand') ?></th>
                    <td><?= h($itemModel->brand) ?></td>
                </tr>
                <tr>
                    <th><?= __('Model') ?></th>
                    <td><?= h($itemModel->model) ?></td>
                </tr>
                <tr>
                    <th><?= __('Id') ?></th>
                    <td><?= $this->Number->format($itemModel->id) ?></td>
                </tr>
            </table>
        </div>
    </div>
</div>

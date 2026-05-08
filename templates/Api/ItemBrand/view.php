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
            <?= $this->Html->link(__('Edit Item Brand'), ['action' => 'edit', $itemBrand->id], ['class' => 'side-nav-item']) ?>
            <?= $this->Form->postLink(__('Delete Item Brand'), ['action' => 'delete', $itemBrand->id], ['confirm' => __('Are you sure you want to delete # {0}?', $itemBrand->id), 'class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('List Item Brand'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('New Item Brand'), ['action' => 'add'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="itemBrand view content">
            <h3><?= h($itemBrand->item_desc) ?></h3>
            <table>
                <tr>
                    <th><?= __('Item Desc') ?></th>
                    <td><?= h($itemBrand->item_desc) ?></td>
                </tr>
                <tr>
                    <th><?= __('Brand') ?></th>
                    <td><?= h($itemBrand->brand) ?></td>
                </tr>
                <tr>
                    <th><?= __('Id') ?></th>
                    <td><?= $this->Number->format($itemBrand->id) ?></td>
                </tr>
            </table>
        </div>
    </div>
</div>

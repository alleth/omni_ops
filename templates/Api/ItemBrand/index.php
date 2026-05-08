<?php
/**
 * @var \App\View\AppView $this
 * @var iterable<\App\Model\Entity\ItemBrand> $itemBrand
 */
?>
<div class="itemBrand index content">
    <?= $this->Html->link(__('New Item Brand'), ['action' => 'add'], ['class' => 'button float-right']) ?>
    <h3><?= __('Item Brand') ?></h3>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th><?= $this->Paginator->sort('id') ?></th>
                    <th><?= $this->Paginator->sort('item_desc') ?></th>
                    <th><?= $this->Paginator->sort('brand') ?></th>
                    <th class="actions"><?= __('Actions') ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($itemBrand as $itemBrand): ?>
                <tr>
                    <td><?= $this->Number->format($itemBrand->id) ?></td>
                    <td><?= h($itemBrand->item_desc) ?></td>
                    <td><?= h($itemBrand->brand) ?></td>
                    <td class="actions">
                        <?= $this->Html->link(__('View'), ['action' => 'view', $itemBrand->id]) ?>
                        <?= $this->Html->link(__('Edit'), ['action' => 'edit', $itemBrand->id]) ?>
                        <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $itemBrand->id], ['confirm' => __('Are you sure you want to delete # {0}?', $itemBrand->id)]) ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <div class="paginator">
        <ul class="pagination">
            <?= $this->Paginator->first('<< ' . __('first')) ?>
            <?= $this->Paginator->prev('< ' . __('previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('next') . ' >') ?>
            <?= $this->Paginator->last(__('last') . ' >>') ?>
        </ul>
        <p><?= $this->Paginator->counter(__('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')) ?></p>
    </div>
</div>

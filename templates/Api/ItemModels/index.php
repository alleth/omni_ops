<?php
/**
 * @var \App\View\AppView $this
 * @var iterable<\App\Model\Entity\ItemModel> $itemModels
 */
?>
<div class="itemModels index content">
    <?= $this->Html->link(__('New Item Model'), ['action' => 'add'], ['class' => 'button float-right']) ?>
    <h3><?= __('Item Models') ?></h3>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th><?= $this->Paginator->sort('id') ?></th>
                    <th><?= $this->Paginator->sort('item_desc') ?></th>
                    <th><?= $this->Paginator->sort('brand') ?></th>
                    <th><?= $this->Paginator->sort('model') ?></th>
                    <th class="actions"><?= __('Actions') ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($itemModels as $itemModel): ?>
                <tr>
                    <td><?= $this->Number->format($itemModel->id) ?></td>
                    <td><?= h($itemModel->item_desc) ?></td>
                    <td><?= h($itemModel->brand) ?></td>
                    <td><?= h($itemModel->model) ?></td>
                    <td class="actions">
                        <?= $this->Html->link(__('View'), ['action' => 'view', $itemModel->id]) ?>
                        <?= $this->Html->link(__('Edit'), ['action' => 'edit', $itemModel->id]) ?>
                        <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $itemModel->id], ['confirm' => __('Are you sure you want to delete # {0}?', $itemModel->id)]) ?>
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

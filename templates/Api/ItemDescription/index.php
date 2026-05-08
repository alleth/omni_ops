<?php
/**
 * @var \App\View\AppView $this
 * @var iterable<\Cake\Datasource\EntityInterface> $itemDescription
 */
?>
<div class="itemDescription index content">
    <?= $this->Html->link(__('New Item Description'), ['action' => 'add'], ['class' => 'button float-right']) ?>
    <h3><?= __('Item Description') ?></h3>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th><?= $this->Paginator->sort('item_id') ?></th>
                    <th><?= $this->Paginator->sort('item_desc') ?></th>
                    <th><?= $this->Paginator->sort('sub_major_type') ?></th>
                    <th class="actions"><?= __('Actions') ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($itemDescription as $itemDescription): ?>
                <tr>
                    <td><?= $this->Number->format($itemDescription->item_id) ?></td>
                    <td><?= h($itemDescription->item_desc) ?></td>
                    <td><?= h($itemDescription->sub_major_type) ?></td>
                    <td class="actions">
                        <?= $this->Html->link(__('View'), ['action' => 'view', $itemDescription->item_id]) ?>
                        <?= $this->Html->link(__('Edit'), ['action' => 'edit', $itemDescription->item_id]) ?>
                        <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $itemDescription->item_id], ['confirm' => __('Are you sure you want to delete # {0}?', $itemDescription->item_id)]) ?>
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

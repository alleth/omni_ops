<?php
/**
 * @var \App\View\AppView $this
 * @var iterable<\App\Model\Entity\RegionTbl> $regionTbl
 */
?>
<div class="regionTbl index content">
    <?= $this->Html->link(__('New Region Tbl'), ['action' => 'add'], ['class' => 'button float-right']) ?>
    <h3><?= __('Region Tbl') ?></h3>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th><?= $this->Paginator->sort('region_id') ?></th>
                    <th><?= $this->Paginator->sort('region_name') ?></th>
                    <th><?= $this->Paginator->sort('cluster_name') ?></th>
                    <th class="actions"><?= __('Actions') ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($regionTbl as $regionTbl): ?>
                <tr>
                    <td><?= $this->Number->format($regionTbl->region_id) ?></td>
                    <td><?= h($regionTbl->region_name) ?></td>
                    <td><?= h($regionTbl->cluster_name) ?></td>
                    <td class="actions">
                        <?= $this->Html->link(__('View'), ['action' => 'view', $regionTbl->region_id]) ?>
                        <?= $this->Html->link(__('Edit'), ['action' => 'edit', $regionTbl->region_id]) ?>
                        <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $regionTbl->region_id], ['confirm' => __('Are you sure you want to delete # {0}?', $regionTbl->region_id)]) ?>
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

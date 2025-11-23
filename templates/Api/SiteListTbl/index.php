<?php
/**
 * @var \App\View\AppView $this
 * @var iterable<\App\Model\Entity\SiteListTbl> $siteListTbl
 */
?>
<div class="siteListTbl index content">
    <?= $this->Html->link(__('New Site List Tbl'), ['action' => 'add'], ['class' => 'button float-right']) ?>
    <h3><?= __('Site List Tbl') ?></h3>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th><?= $this->Paginator->sort('site_id') ?></th>
                    <th><?= $this->Paginator->sort('site_code') ?></th>
                    <th><?= $this->Paginator->sort('site_name') ?></th>
                    <th><?= $this->Paginator->sort('site_address') ?></th>
                    <th><?= $this->Paginator->sort('region_id') ?></th>
                    <th><?= $this->Paginator->sort('office_type') ?></th>
                    <th><?= $this->Paginator->sort('site_partnership') ?></th>
                    <th><?= $this->Paginator->sort('trxn_catered') ?></th>
                    <th><?= $this->Paginator->sort('cluster_name') ?></th>
                    <th class="actions"><?= __('Actions') ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($siteListTbl as $siteListTbl): ?>
                <tr>
                    <td><?= $this->Number->format($siteListTbl->site_id) ?></td>
                    <td><?= h($siteListTbl->site_code) ?></td>
                    <td><?= h($siteListTbl->site_name) ?></td>
                    <td><?= h($siteListTbl->site_address) ?></td>
                    <td><?= h($siteListTbl->region_id) ?></td>
                    <td><?= h($siteListTbl->office_type) ?></td>
                    <td><?= h($siteListTbl->site_partnership) ?></td>
                    <td><?= h($siteListTbl->trxn_catered) ?></td>
                    <td><?= h($siteListTbl->cluster_name) ?></td>
                    <td class="actions">
                        <?= $this->Html->link(__('View'), ['action' => 'view', $siteListTbl->site_id]) ?>
                        <?= $this->Html->link(__('Edit'), ['action' => 'edit', $siteListTbl->site_id]) ?>
                        <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $siteListTbl->site_id], ['confirm' => __('Are you sure you want to delete # {0}?', $siteListTbl->site_id)]) ?>
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

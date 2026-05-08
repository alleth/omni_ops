<?php
/**
 * @var \App\View\AppView $this
 * @var iterable<\App\Model\Entity\RequestTbl> $requestTbl
 */
?>
<div class="request-tbl index content">
    <?= $this->Html->link(__('New Request Tbl'), ['action' => 'add'], ['class' => 'button float-right']) ?>
    <h3><?= __('Request Tbl') ?></h3>

    <div class="table-responsive">
        <table class="table table-striped table-hover">
            <thead>
            <tr>
                <th><?= $this->Paginator->sort('request_id') ?></th>
                <th><?= $this->Paginator->sort('hw_id') ?></th>
                <th><?= $this->Paginator->sort('request_type') ?></th>
                <th><?= $this->Paginator->sort('requested_by') ?></th>
                <th><?= $this->Paginator->sort('requested_at') ?></th>
                <th><?= $this->Paginator->sort('status') ?></th>
                <th><?= $this->Paginator->sort('approved_by') ?></th>
                <th><?= $this->Paginator->sort('approved_at') ?></th>
                <th><?= $this->Paginator->sort('approval_remarks') ?></th> <!-- Added this column -->
                <th><?= $this->Paginator->sort('site_code') ?></th>
                <th><?= $this->Paginator->sort('asset_num') ?></th>
                <th><?= $this->Paginator->sort('serial_num') ?></th>
                <th><?= $this->Paginator->sort('item_desc') ?></th>
                <th><?= $this->Paginator->sort('hw_brand_name') ?></th>
                <th><?= $this->Paginator->sort('hw_model') ?></th>
                <th><?= $this->Paginator->sort('quantity') ?></th>
                <th><?= $this->Paginator->sort('attachment_path') ?></th>
                <th><?= $this->Paginator->sort('sr_num') ?></th>
                <th><?= $this->Paginator->sort('sr_date') ?></th>
                <th><?= $this->Paginator->sort('return_date') ?></th>
                <th><?= $this->Paginator->sort('delivery_method') ?></th>
                <th><?= $this->Paginator->sort('tracking_num') ?></th>
                <th><?= $this->Paginator->sort('delivered_by') ?></th>
                <th><?= $this->Paginator->sort('pickup_date') ?></th>
                <th><?= $this->Paginator->sort('date_transfer') ?></th>
                <th><?= $this->Paginator->sort('transfer_from_name') ?></th>
                <th><?= $this->Paginator->sort('transfer_to_name') ?></th>
                <th><?= $this->Paginator->sort('destination_site') ?></th>
                <th><?= $this->Paginator->sort('created_at') ?></th>
                <th><?= $this->Paginator->sort('updated_at') ?></th>
                <th class="actions"><?= __('Actions') ?></th>
            </tr>
            </thead>
            <tbody>
            <?php foreach ($requestTbl as $requestTblItem): ?>
                <tr>
                    <td><?= $this->Number->format($requestTblItem->request_id) ?></td>
                    <td><?= $requestTblItem->hw_id ? $this->Number->format($requestTblItem->hw_id) : '' ?></td>
                    <td><?= h($requestTblItem->request_type) ?></td>
                    <td><?= h($requestTblItem->requested_by) ?></td>
                    <td><?= $requestTblItem->requested_at ? $this->Time->nice($requestTblItem->requested_at) : '' ?></td>
                    <td><?= h($requestTblItem->status) ?></td>
                    <td><?= $requestTblItem->approved_by ? $this->Number->format($requestTblItem->approved_by) : '' ?></td>
                    <td><?= $requestTblItem->approved_at ? $this->Time->nice($requestTblItem->approved_at) : '' ?></td>
                    <td><?= h($requestTblItem->approval_remarks) ?></td> <!-- Added this cell -->
                    <td><?= h($requestTblItem->site_code) ?></td>
                    <td><?= h($requestTblItem->asset_num) ?></td>
                    <td><?= h($requestTblItem->serial_num) ?></td>
                    <td><?= h($requestTblItem->item_desc) ?></td>
                    <td><?= h($requestTblItem->hw_brand_name) ?></td>
                    <td><?= h($requestTblItem->hw_model) ?></td>
                    <td><?= $requestTblItem->quantity ? $this->Number->format($requestTblItem->quantity) : '' ?></td>
                    <td><?= h($requestTblItem->attachment_path) ?></td>
                    <td><?= $requestTblItem->sr_num ? $this->Number->format($requestTblItem->sr_num) : '' ?></td>
                    <td><?= h($requestTblItem->sr_date) ?></td>
                    <td><?= h($requestTblItem->return_date) ?></td>
                    <td><?= h($requestTblItem->delivery_method) ?></td>
                    <td><?= h($requestTblItem->tracking_num) ?></td>
                    <td><?= h($requestTblItem->delivered_by) ?></td>
                    <td><?= h($requestTblItem->pickup_date) ?></td>
                    <td><?= h($requestTblItem->date_transfer) ?></td>
                    <td><?= h($requestTblItem->transfer_from_name) ?></td>
                    <td><?= h($requestTblItem->transfer_to_name) ?></td>
                    <td><?= h($requestTblItem->destination_site) ?></td>
                    <td><?= $requestTblItem->created_at ? $this->Time->nice($requestTblItem->created_at) : '' ?></td>
                    <td><?= $requestTblItem->updated_at ? $this->Time->nice($requestTblItem->updated_at) : '' ?></td>
                    <td class="actions">
                        <?= $this->Html->link(__('View'), ['action' => 'view', $requestTblItem->request_id], ['class' => 'btn btn-sm btn-info']) ?>
                        <?= $this->Html->link(__('Edit'), ['action' => 'edit', $requestTblItem->request_id], ['class' => 'btn btn-sm btn-warning']) ?>
                        <?= $this->Form->postLink(
                            __('Delete'),
                            ['action' => 'delete', $requestTblItem->request_id],
                            ['confirm' => __('Are you sure you want to delete # {0}?', $requestTblItem->request_id), 'class' => 'btn btn-sm btn-danger']
                        ) ?>
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

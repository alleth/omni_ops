<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\RequestTbl $requestTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('Edit Request Tbl'), ['action' => 'edit', $requestTbl->request_id], ['class' => 'side-nav-item']) ?>
            <?= $this->Form->postLink(__('Delete Request Tbl'), ['action' => 'delete', $requestTbl->request_id], ['confirm' => __('Are you sure you want to delete # {0}?', $requestTbl->request_id), 'class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('List Request Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('New Request Tbl'), ['action' => 'add'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="requestTbl view content">
            <h3><?= h($requestTbl->attachment_path) ?></h3>
            <table>
                <tr>
                    <th><?= __('Request Type') ?></th>
                    <td><?= h($requestTbl->request_type) ?></td>
                </tr>
                <tr>
                    <th><?= __('Status') ?></th>
                    <td><?= h($requestTbl->status) ?></td>
                </tr>
                <tr>
                    <th><?= __('Site Code') ?></th>
                    <td><?= h($requestTbl->site_code) ?></td>
                </tr>
                <tr>
                    <th><?= __('Asset Num') ?></th>
                    <td><?= h($requestTbl->asset_num) ?></td>
                </tr>
                <tr>
                    <th><?= __('Serial Num') ?></th>
                    <td><?= h($requestTbl->serial_num) ?></td>
                </tr>
                <tr>
                    <th><?= __('Item Desc') ?></th>
                    <td><?= h($requestTbl->item_desc) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Brand Name') ?></th>
                    <td><?= h($requestTbl->hw_brand_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Model') ?></th>
                    <td><?= h($requestTbl->hw_model) ?></td>
                </tr>
                <tr>
                    <th><?= __('Attachment Path') ?></th>
                    <td><?= h($requestTbl->attachment_path) ?></td>
                </tr>
                <tr>
                    <th><?= __('Sr Date') ?></th>
                    <td><?= h($requestTbl->sr_date) ?></td>
                </tr>
                <tr>
                    <th><?= __('Return Date') ?></th>
                    <td><?= h($requestTbl->return_date) ?></td>
                </tr>
                <tr>
                    <th><?= __('Delivery Method') ?></th>
                    <td><?= h($requestTbl->delivery_method) ?></td>
                </tr>
                <tr>
                    <th><?= __('Delivered By') ?></th>
                    <td><?= h($requestTbl->delivered_by) ?></td>
                </tr>
                <tr>
                    <th><?= __('Pickup Date') ?></th>
                    <td><?= h($requestTbl->pickup_date) ?></td>
                </tr>
                <tr>
                    <th><?= __('Date Transfer') ?></th>
                    <td><?= h($requestTbl->date_transfer) ?></td>
                </tr>
                <tr>
                    <th><?= __('Transfer From Name') ?></th>
                    <td><?= h($requestTbl->transfer_from_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Transfer To Name') ?></th>
                    <td><?= h($requestTbl->transfer_to_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Destination Site') ?></th>
                    <td><?= h($requestTbl->destination_site) ?></td>
                </tr>
                <tr>
                    <th><?= __('Request Id') ?></th>
                    <td><?= $this->Number->format($requestTbl->request_id) ?></td>
                </tr>
                <tr>
                    <th><?= __('Requested At') ?></th>
                    <td><?= $requestTbl->requested_at === null ? '' : $this->Number->format($requestTbl->requested_at) ?></td>
                </tr>
                <tr>
                    <th><?= __('Approved By') ?></th>
                    <td><?= $requestTbl->approved_by === null ? '' : $this->Number->format($requestTbl->approved_by) ?></td>
                </tr>
                <tr>
                    <th><?= __('Quantity') ?></th>
                    <td><?= $requestTbl->quantity === null ? '' : $this->Number->format($requestTbl->quantity) ?></td>
                </tr>
                <tr>
                    <th><?= __('Sr Num') ?></th>
                    <td><?= $requestTbl->sr_num === null ? '' : $this->Number->format($requestTbl->sr_num) ?></td>
                </tr>
                <tr>
                    <th><?= __('Tracking Num') ?></th>
                    <td><?= $requestTbl->tracking_num === null ? '' : $this->Number->format($requestTbl->tracking_num) ?></td>
                </tr>
                <tr>
                    <th><?= __('Requested By') ?></th>
                    <td><?= h($requestTbl->requested_by) ?></td>
                </tr>
                <tr>
                    <th><?= __('Approved At') ?></th>
                    <td><?= h($requestTbl->approved_at) ?></td>
                </tr>
                <tr>
                    <th><?= __('Created At') ?></th>
                    <td><?= h($requestTbl->created_at) ?></td>
                </tr>
                <tr>
                    <th><?= __('Updated At') ?></th>
                    <td><?= h($requestTbl->updated_at) ?></td>
                </tr>
            </table>
            <div class="text">
                <strong><?= __('Approval Remarks') ?></strong>
                <blockquote>
                    <?= $this->Text->autoParagraph(h($requestTbl->approval_remarks)); ?>
                </blockquote>
            </div>
            <div class="text">
                <strong><?= __('Remarks') ?></strong>
                <blockquote>
                    <?= $this->Text->autoParagraph(h($requestTbl->remarks)); ?>
                </blockquote>
            </div>
        </div>
    </div>
</div>

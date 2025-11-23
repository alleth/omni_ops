<?php
/**
 * @var \App\View\AppView $this
 * @var iterable<\App\Model\Entity\HwTbl> $hwTbl
 */
?>
<div class="hwTbl index content">
    <?= $this->Html->link(__('New Hw Tbl'), ['action' => 'add'], ['class' => 'button float-right']) ?>
    <h3><?= __('Hw Tbl') ?></h3>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th><?= $this->Paginator->sort('hw_id') ?></th>
                    <th><?= $this->Paginator->sort('region_name') ?></th>
                    <th><?= $this->Paginator->sort('site_code') ?></th>
                    <th><?= $this->Paginator->sort('major_type') ?></th>
                    <th><?= $this->Paginator->sort('sub_major_type') ?></th>
                    <th><?= $this->Paginator->sort('item_desc') ?></th>
                    <th><?= $this->Paginator->sort('hw_brand_name') ?></th>
                    <th><?= $this->Paginator->sort('hw_model') ?></th>
                    <th><?= $this->Paginator->sort('hw_asset_num') ?></th>
                    <th><?= $this->Paginator->sort('hw_serial_num') ?></th>
                    <th><?= $this->Paginator->sort('hw_date_acq') ?></th>
                    <th><?= $this->Paginator->sort('hw_acq_val') ?></th>
                    <th><?= $this->Paginator->sort('hw_status') ?></th>
                    <th><?= $this->Paginator->sort('hw_host_name') ?></th>
                    <th><?= $this->Paginator->sort('hw_ip_add') ?></th>
                    <th><?= $this->Paginator->sort('hw_mac_add') ?></th>
                    <th><?= $this->Paginator->sort('hw_user_name') ?></th>
                    <th><?= $this->Paginator->sort('hw_primary_role') ?></th>
                    <th><?= $this->Paginator->sort('hw_memory') ?></th>
                    <th><?= $this->Paginator->sort('hdd_capacity') ?></th>
                    <th><?= $this->Paginator->sort('hdd_free_space') ?></th>
                    <th><?= $this->Paginator->sort('hdd_health') ?></th>
                    <th><?= $this->Paginator->sort('os_type') ?></th>
                    <th><?= $this->Paginator->sort('core_buid') ?></th>
                    <th><?= $this->Paginator->sort('rsu_fac') ?></th>
                    <th><?= $this->Paginator->sort('mv_dto') ?></th>
                    <th><?= $this->Paginator->sort('mv_maint') ?></th>
                    <th><?= $this->Paginator->sort('ims_aiu') ?></th>
                    <th><?= $this->Paginator->sort('dl_dto') ?></th>
                    <th><?= $this->Paginator->sort('dl_maint') ?></th>
                    <th><?= $this->Paginator->sort('dotnet') ?></th>
                    <th><?= $this->Paginator->sort('hw_antivi') ?></th>
                    <th><?= $this->Paginator->sort('ports_num') ?></th>
                    <th><?= $this->Paginator->sort('ports_working') ?></th>
                    <th><?= $this->Paginator->sort('ports_deffect') ?></th>
                    <th><?= $this->Paginator->sort('hw_utilities') ?></th>
                    <th><?= $this->Paginator->sort('user_id') ?></th>
                    <th class="actions"><?= __('Actions') ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($hwTbl as $hwTbl): ?>
                <tr>
                    <td><?= $this->Number->format($hwTbl->hw_id) ?></td>
                    <td><?= h($hwTbl->region_name) ?></td>
                    <td><?= h($hwTbl->site_code) ?></td>
                    <td><?= h($hwTbl->major_type) ?></td>
                    <td><?= h($hwTbl->sub_major_type) ?></td>
                    <td><?= h($hwTbl->item_desc) ?></td>
                    <td><?= h($hwTbl->hw_brand_name) ?></td>
                    <td><?= h($hwTbl->hw_model) ?></td>
                    <td><?= h($hwTbl->hw_asset_num) ?></td>
                    <td><?= h($hwTbl->hw_serial_num) ?></td>
                    <td><?= h($hwTbl->hw_date_acq) ?></td>
                    <td><?= h($hwTbl->hw_acq_val) ?></td>
                    <td><?= h($hwTbl->hw_status) ?></td>
                    <td><?= h($hwTbl->hw_host_name) ?></td>
                    <td><?= h($hwTbl->hw_ip_add) ?></td>
                    <td><?= h($hwTbl->hw_mac_add) ?></td>
                    <td><?= h($hwTbl->hw_user_name) ?></td>
                    <td><?= h($hwTbl->hw_primary_role) ?></td>
                    <td><?= h($hwTbl->hw_memory) ?></td>
                    <td><?= h($hwTbl->hdd_capacity) ?></td>
                    <td><?= h($hwTbl->hdd_free_space) ?></td>
                    <td><?= h($hwTbl->hdd_health) ?></td>
                    <td><?= h($hwTbl->os_type) ?></td>
                    <td><?= h($hwTbl->core_buid) ?></td>
                    <td><?= h($hwTbl->rsu_fac) ?></td>
                    <td><?= h($hwTbl->mv_dto) ?></td>
                    <td><?= h($hwTbl->mv_maint) ?></td>
                    <td><?= h($hwTbl->ims_aiu) ?></td>
                    <td><?= h($hwTbl->dl_dto) ?></td>
                    <td><?= h($hwTbl->dl_maint) ?></td>
                    <td><?= h($hwTbl->dotnet) ?></td>
                    <td><?= h($hwTbl->hw_antivi) ?></td>
                    <td><?= h($hwTbl->ports_num) ?></td>
                    <td><?= h($hwTbl->ports_working) ?></td>
                    <td><?= h($hwTbl->ports_deffect) ?></td>
                    <td><?= h($hwTbl->hw_utilities) ?></td>
                    <td><?= $this->Number->format($hwTbl->user_id) ?></td>
                    <td class="actions">
                        <?= $this->Html->link(__('View'), ['action' => 'view', $hwTbl->hw_id]) ?>
                        <?= $this->Html->link(__('Edit'), ['action' => 'edit', $hwTbl->hw_id]) ?>
                        <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $hwTbl->hw_id], ['confirm' => __('Are you sure you want to delete # {0}?', $hwTbl->hw_id)]) ?>
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

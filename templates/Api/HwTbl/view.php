<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\HwTbl $hwTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('Edit Hw Tbl'), ['action' => 'edit', $hwTbl->hw_id], ['class' => 'side-nav-item']) ?>
            <?= $this->Form->postLink(__('Delete Hw Tbl'), ['action' => 'delete', $hwTbl->hw_id], ['confirm' => __('Are you sure you want to delete # {0}?', $hwTbl->hw_id), 'class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('List Hw Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('New Hw Tbl'), ['action' => 'add'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="hwTbl view content">
            <h3><?= h($hwTbl->region_name) ?></h3>
            <table>
                <tr>
                    <th><?= __('Region Name') ?></th>
                    <td><?= h($hwTbl->region_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Site Code') ?></th>
                    <td><?= h($hwTbl->site_code) ?></td>
                </tr>
                <tr>
                    <th><?= __('Major Type') ?></th>
                    <td><?= h($hwTbl->major_type) ?></td>
                </tr>
                <tr>
                    <th><?= __('Sub Major Type') ?></th>
                    <td><?= h($hwTbl->sub_major_type) ?></td>
                </tr>
                <tr>
                    <th><?= __('Item Desc') ?></th>
                    <td><?= h($hwTbl->item_desc) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Brand Name') ?></th>
                    <td><?= h($hwTbl->hw_brand_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Model') ?></th>
                    <td><?= h($hwTbl->hw_model) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Asset Num') ?></th>
                    <td><?= h($hwTbl->hw_asset_num) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Serial Num') ?></th>
                    <td><?= h($hwTbl->hw_serial_num) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Date Acq') ?></th>
                    <td><?= h($hwTbl->hw_date_acq) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Acq Val') ?></th>
                    <td><?= h($hwTbl->hw_acq_val) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Status') ?></th>
                    <td><?= h($hwTbl->hw_status) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Host Name') ?></th>
                    <td><?= h($hwTbl->hw_host_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Ip Add') ?></th>
                    <td><?= h($hwTbl->hw_ip_add) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Mac Add') ?></th>
                    <td><?= h($hwTbl->hw_mac_add) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw User Name') ?></th>
                    <td><?= h($hwTbl->hw_user_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Primary Role') ?></th>
                    <td><?= h($hwTbl->hw_primary_role) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Memory') ?></th>
                    <td><?= h($hwTbl->hw_memory) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hdd Capacity') ?></th>
                    <td><?= h($hwTbl->hdd_capacity) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hdd Free Space') ?></th>
                    <td><?= h($hwTbl->hdd_free_space) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hdd Health') ?></th>
                    <td><?= h($hwTbl->hdd_health) ?></td>
                </tr>
                <tr>
                    <th><?= __('Os Type') ?></th>
                    <td><?= h($hwTbl->os_type) ?></td>
                </tr>
                <tr>
                    <th><?= __('Core Buid') ?></th>
                    <td><?= h($hwTbl->core_buid) ?></td>
                </tr>
                <tr>
                    <th><?= __('Rsu Fac') ?></th>
                    <td><?= h($hwTbl->rsu_fac) ?></td>
                </tr>
                <tr>
                    <th><?= __('Mv Dto') ?></th>
                    <td><?= h($hwTbl->mv_dto) ?></td>
                </tr>
                <tr>
                    <th><?= __('Mv Maint') ?></th>
                    <td><?= h($hwTbl->mv_maint) ?></td>
                </tr>
                <tr>
                    <th><?= __('Ims Aiu') ?></th>
                    <td><?= h($hwTbl->ims_aiu) ?></td>
                </tr>
                <tr>
                    <th><?= __('Dl Dto') ?></th>
                    <td><?= h($hwTbl->dl_dto) ?></td>
                </tr>
                <tr>
                    <th><?= __('Dl Maint') ?></th>
                    <td><?= h($hwTbl->dl_maint) ?></td>
                </tr>
                <tr>
                    <th><?= __('Dotnet') ?></th>
                    <td><?= h($hwTbl->dotnet) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Antivi') ?></th>
                    <td><?= h($hwTbl->hw_antivi) ?></td>
                </tr>
                <tr>
                    <th><?= __('Ports Num') ?></th>
                    <td><?= h($hwTbl->ports_num) ?></td>
                </tr>
                <tr>
                    <th><?= __('Ports Working') ?></th>
                    <td><?= h($hwTbl->ports_working) ?></td>
                </tr>
                <tr>
                    <th><?= __('Ports Deffect') ?></th>
                    <td><?= h($hwTbl->ports_deffect) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Utilities') ?></th>
                    <td><?= h($hwTbl->hw_utilities) ?></td>
                </tr>
                <tr>
                    <th><?= __('Hw Id') ?></th>
                    <td><?= $this->Number->format($hwTbl->hw_id) ?></td>
                </tr>
                <tr>
                    <th><?= __('User Id') ?></th>
                    <td><?= $this->Number->format($hwTbl->user_id) ?></td>
                </tr>
            </table>
        </div>
    </div>
</div>

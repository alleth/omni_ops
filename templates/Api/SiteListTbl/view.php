<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\SiteListTbl $siteListTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('Edit Site List Tbl'), ['action' => 'edit', $siteListTbl->site_id], ['class' => 'side-nav-item']) ?>
            <?= $this->Form->postLink(__('Delete Site List Tbl'), ['action' => 'delete', $siteListTbl->site_id], ['confirm' => __('Are you sure you want to delete # {0}?', $siteListTbl->site_id), 'class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('List Site List Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('New Site List Tbl'), ['action' => 'add'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="siteListTbl view content">
            <h3><?= h($siteListTbl->site_code) ?></h3>
            <table>
                <tr>
                    <th><?= __('Site Code') ?></th>
                    <td><?= h($siteListTbl->site_code) ?></td>
                </tr>
                <tr>
                    <th><?= __('Site Name') ?></th>
                    <td><?= h($siteListTbl->site_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Site Address') ?></th>
                    <td><?= h($siteListTbl->site_address) ?></td>
                </tr>
                <tr>
                    <th><?= __('Region Id') ?></th>
                    <td><?= h($siteListTbl->region_id) ?></td>
                </tr>
                <tr>
                    <th><?= __('Office Type') ?></th>
                    <td><?= h($siteListTbl->office_type) ?></td>
                </tr>
                <tr>
                    <th><?= __('Site Partnership') ?></th>
                    <td><?= h($siteListTbl->site_partnership) ?></td>
                </tr>
                <tr>
                    <th><?= __('Trxn Catered') ?></th>
                    <td><?= h($siteListTbl->trxn_catered) ?></td>
                </tr>
                <tr>
                    <th><?= __('Cluster Name') ?></th>
                    <td><?= h($siteListTbl->cluster_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Site Id') ?></th>
                    <td><?= $this->Number->format($siteListTbl->site_id) ?></td>
                </tr>
            </table>
        </div>
    </div>
</div>

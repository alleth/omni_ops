<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\RegionTbl $regionTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('Edit Region Tbl'), ['action' => 'edit', $regionTbl->region_id], ['class' => 'side-nav-item']) ?>
            <?= $this->Form->postLink(__('Delete Region Tbl'), ['action' => 'delete', $regionTbl->region_id], ['confirm' => __('Are you sure you want to delete # {0}?', $regionTbl->region_id), 'class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('List Region Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('New Region Tbl'), ['action' => 'add'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="regionTbl view content">
            <h3><?= h($regionTbl->region_name) ?></h3>
            <table>
                <tr>
                    <th><?= __('Region Name') ?></th>
                    <td><?= h($regionTbl->region_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Cluster Name') ?></th>
                    <td><?= h($regionTbl->cluster_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('Region Id') ?></th>
                    <td><?= $this->Number->format($regionTbl->region_id) ?></td>
                </tr>
            </table>
        </div>
    </div>
</div>

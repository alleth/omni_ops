<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\UserTbl $userTbl
 */
?>
<div class="row">
    <aside class="column">
        <div class="side-nav">
            <h4 class="heading"><?= __('Actions') ?></h4>
            <?= $this->Html->link(__('Edit User Tbl'), ['action' => 'edit', $userTbl->id], ['class' => 'side-nav-item']) ?>
            <?= $this->Form->postLink(__('Delete User Tbl'), ['action' => 'delete', $userTbl->id], ['confirm' => __('Are you sure you want to delete # {0}?', $userTbl->id), 'class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('List User Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
            <?= $this->Html->link(__('New User Tbl'), ['action' => 'add'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="userTbl view content">
            <h3><?= h($userTbl->id) ?></h3>
            <table>
                <tr>
                    <th><?= __('Fname') ?></th>
                    <td><?= h($userTbl->fname) ?></td>
                </tr>
                <tr>
                    <th><?= __('Lname') ?></th>
                    <td><?= h($userTbl->lname) ?></td>
                </tr>
                <tr>
                    <th><?= __('Region Assigned') ?></th>
                    <td><?= h($userTbl->region_assigned) ?></td>
                </tr>
                <tr>
                    <th><?= __('User Type') ?></th>
                    <td><?= h($userTbl->user_type) ?></td>
                </tr>
                <tr>
                    <th><?= __('Cluster Name') ?></th>
                    <td><?= h($userTbl->cluster_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('User Name') ?></th>
                    <td><?= h($userTbl->user_name) ?></td>
                </tr>
                <tr>
                    <th><?= __('User Pass') ?></th>
                    <td><?= h($userTbl->user_pass) ?></td>
                </tr>
                <tr>
                    <th><?= __('Profile Picture') ?></th>
                    <td><?= h($userTbl->profile_picture) ?></td>
                </tr>
                <tr>
                    <th><?= __('Id') ?></th>
                    <td><?= $this->Number->format($userTbl->id) ?></td>
                </tr>
                <tr>
                    <th><?= __('Failed Attempts') ?></th>
                    <td><?= $this->Number->format($userTbl->failed_attempts) ?></td>
                </tr>
                <tr>
                    <th><?= __('Lockout Until') ?></th>
                    <td><?= h($userTbl->lockout_until) ?></td>
                </tr>
            </table>
        </div>
    </div>
</div>

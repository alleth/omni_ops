<?php
/**
 * @var \App\View\AppView $this
 * @var iterable<\App\Model\Entity\UserTbl> $userTbl
 */
?>
<div class="userTbl index content">
    <?= $this->Html->link(__('New User Tbl'), ['action' => 'add'], ['class' => 'button float-right']) ?>
    <h3><?= __('User Tbl') ?></h3>
    <div class="table-responsive">
        <table>
            <thead>
                <tr>
                    <th><?= $this->Paginator->sort('id') ?></th>
                    <th><?= $this->Paginator->sort('fname') ?></th>
                    <th><?= $this->Paginator->sort('lname') ?></th>
                    <th><?= $this->Paginator->sort('region_assigned') ?></th>
                    <th><?= $this->Paginator->sort('user_type') ?></th>
                    <th><?= $this->Paginator->sort('cluster_name') ?></th>
                    <th><?= $this->Paginator->sort('user_name') ?></th>
                    <th><?= $this->Paginator->sort('user_pass') ?></th>
                    <th><?= $this->Paginator->sort('profile_picture') ?></th>
                    <th><?= $this->Paginator->sort('failed_attempts') ?></th>
                    <th><?= $this->Paginator->sort('lockout_until') ?></th>
                    <th class="actions"><?= __('Actions') ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($userTbl as $userTbl): ?>
                <tr>
                    <td><?= $this->Number->format($userTbl->id) ?></td>
                    <td><?= h($userTbl->fname) ?></td>
                    <td><?= h($userTbl->lname) ?></td>
                    <td><?= h($userTbl->region_assigned) ?></td>
                    <td><?= h($userTbl->user_type) ?></td>
                    <td><?= h($userTbl->cluster_name) ?></td>
                    <td><?= h($userTbl->user_name) ?></td>
                    <td><?= h($userTbl->user_pass) ?></td>
                    <td><?= h($userTbl->profile_picture) ?></td>
                    <td><?= $this->Number->format($userTbl->failed_attempts) ?></td>
                    <td><?= h($userTbl->lockout_until) ?></td>
                    <td class="actions">
                        <?= $this->Html->link(__('View'), ['action' => 'view', $userTbl->id]) ?>
                        <?= $this->Html->link(__('Edit'), ['action' => 'edit', $userTbl->id]) ?>
                        <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $userTbl->id], ['confirm' => __('Are you sure you want to delete # {0}?', $userTbl->id)]) ?>
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

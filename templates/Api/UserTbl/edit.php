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
            <?= $this->Form->postLink(
                __('Delete'),
                ['action' => 'delete', $userTbl->id],
                ['confirm' => __('Are you sure you want to delete # {0}?', $userTbl->id), 'class' => 'side-nav-item']
            ) ?>
            <?= $this->Html->link(__('List User Tbl'), ['action' => 'index'], ['class' => 'side-nav-item']) ?>
        </div>
    </aside>
    <div class="column-responsive column-80">
        <div class="userTbl form content">
            <?= $this->Form->create($userTbl) ?>
            <fieldset>
                <legend><?= __('Edit User Tbl') ?></legend>
                <?php
                    echo $this->Form->control('fname');
                    echo $this->Form->control('lname');
                    echo $this->Form->control('region_assigned');
                    echo $this->Form->control('user_type');
                    echo $this->Form->control('cluster_name');
                    echo $this->Form->control('user_name');
                    echo $this->Form->control('user_pass');
                    echo $this->Form->control('profile_picture');
                    echo $this->Form->control('failed_attempts');
                    echo $this->Form->control('lockout_until');
                ?>
            </fieldset>
            <?= $this->Form->button(__('Submit')) ?>
            <?= $this->Form->end() ?>
        </div>
    </div>
</div>

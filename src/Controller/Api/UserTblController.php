<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Database\Expression\QueryExpression;

/**
 * UserTbl Controller
 *
 * @property \App\Model\Table\UserTblTable $UserTbl
 */
class UserTblController extends ApiController
{
    /** Failed sign-ins on one account before it locks. */
    private const MAX_FAILED_ATTEMPTS = 8;

    /** How long a locked account stays locked, in seconds. */
    private const LOCKOUT_SECONDS = 15 * 60;


    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
    }

    /**
     * Phase 1 of API authorization. These are the account-takeover endpoints:
     * before this map existed, an unauthenticated POST to reset-password could
     * set any account's password, including an ADM's.
     *
     * login() is deliberately absent — it is how a session is obtained. index()
     * and view() are left open for now; Phase 2 closes the remaining actions.
     *
     * @return array<string, array<int, string>>
     */
    protected function protectedActions(): array
    {
        return [
            'add' => ['ADM', 'SPV'],
            'resetPassword' => ['ADM', 'SPV'],
            'updateRole' => ['ADM'],
            'updateRegion' => ['ADM', 'SPV'],
            'delete' => ['ADM'],
        ];
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        $origin = $this->request->getHeaderLine('Origin') ?: '*';

        if ($this->request->is('options')) {
            $this->response = $this->response
                ->withHeader('Access-Control-Allow-Origin', $origin)
                ->withHeader('Access-Control-Allow-Credentials', 'true')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
                ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->withHeader('Access-Control-Max-Age', '86400')
                ->withHeader('Vary', 'Origin')
                ->withStatus(204);

            return $this->response;
        }

        $this->response = $this->response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Vary', 'Origin');

        // CORS headers are set above first so a 401/403 still carries them.
        // The return value MUST be passed through: discarding it (as this method
        // previously did) would run the action even when the check rejected it.
        return parent::beforeFilter($event);
    }

    public function index()
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
            $query = $this->UserTbl->find()->select([
                'id', 'fname', 'lname', 'user_name', 'user_type',
                'region_assigned', 'cluster_name', 'last_active',
            ]);

            $clusterName = $this->request->getQuery('cluster_name');
            if ($clusterName) {
                $query->where(['cluster_name LIKE' => '%' . trim($clusterName) . '%']);
            }

            $users = $query->order(['fname' => 'ASC', 'lname' => 'ASC'])->toArray();

            return $this->response->withType('json')
                ->withStringBody(json_encode(['users' => $users]));
        }

        $userTbl = $this->paginate($this->UserTbl);
        $this->set(compact('userTbl'));
    }

    public function view($id = null)
    {
        $this->viewBuilder()->setOption('serialize', true);
        $userTbl = $this->UserTbl->get($id);
        $this->set(compact('userTbl'));
    }

    public function add()
    {
        if ($this->request->is('post') && $this->request->accepts('application/json')) {
            $data = $this->request->getData();

            if (empty($data['user_pass'])) {
                return $this->response->withStatus(400)->withType('json')
                    ->withStringBody(json_encode(['success' => false, 'error' => 'Password is required']));
            }

            // login() resolves an account with ->first(), and there is no unique
            // index on user_name, so a duplicate name would permanently shadow the
            // second account: that user could never sign in, with nothing in the
            // UI to explain why.
            $userName = trim((string)($data['user_name'] ?? ''));
            if ($userName === '') {
                return $this->response->withStatus(400)->withType('json')
                    ->withStringBody(json_encode(['success' => false, 'error' => 'Username is required']));
            }

            $taken = $this->UserTbl->find()->where(['TRIM(user_name)' => $userName])->count();
            if ($taken > 0) {
                return $this->response->withStatus(409)->withType('json')
                    ->withStringBody(json_encode([
                        'success' => false,
                        'error'   => "Username '{$userName}' is already taken.",
                    ]));
            }

            $data['user_pass'] = password_hash($data['user_pass'], PASSWORD_DEFAULT);
            $data['failed_attempts'] = 0;

            $userTbl = $this->UserTbl->newEntity($data);

            if ($this->UserTbl->save($userTbl)) {
                return $this->response->withType('json')
                    ->withStringBody(json_encode([
                        'success' => true,
                        'message' => 'User created successfully',
                        'user' => [
                            'id'              => $userTbl->id,
                            'fname'           => $userTbl->fname,
                            'lname'           => $userTbl->lname,
                            'user_name'       => $userTbl->user_name,
                            'user_type'       => $userTbl->user_type,
                            'region_assigned' => $userTbl->region_assigned,
                            'cluster_name'    => $userTbl->cluster_name,
                        ],
                    ]));
            }

            return $this->response->withStatus(400)->withType('json')
                ->withStringBody(json_encode([
                    'success' => false,
                    'errors'  => $userTbl->getErrors(),
                ]));
        }

        $userTbl = $this->UserTbl->newEmptyEntity();
        if ($this->request->is('post')) {
            $userTbl = $this->UserTbl->patchEntity($userTbl, $this->request->getData());
            if ($this->UserTbl->save($userTbl)) {
                $this->Flash->success(__('The user tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The user tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('userTbl'));
    }

    public function resetPassword()
    {
        $this->request->allowMethod(['post']);

        $data     = $this->request->getData();
        $userId   = $data['user_id'] ?? null;
        $newPass  = $data['new_password'] ?? null;

        if (!$userId || !$newPass) {
            return $this->response->withStatus(400)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'user_id and new_password are required']));
        }

        try {
            $user = $this->UserTbl->get($userId);
        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            return $this->response->withStatus(404)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'User not found']));
        }

        $user->user_pass      = password_hash($newPass, PASSWORD_DEFAULT);
        $user->failed_attempts = 0;
        $user->lockout_until  = null;

        if ($this->UserTbl->save($user)) {
            return $this->response->withType('json')
                ->withStringBody(json_encode(['success' => true, 'message' => 'Password reset successfully']));
        }

        return $this->response->withStatus(400)->withType('json')
            ->withStringBody(json_encode(['success' => false, 'error' => 'Could not reset password']));
    }

    public function updateRegion()
    {
        $this->request->allowMethod(['post']);

        $data   = $this->request->getData();
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            return $this->response->withStatus(400)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'user_id is required']));
        }

        try {
            $user = $this->UserTbl->get($userId);
        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            return $this->response->withStatus(404)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'User not found']));
        }

        // Assign directly (not patchEntity) so this admin action never touches the
        // acting user's own Auth session — unlike edit()/updateProfile().
        $user->region_assigned = $data['region_assigned'] ?? '';
        if (isset($data['cluster_name'])) {
            $user->cluster_name = $data['cluster_name'];
        }

        if ($this->UserTbl->save($user)) {
            return $this->response->withType('json')
                ->withStringBody(json_encode([
                    'success'         => true,
                    'message'         => 'Region assignment updated successfully',
                    'region_assigned' => $user->region_assigned,
                ]));
        }

        return $this->response->withStatus(400)->withType('json')
            ->withStringBody(json_encode([
                'success' => false,
                'error'   => 'Could not update region assignment',
                'errors'  => $user->getErrors(),
            ]));
    }

    public function updateRole()
    {
        $this->request->allowMethod(['post']);

        $data   = $this->request->getData();
        $userId = $data['user_id'] ?? null;
        $type   = $data['user_type'] ?? null;

        if (!$userId || !$type) {
            return $this->response->withStatus(400)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'user_id and user_type are required']));
        }

        try {
            $user = $this->UserTbl->get($userId);
        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            return $this->response->withStatus(404)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'User not found']));
        }

        // Assign directly (not patchEntity) so this admin action never touches the
        // acting user's own Auth session — mirrors updateRegion() above.
        $user->user_type = $type;

        if (in_array($type, ['ADM', 'ROO'], true)) {
            // Org-wide roles carry no region scoping.
            $user->cluster_name    = 'All Cluster';
            $user->region_assigned = '';
        } else {
            if (isset($data['cluster_name'])) {
                $user->cluster_name = $data['cluster_name'];
            }
            if (isset($data['region_assigned'])) {
                $user->region_assigned = $data['region_assigned'];
            }
        }

        if ($this->UserTbl->save($user)) {
            return $this->response->withType('json')
                ->withStringBody(json_encode([
                    'success'         => true,
                    'message'         => 'Role updated successfully',
                    'user_type'       => $user->user_type,
                    'cluster_name'    => $user->cluster_name,
                    'region_assigned' => $user->region_assigned,
                ]));
        }

        return $this->response->withStatus(400)->withType('json')
            ->withStringBody(json_encode([
                'success' => false,
                'error'   => 'Could not update role',
                'errors'  => $user->getErrors(),
            ]));
    }

    /**
     * UTC "now" for the last_active column. Deliberately gmdate(), not
     * date() — CakePHP reads/serialises datetime columns assuming
     * App.defaultTimezone (UTC here), tagging the JSON it sends the
     * frontend with an explicit "+00:00"; writing anything other than true
     * UTC digits here would make that tag a lie and desync from what's
     * actually stored, which is exactly what happened when this briefly
     * wrote Asia/Manila wall-clock digits instead — the mismatch made
     * fresh timestamps parse as hours in the future client-side, which
     * always reads as "online". Plain UTC in, UTC-tagged ISO out, browser
     * converts to local for free — keep it that way.
     */
    private function nowForPresence(): string
    {
        return gmdate('Y-m-d H:i:s');
    }

    /**
     * Is this account currently locked?
     *
     * The comparison runs in SQL so both sides of it come from MySQL's clock.
     * See the note in login() for why a PHP-side comparison is wrong here.
     */
    private function isLockedOut(int $userId): bool
    {
        return $this->UserTbl->find()
            ->where(['id' => $userId])
            ->where('lockout_until IS NOT NULL AND lockout_until > NOW()')
            ->count() > 0;
    }

    /**
     * Clears the failure counter and any (possibly expired) lock.
     *
     * updateAll rather than an entity save: these two columns are all that
     * changes, and it keeps the write off the entity that login() also saves
     * last_active on.
     */
    private function clearLoginAttempts(int $userId): void
    {
        $this->UserTbl->updateAll(
            ['failed_attempts' => 0, 'lockout_until' => null],
            ['id' => $userId]
        );
    }

    /**
     * Counts one failed sign-in, locking the account once the threshold is hit.
     * The lock expiry is computed by MySQL (DATE_ADD(NOW(), ...)) so it lands in
     * the same time frame the isLockedOut() check reads it back in.
     */
    private function recordFailedLogin(int $userId, int $currentAttempts): void
    {
        $next = $currentAttempts + 1;

        if ($next >= self::MAX_FAILED_ATTEMPTS) {
            $this->UserTbl->updateQuery()
                ->set([
                    'failed_attempts' => 0,
                    'lockout_until' => new QueryExpression(
                        'DATE_ADD(NOW(), INTERVAL ' . self::LOCKOUT_SECONDS . ' SECOND)'
                    ),
                ])
                ->where(['id' => $userId])
                ->execute();

            return;
        }

        $this->UserTbl->updateAll(['failed_attempts' => $next], ['id' => $userId]);
    }

    /**
     * Presence heartbeat — called periodically by the logged-in frontend
     * (MasterfileLayout) while a session is open. Stamps last_active so the
     * Users tab can show online/offline. Deliberately lightweight: no auth
     * middleware round-trip, just a direct column update by user_id.
     */
    public function heartbeat()
    {
        $this->request->allowMethod(['post']);

        $data   = $this->request->getData();
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            return $this->response->withStatus(400)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'user_id is required']));
        }

        try {
            $user = $this->UserTbl->get($userId);
        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            return $this->response->withStatus(404)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'User not found']));
        }

        $user->last_active = $this->nowForPresence();

        if ($this->UserTbl->save($user)) {
            return $this->response->withType('json')
                ->withStringBody(json_encode(['success' => true, 'last_active' => $user->last_active]));
        }

        return $this->response->withStatus(400)->withType('json')
            ->withStringBody(json_encode([
                'success' => false,
                'error'   => 'Could not update last_active',
                'errors'  => $user->getErrors(),
            ]));
    }

    public function edit($id = null)
    {
        try {
            $userTbl = $this->UserTbl->get($id);
        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            // Unguarded, a bad id surfaced as an uncaught exception -> HTTP 500,
            // which a client can't tell apart from a real server fault.
            return $this->response->withStatus(404)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'User not found']));
        }

        if ($this->request->accepts('application/json')) {
            if ($this->request->is(['post', 'patch', 'put'])) {
                $data = $this->request->getData();

                if (!empty($data['current_password'])) {
                    if (!password_verify($data['current_password'], $userTbl->user_pass)) {
                        return $this->response
                            ->withType('json')
                            ->withStatus(400)
                            ->withStringBody(json_encode([
                                'success' => false,
                                'error' => 'Current password is incorrect'
                            ]));
                    }

                    if (!empty($data['new_password'])) {
                        $data['user_pass'] = password_hash($data['new_password'], PASSWORD_DEFAULT);
                    }
                }

                // FIXED: No third argument — use entity's _accessible
                $userTbl = $this->UserTbl->patchEntity($userTbl, $data);

                if ($this->UserTbl->save($userTbl)) {
                    $session = $this->request->getSession();
                    $session->write('Auth.User.fname', $userTbl->fname);
                    $session->write('Auth.User.lname', $userTbl->lname);
                    $session->write('Auth.User.user_name', $userTbl->user_name);

                    return $this->response
                        ->withType('json')
                        ->withStringBody(json_encode([
                            'success' => true,
                            'message' => 'Profile updated successfully'
                        ]));
                }

                return $this->response
                    ->withType('json')
                    ->withStatus(400)
                    ->withStringBody(json_encode([
                        'success' => false,
                        'error' => 'Could not update profile',
                        'errors' => $userTbl->getErrors()
                    ]));
            }

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['userTbl' => $userTbl]));
        }

        // HTML CRUD - unchanged
        if ($this->request->is(['post', 'patch', 'put'])) {
            $userTbl = $this->UserTbl->patchEntity($userTbl, $this->request->getData());
            if ($this->UserTbl->save($userTbl)) {
                $this->Flash->success(__('The user tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The user tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('userTbl'));
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $userTbl = $this->UserTbl->get($id);
        if ($this->UserTbl->delete($userTbl)) {
            $this->Flash->success(__('The user tbl has been deleted.'));
        } else {
            $this->Flash->error(__('The user tbl could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }

    public function login()
    {
        $this->autoRender = false;

        $this->request->allowMethod(['post']);
        $data = $this->request->getData();

        $userName = $data['user_name'] ?? '';
        $userPass = $data['user_pass'] ?? '';

        if ($userName === '' || $userPass === '') {
            return $this->response->withType('json')->withStatus(401)
                ->withStringBody(json_encode(['error' => 'Invalid credentials']));
        }

        $user = $this->UserTbl->find()
            ->where(['user_name' => $userName])
            ->first();

        $response = $this->response->withType('json');

        // user_tbl has carried failed_attempts/lockout_until since the table was
        // created, and add()/resetPassword() dutifully reset them -- but nothing
        // ever incremented or checked either one, so there was no brute-force
        // protection at all. Enforced here.
        //
        // Whether the lock is still live is decided by MySQL against its own
        // clock, never by comparing a PHP timestamp to the stored value:
        // lockout_until is a TIMESTAMP column (last_active, right next to it, is
        // a DATETIME), and MySQL converts TIMESTAMP on both read and write using
        // the session time zone -- which here is Asia/Manila while the app runs
        // in UTC. Writing gmdate() digits and comparing them in PHP made a
        // 15-minute lock read as 8h15m. Same trap CLAUDE.md flags for
        // last_active, opposite direction.
        if ($user && $this->isLockedOut((int)$user->id)) {
            return $response->withStatus(429)->withStringBody(json_encode([
                'error' => 'Account temporarily locked after too many failed sign-in attempts. Try again later.',
            ]));
        }

        if ($user && password_verify($userPass, $user->user_pass)) {
            $this->clearLoginAttempts((int)$user->id);
            // Stamp online status immediately on login — the frontend heartbeat
            // (MasterfileLayout) keeps it fresh from here on for as long as a
            // session stays open.
            $user->last_active = $this->nowForPresence();
            if (!$this->UserTbl->save($user)) {
                // Login must still succeed even if this stamp fails, but log why
                // rather than discarding save()'s result silently — a stale ORM
                // schema cache (see heartbeat()) is the one way this has actually
                // failed in practice, and it's otherwise invisible.
                \Cake\Log\Log::error('last_active save failed for user_id=' . $user->id . ': ' . json_encode($user->getErrors()));
            }

            $this->request->getSession()->write('Auth.User', [
                'id' => $user->id,
                'fname' => $user->fname,
                'lname' => $user->lname,
                'user_name' => $user->user_name,
                'user_type' => $user->user_type,
                'region_assigned' => $user->region_assigned,
                'cluster_name' => $user->cluster_name,
            ]);

            $response = $response->withStringBody(json_encode([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'fname' => $user->fname,
                    'lname' => $user->lname,
                    'user_name' => $user->user_name,
                    'user_type' => $user->user_type,
                    'region_assigned' => $user->region_assigned,
                    'cluster_name' => $user->cluster_name,
                ]
            ]));
        } else {
            // Counted only for a real account; an unknown username gets the same
            // generic 401 so the response doesn't reveal which names exist.
            if ($user) {
                $this->recordFailedLogin((int)$user->id, (int)($user->failed_attempts ?? 0));
            }

            $response = $response->withStatus(401)
                ->withStringBody(json_encode(['error' => 'Invalid credentials']));
        }

        return $response;
    }

    public function updateProfile()
    {
        $this->autoRender = false;
        $this->request->allowMethod(['post']);

        $data = $this->request->getData();

        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            return $this->response
                ->withType('json')
                ->withStatus(400)
                ->withStringBody(json_encode([
                    'success' => false,
                    'error' => 'User ID is required'
                ]));
        }

        try {
            $user = $this->UserTbl->get($userId);

            if (!empty($data['current_password'])) {
                if (!password_verify($data['current_password'], $user->user_pass)) {
                    return $this->response
                        ->withType('json')
                        ->withStatus(400)
                        ->withStringBody(json_encode([
                            'success' => false,
                            'error' => 'Current password is incorrect'
                        ]));
                }

                if (!empty($data['new_password'])) {
                    $data['user_pass'] = password_hash($data['new_password'], PASSWORD_DEFAULT);
                }
            }

            // FIXED: no third argument - use entity's _accessible array
            $user = $this->UserTbl->patchEntity($user, $data);

            if ($this->UserTbl->save($user)) {
                return $this->response
                    ->withType('json')
                    ->withStringBody(json_encode([
                        'success' => true,
                        'message' => 'Profile updated successfully'
                    ]));
            }

            return $this->response
                ->withType('json')
                ->withStatus(400)
                ->withStringBody(json_encode([
                    'success' => false,
                    'error' => 'Could not update profile',
                    'errors' => $user->getErrors()
                ]));

        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            return $this->response
                ->withType('json')
                ->withStatus(404)
                ->withStringBody(json_encode([
                    'success' => false,
                    'error' => 'User not found (ID: ' . $userId . ')'
                ]));
        } catch (\Exception $e) {
            error_log('Update profile exception: ' . $e->getMessage());
            return $this->response
                ->withType('json')
                ->withStatus(500)
                ->withStringBody(json_encode([
                    'success' => false,
                    'error' => 'Server error: ' . $e->getMessage()
                ]));
        }
    }
}

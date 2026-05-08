<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;

/**
 * UserTbl Controller
 *
 * @property \App\Model\Table\UserTblTable $UserTbl
 */
class UserTblController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        parent::beforeFilter($event);

        // Handle OPTIONS preflight – this must run FIRST and RETURN immediately
        if ($this->request->is('options')) {
            $origin = $this->request->getHeaderLine('Origin') ?: 'http://localhost:3000';

            $this->response = $this->response
                ->withHeader('Access-Control-Allow-Origin', $origin)
                ->withHeader('Access-Control-Allow-Credentials', 'true')  // string 'true'
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
                ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->withHeader('Access-Control-Max-Age', '86400')
                ->withStatus(204);  // 204 is REQUIRED for preflight success

            return $this->response;  // STOP HERE - do not run other code
        }

        // For POST/GET - only if origin matches
        $origin = $this->request->getHeaderLine('Origin');
        $allowedOrigins = ['http://localhost:3000', 'http://omniops.local'];

        if (in_array($origin, $allowedOrigins)) {
            $this->response = $this->response
                ->withHeader('Access-Control-Allow-Origin', $origin)
                ->withHeader('Access-Control-Allow-Credentials', 'true')
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
                ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->withHeader('Access-Control-Max-Age', '86400');
        }
    }
    public function index()
    {
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

    public function edit($id = null)
    {
        $userTbl = $this->UserTbl->get($id);

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

        $user = $this->UserTbl->find()
            ->where(['user_name' => $data['user_name']])
            ->first();

        $response = $this->response->withType('json');

        if ($user && password_verify($data['user_pass'], $user->user_pass)) {
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
            $response = $response->withStatus(401)
                ->withStringBody(json_encode(['error' => 'Invalid credentials']));
        }

        return $response
            ->withHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
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

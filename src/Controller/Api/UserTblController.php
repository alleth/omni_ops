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

        // CORS: Allow localhost:3000
        $this->response = $this->response
            ->withHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type')
            ->withHeader('Access-Control-Allow-Credentials', 'true');

        if ($this->request->is('options')) {
            return $this->response;
        }
    }

    /**
     * Index method — returns JSON
     */
    public function index()
    {
        $userTbl = $this->paginate($this->UserTbl);
        $this->set(compact('userTbl'));
    }

    /**
     * View method — returns JSON
     */
    public function view($id = null)
    {
        $this->viewBuilder()->setOption('serialize', true);
        $userTbl = $this->UserTbl->get($id);
        $this->set(compact('userTbl'));
    }

    /**
     * Add method
     */
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

    /**
     * Edit method
     */
    public function edit($id = null)
    {
        $userTbl = $this->UserTbl->get($id);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $userTbl = $this->UserTbl->patchEntity($userTbl, $this->request->getData());
            if ($this->UserTbl->save($userTbl)) {
                $this->Flash->success(__('The user tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The user tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('userTbl'));
    }

    /**
     * Delete method
     */
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

    /**
     * Login method — returns JSON
     */
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
            ]);

            $response = $response->withStringBody(json_encode([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'fname' => $user->fname,
                    'lname' => $user->lname,
                    'user_name' => $user->user_name,
                ]
            ]));
        } else {
            $response = $response->withStatus(401)
                ->withStringBody(json_encode(['error' => 'Invalid credentials']));
        }

        // ADD CORS TO FINAL RESPONSE
        return $response
            ->withHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    }
}

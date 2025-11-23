<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;

class HwTblController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->HwTbl = $this->fetchTable('HwTbl'); // ADD THIS
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        parent::beforeFilter($event);
        $this->response = $this->response
            ->withHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type');

        if ($this->request->is('options')) {
            return $this->response;
        }
    }

    public function index()
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
            // DISABLE PAGINATION FOR FULL LIST (API)
            $this->paginate = ['limit' => 10000];
            $hwTbl = $this->HwTbl->find('all', [
                'order' => [
                    'region_name' => 'ASC',
                    'site_code' => 'ASC',
                    'hw_asset_num' => 'ASC'
                ]
            ])->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['hwTbl' => $hwTbl]));
        }

        // CRUD UI — keep pagination
        $hwTbl = $this->paginate($this->HwTbl);
        $this->set(compact('hwTbl'));
    }

    public function view($id = null)
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
            $hwTbl = $this->HwTbl->get($id, ['contain' => []]);
            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['hwTbl' => $hwTbl]));
        }

        $hwTbl = $this->HwTbl->get($id, ['contain' => []]);
        $this->set(compact('hwTbl'));
    }

    public function add()
    {
        $hwTbl = $this->HwTbl->newEmptyEntity();
        if ($this->request->is('post')) {
            $hwTbl = $this->HwTbl->patchEntity($hwTbl, $this->request->getData());
            if ($this->HwTbl->save($hwTbl)) {
                $this->Flash->success(__('The hw tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The hw tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('hwTbl'));
    }

    public function edit($id = null)
    {
        $hwTbl = $this->HwTbl->get($id, ['contain' => []]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $hwTbl = $this->HwTbl->patchEntity($hwTbl, $this->request->getData());
            if ($this->HwTbl->save($hwTbl)) {
                $this->Flash->success(__('The hw tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The hw tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('hwTbl'));
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $hwTbl = $this->HwTbl->get($id);
        if ($this->HwTbl->delete($hwTbl)) {
            $this->Flash->success(__('The hw tbl has been deleted.'));
        } else {
            $this->Flash->error(__('The hw tbl could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

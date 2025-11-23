<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
use App\Model\Table\RegionTblTable;

class RegionTblController extends AppController
{
    protected $RegionTbl;

    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->RegionTbl = $this->fetchTable('RegionTbl');
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        parent::beforeFilter($event);

        // CORS for React
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

        // IF JSON REQUESTED → RETURN JSON
        if ($this->request->accepts('application/json')) {
            $regionTbl = $this->paginate($this->RegionTbl)->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['regionTbl' => $regionTbl]));
        }

        // OTHERWISE → SHOW CRUD UI (like UserTbl)
        $regionTbl = $this->paginate($this->RegionTbl);
        $this->set(compact('regionTbl'));
    }

    public function view($id = null)
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
            $regionTbl = $this->RegionTbl->get($id, ['contain' => []]);
            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['regionTbl' => $regionTbl]));
        }

        $regionTbl = $this->RegionTbl->get($id, ['contain' => []]);
        $this->set(compact('regionTbl'));
    }

    // CRUD — 100% PRESERVED (HTML UI)
    public function add()
    {
        $regionTbl = $this->RegionTbl->newEmptyEntity();
        if ($this->request->is('post')) {
            $regionTbl = $this->RegionTbl->patchEntity($regionTbl, $this->request->getData());
            if ($this->RegionTbl->save($regionTbl)) {
                $this->Flash->success(__('The region tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The region tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('regionTbl'));
    }

    public function edit($id = null)
    {
        $regionTbl = $this->RegionTbl->get($id, ['contain' => []]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $regionTbl = $this->RegionTbl->patchEntity($regionTbl, $this->request->getData());
            if ($this->RegionTbl->save($regionTbl)) {
                $this->Flash->success(__('The region tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The region tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('regionTbl'));
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $regionTbl = $this->RegionTbl->get($id);
        if ($this->RegionTbl->delete($regionTbl)) {
            $this->Flash->success(__('The region tbl has been deleted.'));
        } else {
            $this->Flash->error(__('The region tbl could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

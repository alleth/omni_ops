<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;

class SiteListTblController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->SiteListTbl = $this->fetchTable('SiteListTbl'); // ADD THIS
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        parent::beforeFilter($event);
        $this->response = $this->response->withHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
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
            // DISABLE PAGINATION FOR FULL LIST
            $this->paginate = ['limit' => 10000];
            $siteListTbl = $this->SiteListTbl->find('all')->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['siteListTbl' => $siteListTbl]));
        }

        // CRUD UI — keep pagination
        $siteListTbl = $this->paginate($this->SiteListTbl);
        $this->set(compact('siteListTbl'));
    }

    public function view($id = null)
    {
        $this->request->allowMethod(['get']);
        if ($this->request->accepts('application/json')) {
            $siteListTbl = $this->SiteListTbl->get($id, ['contain' => []]);
            return $this->response->withType('json')
                ->withStringBody(json_encode(['siteListTbl' => $siteListTbl]));
        }
        $siteListTbl = $this->SiteListTbl->get($id, ['contain' => []]);
        $this->set(compact('siteListTbl'));
    }

    public function add()
    {
        $siteListTbl = $this->SiteListTbl->newEmptyEntity();
        if ($this->request->is('post')) {
            $siteListTbl = $this->SiteListTbl->patchEntity($siteListTbl, $this->request->getData());
            if ($this->SiteListTbl->save($siteListTbl)) {
                $this->Flash->success(__('The site list tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The site list tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('siteListTbl'));
    }

    public function edit($id = null)
    {
        $siteListTbl = $this->SiteListTbl->get($id, ['contain' => []]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $siteListTbl = $this->SiteListTbl->patchEntity($siteListTbl, $this->request->getData());
            if ($this->SiteListTbl->save($siteListTbl)) {
                $this->Flash->success(__('The site list tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The site list tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('siteListTbl'));
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $siteListTbl = $this->SiteListTbl->get($id);
        if ($this->SiteListTbl->delete($siteListTbl)) {
            $this->Flash->success(__('The site list tbl has been deleted.'));
        } else {
            $this->Flash->error(__('The site list tbl could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

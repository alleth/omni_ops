<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
use App\Model\Table\ItemBrandTable;

class ItemBrandController extends AppController
{
    protected $ItemBrand;

    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->ItemBrand = $this->fetchTable('ItemBrand');
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        parent::beforeFilter($event);

        // CORS for React (localhost:3000)
        $this->response = $this->response
            ->withHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type');

        if ($this->request->is('options')) {
            return $this->response;
        }
    }

    /**
     * Index method — returns JSON for API, HTML for UI
     */
    public function index()
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
            // API: Return all item brands (no pagination limit for simplicity)
            $itemBrand = $this->ItemBrand->find('all')->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['itemBrand' => $itemBrand]));
        }

        // UI: Keep pagination
        $itemBrand = $this->paginate($this->ItemBrand);
        $this->set(compact('itemBrand'));
    }

    /**
     * View method — returns JSON for API, HTML for UI
     */
    public function view($id = null)
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
            $itemBrand = $this->ItemBrand->get($id, ['contain' => []]);
            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['itemBrand' => $itemBrand]));
        }

        $itemBrand = $this->ItemBrand->get($id, ['contain' => []]);
        $this->set(compact('itemBrand'));
    }

    /**
     * Add method — HTML UI only (no JSON API for create)
     */
    public function add()
    {
        $itemBrand = $this->ItemBrand->newEmptyEntity();
        if ($this->request->is('post')) {
            $itemBrand = $this->ItemBrand->patchEntity($itemBrand, $this->request->getData());
            if ($this->ItemBrand->save($itemBrand)) {
                $this->Flash->success(__('The item brand has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item brand could not be saved. Please, try again.'));
        }
        $this->set(compact('itemBrand'));
    }

    /**
     * Edit method — HTML UI only
     */
    public function edit($id = null)
    {
        $itemBrand = $this->ItemBrand->get($id, ['contain' => []]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $itemBrand = $this->ItemBrand->patchEntity($itemBrand, $this->request->getData());
            if ($this->ItemBrand->save($itemBrand)) {
                $this->Flash->success(__('The item brand has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item brand could not be saved. Please, try again.'));
        }
        $this->set(compact('itemBrand'));
    }

    /**
     * Delete method — HTML UI only
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $itemBrand = $this->ItemBrand->get($id);
        if ($this->ItemBrand->delete($itemBrand)) {
            $this->Flash->success(__('The item brand has been deleted.'));
        } else {
            $this->Flash->error(__('The item brand could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}

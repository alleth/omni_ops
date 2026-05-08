<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;

class ItemModelsController extends AppController
{
    protected $ItemModels;

    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->ItemModels = $this->fetchTable('ItemModels');
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
            // API: Return all item models (no pagination limit for simplicity)
            $itemModels = $this->ItemModels->find('all')->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['itemModels' => $itemModels]));
        }

        // UI: Keep pagination
        $itemModels = $this->paginate($this->ItemModels);
        $this->set(compact('itemModels'));
    }

    /**
     * View method — returns JSON for API, HTML for UI
     */
    public function view($id = null)
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
            $itemModel = $this->ItemModels->get($id, ['contain' => []]);
            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['itemModel' => $itemModel]));
        }

        $itemModel = $this->ItemModels->get($id, ['contain' => []]);
        $this->set(compact('itemModel'));
    }

    /**
     * Add method — HTML UI only (no JSON API for create yet)
     */
    public function add()
    {
        $itemModel = $this->ItemModels->newEmptyEntity();
        if ($this->request->is('post')) {
            $itemModel = $this->ItemModels->patchEntity($itemModel, $this->request->getData());
            if ($this->ItemModels->save($itemModel)) {
                $this->Flash->success(__('The item model has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item model could not be saved. Please, try again.'));
        }
        $this->set(compact('itemModel'));
    }

    /**
     * Edit method — HTML UI only
     */
    public function edit($id = null)
    {
        $itemModel = $this->ItemModels->get($id, ['contain' => []]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $itemModel = $this->ItemModels->patchEntity($itemModel, $this->request->getData());
            if ($this->ItemModels->save($itemModel)) {
                $this->Flash->success(__('The item model has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item model could not be saved. Please, try again.'));
        }
        $this->set(compact('itemModel'));
    }

    /**
     * Delete method — HTML UI only
     */
    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $itemModel = $this->ItemModels->get($id);
        if ($this->ItemModels->delete($itemModel)) {
            $this->Flash->success(__('The item model has been deleted.'));
        } else {
            $this->Flash->error(__('The item model could not be deleted. Please, try again.'));
        }

        return $this->redirect(['action' => 'index']);
    }
}

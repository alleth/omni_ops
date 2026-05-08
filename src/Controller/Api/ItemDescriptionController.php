<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;

/**
 * ItemDescription Controller
 *
 * @property \App\Model\Table\ItemDescriptionTable $ItemDescription
 */
class ItemDescriptionController extends AppController
{
    protected $ItemDescription;

    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->ItemDescription = $this->fetchTable('ItemDescription');
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        parent::beforeFilter($event);

        // CORS — identical to RegionTblController
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
            // Return full list for API (no pagination limit)
            $itemDescription = $this->ItemDescription->find('all')
                ->order(['item_id' => 'ASC']) // using item_id as primary key
                ->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['itemDescription' => $itemDescription]));
        }

        // Regular HTML CRUD view
        $itemDescription = $this->paginate($this->ItemDescription);
        $this->set(compact('itemDescription'));
    }

    public function view($id = null)
    {
        $this->request->allowMethod(['get']);

        $itemDescription = $this->ItemDescription->get($id, ['contain' => []]);

        if ($this->request->accepts('application/json')) {
            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['itemDescription' => $itemDescription]));
        }

        $this->set(compact('itemDescription'));
    }

    public function add()
    {
        $itemDescription = $this->ItemDescription->newEmptyEntity();
        if ($this->request->is('post')) {
            $itemDescription = $this->ItemDescription->patchEntity($itemDescription, $this->request->getData());
            if ($this->ItemDescription->save($itemDescription)) {
                $this->Flash->success(__('The item description has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item description could not be saved. Please, try again.'));
        }
        $this->set(compact('itemDescription'));
    }

    public function edit($id = null)
    {
        $itemDescription = $this->ItemDescription->get($id, ['contain' => []]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $itemDescription = $this->ItemDescription->patchEntity($itemDescription, $this->request->getData());
            if ($this->ItemDescription->save($itemDescription)) {
                $this->Flash->success(__('The item description has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item description could not be saved. Please, try again.'));
        }
        $this->set(compact('itemDescription'));
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $itemDescription = $this->ItemDescription->get($id);
        if ($this->ItemDescription->delete($itemDescription)) {
            $this->Flash->success(__('The item description has been deleted.'));
        } else {
            $this->Flash->error(__('The item description could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

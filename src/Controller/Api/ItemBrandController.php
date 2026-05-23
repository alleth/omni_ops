<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;

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
            $itemBrand = $this->ItemBrand->find('all')->toArray();
            return $this->response->withType('json')
                ->withStringBody(json_encode(['itemBrand' => $itemBrand]));
        }

        $itemBrand = $this->paginate($this->ItemBrand);
        $this->set(compact('itemBrand'));
    }

    public function view($id = null)
    {
        $this->request->allowMethod(['get']);
        $itemBrand = $this->ItemBrand->get($id, ['contain' => []]);

        if ($this->request->accepts('application/json')) {
            return $this->response->withType('json')
                ->withStringBody(json_encode(['itemBrand' => $itemBrand]));
        }

        $this->set(compact('itemBrand'));
    }

    public function add()
    {
        $itemBrand = $this->ItemBrand->newEmptyEntity();
        if ($this->request->is('post')) {
            $itemBrand = $this->ItemBrand->patchEntity($itemBrand, $this->request->getData());
            $saved = $this->ItemBrand->save($itemBrand);

            if ($this->request->accepts('application/json')) {
                if ($saved) {
                    return $this->response->withType('json')
                        ->withStringBody(json_encode(['success' => true, 'data' => $saved->toArray()]));
                }
                return $this->response->withStatus(422)->withType('json')
                    ->withStringBody(json_encode(['success' => false, 'errors' => $itemBrand->getErrors()]));
            }

            if ($saved) {
                $this->Flash->success(__('The item brand has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item brand could not be saved. Please, try again.'));
        }
        $this->set(compact('itemBrand'));
    }

    public function edit($id = null)
    {
        $itemBrand = $this->ItemBrand->get($id, ['contain' => []]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $itemBrand = $this->ItemBrand->patchEntity($itemBrand, $this->request->getData());
            $saved = $this->ItemBrand->save($itemBrand);

            if ($this->request->accepts('application/json')) {
                if ($saved) {
                    return $this->response->withType('json')
                        ->withStringBody(json_encode(['success' => true, 'data' => $saved->toArray()]));
                }
                return $this->response->withStatus(422)->withType('json')
                    ->withStringBody(json_encode(['success' => false, 'errors' => $itemBrand->getErrors()]));
            }

            if ($saved) {
                $this->Flash->success(__('The item brand has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item brand could not be saved. Please, try again.'));
        }
        $this->set(compact('itemBrand'));
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $itemBrand = $this->ItemBrand->get($id);
        $deleted = $this->ItemBrand->delete($itemBrand);

        if ($this->request->accepts('application/json')) {
            if ($deleted) {
                return $this->response->withType('json')
                    ->withStringBody(json_encode(['success' => true]));
            }
            return $this->response->withStatus(422)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'Could not delete this record.']));
        }

        if ($deleted) {
            $this->Flash->success(__('The item brand has been deleted.'));
        } else {
            $this->Flash->error(__('The item brand could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

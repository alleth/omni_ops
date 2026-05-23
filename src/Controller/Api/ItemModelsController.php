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
        $origin = $this->request->getHeaderLine('Origin') ?: '*';
        $this->response = $this->response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type')
            ->withHeader('Vary', 'Origin');

        if ($this->request->is('options')) {
            return $this->response;
        }
    }

    public function index()
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
            $itemModels = $this->ItemModels->find('all')->toArray();
            return $this->response->withType('json')
                ->withStringBody(json_encode(['itemModels' => $itemModels]));
        }

        $itemModels = $this->paginate($this->ItemModels);
        $this->set(compact('itemModels'));
    }

    public function view($id = null)
    {
        $this->request->allowMethod(['get']);
        $itemModel = $this->ItemModels->get($id, ['contain' => []]);

        if ($this->request->accepts('application/json')) {
            return $this->response->withType('json')
                ->withStringBody(json_encode(['itemModel' => $itemModel]));
        }

        $this->set(compact('itemModel'));
    }

    public function add()
    {
        $itemModel = $this->ItemModels->newEmptyEntity();
        if ($this->request->is('post')) {
            $itemModel = $this->ItemModels->patchEntity($itemModel, $this->request->getData());
            $saved = $this->ItemModels->save($itemModel);

            if ($this->request->accepts('application/json')) {
                if ($saved) {
                    return $this->response->withType('json')
                        ->withStringBody(json_encode(['success' => true, 'data' => $saved->toArray()]));
                }
                return $this->response->withStatus(422)->withType('json')
                    ->withStringBody(json_encode(['success' => false, 'errors' => $itemModel->getErrors()]));
            }

            if ($saved) {
                $this->Flash->success(__('The item model has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item model could not be saved. Please, try again.'));
        }
        $this->set(compact('itemModel'));
    }

    public function edit($id = null)
    {
        $itemModel = $this->ItemModels->get($id, ['contain' => []]);
        if ($this->request->is(['patch', 'post', 'put'])) {
            $itemModel = $this->ItemModels->patchEntity($itemModel, $this->request->getData());
            $saved = $this->ItemModels->save($itemModel);

            if ($this->request->accepts('application/json')) {
                if ($saved) {
                    return $this->response->withType('json')
                        ->withStringBody(json_encode(['success' => true, 'data' => $saved->toArray()]));
                }
                return $this->response->withStatus(422)->withType('json')
                    ->withStringBody(json_encode(['success' => false, 'errors' => $itemModel->getErrors()]));
            }

            if ($saved) {
                $this->Flash->success(__('The item model has been saved.'));
                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('The item model could not be saved. Please, try again.'));
        }
        $this->set(compact('itemModel'));
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $itemModel = $this->ItemModels->get($id);
        $deleted = $this->ItemModels->delete($itemModel);

        if ($this->request->accepts('application/json')) {
            if ($deleted) {
                return $this->response->withType('json')
                    ->withStringBody(json_encode(['success' => true]));
            }
            return $this->response->withStatus(422)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'Could not delete this record.']));
        }

        if ($deleted) {
            $this->Flash->success(__('The item model has been deleted.'));
        } else {
            $this->Flash->error(__('The item model could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

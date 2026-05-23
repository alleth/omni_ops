<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;

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
            $itemDescription = $this->ItemDescription->find('all')
                ->order(['item_id' => 'ASC'])
                ->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['itemDescription' => $itemDescription]));
        }

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
            $saved = $this->ItemDescription->save($itemDescription);

            if ($this->request->accepts('application/json')) {
                if ($saved) {
                    return $this->response->withType('json')
                        ->withStringBody(json_encode(['success' => true, 'data' => $saved->toArray()]));
                }
                return $this->response->withStatus(422)->withType('json')
                    ->withStringBody(json_encode(['success' => false, 'errors' => $itemDescription->getErrors()]));
            }

            if ($saved) {
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
            $saved = $this->ItemDescription->save($itemDescription);

            if ($this->request->accepts('application/json')) {
                if ($saved) {
                    return $this->response->withType('json')
                        ->withStringBody(json_encode(['success' => true, 'data' => $saved->toArray()]));
                }
                return $this->response->withStatus(422)->withType('json')
                    ->withStringBody(json_encode(['success' => false, 'errors' => $itemDescription->getErrors()]));
            }

            if ($saved) {
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
        $deleted = $this->ItemDescription->delete($itemDescription);

        if ($this->request->accepts('application/json')) {
            if ($deleted) {
                return $this->response->withType('json')
                    ->withStringBody(json_encode(['success' => true]));
            }
            return $this->response->withStatus(422)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'error' => 'Could not delete this record.']));
        }

        if ($deleted) {
            $this->Flash->success(__('The item description has been deleted.'));
        } else {
            $this->Flash->error(__('The item description could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

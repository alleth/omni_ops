<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
use Cake\Datasource\Exception\RecordNotFoundException;

class HwTblController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->HwTbl = $this->fetchTable('HwTbl');
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        parent::beforeFilter($event);

        // Global CORS headers
        $origin = $this->request->getHeaderLine('Origin') ?: '*';
        $this->response = $this->response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Max-Age', '86400')
            ->withHeader('Vary', 'Origin');

        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
    }

    public function index()
    {
        $this->request->allowMethod(['get']);

        if ($this->request->accepts('application/json')) {
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

        $hwTbl = $this->paginate($this->HwTbl);
        $this->set(compact('hwTbl'));
    }

    public function view($id = null)
    {
        $this->request->allowMethod(['get']);

        try {
            $hwTbl = $this->HwTbl->get($id, ['contain' => []]);
        } catch (RecordNotFoundException $e) {
            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withStatus(404)
                    ->withType('json')
                    ->withStringBody(json_encode(['error' => 'Record not found']));
            }
            throw $e;
        }

        if ($this->request->accepts('application/json')) {
            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['hwTbl' => $hwTbl]));
        }

        $this->set(compact('hwTbl'));
    }

    public function add()
    {
        $hwTbl = $this->HwTbl->newEmptyEntity();

        if ($this->request->is('post')) {
            $hwTbl = $this->HwTbl->patchEntity($hwTbl, $this->request->getData());

            if ($this->HwTbl->save($hwTbl)) {
                if ($this->request->accepts('application/json') || $this->request->getParam('_ext') === 'json') {
                    return $this->response
                        ->withType('json')
                        ->withStringBody(json_encode([
                            'success' => true,
                            'id' => $hwTbl->id,
                            'message' => 'The hardware has been saved.'
                        ]));
                }

                $this->Flash->success(__('The hardware has been saved.'));
                return $this->redirect(['action' => 'index']);
            }

            if ($this->request->accepts('application/json') || $this->request->getParam('_ext') === 'json') {
                return $this->response
                    ->withType('json')
                    ->withStatus(400)
                    ->withStringBody(json_encode([
                        'success' => false,
                        'message' => 'The hardware could not be saved. Please, try again.',
                        'errors' => $hwTbl->getErrors()
                    ]));
            }

            $this->Flash->error(__('The hardware could not be saved. Please, try again.'));
        }

        $this->set(compact('hwTbl'));
    }

    /**
     * Standard CakePHP edit action (for web UI)
     */
    public function edit($id = null)
    {
        try {
            $hwTbl = $this->HwTbl->get($id, ['contain' => []]);
        } catch (RecordNotFoundException $e) {
            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withStatus(404)
                    ->withType('json')
                    ->withStringBody(json_encode(['error' => 'Record not found']));
            }
            throw $e;
        }

        if ($this->request->is(['patch', 'post', 'put'])) {
            $hwTbl = $this->HwTbl->patchEntity($hwTbl, $this->request->getData());
            if ($this->HwTbl->save($hwTbl)) {
                if ($this->request->accepts('application/json')) {
                    return $this->response
                        ->withType('json')
                        ->withStringBody(json_encode([
                            'success' => true,
                            'message' => 'The hardware has been updated.',
                            'hwTbl' => $hwTbl
                        ]));
                }
                $this->Flash->success(__('The hardware has been saved.'));
                return $this->redirect(['action' => 'index']);
            }

            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withStatus(400)
                    ->withType('json')
                    ->withStringBody(json_encode([
                        'success' => false,
                        'message' => 'The hardware could not be updated.',
                        'errors' => $hwTbl->getErrors()
                    ]));
            }
            $this->Flash->error(__('The hardware could not be saved. Please, try again.'));
        }

        $this->set(compact('hwTbl'));
    }

    /**
     * API-only update action (used by React)
     * Endpoint: /api/hw-tbl/update.json
     */
    public function update()
    {
        $this->request->allowMethod(['post', 'put']);

        // Accept either 'id' or 'hw_id' from request
        $id = $this->request->getData('id') ?? $this->request->getData('hw_id');

        // Force cast to integer
        $id = (int) $id;

        if (!$id) {
            return $this->response
                ->withStatus(400)
                ->withType('json')
                ->withStringBody(json_encode(['error' => 'Valid ID (id or hw_id) is required for update']));
        }

        try {
            // Use hw_id to fetch the record
            $hwTbl = $this->HwTbl->get($id);
        } catch (RecordNotFoundException $e) {
            return $this->response
                ->withStatus(404)
                ->withType('json')
                ->withStringBody(json_encode(['error' => 'Hardware record not found']));
        }

        // Patch entity with incoming data
        $hwTbl = $this->HwTbl->patchEntity($hwTbl, $this->request->getData());

        if ($this->HwTbl->save($hwTbl)) {
            return $this->response
                ->withType('json')
                ->withStringBody(json_encode([
                    'success' => true,
                    'message' => 'Hardware updated successfully.',
                    'hwTbl' => $hwTbl
                ]));
        }

        return $this->response
            ->withStatus(400)
            ->withType('json')
            ->withStringBody(json_encode([
                'success' => false,
                'message' => 'Failed to update hardware.',
                'errors' => $hwTbl->getErrors()
            ]));
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        try {
            $hwTbl = $this->HwTbl->get($id);
        } catch (RecordNotFoundException $e) {
            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withStatus(404)
                    ->withType('json')
                    ->withStringBody(json_encode(['error' => 'Record not found']));
            }
            throw $e;
        }

        if ($this->HwTbl->delete($hwTbl)) {
            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withType('json')
                    ->withStringBody(json_encode(['message' => 'Deleted successfully']));
            }
            $this->Flash->success(__('The hw tbl has been deleted.'));
        } else {
            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withStatus(400)
                    ->withType('json')
                    ->withStringBody(json_encode(['error' => 'The hw tbl could not be deleted']));
            }
            $this->Flash->error(__('The hw tbl could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }

    /**
     * API endpoint: Get hardware by site_code
     */
    public function site($site_code = null)
    {
        $this->request->allowMethod(['get']);

        if (!$site_code) {
            return $this->response
                ->withStatus(400)
                ->withType('json')
                ->withStringBody(json_encode(['error' => 'Site code is required']));
        }

        if ($this->request->accepts('application/json')) {
            $hwTbl = $this->HwTbl->find('all')
                ->where(['site_code' => $site_code])
                ->order(['hw_asset_num' => 'ASC'])
                ->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['hwTbl' => $hwTbl]));
        }

        return $this->redirect(['action' => 'index']);
    }
}

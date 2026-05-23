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
        $this->SiteListTbl = $this->fetchTable('SiteListTbl');
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        parent::beforeFilter($event);

        // CORS headers (keep your existing)
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
            $this->paginate = ['limit' => 10000];
            $siteListTbl = $this->SiteListTbl->find('all')->toArray();

            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['siteListTbl' => $siteListTbl]));
        }

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
            $data = $this->request->getData();

            // Force physical_site_count to 1 or 2 for API
            $val = isset($data['physical_site_count']) ? (int)$data['physical_site_count'] : 1;
            $data['physical_site_count'] = ($val === 2) ? 2 : 1;

            $siteListTbl = $this->SiteListTbl->patchEntity($siteListTbl, $data);
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

        // JSON API handling (React)
        if ($this->request->accepts('application/json')) {
            if ($this->request->is(['post', 'patch', 'put'])) {
                $data = $this->request->getData();

                // Force physical_site_count to 1 or 2
                $val = isset($data['physical_site_count']) ? (int)$data['physical_site_count'] : 1;
                $data['physical_site_count'] = ($val === 2) ? 2 : 1;

                $siteListTbl = $this->SiteListTbl->patchEntity($siteListTbl, $data);

                if ($this->SiteListTbl->save($siteListTbl)) {
                    return $this->response
                        ->withType('json')
                        ->withStringBody(json_encode([
                            'success' => true,
                            'message' => 'Site updated successfully',
                            'siteListTbl' => $siteListTbl
                        ]));
                }

                return $this->response
                    ->withType('json')
                    ->withStatus(400)
                    ->withStringBody(json_encode([
                        'success' => false,
                        'message' => 'Could not save site',
                        'errors' => $siteListTbl->getErrors()
                    ]));
            }

            // GET JSON (view single)
            return $this->response
                ->withType('json')
                ->withStringBody(json_encode(['siteListTbl' => $siteListTbl]));
        }

        // HTML CRUD template (browser) - unchanged
        if ($this->request->is(['post', 'patch', 'put'])) {
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

        if ($this->request->accepts('application/json')) {
            if ($this->SiteListTbl->delete($siteListTbl)) {
                return $this->response
                    ->withType('json')
                    ->withStringBody(json_encode([
                        'success' => true,
                        'message' => 'Site deleted successfully'
                    ]));
            }

            return $this->response
                ->withType('json')
                ->withStatus(400)
                ->withStringBody(json_encode([
                    'success' => false,
                    'message' => 'The site list tbl could not be deleted. Please, try again.'
                ]));
        }

        if ($this->SiteListTbl->delete($siteListTbl)) {
            $this->Flash->success(__('The site list tbl has been deleted.'));
        } else {
            $this->Flash->error(__('The site list tbl could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

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

            $isJson = $this->request->accepts('application/json');

            // site_code is the key every hardware row joins on, so a duplicate
            // silently splits one site's inventory in two. SiteDetailsModal checks
            // this client-side on create; enforced here too since the endpoint is
            // reachable without it.
            $code = trim((string)($data['site_code'] ?? ''));
            if ($isJson && $code !== '') {
                $exists = $this->SiteListTbl->find()
                    ->where(['TRIM(site_code)' => $code])
                    ->count();
                if ($exists > 0) {
                    return $this->response->withStatus(409)->withType('json')
                        ->withStringBody(json_encode([
                            'success' => false,
                            'message' => "Site Code '{$code}' already exists.",
                        ]));
                }
            }

            $siteListTbl = $this->SiteListTbl->patchEntity($siteListTbl, $data);
            if ($this->SiteListTbl->save($siteListTbl)) {
                // This branch used to be missing entirely: the API client got a
                // 302 to index(), followed it, and received the whole site list --
                // which is the only reason its `res.siteListTbl` success check
                // appeared to work. Validation failures never reached it at all.
                if ($isJson) {
                    return $this->response->withType('json')
                        ->withStringBody(json_encode([
                            'success'     => true,
                            'message'     => 'Site created successfully',
                            'siteListTbl' => $siteListTbl,
                        ]));
                }
                $this->Flash->success(__('The site list tbl has been saved.'));
                return $this->redirect(['action' => 'index']);
            }

            if ($isJson) {
                return $this->response->withStatus(400)->withType('json')
                    ->withStringBody(json_encode([
                        'success' => false,
                        'message' => 'Could not save site',
                        'errors'  => $siteListTbl->getErrors(),
                    ]));
            }
            $this->Flash->error(__('The site list tbl could not be saved. Please, try again.'));
        }
        $this->set(compact('siteListTbl'));
    }

    public function edit($id = null)
    {
        try {
            $siteListTbl = $this->SiteListTbl->get($id, ['contain' => []]);
        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            return $this->response->withStatus(404)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'message' => 'Site not found']));
        }

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

        try {
            $siteListTbl = $this->SiteListTbl->get($id);
        } catch (\Cake\Datasource\Exception\RecordNotFoundException $e) {
            return $this->response->withStatus(404)->withType('json')
                ->withStringBody(json_encode(['success' => false, 'message' => 'Site not found']));
        }

        // The schema carries no foreign keys, so deleting a site used to silently
        // strand its hardware: those rows keep a site_code that now matches
        // nothing, disappear from every site-scoped view, and still count toward
        // totals. Refused rather than cascaded -- which rows should follow a
        // deleted site is a decision for whoever is deleting it.
        $code = trim((string)$siteListTbl->site_code);
        if ($code !== '') {
            $hwCount = $this->fetchTable('HwTbl')->find()
                ->where(['TRIM(site_code)' => $code])
                ->count();

            if ($hwCount > 0) {
                $message = "Cannot delete this site: {$hwCount} hardware record(s) are still assigned to "
                    . "site code {$code}. Reassign or remove them first.";

                if ($this->request->accepts('application/json')) {
                    return $this->response->withStatus(409)->withType('json')
                        ->withStringBody(json_encode(['success' => false, 'message' => $message]));
                }

                $this->Flash->error(__($message));
                return $this->redirect(['action' => 'index']);
            }
        }

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

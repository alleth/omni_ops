<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
use Cake\Datasource\Exception\RecordNotFoundException;
use Cake\Datasource\ConnectionManager;
use Cake\Http\Exception\BadRequestException;
use Cake\Utility\Text;

class RequestTblController extends AppController
{
    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->RequestTbl = $this->fetchTable('RequestTbl');

        // Association for cluster filtering via user_tbl
        $this->RequestTbl->belongsTo('Users', [
            'className' => 'UserTbl',
            'foreignKey' => 'requested_by',
            'joinType' => 'INNER',
        ]);
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

        if (!$this->request->accepts('application/json')) {
            $requestTbl = $this->paginate($this->RequestTbl);
            $this->set(compact('requestTbl'));
            return;
        }

        $query = $this->RequestTbl->find()
            ->order(['RequestTbl.created_at' => 'DESC'])
            ->contain(['Users']);

        // Filter: requested_by (FSE)
        $requestedBy = $this->request->getQuery('requested_by');
        if ($requestedBy !== null && $requestedBy !== '') {
            $requestedBy = (int)$requestedBy;
            if ($requestedBy > 0) {
                $query->where(['RequestTbl.requested_by' => $requestedBy]);
            }
        }

        // Filter: status
        $status = $this->request->getQuery('status');
        if ($status) {
            $cleanStatus = strtoupper(trim($status));
            $validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'];
            if (in_array($cleanStatus, $validStatuses)) {
                $query->where(['RequestTbl.status' => $cleanStatus]);
            }
        }

        // Filter: cluster_name (Supervisor)
        $clusterName = $this->request->getQuery('cluster_name');
        if ($clusterName) {
            $query->innerJoinWith('Users')
                ->where(['Users.cluster_name LIKE' => '%' . trim($clusterName) . '%']);
        }

        $requests = $query->all()->toArray();

        return $this->response
            ->withType('json')
            ->withStringBody(json_encode([
                'requests' => $requests,
                'count'    => count($requests),
                'applied_filters' => $this->request->getQuery()
            ]));
    }

    public function view($id = null)
    {
        $this->request->allowMethod(['get']);

        try {
            $requestTbl = $this->RequestTbl->get($id, ['contain' => []]);
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
                ->withStringBody(json_encode(['requestTbl' => $requestTbl]));
        }

        $this->set(compact('requestTbl'));
    }

    public function add()
    {
        // Your existing add() method - unchanged
        if (!$this->request->is('post')) {
            $requestTbl = $this->RequestTbl->newEmptyEntity();
            $this->set(compact('requestTbl'));
            return;
        }

        $postData = $this->request->getData();

        $jsonData = [];
        if (isset($postData['data']) && is_string($postData['data'])) {
            $jsonData = json_decode($postData['data'], true) ?? [];
        }

        $data = array_merge($postData, $jsonData);

        $attachmentPath = null;
        $uploadedFile = $this->request->getUploadedFile('attachment');

        if ($uploadedFile && $uploadedFile->getError() === UPLOAD_ERR_OK) {
            $allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            $mimeType = $uploadedFile->getClientMediaType();

            if (in_array($mimeType, $allowedTypes)) {
                $requestType = $data['request_type'] ?? 'PULL_OUT';
                $subFolderName = ($requestType === 'RELOCATION') ? 'relocation_forms' : 'pullout_forms';
                $monthYear = date('Y-m');
                $uploadSubDir = $subFolderName . DS . $monthYear;

                $uploadDir = WWW_ROOT . 'uploads' . DS . $uploadSubDir;
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }

                $timestamp = date('Ymd-His');
                $originalExt = strtolower(pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION));
                $prefix = ($requestType === 'RELOCATION') ? 'relocation_' : 'pullout_';
                $uniqueName = $prefix . $timestamp . '_' . uniqid() . '.' . $originalExt;
                $targetPath = $uploadDir . DS . $uniqueName;

                $uploadedFile->moveTo($targetPath);

                if (file_exists($targetPath)) {
                    $attachmentPath = '/uploads/' . str_replace(DS, '/', $uploadSubDir) . '/' . $uniqueName;
                }
            }
        }

        $savedIds = [];
        $errors = [];
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [$data];

        foreach ($items as $itemData) {
            $entityData = [
                'hw_id'             => $itemData['hw_id'] ?? null,
                'request_type'      => $data['request_type'] ?? null,
                'requested_by'      => $data['requested_by'] ?? null,
                'status'            => $data['status'] ?? 'PENDING',
                'destination_site'  => $data['destination_site'] ?? null,
                'site_code'         => $itemData['site_code'] ?? $data['site_code'] ?? null,
                'asset_num'         => $itemData['asset_num'] ?? null,
                'serial_num'        => $itemData['serial_num'] ?? null,
                'item_desc'         => $itemData['item_desc'] ?? null,
                'hw_brand_name'     => $itemData['hw_brand_name'] ?? null,
                'hw_model'          => $itemData['hw_model'] ?? null,
                'quantity'          => $itemData['quantity'] ?? 1,
                'remarks'           => $itemData['remarks'] ?? $data['remarks'] ?? null,
                'attachment_path'   => $attachmentPath,
                // Pull-out detail fields
                'sr_num'            => $data['sr_num'] ?? null,
                'sr_date'           => $data['sr_date'] ?? null,
                'return_date'       => $data['return_date'] ?? null,
                'delivery_method'   => $data['delivery_method'] ?? null,
                'tracking_num'      => $data['tracking_num'] ?? null,
                'delivered_by'      => $data['delivered_by'] ?? null,
                'pickup_date'       => $data['pickup_date'] ?? null,
                // Relocation detail fields
                'date_transfer'     => $data['date_transfer'] ?? null,
                'transfer_from_name' => $data['transfer_from_name'] ?? null,
                'transfer_to_name'  => $data['transfer_to_name'] ?? null,
            ];

            $requestTbl = $this->RequestTbl->newEntity($entityData);

            if ($this->RequestTbl->save($requestTbl)) {
                $savedIds[] = $requestTbl->id;
            } else {
                $errors[] = $requestTbl->getErrors();
            }
        }

        if (empty($errors)) {
            return $this->response->withType('json')->withStringBody(json_encode([
                'success'         => true,
                'ids'             => $savedIds,
                'message'         => 'The request(s) have been saved.',
                'attachment_path' => $attachmentPath
            ]));
        } else {
            return $this->response->withStatus(400)->withType('json')->withStringBody(json_encode([
                'success' => false,
                'message' => 'The request(s) could not be saved.',
                'errors'  => $errors
            ]));
        }
    }

    public function edit($id = null)
    {
        try {
            $requestTbl = $this->RequestTbl->get($id, ['contain' => []]);
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
            $requestTbl = $this->RequestTbl->patchEntity($requestTbl, $this->request->getData());
            if ($this->RequestTbl->save($requestTbl)) {
                if ($this->request->accepts('application/json')) {
                    return $this->response
                        ->withType('json')
                        ->withStringBody(json_encode([
                            'success'    => true,
                            'message'    => 'The request has been updated.',
                            'requestTbl' => $requestTbl
                        ]));
                }
                $this->Flash->success(__('The request has been saved.'));
                return $this->redirect(['action' => 'index']);
            }

            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withStatus(400)
                    ->withType('json')
                    ->withStringBody(json_encode([
                        'success' => false,
                        'message' => 'The request could not be updated.',
                        'errors'  => $requestTbl->getErrors()
                    ]));
            }
            $this->Flash->error(__('The request could not be saved. Please, try again.'));
        }

        $this->set(compact('requestTbl'));
    }

    /**
     * API endpoint for React modal: approve / reject / cancel
     */
    public function update()
    {
        $this->request->allowMethod(['post', 'put', 'patch']);

        $data = $this->request->getData();

        if (empty($data['request_id'])) {
            return $this->responseJson(['success' => false, 'message' => 'Missing request_id']);
        }

        try {
            $requestTbl = $this->RequestTbl->get($data['request_id']);
        } catch (RecordNotFoundException $e) {
            return $this->responseJson(['success' => false, 'message' => 'Request not found']);
        }

        $requestTbl = $this->RequestTbl->patchEntity($requestTbl, $data);

        if ($this->RequestTbl->save($requestTbl)) {
            return $this->responseJson([
                'success' => true,
                'message' => 'Request updated successfully',
                'request' => $requestTbl->toArray()
            ]);
        }

        return $this->responseJson([
            'success' => false,
            'message' => 'Failed to update request',
            'errors' => $requestTbl->getErrors()
        ]);
    }

    /**
     * NEW: Update Attachment Only (for SPV replacement)
     * URL: /api/request-tbl/update-attachment/{id}.json
     */
    public function updateAttachment($id = null)
    {
        $this->request->allowMethod(['post']);

        if (!$id) {
            return $this->responseJson(['success' => false, 'message' => 'Request ID is required']);
        }

        try {
            $requestTbl = $this->RequestTbl->get($id);
        } catch (RecordNotFoundException $e) {
            return $this->responseJson(['success' => false, 'message' => 'Request not found']);
        }

        $uploadedFile = $this->request->getUploadedFile('attachment');

        if (!$uploadedFile || $uploadedFile->getError() !== UPLOAD_ERR_OK) {
            return $this->responseJson(['success' => false, 'message' => 'No valid file uploaded']);
        }

        // Validate file type
        $allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        $mimeType = $uploadedFile->getClientMediaType();

        if (!in_array($mimeType, $allowedTypes)) {
            return $this->responseJson(['success' => false, 'message' => 'Invalid file type. Only PDF, JPG, PNG allowed']);
        }

        if ($uploadedFile->getSize() > 5 * 1024 * 1024) {
            return $this->responseJson(['success' => false, 'message' => 'File size exceeds 5MB limit']);
        }

        // Create upload path
        $monthYear = date('Y-m');
        $uploadSubDir = 'request_attachments' . DS . $monthYear;
        $uploadDir = WWW_ROOT . 'uploads' . DS . $uploadSubDir;

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $timestamp = date('Ymd-His');
        $originalExt = strtolower(pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION));
        $uniqueName = 'req_' . $id . '_' . $timestamp . '_' . uniqid() . '.' . $originalExt;
        $targetPath = $uploadDir . DS . $uniqueName;

        $uploadedFile->moveTo($targetPath);

        if (!file_exists($targetPath)) {
            return $this->responseJson(['success' => false, 'message' => 'Failed to save uploaded file']);
        }

        $attachmentPath = '/uploads/' . str_replace(DS, '/', $uploadSubDir) . '/' . $uniqueName;

        // Update only the attachment_path
        $requestTbl = $this->RequestTbl->patchEntity($requestTbl, [
            'attachment_path' => $attachmentPath,
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        if ($this->RequestTbl->save($requestTbl)) {
            return $this->responseJson([
                'success' => true,
                'message' => 'Attachment updated successfully',
                'attachment_path' => $attachmentPath,
                'request' => $requestTbl->toArray()
            ]);
        }

        return $this->responseJson([
            'success' => false,
            'message' => 'Failed to update attachment',
            'errors' => $requestTbl->getErrors()
        ]);
    }

    /**
     * Helper to return JSON response
     */
    private function responseJson(array $data)
    {
        $this->response = $this->response->withType('application/json');
        $this->response = $this->response->withStringBody(json_encode($data));
        return $this->response;
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        try {
            $requestTbl = $this->RequestTbl->get($id);
        } catch (RecordNotFoundException $e) {
            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withStatus(404)
                    ->withType('json')
                    ->withStringBody(json_encode(['error' => 'Record not found']));
            }
            throw $e;
        }

        if ($this->RequestTbl->delete($requestTbl)) {
            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withType('json')
                    ->withStringBody(json_encode(['message' => 'Deleted successfully']));
            }
            $this->Flash->success(__('The request has been deleted.'));
        } else {
            if ($this->request->accepts('application/json')) {
                return $this->response
                    ->withStatus(400)
                    ->withType('json')
                    ->withStringBody(json_encode(['error' => 'The request could not be deleted']));
            }
            $this->Flash->error(__('The request could not be deleted. Please, try again.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}

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
    /**
     * Verified MIME type => the extension the file gets on disk.
     *
     * Both the Content-Type header and the filename on a multipart upload are
     * supplied by the client and can say anything, so neither is used to decide
     * what a file is or what it is named here. The type is sniffed from the
     * file's own bytes and the extension comes from this map, which is what
     * stops a .php from being written into WWW_ROOT/uploads (served straight
     * off disk by Apache) just by declaring Content-Type: application/pdf.
     */
    private const ALLOWED_UPLOAD_TYPES = [
        'application/pdf' => 'pdf',
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
    ];

    private const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

    /**
     * Returns the canonical extension for an uploaded file after confirming its
     * real type from its contents, or null if it isn't an allowed type or is
     * over the size limit.
     */
    private function verifiedUploadExtension(\Psr\Http\Message\UploadedFileInterface $file): ?string
    {
        $size = $file->getSize();
        if ($size !== null && $size > self::MAX_UPLOAD_BYTES) {
            return null;
        }

        try {
            $stream = $file->getStream();
            $stream->rewind();
            // Magic bytes for PDF/JPEG/PNG all live well inside the first few KB.
            $head = $stream->read(4096);
            $stream->rewind();
        } catch (\Throwable $e) {
            return null;
        }

        if ($head === '' || $head === false) {
            return null;
        }

        $detected = (new \finfo(FILEINFO_MIME_TYPE))->buffer($head);

        return self::ALLOWED_UPLOAD_TYPES[$detected] ?? null;
    }

    /**
     * Removes an attachment file from disk, but only once no request row still
     * points at it.
     *
     * A bulk submission saves one row per hardware item and gives every one of
     * them the SAME attachment_path (add() uploads a single form covering the
     * whole batch). Deleting the file when one of those rows is canceled used to
     * break the attachment link for all its siblings, which are still live
     * requests. Checking for other referencing rows first keeps a shared form on
     * disk until the last row referencing it is gone.
     *
     * @param string $path      attachment_path as stored (web path, e.g. /uploads/...)
     * @param int    $exceptId  request_id to ignore when looking for other referents
     */
    private function deleteAttachmentFile(string $path, int $exceptId): void
    {
        if ($path === '') {
            return;
        }

        $stillReferenced = $this->RequestTbl->find()
            ->where(['attachment_path' => $path, 'request_id !=' => $exceptId])
            ->count();

        if ($stillReferenced > 0) {
            return;
        }

        $fullPath = WWW_ROOT . ltrim(str_replace('/', DS, $path), DS);
        if (is_file($fullPath) && !@unlink($fullPath)) {
            // Logged rather than swallowed: a failed delete leaves a real file on
            // disk that no DB row references any more, so this line is the only
            // way it gets noticed (backfill_delete_canceled_attachments.php only
            // finds rows where attachment_path is still set).
            \Cake\Log\Log::error("Failed to delete attachment file: {$fullPath}");
        }
    }

    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
        $this->RequestTbl = $this->fetchTable('RequestTbl');
        $this->HwTbl = $this->fetchTable('HwTbl');

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
            $ext = $this->verifiedUploadExtension($uploadedFile);

            // A rejected file used to be dropped silently here: the request saved
            // with attachment_path = null and the response still said success, so
            // the requester was told their form was on file when it wasn't.
            if ($ext === null) {
                return $this->response->withStatus(400)->withType('json')->withStringBody(json_encode([
                    'success' => false,
                    'message' => 'Attachment must be a PDF, JPEG or PNG of at most 5MB.',
                ]));
            }

            $requestType = $data['request_type'] ?? 'PULL_OUT';
            $subFolderName = ($requestType === 'RELOCATION') ? 'relocation_forms' : 'pullout_forms';
            $monthYear = date('Y-m');
            $uploadSubDir = $subFolderName . DS . $monthYear;

            $uploadDir = WWW_ROOT . 'uploads' . DS . $uploadSubDir;
            if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                \Cake\Log\Log::error("Could not create upload directory: {$uploadDir}");
                return $this->response->withStatus(500)->withType('json')->withStringBody(json_encode([
                    'success' => false,
                    'message' => 'Could not store the attachment. Please try again.',
                ]));
            }

            $timestamp = date('Ymd-His');
            $prefix = ($requestType === 'RELOCATION') ? 'relocation_' : 'pullout_';
            $uniqueName = $prefix . $timestamp . '_' . uniqid() . '.' . $ext;
            $targetPath = $uploadDir . DS . $uniqueName;

            // moveTo() throws on failure; unguarded it surfaced as a 500 with no
            // indication the attachment was the cause.
            try {
                $uploadedFile->moveTo($targetPath);
            } catch (\Throwable $e) {
                \Cake\Log\Log::error("Attachment moveTo failed ({$targetPath}): " . $e->getMessage());
                return $this->response->withStatus(500)->withType('json')->withStringBody(json_encode([
                    'success' => false,
                    'message' => 'Could not store the attachment. Please try again.',
                ]));
            }

            if (file_exists($targetPath)) {
                $attachmentPath = '/uploads/' . str_replace(DS, '/', $uploadSubDir) . '/' . $uniqueName;
            }
        }

        $savedIds = [];
        $errors = [];
        $items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [$data];

        // A bulk submission is one user action and has to land all-or-nothing.
        // Without this, a validation failure on item 3 of 5 still left items 1-2
        // saved -- and their hardware already flipped to 'Pending' below -- while
        // the client got a 400 saying nothing had been saved, so the stranded
        // rows were invisible from the UI that created them.
        $connection = $this->RequestTbl->getConnection();
        $connection->begin();

        try {
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
                    // Not ->id -- the primary key column is request_id, not id, so
                    // ->id was always null here (harmless so far since no caller
                    // reads the response's `ids`, but worth being correct).
                    $savedIds[] = $requestTbl->request_id;

                    // Reflect the pending request on the hardware record itself.
                    // Without this, hw_status stays 'On Site' until the request is
                    // approved, and only MasterfileInventory's client-side
                    // pendingRequestHwIds cross-reference (built from PENDING
                    // request-tbl rows) hides it there -- every other view that
                    // filters by hw_status directly (Hardware Management, Reports,
                    // the public Landing page) kept counting/showing it as On Site.
                    // Reverted back to 'On Site' on reject/cancel, flipped to
                    // 'Pullout' on approve (see requestActions.js).
                    $requestType = strtoupper($data['request_type'] ?? '');
                    if (!empty($entityData['hw_id']) && in_array($requestType, ['PULL_OUT', 'RELOCATION'], true)) {
                        try {
                            $hw = $this->HwTbl->get($entityData['hw_id']);
                            $hw->hw_status = 'Pending';
                            // No updated_at here: hw_tbl has no such column, so the
                            // assignment that used to sit on this line never reached
                            // the generated SQL.
                            $this->HwTbl->save($hw);
                        } catch (RecordNotFoundException $e) {
                            // hw_id no longer exists; the request itself still saved fine.
                        }
                    }
                } else {
                    $errors[] = $requestTbl->getErrors();
                }
            }
        } catch (\Throwable $e) {
            // Without this, a DB-level failure mid-loop would leave the
            // transaction open on the way out instead of undoing the batch.
            $connection->rollback();
            \Cake\Log\Log::error('Request batch save failed, rolled back: ' . $e->getMessage());

            return $this->response->withStatus(500)->withType('json')->withStringBody(json_encode([
                'success' => false,
                'message' => 'The request(s) could not be saved.',
            ]));
        }

        if (empty($errors)) {
            $connection->commit();
            return $this->response->withType('json')->withStringBody(json_encode([
                'success'         => true,
                'ids'             => $savedIds,
                'message'         => 'The request(s) have been saved.',
                'attachment_path' => $attachmentPath
            ]));
        } else {
            // Undoes every row saved in this batch and every hw_status flip that
            // went with them, so the 400 below is actually true.
            $connection->rollback();
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

        // Captured before patching -- once CANCELED, the requester's uploaded
        // attachment (pullout/relocation form) is deleted below, so this is
        // the last point the pre-patch status/attachment are both known.
        $wasCanceled = strtoupper($requestTbl->status ?? '') === 'CANCELED';
        $previousAttachment = $requestTbl->attachment_path;

        $requestTbl = $this->RequestTbl->patchEntity($requestTbl, $data);

        if ($this->RequestTbl->save($requestTbl)) {
            // A canceled request never went anywhere -- its attachment (and
            // visibility to anyone but the requester; see MasterfileDashboard.js
            // / MasterfileRequestMonitoring.js) shouldn't stick around either.
            // Only fires on the PENDING/REJECTED -> CANCELED transition, not on
            // every subsequent update to an already-canceled row (attachment_path
            // is null by then anyway).
            $becomingCanceled = !$wasCanceled && strtoupper($requestTbl->status ?? '') === 'CANCELED';
            if ($becomingCanceled && $previousAttachment) {
                // attachment_path is cleared below regardless of whether the file
                // delete happens -- the "not viewable to anyone" guarantee is a
                // database fact (nothing in the app links a null path), and it
                // shouldn't depend on the filesystem. The file itself only goes
                // when no sibling row from the same bulk submission still needs
                // it; see deleteAttachmentFile().
                $this->deleteAttachmentFile($previousAttachment, (int)$requestTbl->request_id);
                $requestTbl->attachment_path = null;
                if (!$this->RequestTbl->save($requestTbl)) {
                    \Cake\Log\Log::error(
                        "Failed to clear attachment_path for canceled request #{$requestTbl->request_id}: "
                        . json_encode($requestTbl->getErrors())
                    );
                }
            }

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

        // Type is sniffed from the file's bytes, not taken from the client's
        // Content-Type header or filename (see verifiedUploadExtension).
        $ext = $this->verifiedUploadExtension($uploadedFile);
        if ($ext === null) {
            return $this->responseJson(
                ['success' => false, 'message' => 'Attachment must be a PDF, JPEG or PNG of at most 5MB.'],
                400
            );
        }

        // Create upload path
        $monthYear = date('Y-m');
        $uploadSubDir = 'request_attachments' . DS . $monthYear;
        $uploadDir = WWW_ROOT . 'uploads' . DS . $uploadSubDir;

        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            \Cake\Log\Log::error("Could not create upload directory: {$uploadDir}");
            return $this->responseJson(['success' => false, 'message' => 'Failed to save uploaded file'], 500);
        }

        // Captured before the row is repointed, so the file being replaced can be
        // removed afterwards instead of being orphaned on disk with no reference.
        $replacedAttachment = $requestTbl->attachment_path;

        $timestamp = date('Ymd-His');
        $uniqueName = 'req_' . $id . '_' . $timestamp . '_' . uniqid() . '.' . $ext;
        $targetPath = $uploadDir . DS . $uniqueName;

        try {
            $uploadedFile->moveTo($targetPath);
        } catch (\Throwable $e) {
            \Cake\Log\Log::error("Attachment moveTo failed ({$targetPath}): " . $e->getMessage());
            return $this->responseJson(['success' => false, 'message' => 'Failed to save uploaded file'], 500);
        }

        if (!file_exists($targetPath)) {
            return $this->responseJson(['success' => false, 'message' => 'Failed to save uploaded file'], 500);
        }

        $attachmentPath = '/uploads/' . str_replace(DS, '/', $uploadSubDir) . '/' . $uniqueName;

        // Update only the attachment_path
        $requestTbl = $this->RequestTbl->patchEntity($requestTbl, [
            'attachment_path' => $attachmentPath,
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        if ($this->RequestTbl->save($requestTbl)) {
            // Only once the row points at the new file -- if the save had failed,
            // the old attachment is still the live one and must stay.
            if ($replacedAttachment && $replacedAttachment !== $attachmentPath) {
                $this->deleteAttachmentFile($replacedAttachment, (int)$requestTbl->request_id);
            }

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
        ], 400);
    }

    /**
     * Helper to return JSON response
     */
    private function responseJson(array $data, int $status = 200)
    {
        // Failures used to come back as HTTP 200 with success:false, so callers
        // checking res.ok (rather than the body) read "not found" as a success.
        $this->response = $this->response->withType('application/json');
        $this->response = $this->response->withStatus($status);
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

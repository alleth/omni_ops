<?php
declare(strict_types=1);

namespace App\Controller\Api;

use App\Controller\AppController;
use Cake\Event\EventInterface;

/**
 * Base controller for /api endpoints that enforce authentication.
 *
 * Background: until this class existed, nothing under /api was authenticated or
 * authorized at all. `UserTblController::login()` wrote `Auth.User` into the PHP
 * session, but no controller ever read it back, so every role rule in the app
 * was client-side UI gating -- a direct POST to `/api/user-tbl/reset-password`
 * would change any account's password with no credentials whatsoever.
 *
 * Rollout is deliberately phased. This base is **allow-by-default**: an action
 * is only checked when a controller names it in `protectedActions()`. Phase 1
 * covers the account-takeover endpoints and the destructive ones; Phase 2 will
 * invert the default to deny-by-default once every caller is confirmed. Leaving
 * the default open for now means an endpoint overlooked here keeps behaving
 * exactly as it did before, rather than returning 401 to live users.
 *
 * Identity comes from the session written at login, which means the existing
 * PHPSESSID cookie is enough -- it is already issued at login (the client sends
 * `credentials: 'include'` there) and already travels on every subsequent call,
 * since the SPA is same-origin with the API in production and goes through the
 * CRA proxy in development. No client change is required for the session to
 * arrive.
 */
abstract class ApiController extends AppController
{
    /**
     * Wildcard for `protectedActions()`: any signed-in user, no role restriction.
     */
    protected const ANY_AUTHENTICATED = '*';

    /**
     * Accepted spellings per canonical role.
     *
     * `user_tbl.user_type` holds ADM/SPV/FSE/ROO in practice, but the frontend
     * matches these longer variants too (see AddHardwareModal, MasterfileDashboard,
     * MasterfileHardwareManagement). Mirrored here so the server can never be
     * stricter than the UI that renders the button -- a user typed 'ADMINISTRATOR'
     * sees an admin control and must not then be refused by the API.
     */
    protected const ROLE_ALIASES = [
        'ADM' => ['ADM', 'ADMIN', 'ADMINISTRATOR'],
        'SPV' => ['SPV', 'SUPERVISOR'],
        'FSE' => ['FSE'],
        'ROO' => ['ROO'],
    ];

    /**
     * Map of action name => allowed canonical roles (or [self::ANY_AUTHENTICATED]).
     *
     * Actions absent from this map are NOT checked. Override in each controller.
     *
     * @return array<string, array<int, string>>
     */
    protected function protectedActions(): array
    {
        return [];
    }

    /**
     * The signed-in user as stored by `UserTblController::login()`, or null.
     *
     * @return array<string, mixed>|null
     */
    protected function currentUser(): ?array
    {
        $user = $this->request->getSession()->read('Auth.User');

        return is_array($user) && !empty($user['id']) ? $user : null;
    }

    /**
     * Canonical-cased role of the signed-in user ('' when signed out).
     */
    protected function currentRole(): string
    {
        return strtoupper(trim((string)($this->currentUser()['user_type'] ?? '')));
    }

    /**
     * Does the signed-in user hold any of these canonical roles?
     *
     * @param array<int, string> $allowed
     */
    protected function hasAnyRole(array $allowed): bool
    {
        if (in_array(self::ANY_AUTHENTICATED, $allowed, true)) {
            return true;
        }

        $role = $this->currentRole();
        foreach ($allowed as $canonical) {
            if (in_array($role, self::ROLE_ALIASES[$canonical] ?? [$canonical], true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function denied(int $status, array $payload): \Cake\Http\Response
    {
        return $this->response
            ->withStatus($status)
            ->withType('json')
            ->withStringBody(json_encode($payload));
    }

    /**
     * Enforces `protectedActions()` for the action being dispatched.
     *
     * Subclasses set their CORS headers BEFORE delegating here, so that a 401/403
     * still carries them -- otherwise a cross-origin caller sees an opaque CORS
     * failure instead of the actual status. They must also RETURN this method's
     * result; discarding it (the previous shape of those methods) would let a
     * rejected request run the action anyway.
     */
    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);

        // Preflight carries no cookies by design, so it can never satisfy an auth
        // check. Subclasses answer OPTIONS before calling this, but guard anyway.
        if ($this->request->is('options')) {
            return null;
        }

        $action = (string)$this->request->getParam('action');
        $rules = $this->protectedActions();

        if (!array_key_exists($action, $rules)) {
            return null;
        }

        if ($this->currentUser() === null) {
            return $this->denied(401, [
                'success' => false,
                'error' => 'Authentication required. Please sign in again.',
            ]);
        }

        if (!$this->hasAnyRole($rules[$action])) {
            return $this->denied(403, [
                'success' => false,
                'error' => 'Your account does not have permission to perform this action.',
            ]);
        }

        return null;
    }
}

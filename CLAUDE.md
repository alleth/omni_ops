# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniOps is a hardware asset management and inventory system built with a **CakePHP 4.5 backend** and **React 19 frontend**. The application manages hardware assets, users, requests, and related metadata across multiple regions and sites.

- **Backend**: CakePHP 4.5 (PHP 7.4+) REST API with JSON responses
- **Frontend**: React 19 SPA with React Router 7.9, React Bootstrap 2.10, TanStack React Table, Chart.js
- **Styling**: Bootstrap 5 for layout; Tailwind utility class names used in JSX (`text-red-500`, `dark:bg-gray-900`, etc.) — **`tailwindcss` is not installed as an npm package** (config files `tailwind.config.js` and `postcss.config.js` exist, but the package itself is absent from `package.json`); run `npm install -D tailwindcss` if new components need Tailwind styles to apply.
- **Icons**: Two libraries are in use — `@heroicons/react` v2 (used in most page components) and `react-icons` v5 (`react-icons/hi` HeroIcons variant, used in `MasterfileLayout.js` sidebar/nav). Both are installed; match whichever the file already uses.
- **Database**: MySQL via PDO — schema `hw_db`. Note there are **no foreign keys and almost no unique indexes**; integrity is enforced in application code or not at all (see Key Domain Details).
- **Dev Environment**: XAMPP (Apache), Node.js
- **`README.md` is the unmodified CakePHP skeleton readme** — no project-specific information lives there. This file is the only project documentation; don't send readers to the README.

## Commands

### Backend (PHP/CakePHP)

```bash
# Install dependencies
composer install

# Run migrations
php bin/cake migrations migrate

# Run all tests
composer test

# Run a single test file
vendor/bin/phpunit tests/TestCase/Controller/Api/HwTblControllerTest.php

# Code style check / fix
# The codebase is far from phpcs-clean and phpcs is not enforced anywhere (see the CI
# note below), so cs-check output is mostly pre-existing noise: the four Api controllers
# alone carry ~185 errors. Running `composer cs-fix` across a file you touched will
# reformat unrelated code and bury your change in the diff — match the surrounding style
# instead, or fix style in its own separate commit.
composer cs-check
composer cs-fix

# Tests + style check together
composer check

# Static analysis (phpstan/phpstan ^2.2, level 8, scoped to src/; not wired into composer check)
# phpstan.neon suppresses missingType.iterableValue / missingType.generics (baked-in CakePHP
# @method PHPDoc noise); ~260 real level-8 findings remain unaddressed as of this writing.
vendor/bin/phpstan analyse

# Generate migration
php bin/cake bake migration AlterHwTbl

# Built-in dev server (alternative to XAMPP)
php bin/cake server -p 8765
```

The backend is normally served via XAMPP Apache at `http://omniops.local`.

> **CI note**: `.github/workflows/ci.yml` is the unmodified CakePHP skeleton workflow — it only triggers on push to `4.x`/`4.next`/`5.x` branches (this repo uses `master`/`main`) plus any PR, and runs PHPUnit + `phpcs` against a SQLite test DB. There is effectively no CI on the branches this project actually uses; `composer check` and `phpstan` are run manually or not at all.

### Frontend (React)

```bash
cd dev

npm install
npm start        # Dev server at http://localhost:3000 (proxies /api to http://omniops.local)
npm run build    # Outputs to dev/build/ — copy to webroot/public/ for deployment
npm test         # Jest watch mode
```

npm is the package manager (`package-lock.json` is tracked). An untracked `dev/yarn.lock` also exists — do not use yarn or commit that file.

> **Testing note**: PHPUnit tests exist for backend controllers under `tests/TestCase/Controller/Api/`. The frontend has only a placeholder `App.test.js` — no meaningful React tests exist yet. Two orphaned bake artifacts fatal-error on autoload if the suite hits them — don't mistake either for something you broke: `tests/TestCase/Controller/Api/RegionsControllerTest.php` references `App\Controller\Api\RegionsController` (doesn't exist; only `RegionTblController` does), and `tests/TestCase/Controller/RegionTblControllerTest.php` (note: no `Api\` in the path) references `App\Controller\RegionTblController` (doesn't exist; the real class lives under `App\Controller\Api\`). The correct, working test is `tests/TestCase/Controller/Api/RegionTblControllerTest.php`. `composer test` / PHPUnit need a working `test` datasource — configured in the untracked `config/app_local.php` (defaults to MySQL per `config/app.php`; CI overrides it to SQLite via `DATABASE_TEST_URL`). **As currently configured on this dev machine the suite does not run at all**: it dies inside `tests/bootstrap.php` (the `Migrations\TestSuite\Migrator` run), failing on `20260630000000_ChangeTrackingNumToString`, before a single test executes. Don't read that stack trace as a regression in whatever you just changed — it never reaches application code. Until the test datasource is fixed, **verify backend changes by exercising the real endpoints**: `php bin/cake.php server -p 8765` (note `cake.php`, not `cake` — the extensionless file is a shell script and `php bin/cake` fails), then `curl` with an explicit `-H 'Accept: application/json'`. Without that header the JSON branches don't trigger and you get a `MissingTemplateException` instead. On Windows, Git Bash `/tmp` paths don't work with `curl -F` (native Windows binary) — use a `C:/...`-style path.

Also note: `dev/src/hooks/useHardwareAging.js` is a tracked 0-byte stub — aging logic actually lives inline in `MasterfileHardwareManagement.js` and `HardwareAgingCard.js`; don't import the empty hook.

## Architecture

### Directory Layout

```
omni_ops/
├── src/                          # CakePHP application code
│   ├── Controller/
│   │   ├── AppController.php     # Base controller
│   │   └── Api/                  # REST API controllers (one per resource)
│   ├── Model/
│   │   ├── Table/                # ORM Table classes
│   │   └── Entity/               # ORM Entity classes
│   └── Application.php           # Middleware stack, bootstrap
├── config/
│   ├── app.php                   # App constants, cache, logging
│   ├── app_local.php             # Local overrides (DB DSN, debug flag)
│   └── routes.php                # URL routing
├── dev/                          # React frontend source
│   └── src/
│       ├── App.js                # Router with all route definitions
│       ├── pages/
│       │   ├── LandingPage.js    # Root "/" public page
│       │   └── masterfile/       # Page components + sub-components
│       │       └── components/   # Shared modal and card components (see below)
│       └── hooks/
│           └── useApi.js         # Fetch wrapper used by all pages
├── webroot/public/               # React production build (deployed here)
├── templates/                    # CakePHP templates (legacy, not used by SPA)
└── tests/                        # PHPUnit tests + fixtures
```

**Components in `dev/src/pages/masterfile/components/`:**
- `AgingDetailsModal.jsx` — age-bucket breakdown modal with expandable groups by hardware type
- `SiteDetailsModal.jsx` — create/edit/view/delete site modal with react-select multi-select
- `StatsOverviewCards.jsx` — dashboard summary cards (total sites, dual-server, CPU-servers, VMs)
- `HardwareSummaryLeft.jsx` — dashboard section: CPU/workstation brands, OS distribution, UPS, monitors, utilities
- `HardwareSummaryRight.jsx` — dashboard section: printer types, aging doughnut chart, peripherals, other equipment
- `BulkRequestModal.js` — client-side PDF generation for PULL_OUT and RELOCATION requests
- `RequestDetailModal.js` — request detail/approval modal with approver lookup and attachment replacement
- `HardwareAgingDetails.js` — older aging card with doughnut chart (use `AgingDetailsModal.jsx` for new work)
- `HardwareAgingCard.js` — compact aging summary card used inside the management page
- `AddHardwareModal.js` — hardware CRUD modal with cascading dropdowns; handles both add and edit modes via `initialData` prop (`isEditMode = !!initialData`)

### Backend API

> **No `/api/` endpoint is authenticated or authorized.** CSRF is skipped for any path starting with `/api` (`Application.php`), no controller reads the `Auth.User` session that `login()` writes (`grep -rn "read('Auth" src/` returns nothing), no controller checks `user_type`, and `src/Controller/Component/` is empty. Every role rule in **Role-Based Access** below is client-side UI gating only — including `reset-password`, `update-role` and `delete`. Treat any "only role X can do Y" statement in this file as describing which buttons render, never what the server enforces. Adding a real authorization layer is an open design decision, not a patch.

All endpoints are under `/api/` prefix, return JSON, and have CSRF disabled (handled by CORS preflight). Responses over 1 KB are gzip-compressed by `App\Middleware\GzipMiddleware` (registered in `Application.php`) — this is done in PHP because Apache `mod_deflate` is disabled in the XAMPP setups this app runs on; the full `hw-tbl` payload is ~12 MB raw / ~0.5 MB gzipped. CORS is configured per-controller in `beforeFilter()`. Configuration varies:
- `HwTblController`, `RegionTblController`, `RequestTblController`, `SiteListTblController` — allow `*` origin (mirrors the request's `Origin` header)
- `UserTblController` — explicit allowlist (`http://localhost:3000`, `http://omniops.local`) with `credentials: true`
- `ItemBrandController`, `ItemDescriptionController`, `ItemModelsController` — hardcoded `http://localhost:3000` only; **these will fail in production** unless the origin is updated to the production domain

This inconsistency matters when adding new controllers: copy the pattern from a controller with similar auth requirements.

**Routing**: the `/api` scope in `config/routes.php` ends with `$builder->fallbacks()` under `DashedRoute`, so **any public method on an `Api\` controller is already a live endpoint** at `/api/<dashed-controller>/<dashed-action>[/args].json` — no route entry needed. That is why the "non-REST named actions" below work without being listed. The handful of explicit `$builder->post(...)` lines exist only to bind POST to actions the fallback would otherwise expose as GET. Consequence: adding a public helper method to a controller publishes it. Make helpers `private`.

Key endpoints:
- `POST /api/user-tbl/login.json` — auth; sets `Auth.User` in PHP session
- `GET /api/hw-tbl.json` — **all** hardware ordered by region/site/asset, with no limit. The `$this->paginate = ['limit' => 10000]` line above it is dead on the JSON path (the response is built from `find('all')->toArray()`, which ignores it). `hw_tbl` is ~18,250 rows as of 2026-09, and every page that needs hardware fetches the whole set; bounding it would need frontend work too, since the client filters in memory.
- `POST /api/hw-tbl.json` — add hardware (maps to `add()` via explicit route in `routes.php`)
- `POST /api/hw-tbl/update.json` — React-facing edit; accepts `id` or `hw_id` in the body (not a standard REST route)
- `DELETE /api/hw-tbl/:id.json` — delete hardware
- `GET /api/hw-tbl/site/:site_code.json` — hardware filtered by site code
- `GET /api/site-list-tbl.json`, `GET /api/region-tbl.json` — reference data
- `POST /api/site-list-tbl/add.json`, `POST /api/site-list-tbl/edit/:id.json`, `POST /api/site-list-tbl/delete/:id.json` — site CRUD (non-REST named actions)
- `POST /api/user-tbl/add.json` — create new user (name, username, password, region assignment)
- `POST /api/user-tbl/reset-password.json` — reset user password (`user_id` required in body)
- `POST /api/user-tbl/update-region.json` — reassign a user's regions (`user_id` + comma-separated `region_assigned`; maps to `updateRegion()`)
- `POST /api/user-tbl/update-role.json` — reassign a user's `user_type` (`user_id` + `user_type`, plus `cluster_name`/`region_assigned` for non-org-wide roles; maps to `updateRole()`); switching to ADM/ROO server-side forces `cluster_name = 'All Cluster'` and clears `region_assigned`
- `GET /api/request-tbl.json` — hardware requests; query params: `requested_by`, `status` (PENDING/APPROVED/REJECTED/CANCELED), `cluster_name`
- `POST /api/request-tbl/add.json` — create request (multipart/form-data, supports file uploads); `request_type` is `PULL_OUT` or `RELOCATION`. Note the `/add` — `POST /api/request-tbl.json` maps to `index()`, which is GET-only, and returns 405. Saves one row per item in `items[]`, all inside one transaction (a partial batch used to be left saved behind a 400 response).
- `POST /api/request-tbl/update.json` — patch fields on an existing request (`request_id` required in body); used by the Pull-Out detail modal to let non-ROO users add/edit the tracking number
- `POST /api/request-tbl/updateAttachment/:id.json` — replace attachment on an existing request (SPV only; multipart/form-data)
- `GET /api/item-brand.json`, `GET /api/item-description.json`, `GET /api/item-models.json` — cascading dropdown data

**Response shapes are not uniform — there is no single envelope.** Reads never carry a `success` key; only writes do:

```json
GET index/view   { "hwTbl": [...] }        // no "success" key at all
GET 404          { "error": "Record not found" }
writes           { "success": true, ... } | { "success": false, "error"/"errors": ... }
Item* writes     { "success": true, "data": {...} }   // "data", not the resource key
```

Envelope keys are per-controller and don't always match the table: `UserTblController` returns `users` (not `userTbl`), and `ItemModelsController` returns `itemModels` from `index()` but `itemModel` from `view()`. Check the controller before writing a client call — don't assume.

File uploads (requests) are stored under `webroot/uploads/` organized as `{request_type}/{Y-m}/{unique_filename}`. **Type is sniffed from the file's own bytes with `finfo`, and the on-disk extension comes from a verified-MIME map (`RequestTblController::verifiedUploadExtension()`) — never from the client's `Content-Type` header or filename, both of which the uploader controls.** Allowed: PDF, JPEG, PNG, max 5 MB. This matters because `webroot/.htaccess` only rewrites to `index.php` when a file *doesn't* exist, so anything under `uploads/` is served straight off disk; the old check trusted `getClientMediaType()`, which let a `.php` be written there and executed. `webroot/uploads/.htaccess` and `webroot/public/uploads/.htaccess` additionally turn the PHP engine off and strip script handlers as a backstop — keep both when touching those files. A rejected upload now fails the whole request with a 400 rather than saving silently with `attachment_path: null`.

A bulk submission gives **every** row it creates the *same* `attachment_path` (one uploaded form covers the batch), so an attachment file is only deleted once no other request row still references it (`deleteAttachmentFile()`). Don't "simplify" that check away.

### Frontend Routing & Auth

React Router with `basename="/public"`. Public routes: `/`, `/masterfile`, `/masterfile/login`. All other `/masterfile/*` routes are nested under `<MasterfileLayout>`, which enforces authentication by checking `sessionStorage.user` and redirecting to login if absent. (That check is the *only* gate — the API behind it is open; see **Backend API**.)

`App.js` ends with a catch-all `<Route path="*" element={<LandingPage />} />`, so a typo'd or removed protected route silently renders the **public** landing page instead of 404-ing or redirecting to login. If a nav link mysteriously lands on the public stats page, suspect a route-path mismatch rather than an auth failure.

Login is rate-limited: `UserTblController` locks an account for 15 minutes after 8 failed sign-ins (`MAX_FAILED_ATTEMPTS` / `LOCKOUT_SECONDS`), returning HTTP 429. The `failed_attempts` / `lockout_until` columns had existed unused since the table was created — `add()` and `resetPassword()` reset them but nothing ever incremented or checked them. A successful login and a password reset both clear the counter; an unknown username returns the same generic 401 as a wrong password, so the response doesn't reveal which accounts exist.

`MasterfileLanding.js` (`/masterfile`) is the public pre-login stats page — it fetches and renders live hardware summary charts and stats without requiring a session.

Protected routes:
- `/masterfile/home` → `MasterfileDashboard` (request overview, role-filtered; caps its own request list at `PENDING_CARD_LIMIT` (5) and links out to Request Monitoring for the full list). Bulk Approve (SPV)/Cancel/Delete (FSE) buttons call `approveRequestCore`/`cancelRequestCore`/`deleteRequestCore` from `dev/src/utils/requestActions.js` — `window.confirm()` gates the action, `alert()` only reports the result, the underlying calls are real API requests.
- `/masterfile/request-monitoring` → `MasterfileRequestMonitoring` (SPV/ADM/FSE only, never ROO; titled "My Requests" for FSE). Gmail-style split-pane inbox — request list on the left, detail reading pane on the right, collapsing to single-column below `lg`. Fetches every status (not just PENDING) scoped the same way as the Dashboard: FSE sees only their own (`requested_by`), SPV their `cluster_name`, ADM everything. Approve/reject/cancel/delete are deliberately *not* reimplemented here — clicking the action button opens the same `RequestDetailModal` used elsewhere so the hardware side effects and approval rules can't drift between entry points. The sidebar nav item (`MasterfileLayout.js`) carries a live red count badge next to its label — a per-role "needs your action" count, not generic activity: FSE sees their own REJECTED requests (edit/resubmit/delete), SPV/ADM see PENDING requests awaiting their decision. No seen/dismissed state; it just polls `/api/request-tbl.json` every 60s while the tab is visible (same cadence/pause-when-hidden behavior as the presence heartbeat) and also refetches on route change so it drops promptly after acting on a request from the page itself.
- `/masterfile/inventory` → `MasterfileInventory` (hardware table with bulk request; default 10 rows/page). Region/site/type filters are searchable react-select dropdowns (`SearchableSelect`, defined at the top of the file). The full hardware list and pull-out requests are fetched once on mount; the On Site / Pull Out status toggle filters in memory (no refetch). Includes accuracy report cards, each opening a modal overlay: **Profile Accuracy** (per-field completeness breakdown for asset/serial/type/brand/model/OS, with OS scoped to CPU/PC items), **Duplicate Entries** (duplicate asset/serial groups among On Site hardware), and **Pull-Out Attachment Coverage** (hardware missing a pull-out form on file; supports viewing/uploading an attachment for legacy records).
- `/masterfile/management` → `MasterfileHardwareManagement` (hardware aging table: age computation, HDD health badges, `PAGE_SIZE=30`). CPU rows have a sub-view toggle (`CPU_VIEWS`): `os_dotnet`, `antivirus`, `core_facilities`, `hostname_ip_mac`, `workstep_user`, `hdd_age`; Server rows (`SERVER_VIEWS`) have `os_dotnet`, `antivirus`, `hostname_ip_mac`, `mem_hdd`. `os_dotnet` and `antivirus` used to be one combined "OS Type & Antivirus" sub-view — split so Antivirus can carry its own version/definition-date/last-verified fields without crowding the OS/.NET section. `CPU_VIEW_FIELDS`/`SERVER_VIEW_FIELDS` per sub-view (and `CONFIG_FIELDS` for SWITCH) define which fields count toward the Configuration Completeness card. `installedFacilities()` maps boolean DB columns (`rsu_fac`, `mv_dto`, `mv_maint`, `ims_aiu`, `dl_dto`, `dl_maint`) to display labels. A "Generate Report" button exports the currently filtered rows to Excel via the `xlsx` (SheetJS) package — exported columns match the active hardware type and sub-view, all active filters (region/site/search/type/sub-view) apply, and the filename encodes type/region/date.
  - **Antivirus Updates sub-view**: `hw_tbl.hw_antivi` still holds just the product name (unchanged). Version, virus definition date, and a "last verified" timestamp are stored together as JSON in one added column, `hw_antivi_meta` (`{"version","def_date","last_checked"}`) — deliberately one column instead of three, parsed/built by `parseAntiviMeta()`/`getFieldValue()` in `MasterfileHardwareManagement.js`. `last_checked` is stamped automatically (client `new Date().toISOString()`) whenever this sub-view is saved — saving *is* the "check" event, there's no manual field for it. `antiviLastCheckedInfo()` renders "Verified today / N days ago / Never verified" (audit freshness), flagged amber past `ANTIVIRUS_STALE_DAYS` (90).
  - **Virus definition monitor**: a fleet-wide notification distinct from the per-record "last verified" above — `virusDefStatus()` flags any CPU/Server unit in `baseHardware` (the user's full region/cluster scope, independent of the table's current category/sub-view/search filters) whose `hw_antivi_meta.def_date` is missing or older than `VIRUS_DEF_STALE_DAYS` (30), or whose `hw_antivi` is empty. Surfaced via a bell button + badge (top-right, mirrors the "Data Quality" bell on Hardware Inventory) with a summary popover, a once-per-visit auto-fading hint bubble (`AntivirusAlertHint`, same 4.5s pattern as Inventory's `QualityHintBubble`), and a searchable/paginated `AntivirusAlertsModal` ("View All") — the alert count can run into the thousands on a fresh install since nothing has a definition date recorded yet, hence the pagination and the bell badge capping display at "99+". Clicking an alert row (`openAvAlert`) jumps straight into that unit's `ConfigModal` on the `antivirus` sub-view, also syncing the background table's category/sub-view to match.
- `/masterfile/directory` → `MasterfileDirectory` (site directory with TanStack Table v8 + `SiteDetailsModal`; global filter across site_code, site_name, office_type, address, trxn_catered, ownership, region). Summary count cards (Total, NRU, DLRO, Mixed MV/DL/LETAS, District Office, Licensing Center) recompute after deletes. Note: the `NRU` trxn option replaced the former "MV New" in `SiteDetailsModal`.
- `/masterfile/reports` → `MasterfileReports` (FSE and SPV only — sidebar item hidden for other roles; ROO is blocked by the layout route guard). "Site Hardware Count" report: pick a region (scoped to the user's allowed regions), get a per-site matrix of On Site hardware counts — columns are the distinct `item_desc` values found in scope, ordered by overall count — with row/column/grand totals and an Excel download via `xlsx`.
- `/masterfile/users` → `MasterfileUsers` (user management table; SPV can add new FSE users scoped to their cluster and reset passwords; ADM can add new users as either ADM or FSE (role dropdown) and reset passwords; FSE has no access). A "Reassign Region" action (`EditRegionModal` → `POST /api/user-tbl/update-region.json`) is available for any region-scoped user (i.e. not ADM/ROO with org-wide scope); clearing all regions removes that user's hardware access. A "Change Role" action (`EditRoleModal` → `POST /api/user-tbl/update-role.json`, ADM only) reassigns any user's `user_type` among ADM/SPV/FSE/ROO. A "Status" column shows online/offline via a **presence heartbeat**: `MasterfileLayout` posts `/api/user-tbl/heartbeat.json` immediately on mount and every 60s while the tab is visible (paused when backgrounded via `visibilitychange`), stamping `user_tbl.last_active`; `login()` also stamps it immediately. `MasterfileUsers` silently re-fetches the user list every 60s (bypassing the full-table loading state) so status stays current while the tab is open. "Online" = `last_active` within `ONLINE_THRESHOLD_MS` (2 min, 2x the heartbeat interval); otherwise shows a relative "N minutes/hours/days ago" via `formatLastActive()`, or "Never signed in". **Timezone note**: `last_active` is written with `gmdate()` (true UTC), deliberately not PHP's ambient default timezone (`App.defaultTimezone` in `config/app.php` is `UTC`, but this app's DB/users are all Philippine-local — MySQL's own `NOW()` is `Asia/Manila`, 8h ahead) — CakePHP serializes datetime columns assuming UTC and tags the JSON with an explicit `+00:00`, so writing anything other than true UTC digits desyncs the write from that tag and makes timestamps parse as hours in the future client-side, which always reads as "online". If you touch presence-related code, keep write-side UTC and read-side UTC-tagged ISO in agreement.
- `/masterfile/profile` → `MasterfileProfile` (password change, profile edit; save only enabled when fields actually changed)

### Data Flow

1. Login writes user object to `sessionStorage.user` (fields: `fname`, `lname`, `user_name`, `user_type`, `region_assigned`, `cluster_name`, `id`)
2. Components call `useApi()` hook: `fetchData(endpoint)`, `fetchMany(...endpoints)`, `postData(endpoint, data)`, `postFormData(endpoint, formData)`. **Every one of these swallows its error and returns `null` — none of them ever throw.** A failed request and a legitimately empty response are indistinguishable at the call site unless you also read the hook's `error` state, which is why call sites are full of `?.` and `|| []`. Don't wrap these in `try/catch` expecting to catch a network or HTTP failure; check the return value instead.
3. `fetchMasterfileData()` is a convenience method on `useApi()` that batch-fetches the reference endpoints needed by the inventory page in parallel
4. State is local per component; dark mode preference stored in `localStorage.darkMode`
5. A 30-minute *inactivity* timer (`dev/src/utils/session.js`, wired up in `MasterfileLayout`) shows a timeout modal and redirects to login. Genuinely activity-based: `startActivityTracking()` listens for `mousedown`/`mousemove`/`keydown`/`wheel`/`touchstart` (throttled to once per 5s) and resets the countdown on each one — until this was added, `resetSessionTimer()` existed but nothing ever called it, so the timer just counted down unconditionally from page-load and logged users out on a fixed schedule regardless of activity. Deliberately independent of the presence heartbeat (`MasterfileLayout`, see Role-Based Access → online/offline) — that only proves the tab is open, not that anyone's actually at the keyboard.
6. `useApi` always uses relative URL paths (empty string prefix); the CRA proxy in `package.json` forwards `/api/*` requests to `http://omniops.local` during development
7. **A few components bypass `useApi` with host-detected absolute URLs** — do not assume all network calls go through the hook or the CRA proxy:
   - `MasterfileLogin.js` and `MasterfileProfile.js` build their own `API_BASE` / hardcode `http://omniops.local` for login and profile-update `fetch` calls.
   - Attachment/file links (`getFileUrl` in `MasterfileInventory.js`, `RequestDetailModal.js`) switch on `window.location.origin`: dev/localhost → `http://omniops.local`, otherwise the production VM at the hardcoded IP `http://192.168.4.95:8888`. This IP is used (rather than `omniops.local`) so links resolve on clients without the hosts-file entry. Update these hardcoded hosts when the deployment target changes.

### Role-Based Access

`user_type` controls both data scope and UI capabilities. The roles are **not a hierarchy** — FSE is the editing role, while ADM/SPV/ROO have broader data scope but are read-only for hardware records.

**All of it is client-side only.** Nothing below is enforced by the server (see the warning at the top of **Backend API**), so every rule here describes which controls render, not who can perform the action. A "read-only" role is one whose buttons are hidden. Implementing a new restriction means adding a UI gate; there is currently no server-side layer to add one to.

- `FSE` (default) — can add hardware, edit hardware, create bulk pull-out/relocation requests; scoped to their `region_assigned` IDs. No Users management tab.
- `ADM` — read-only in Hardware Management, but in Inventory **can add and edit hardware** same as FSE (the "+ Add Hardware" button and each row's "Edit" action are both gated `isFSE || isADM`, not FSE-only; there's no delete action on this page for either role) — the underlying submit handlers (`handleAddHardwareSubmit`/`handleEditHardwareSubmit`) and `AddHardwareModal` have no role checks of their own, so this is purely a UI-visibility gate; full data scope if `cluster_name === 'All Cluster'` (all regions), otherwise same region scoping as FSE. In Inventory, org-wide ADM (`cluster_name === 'All Cluster'`, same as ROO) gets the Site dropdown enabled without first picking a Region — everyone else must select a Region before Site unlocks; all four filter controls (Region/Site/Type/Search) are disabled while hardware data is still loading (`isLoading = baseLoading || hardwareLoading`). In Users tab: can reset any user's password, add new users via a role dropdown (ADM, SPV, FSE, or ROO) — for a new ADM/ROO, cluster auto-sets to `'All Cluster'` and the Region Assigned field is hidden; for a new SPV, cluster is an editable dropdown (`CLUSTER_OPTIONS`: NCR/Luzon/VisMin) with Region Assigned hidden (SPV scope is cluster-wide, not per-region); for a new FSE, both cluster (same dropdown) and region are editable — and can reassign any existing user's role/type via a "Change Role" button (`EditRoleModal` → `POST /api/user-tbl/update-role.json`, role options ADM/SPV/FSE/ROO; switching to ADM or ROO auto-sets cluster to `'All Cluster'` and clears region_assigned). In `AddHardwareModal`, matched as `['ADM', 'ADMIN', 'ADMINISTRATOR']`.
- `SPV` / `SUPERVISOR` — read-only in inventory; scoped to all regions sharing their `cluster_name`. In Users tab: can add new FSE users scoped to their cluster and reset passwords; region column is hidden for SPV.
- `ROO` — read-only viewer with **org-wide** data scope (all regions, like ADM `'All Cluster'`). Sees only three sidebar items: Hardware Inventory, Hardware Management, Directory (no Dashboard, no Users). Can browse, filter, and export (Generate Report) but cannot add/edit/delete hardware, sites, or upload pull-out attachments. Enforced client-side: `MasterfileLayout` redirects ROO off `/home` and `/users` and logs them in at `/inventory`; Inventory/Management gate edit UI off `role === 'FSE'`; `MasterfileDirectory` hides "Add New Site" and passes `readOnly` to `SiteDetailsModal` (which hides Edit/Delete); `HardwareDetailModal` hides the attachment-upload zone. ADM can create ROO users via the Users-tab role dropdown (cluster auto-sets to `'All Cluster'`, region hidden).

`region_assigned` is a comma-separated string of region IDs; the inventory page filters hardware to the user's assigned regions. ADM with `cluster_name === 'All Cluster'` bypasses this filter entirely.

### Key Domain Details

- **The VM's CakePHP ORM schema cache must be cleared after every column-adding migration, or the new column is silently invisible.** The VM (see Deployment) runs with `debug => false`, so CakePHP persists each table's reflected schema to `tmp/cache/models/myapp_cake_model_default_<table>` indefinitely instead of re-reading it every request. Add a column to `user_tbl` or `hw_tbl` (whether via a migration or by hand) without also clearing that file, and every read/write through the ORM keeps behaving exactly as if the column doesn't exist: `save()` on an entity with the new field set still returns success (other fields save fine), but the new column is silently omitted from the generated SQL entirely — no exception, nothing in `logs/error.log`, and `find()`/`get()` on that table just don't return it. Explicit-select queries (`->select(['col', ...])`) are a red herring: they still show the field name because they don't depend on the cached schema, but every value under it reads `null` from the same staleness. This exact failure mode cost a long debugging session for `user_tbl.last_active` (root cause found by comparing `view()`'s field list, which silently dropped `last_active` entirely, against `index()`'s explicit-select response, which showed the key but always `null`) — `hw_tbl.hw_antivi_meta` had the identical problem from the same stale-cache root cause. **Fix**: delete `tmp/cache/models/myapp_cake_model_default_user_tbl` (or the relevant table's cache file) after any schema change reaches the VM, or run `bin/cake cache clear_all` there if the console is usable in that environment — then the next request re-reads the real DB schema and regenerates the cache correctly. Do this as a standard step of every VM deploy that touches a table's columns, not just when something breaks.
  - **On the VM the console user cannot write that cache directory.** Running any CLI script there prints a wall of non-fatal `SplFileInfo::openFile(...tmp\cache\models\...): Failed to open stream: Permission denied` warnings — the files are owned by the Apache user. Two consequences, both useful: `bin/cake cache clear_all` from the CLI will *not* reliably clear them (delete the files instead, as an admin or over the `Z:` share), and **CLI scripts always reflect the live schema** because they can't read the cache either. So a CLI script and the web app can genuinely disagree about a table's columns — the script is the one telling the truth. Ignore those warnings; they are not the error you're chasing.
- **`request_tbl.hw_id` was missing entirely from the VM's database until 2026-09-02** — a distinct bug from the schema-cache gotcha above, and worth telling apart from it. `hw_id` had been added to the local dev DB by hand (no migration file ever existed for it), so `migrations migrate` on the VM had nothing to apply and the column was never created there at all — not stale-cached, genuinely absent (confirmed by deleting the VM's `tmp/cache/models/myapp_cake_model_default_request_tbl` and re-reading: `hw_id` still didn't appear in any of the 79 live request rows, even freshly reflected). Effect: `RequestTblController::add()`'s per-item `'hw_id' => $itemData['hw_id']` silently never persisted, so every request in production has `hw_id = NULL`; the client-side revert-to-`On Site` on cancel/reject (`updateHardwareStatusForRequest` in `requestActions.js`) is gated on `request.hw_id` being truthy, so it was a permanent no-op — hardware whose request got rejected/canceled stayed stuck at `Pending` forever instead of reverting, invisible in every On Site view with no request left in `request_tbl` to explain why. `config/Migrations/20260902150000_AddHwIdToRequestTbl.php` tracks the column. **It applied on the VM on 2026-09-18 — `request_tbl.hw_id` now exists there.**
  - **Don't mistake this for the stale-cache gotcha above — and don't use the schema cache to tell them apart.** The VM's `tmp/cache/models/myapp_cake_model_default_request_tbl` records `a:30:` columns with no `hw_id`, which looks like a stale cache but is the cache *correctly* describing a table that really has no such column. Deleting it changes nothing: Apache regenerates it identically. **The reliable check is the database, not the cache**: `SHOW COLUMNS FROM request_tbl LIKE 'hw_id';` (empty = migration hasn't applied) and `SELECT * FROM phinxlog ORDER BY version;` (is `20260902150000` recorded?). A query against the column fails loudly — `SQLSTATE[42S22] Unknown column 'hw_id' in 'where clause'` — which is how this was finally confirmed on 2026-09-18, by running the backfill script's `--dry-run` on the VM.
  - **Resolved on the VM on 2026-09-18.** `bin\cake.bat migrations migrate` applied all five migrations — `phinxlog` was empty there, which is why this one had never run — `SHOW COLUMNS` then confirmed `hw_id bigint(20)`, the `request_tbl` cache file was deleted, and the backfill ran: of **175** hardware rows at `Pending`, **3** were stranded by CANCELED pull-outs and reverted to `On Site` (hw_id 5505, 6177, 6178), **171** were correctly left alone because their request is genuinely still PENDING, and **1** was unresolved. Every match came through the **asset/serial fallback, not `hw_id`** — every request row predating the migration has `hw_id = NULL` permanently, so the column only helps requests created from that point on.
  - **The fallback's matching is stricter than it looks.** When both asset and serial are usable it requires *both* to match (`asset_num` AND `serial_num`), and it trims only the `hw_tbl` side — `trim($hw->hw_asset_num)` compared against an untrimmed `request_tbl.asset_num`. A leading space on either request-side value therefore misses. That is what left `hw_id 6157` unresolved (`serial_num=' PA63J17LtY'`). To chase one of these by hand: `SELECT request_id, status, asset_num, serial_num FROM request_tbl WHERE TRIM(asset_num)='...' OR TRIM(serial_num)='...';` — if the match is CANCELED/REJECTED the hardware can be set back to `On Site` manually; if it's PENDING, leave it.
  - Once the migration applies, new requests need no backfill — `add()`/cancel/reject work as designed from that point on. Everything created before it keeps `hw_id = NULL` permanently, which is exactly what the asset/serial fallback exists for.
  - The migration's own docblock references `scripts/backfill_request_tbl_hw_id.php`. **That script does not exist** — only the three `backfill_*` scripts listed under Deployment do. Don't go looking for it.
- **PHP/MySQL timezone mismatch**: `App.defaultTimezone` (`config/app.php`) is `UTC`, but MySQL's own clock is `Asia/Manila` (confirm with `SELECT NOW(), UTC_TIMESTAMP()` — 8h apart) and every real user is in the Philippines. CakePHP reads/serializes `datetime` columns assuming UTC and tags outgoing JSON with an explicit `+00:00`. Writing anything to a `datetime` column with plain `date('Y-m-d H:i:s')` is fine (it's genuinely UTC, matching that tag) — but writing Manila-local wall-clock digits (e.g. via an explicit `Asia/Manila` `DateTimeZone`) desyncs the stored digits from the `+00:00` tag CakePHP still applies, and the frontend then parses the value as hours in the future. This bit `user_tbl.last_active` on first implementation (see below) — if you add another timestamp column compared against `Date.now()` client-side, use `gmdate()`/UTC on the write side, not the app's "real" local time.
  - **`DATETIME` and `TIMESTAMP` columns behave differently here, and `user_tbl` has one of each.** `last_active` is `datetime` (MySQL stores the digits verbatim — write UTC, read UTC, as above). `lockout_until` is `timestamp(1)`, and MySQL converts a `TIMESTAMP` on *both* read and write using the session time zone, which is `SYSTEM` = `Asia/Manila` while the app runs in UTC. Writing `gmdate()` digits to it and comparing them in PHP made a 15-minute lock read as 8h15m. **For a `TIMESTAMP` column, keep the comparison in SQL** (`WHERE lockout_until > NOW()`, `DATE_ADD(NOW(), INTERVAL n SECOND)` on write) so both sides come from MySQL's own clock — that's what `UserTblController::isLockedOut()` / `recordFailedLogin()` do. Check `information_schema.COLUMNS.DATA_TYPE` before assuming which kind you're dealing with.
- **A dual-server office is TWO `site_list_tbl` rows, not one.** One physical location with two servers is registered as two separate `site_code`s, each row flagged `physical_site_count = 2` — e.g. `1328 Makati DO` + `1329 Makati LC` (both "Butel Bldg., Pilia St."), `0120 Dagupan District Office` + `0122 Dagupan Licencing Center` (both "Bonuan Complex"), `0912 Ipil DO` + `0913 MAIDRS - Ipil`. As of 2026-09 there are 34 such rows = **17 offices**, pairing evenly in every region. **The pair is identifiable only by shared `site_address`** — the two rows deliberately have different `site_name`s and (always) different `site_code`s, so checking for duplicate codes or names finds nothing and makes them look like 34 unrelated sites. Consequences:
  - `MasterfileLanding.js`'s `dualServerSites` stat divides the matching row count by 2 **on purpose**, because that card counts offices. This has been "corrected" to remove the `/2` once and had to be reverted — don't do it again without re-reading this bullet.
  - `MasterfileDirectory`'s Dual Server filter shows all 34 **rows**, since it is a row filter over site codes. Directory showing 34 while the landing card shows 17 is expected, not a bug.
  - `SiteDetailsModal`'s "Dual Server" Yes/No field is just `physical_site_count === 2` on the single row being edited; it does not know about the pairing.
  - The landing page's counts additionally exclude `office_type === 'E-Patrol'` (`validSites`), which no dual-server row currently is — beware that `office_type` is NULL on at least one row, so a SQL `office_type <> 'E-Patrol'` filter silently drops it (use `TRIM(COALESCE(office_type,''))`).
- **The schema has no foreign keys at all** (`information_schema.KEY_COLUMN_USAGE` returns zero rows for `hw_db`). Nothing at the DB level stops a delete from orphaning dependents: **52 `hw_tbl` rows already carry a `site_code` matching no site**, invisible in site-scoped views but still counted in totals. `SiteListTblController::delete()` now refuses (409) when hardware still references the site code, and `user-tbl/add` / `site-list-tbl/add` reject duplicate `user_name` / `site_code` (409) since no unique index exists either — `login()` resolves with `->first()`, so a duplicate username would permanently shadow the second account.
- `hw_id` is the database primary key; `hw_asset_num` is the user-visible asset tag. Special values: `NOT_APPLICABLE`, `TAG_REMOVED_UNREADABLE`, or prefixed with `PE` or `CI` — these are treated differently in the UI and must be preserved exactly. `AddHardwareModal` maps `NOT_APPLICABLE` → `'N/A'`, `TAG_REMOVED_UNREADABLE` → `'No Tag'`, `UNREADABLE_MISSING` → `'Unreadable'` before sending to the API.
- `hw_status` has normalized variants: `'On Site'` and `'Onsite'` are both treated as on-site; `'Pull Out'` and `'Pullout'` as pulled-out. Duplicate detection in `MasterfileInventory` uses `['On Site', 'Active', 'Installed']` as the active-status set.
- `HwTbl` entity has 45+ fields covering hardware specs (memory, HDD capacity/health, ports), software info (OS, antivirus, .NET), management codes (RSU, DTO, AIA), and network details (hostname, IP, MAC). All fields are mass-assignable.
- **The acquisition-date column is `hw_date_acq`, not `acq_date`.** It stores a string in `MM/DD/YY` (also accepts `MM/DD/YYYY`); age is computed by parsing it client-side against the current date, with a 2-digit year under 50 read as 20xx and 50–99 as 19xx. `acq_date` exists only as a *client-side mapped* field name: `MasterfileLanding.js`'s `detailedAgingList` builds `{ acq_date: h.hw_date_acq, ... }`, and `AgingDetailsModal.jsx` reads `acq_date` off those mapped objects. Both are correct; don't "fix" either to match the other, and don't expect `acq_date` to exist on a raw `/api/hw-tbl.json` row.
- **`hw_tbl` has no `created_at` / `updated_at` columns** (`request_tbl` and `site_list_tbl` do). CakePHP builds its SQL from the reflected schema, so assigning `updated_at` on a `HwTbl` entity is silently dropped — no error, no column written. Several call sites used to do this pointlessly. Don't add timestamps to hardware writes expecting them to persist.
- Hardware aging color thresholds: red ≥10 yr, amber ≥5 yr, lime ≥3 yr, emerald <3 yr (used in `MasterfileHardwareManagement` and `AgingDetailsModal`)
- Hardware type detection uses substring matching on the item description: `"cpu"/"desktop"/"laptop"/"workstation"` → CPU category, `"server"` → Server, `"switch"` → Switch. Server check is skipped if `"ups"` is in the description.
- HDD health badge is computed from `hdd_capacity` and `hdd_free_space` (not the stored `hdd_health` text field): usage % = (capacity − free) / capacity × 100. Color thresholds: ≥90% used → red, ≥75% → amber, <75% → green. Parses values like `"500GB"`, `"1TB"`, `"120MB"` — unit-aware (TB = ×1024 GB, MB = ÷1024 GB).
- Dropdown cascades in `AddHardwareModal`: item description → brand → model (each fetch depends on prior selection). Uses `useRef` to track last-fetched value and prevent duplicate API calls on re-render.
- Modals use React portals rendering into `#modal-root` for z-index isolation; the root element is auto-created if absent
- Bulk request selection constraints (enforced client-side in `MasterfileInventory`): max 5 items; all selected items must share the same `site_code` and `item_desc`. Checkboxes are disabled in Pull Out view — bulk actions only available for On Site hardware.
- Before add/edit in `MasterfileInventory`, a fresh `GET /api/hw-tbl.json` is issued to detect duplicate `hw_asset_num` / `hw_serial_num` against active-status records, excluding placeholder values (`N/A`, `NA`, `NONE`, `NO TAG`, `NO PE`, `REMOVED`, `UNREADABLE`, matched case-insensitively). A detailed toast shows the conflicting record's location. **Both the add/edit check and the Duplicate Entries accuracy-report card must share one placeholder list** — `ASSET_SERIAL_PLACEHOLDERS`/`isPlaceholderValue`, module scope at the top of `MasterfileInventory.js` — after they were once two separate copies, expanding one list without the other left `"NONE"` still showing up as a false duplicate in the report.
- Creating a PULL_OUT/RELOCATION request flips the underlying hardware's `hw_status` to `Pending` server-side, in `RequestTblController::add()` — this is the source of truth that keeps the hardware out of every "On Site" view (Inventory, Hardware Management, Reports, the public Landing page), not just Inventory's own filtering. It reverts to `On Site` on reject/cancel (client-side, in `dev/src/utils/requestActions.js`'s `cancelRequestCore` and the reject handler in `RequestDetailModal.js`) and flips to `Pullout` on approve (`approveRequestCore`, see below). `MasterfileInventory` also still cross-references PENDING request-tbl rows into `pendingRequestHwIds` and excludes those from its On Site list as a belt-and-suspenders fallback (covers requests created before this change, or any hw_status write that silently failed) — don't remove it as "redundant" without confirming there's no longer a gap. Note: this flip only fires on new requests; PENDING requests created before it existed won't have had their hardware's `hw_status` touched retroactively.
- `dev/src/utils/requestActions.js` centralizes request approve/cancel/delete plus approval's hardware side effects (shared by `RequestDetailModal` and the Dashboard's bulk actions, so the logic can't drift between single and bulk entry points): `approveRequestCore` sets status → APPROVED, flips the hardware's `hw_status` to `Pullout`, and — for RELOCATION — duplicates the hardware record at `destination_site` as a new `On Site` row (`POST /api/hw-tbl/add.json`) via `duplicateHardwareForRelocation`. **That duplication spreads the whole source record** (`{...original}` minus `hw_id`, overriding `site_code` and `hw_status`) rather than listing fields — an earlier version hand-listed ~17 of `hw_tbl`'s 38 columns, so relocated units silently lost memory, HDD capacity/health, OS, .NET, antivirus (incl. `hw_antivi_meta`), `core_buid`, all six facility flags, the ports counts and `major_type`/`sub_major_type`. It also fabricated `hw_ip_add: '0.0.0.0'` / `hw_mac_add: '00:00:00:00:00:00'` / `hw_host_name: reloc-<ts>` for blank values, which gave every relocated unit the *same* MAC and made them collide with each other in `findNetworkDuplicate`'s org-wide check. Blank now stays blank. Don't reintroduce a field allowlist or placeholder defaults here. It deliberately skips attachment replacement (that stays a single-request, SPV-specific step in `RequestDetailModal`). `cancelRequestCore` and the reject handler in `RequestDetailModal.js` both call the shared `updateHardwareStatusForRequest` to revert `hw_status` back to `On Site` for PULL_OUT/RELOCATION requests (undoing the `add()`-time flip above) and surface a non-fatal `warning` string (shown via `alert()`, not a hard failure) if that hardware update fails.
- A request transitioning to CANCELED (`RequestTblController::update()`) deletes its uploaded attachment file from disk and clears `attachment_path` server-side — a canceled request never went anywhere, so its form shouldn't remain viewable. Only fires on the PENDING/REJECTED → CANCELED transition (not on repeat updates to an already-canceled row); a failed `unlink()` is logged via `Cake\Log\Log::error` but doesn't block `attachment_path` from being nulled, since the "not viewable" guarantee is a DB-level fact, not a filesystem one. `scripts/backfill_delete_canceled_attachments.php` is the one-time cleanup for requests that were already CANCELED before this fix shipped (supports `--dry-run`); `scripts/backfill_pending_hw_status.php` is the equivalent one-time backfill for the `add()`-time `hw_status` flip above, matching pre-existing PENDING requests to hardware via `hw_id` or a placeholder-aware asset/serial fallback; `scripts/backfill_revert_stuck_pending_hw_status.php` (also `--dry-run`) is the reverse-direction cleanup, for hardware left stranded at `Pending` because it was rejected/canceled *before* the reject/cancel revert-to-`On Site` code above existed — same `hw_id`-then-asset/serial matching, but only reverts a row when none of its matched requests are still PENDING or APPROVED. All three are meant to be run once against the VM after deploy, not on a schedule.
- CANCELED requests are filtered out of the cluster-wide (SPV) and org-wide (ADM) request fetches in both `MasterfileDashboard.js` and `MasterfileRequestMonitoring.js`, keeping only the viewer's own CANCELED requests (`requested_by === userId`) — a cancel is the requester's own business and shouldn't surface (list, tab counts, or the detail pane) for anyone else. FSE is unaffected since its fetch is already scoped to `requested_by`.
- In `MasterfileHardwareManagement`, editing a CPU/server's `hw_ip_add` / `hw_mac_add` runs a client-side duplicate check (`findNetworkDuplicate`) against all On Site units org-wide (any region). MACs are normalized to hex digits only (separator-agnostic); IPs/MACs are format-validated first (`isValidIp`/`isValidMac`), and a conflicting unit's asset tag + site are reported in the save error.
- PDF reports use jsPDF (+ `jspdf-autotable`), pdf-lib, and react-pdf (which pulls `pdfjs-dist`); `BulkRequestModal` generates PDFs client-side using pdf-lib. PULL_OUT form collects: delivery method, tracking number, delivered by, pickup date, and a pullout form file. RELOCATION form collects: service request no., date, return date, reason, from/to accountable persons, and transfer site code.
- Dark mode reads system preference via `window.matchMedia('(prefers-color-scheme: dark)')` as initial value, then persists toggle to `localStorage.darkMode`; applies by adding `dark` class to `document.documentElement`
- The 30-minute inactivity session timer (`dev/src/utils/session.js`) creates its modal imperatively via `document.createElement` — it is not a React component
- `MasterfileInventory` shows toast notifications for add/edit/delete actions and skeleton loaders (`SkeletonRow`, `SkeletonTableCard`) during data fetch

## Deployment

The live deployment lives at `Z:\xampp\htdocs\masterfilev2` (a mapped network drive, directly writable from the dev machine). `C:\xampp\htdocs\omni_ops` is only the local dev copy — a deploy is copying the built artifacts across to that path (or the VM at `192.168.4.95`, see below).

A deploy is **not frontend-only**. The working pattern (mirrors exclude live data):

```bash
robocopy dev\build            <target>\webroot\public /MIR /XD uploads /XF .htaccess
robocopy dev\src              <target>\dev\src        /MIR
# plus: cp any changed src/Controller/... and webroot/**/.htaccess to <target>
```

`/XD uploads /XF .htaccess` is load-bearing — without it a `/MIR` wipes live attachments and the upload-execution guards. `webroot/public` is tracked in git, so commit the rebuilt bundle too (see the `build:` commits in the log).

1. `cd dev && npm run build`
2. Copy `dev/build/*` to `webroot/public/`
3. Set `config/app_local.php` production values (debug: false, correct DB DSN)
4. `php bin/cake migrations migrate`
5. Update CORS origins in `ItemBrandController`, `ItemDescriptionController`, `ItemModelsController` from `http://localhost:3000` to the production domain
6. If the deploy touched any table's columns, clear the ORM schema cache on the target (`bin/cake cache clear_all`, or delete `tmp/cache/models/myapp_cake_model_default_<table>`) — see Key Domain Details, first bullet.
7. Run any pending one-time backfill scripts in `scripts/` (each supports `--dry-run`; run once against the target, not on a schedule): `backfill_delete_canceled_attachments.php`, `backfill_pending_hw_status.php`, `backfill_revert_stuck_pending_hw_status.php` — see the request-lifecycle bullets in Key Domain Details for what each one repairs.
8. Confirm no executable files sit in any upload directory on the target, and that both guards are in place:
   ```bash
   find <target>/webroot/uploads <target>/webroot/public/uploads -name '*.php'   # must be empty
   grep -l 'engine off' <target>/webroot/uploads/.htaccess <target>/webroot/public/uploads/.htaccess
   ```
   A `test-upload.php` debug script — no auth, no validation, writing `$_FILES` under `basename()` into a web-served directory — sat live on the VM until 2026-09-18. It was untracked, so it never appeared in `git status`; it reached the VM through `dev/public/` being copied into `dev/build/` by CRA. Anything added under `dev/public/` ships to production.

Requires PHP 7.4+, MySQL 5.7+, Apache with mod_rewrite.

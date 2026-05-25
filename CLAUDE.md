# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniOps is a hardware asset management and inventory system built with a **CakePHP 4.5 backend** and **React 19 frontend**. The application manages hardware assets, users, requests, and related metadata across multiple regions and sites.

- **Backend**: CakePHP 4.5 (PHP 7.4+) REST API with JSON responses
- **Frontend**: React 19 SPA with React Router 7.9, React Bootstrap 2.10, TanStack React Table, Chart.js
- **Styling**: Bootstrap 5 for layout; Tailwind utility class names used in JSX (`text-red-500`, `dark:bg-gray-900`, etc.) — **`tailwindcss` is not installed as an npm package** (config files `tailwind.config.js` and `postcss.config.js` exist, but the package itself is absent from `package.json`); run `npm install -D tailwindcss` if new components need Tailwind styles to apply.
- **Icons**: Two libraries are in use — `@heroicons/react` v2 (used in most page components) and `react-icons` v5 (`react-icons/hi` HeroIcons variant, used in `MasterfileLayout.js` sidebar/nav). Both are installed; match whichever the file already uses.
- **Database**: MySQL via PDO
- **Dev Environment**: XAMPP (Apache), Node.js

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
composer cs-check
composer cs-fix

# Generate migration
php bin/cake bake migration AlterHwTbl

# Built-in dev server (alternative to XAMPP)
php bin/cake server -p 8765
```

The backend is normally served via XAMPP Apache at `http://omniops.local`.

### Frontend (React)

```bash
cd dev

npm install
npm start        # Dev server at http://localhost:3000 (proxies /api to http://omniops.local)
npm run build    # Outputs to dev/build/ — copy to webroot/public/ for deployment
npm test         # Jest watch mode
```

> **Testing note**: PHPUnit tests exist for backend controllers under `tests/TestCase/Controller/Api/`. The frontend has only a placeholder `App.test.js` — no meaningful React tests exist yet.

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

All endpoints are under `/api/` prefix, return JSON, and have CSRF disabled (handled by CORS preflight). CORS is configured per-controller in `beforeFilter()`. Configuration varies:
- `HwTblController`, `RegionTblController`, `RequestTblController`, `SiteListTblController` — allow `*` origin (mirrors the request's `Origin` header)
- `UserTblController` — explicit allowlist (`http://localhost:3000`, `http://omniops.local`) with `credentials: true`
- `ItemBrandController`, `ItemDescriptionController`, `ItemModelsController` — hardcoded `http://localhost:3000` only; **these will fail in production** unless the origin is updated to the production domain

This inconsistency matters when adding new controllers: copy the pattern from a controller with similar auth requirements.

Key endpoints:
- `POST /api/user-tbl/login.json` — auth; sets `Auth.User` in PHP session
- `GET /api/hw-tbl.json` — all hardware, up to 10,000 records ordered by region/site/asset
- `POST /api/hw-tbl.json` — add hardware (maps to `add()` via explicit route in `routes.php`)
- `POST /api/hw-tbl/update.json` — React-facing edit; accepts `id` or `hw_id` in the body (not a standard REST route)
- `DELETE /api/hw-tbl/:id.json` — delete hardware
- `GET /api/hw-tbl/site/:site_code.json` — hardware filtered by site code
- `GET /api/site-list-tbl.json`, `GET /api/region-tbl.json` — reference data
- `POST /api/site-list-tbl/add.json`, `POST /api/site-list-tbl/edit/:id.json`, `POST /api/site-list-tbl/delete/:id.json` — site CRUD (non-REST named actions)
- `POST /api/user-tbl/add.json` — create new user (name, username, password, region assignment)
- `POST /api/user-tbl/reset-password.json` — reset user password (`user_id` required in body)
- `GET /api/request-tbl.json` — hardware requests; query params: `requested_by`, `status` (PENDING/APPROVED/REJECTED/CANCELED), `cluster_name`
- `POST /api/request-tbl.json` — create request (multipart/form-data, supports file uploads); `request_type` is `PULL_OUT` or `RELOCATION`
- `POST /api/request-tbl/updateAttachment/:id.json` — replace attachment on an existing request (SPV only; multipart/form-data)
- `GET /api/item-brand.json`, `GET /api/item-description.json`, `GET /api/item-models.json` — cascading dropdown data

Standard response shapes:
```json
{ "success": true, "hwTbl": [...] }
{ "success": false, "error": "message", "errors": { "field": ["..."] } }
```

File uploads (requests) are stored under `webroot/uploads/` organized as `{request_type}/{Y-m}/{unique_filename}`. Allowed MIME types: PDF, JPEG, PNG.

### Frontend Routing & Auth

React Router with `basename="/public"`. Public routes: `/`, `/masterfile`, `/masterfile/login`. All other `/masterfile/*` routes are nested under `<MasterfileLayout>`, which enforces authentication by checking `sessionStorage.user` and redirecting to login if absent.

`MasterfileLanding.js` (`/masterfile`) is the public pre-login stats page — it fetches and renders live hardware summary charts and stats without requiring a session.

Protected routes:
- `/masterfile/home` → `MasterfileDashboard` (request overview, role-filtered)
- `/masterfile/inventory` → `MasterfileInventory` (hardware table with bulk request; default 10 rows/page)
- `/masterfile/management` → `MasterfileHardwareManagement` (hardware aging table: age computation, HDD health badges, `PAGE_SIZE=30`). CPU rows have a sub-view toggle: `os_facilities`, `hostname_ip_mac`, `workstep_user`, `hdd_age`. `CONFIG_FIELDS` per category (CPU/SERVER/SWITCH) defines which fields count toward config completeness. `installedFacilities()` maps boolean DB columns (`rsu_fac`, `mv_dto`, `mv_maint`, `ims_aiu`, `dl_dto`, `dl_maint`, `dotnet`) to display labels.
- `/masterfile/directory` → `MasterfileDirectory` (site directory with TanStack Table v8 + `SiteDetailsModal`; global filter across site_code, site_name, office_type, address, trxn_catered, ownership, region)
- `/masterfile/users` → `MasterfileUsers` (user management table; SPV can add new FSE users scoped to their cluster and reset passwords; ADM is read-only but can also reset passwords; FSE has no access)
- `/masterfile/profile` → `MasterfileProfile` (password change, profile edit; save only enabled when fields actually changed)

### Data Flow

1. Login writes user object to `sessionStorage.user` (fields: `fname`, `lname`, `user_name`, `user_type`, `region_assigned`, `cluster_name`, `id`)
2. Components call `useApi()` hook: `fetchData(endpoint)`, `fetchMany(...endpoints)`, `postData(endpoint, data)`, `postFormData(endpoint, formData)`
3. `fetchMasterfileData()` is a convenience method on `useApi()` that batch-fetches the reference endpoints needed by the inventory page in parallel
4. State is local per component; dark mode preference stored in `localStorage.darkMode`
5. A 15-minute inactivity timer (`dev/src/utils/session.js`) shows a timeout modal and redirects to login
6. `useApi` always uses relative URL paths (empty string prefix); the CRA proxy in `package.json` forwards `/api/*` requests to `http://omniops.local` during development

### Role-Based Access

`user_type` controls both data scope and UI capabilities. The roles are **not a hierarchy** — FSE is the editing role, while ADM/SPV have broader data scope but are read-only for hardware records.

- `FSE` (default) — can add hardware, edit hardware, create bulk pull-out/relocation requests; scoped to their `region_assigned` IDs. No Users management tab.
- `ADM` — read-only in inventory/management views; full data scope if `cluster_name === 'All Cluster'` (all regions), otherwise same region scoping as FSE. In Users tab: read-only list + can reset any user's password. In `AddHardwareModal`, matched as `['ADM', 'ADMIN', 'ADMINISTRATOR']`.
- `SPV` / `SUPERVISOR` — read-only in inventory; scoped to all regions sharing their `cluster_name`. In Users tab: can add new FSE users scoped to their cluster and reset passwords; region column is hidden for SPV.

`region_assigned` is a comma-separated string of region IDs; the inventory page filters hardware to the user's assigned regions. ADM with `cluster_name === 'All Cluster'` bypasses this filter entirely.

### Key Domain Details

- `hw_id` is the database primary key; `hw_asset_num` is the user-visible asset tag. Special values: `NOT_APPLICABLE`, `TAG_REMOVED_UNREADABLE`, or prefixed with `PE` or `CI` — these are treated differently in the UI and must be preserved exactly. `AddHardwareModal` maps `NOT_APPLICABLE` → `'N/A'`, `TAG_REMOVED_UNREADABLE` → `'No Tag'`, `UNREADABLE_MISSING` → `'Unreadable'` before sending to the API.
- `hw_status` has normalized variants: `'On Site'` and `'Onsite'` are both treated as on-site; `'Pull Out'` and `'Pullout'` as pulled-out. Duplicate detection in `MasterfileInventory` uses `['On Site', 'Active', 'Installed']` as the active-status set.
- `HwTbl` entity has 45+ fields covering hardware specs (memory, HDD capacity/health, ports), software info (OS, antivirus, .NET), management codes (RSU, DTO, AIA), and network details (hostname, IP, MAC). All fields are mass-assignable.
- `acq_date` stores acquisition date as a string in `MM/DD/YY` format; age is computed by parsing this field client-side against the current date.
- Hardware aging color thresholds: red ≥10 yr, amber ≥5 yr, lime ≥3 yr, emerald <3 yr (used in `MasterfileHardwareManagement` and `AgingDetailsModal`)
- Hardware type detection uses substring matching on the item description: `"cpu"/"desktop"/"laptop"/"workstation"` → CPU category, `"server"` → Server, `"switch"` → Switch. Server check is skipped if `"ups"` is in the description.
- HDD health badge is computed from `hdd_capacity` and `hdd_free_space` (not the stored `hdd_health` text field): usage % = (capacity − free) / capacity × 100. Color thresholds: ≥90% used → red, ≥75% → amber, <75% → green. Parses values like `"500GB"`, `"1TB"`, `"120MB"` — unit-aware (TB = ×1024 GB, MB = ÷1024 GB).
- Dropdown cascades in `AddHardwareModal`: item description → brand → model (each fetch depends on prior selection). Uses `useRef` to track last-fetched value and prevent duplicate API calls on re-render.
- Modals use React portals rendering into `#modal-root` for z-index isolation; the root element is auto-created if absent
- Bulk request selection constraints (enforced client-side in `MasterfileInventory`): max 5 items; all selected items must share the same `site_code` and `item_desc`. Checkboxes are disabled in Pull Out view — bulk actions only available for On Site hardware.
- Before add/edit in `MasterfileInventory`, a fresh `GET /api/hw-tbl.json` is issued to detect duplicate `hw_asset_num` / `hw_serial_num` against active-status records (excluding placeholder values). A detailed toast shows the conflicting record's location.
- PDF reports use jsPDF, pdf-lib, and react-pdf; `BulkRequestModal` generates PDFs client-side using pdf-lib. PULL_OUT form collects: delivery method, tracking number, delivered by, pickup date, and a pullout form file. RELOCATION form collects: service request no., date, return date, reason, from/to accountable persons, and transfer site code.
- Dark mode reads system preference via `window.matchMedia('(prefers-color-scheme: dark)')` as initial value, then persists toggle to `localStorage.darkMode`; applies by adding `dark` class to `document.documentElement`
- The 15-minute session timer (`dev/src/utils/session.js`) creates its modal imperatively via `document.createElement` — it is not a React component
- Bulk action buttons in `MasterfileDashboard` (Approve for SPV, Cancel/Delete for FSE) are stubs — they currently call `alert()` / `window.confirm()` and do not make API requests. The UI scaffolding exists but the API wiring is not yet implemented.
- `MasterfileInventory` shows toast notifications for add/edit/delete actions and skeleton loaders (`SkeletonRow`, `SkeletonTableCard`) during data fetch

## Deployment

1. `cd dev && npm run build`
2. Copy `dev/build/*` to `webroot/public/`
3. Set `config/app_local.php` production values (debug: false, correct DB DSN)
4. `php bin/cake migrations migrate`
5. Update CORS origins in `ItemBrandController`, `ItemDescriptionController`, `ItemModelsController` from `http://localhost:3000` to the production domain

Requires PHP 7.4+, MySQL 5.7+, Apache with mod_rewrite.

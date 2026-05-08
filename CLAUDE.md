# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniOps is a hardware asset management and inventory system built with a **CakePHP 4.5 backend** and **React 19 frontend**. The application manages hardware assets, users, requests, and related metadata across multiple regions and sites.

- **Backend**: CakePHP 4.5 (PHP 7.4+) REST API with JSON responses
- **Frontend**: React 19 SPA with React Router 7.9, React Bootstrap 2.10, Tailwind CSS, TanStack React Table, Chart.js
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
│       ├── pages/masterfile/     # Page components + sub-components
│       │   └── components/       # Shared modal and card components
│       └── hooks/useApi.js       # Fetch wrapper used by all pages
├── webroot/public/               # React production build (deployed here)
├── templates/                    # CakePHP templates (legacy, not used by SPA)
└── tests/                        # PHPUnit tests + fixtures
```

### Backend API

All endpoints are under `/api/` prefix, return JSON, and have CSRF disabled (handled by CORS preflight). CORS is configured per-controller in `beforeFilter()` for `http://localhost:3000` and `http://omniops.local` with `credentials: true`. Note: CORS configuration varies slightly per controller — some controllers allow `*`.

Key endpoints:
- `POST /api/user-tbl/login.json` — auth; sets `Auth.User` in PHP session
- `GET/POST/DELETE /api/hw-tbl[/:id].json` — hardware CRUD (GET returns up to 10,000 records)
- `GET /api/site-list-tbl.json`, `GET /api/region-tbl.json` — reference data
- `GET /api/request-tbl.json`, `POST /api/request-tbl.json` — hardware requests (supports file uploads)
- `GET /api/item-brand.json`, `GET /api/item-description.json`, `GET /api/item-models.json` — cascading dropdown data

Standard response shapes:
```json
{ "success": true, "hwTbl": [...] }
{ "success": false, "error": "message", "errors": { "field": ["..."] } }
```

File uploads (requests) are stored under `webroot/uploads/` organized as `{request_type}/{Y-m}/{unique_filename}`. Allowed MIME types: PDF, JPEG, PNG.

### Frontend Routing & Auth

React Router with `basename="/public"`. Public routes: `/`, `/masterfile`, `/masterfile/login`. All other `/masterfile/*` routes are nested under `<MasterfileLayout>`, which enforces authentication by checking `sessionStorage.user` and redirecting to login if absent.

Protected routes:
- `/masterfile/home` → `MasterfileDashboard` (request overview, role-filtered)
- `/masterfile/inventory` → `MasterfileInventory` (hardware table with bulk request)
- `/masterfile/management` → `MasterfileHardwareManagement` (**stub — not implemented**)
- `/masterfile/directory` → `MasterfileDirectory` (**stub — not implemented**)
- `/masterfile/users` → `MasterfileUsers` (**stub — not implemented**)
- `/masterfile/profile` → `MasterfileProfile` (password change, profile edit)

### Data Flow

1. Login writes user object to `sessionStorage.user` (fields: `fname`, `lname`, `user_name`, `user_type`, `region_assigned`, `cluster_name`, `id`)
2. Components call `useApi()` hook: `fetchData(endpoint)`, `fetchMany(...endpoints)`, `postData(endpoint, data)`, `postFormData(endpoint, formData)`
3. `fetchMasterfileData()` is a convenience method on `useApi()` that batch-fetches the 7 reference endpoints needed by the inventory page in parallel
4. State is local per component; dark mode preference stored in `localStorage.darkMode`
5. A 15-minute inactivity timer (`dev/src/utils/session.js`) shows a timeout modal and redirects to login

### Role-Based Access

`user_type` controls both API filtering and UI visibility:
- `ADMIN` / `ADM` / `ADMINISTRATOR` — full access, all sidebar items including Users
- `SUPERVISOR` / `SPV` — same as admin
- `FSE` (default) — no Users management tab

`region_assigned` is a comma-separated string of region IDs; the inventory page filters hardware to the user's assigned regions.

### Key Domain Details

- `hw_id` is the database primary key; `hw_asset_num` is the user-visible asset tag
- Dropdown cascades in `AddHardwareModal`: item description → brand → model (each fetch depends on the prior selection)
- Modals use React portals rendering into `#modal-root` for z-index isolation
- PDF reports use jsPDF, pdf-lib, and react-pdf; bulk request PDFs are generated client-side in `BulkRequestModal`
- API base URL is environment-detected at runtime: `localhost:3000` in dev (proxied), same-origin relative path in production

## Deployment

1. `cd dev && npm run build`
2. Copy `dev/build/*` to `webroot/public/`
3. Set `config/app_local.php` production values (debug: false, correct DB DSN)
4. `php bin/cake migrations migrate`

Requires PHP 7.4+, MySQL 5.7+, Apache with mod_rewrite.

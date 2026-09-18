<?php
declare(strict_types=1);

namespace App\Controller\Api;

/**
 * Unauthenticated data for the public pre-login stats page (`/masterfile`,
 * `MasterfileLanding.js`).
 *
 * That page used to build its charts from `GET /api/hw-tbl.json`, which returns
 * every column of all ~18,250 hardware rows — serial numbers, asset tags, IP and
 * MAC addresses, hostnames, assigned usernames, antivirus state, disk figures —
 * to anyone who could reach the server, with no session required. The page reads
 * exactly eight of those columns and none of the sensitive ones, so this endpoint
 * serves that projection instead.
 *
 * Deliberately a projection rather than server-computed aggregates: the landing
 * page derives sixteen different groupings from these rows, re-derives all of
 * them whenever its region/site filters change, and its aging modal is a per-unit
 * list rather than a summary. Reimplementing that in PHP would mean maintaining
 * two copies of ~600 lines of grouping logic that are free to drift apart — the
 * failure mode this codebase has already hit more than once (see the duplicated
 * placeholder list in Key Domain Details). Projecting the columns removes the
 * data that actually mattered while leaving the client logic untouched.
 *
 * Rows are NOT restricted to 'On Site'. Every consumer on that page filters by
 * status itself except `availableHardwareTypes`, which collects distinct
 * `item_desc` values across all statuses to populate the aging-filter dropdown;
 * restricting here would silently shrink that dropdown.
 */
class PublicController extends ApiController
{
    /**
     * Columns the landing page actually reads. Anything not listed here is
     * intentionally withheld — adding to this list makes data public, so it
     * should be a deliberate decision rather than a convenience.
     */
    private const HARDWARE_FIELDS = [
        'site_code',
        'item_desc',
        'sub_major_type',
        'hw_brand_name',
        'hw_model',
        'os_type',
        'hw_status',
        'hw_date_acq',
        // Facility flags behind the landing page's "Utilities" card. Easy to miss:
        // utilitiesData reads them as h[util.key] from a list of string keys, so
        // they do not appear in a grep for `h.<field>` — which is how they were
        // left out of the first version of this list, quietly zeroing that card.
        // Booleans, no identifying content.
        'rsu_fac',
        'mv_dto',
        'mv_maint',
        'ims_aiu',
        'dl_dto',
        'dl_maint',
    ];

    private const SITE_FIELDS = [
        'site_id',
        'site_code',
        'site_name',
        'region_id',
        'office_type',
        'physical_site_count',
    ];

    private const REGION_FIELDS = [
        'region_id',
        'region_name',
    ];

    /**
     * Intentionally empty: `summary` is public by design.
     *
     * When Phase 2 inverts ApiController to deny-by-default, this action must be
     * explicitly exempted — the pre-login page has no session to offer.
     *
     * @return array<string, array<int, string>>
     */
    protected function protectedActions(): array
    {
        return [];
    }

    public function initialize(): void
    {
        parent::initialize();
        $this->loadComponent('RequestHandler');
    }

    public function beforeFilter(\Cake\Event\EventInterface $event)
    {
        $origin = $this->request->getHeaderLine('Origin') ?: '*';
        $this->response = $this->response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
            ->withHeader('Access-Control-Max-Age', '86400')
            ->withHeader('Vary', 'Origin');

        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        return parent::beforeFilter($event);
    }

    /**
     * GET /api/public/summary.json
     *
     * One round trip in place of the three the page used to make. Response keys
     * mirror the shapes those endpoints returned, so the client keeps the same
     * `regions` / `sites` / `hardware` arrays it always had.
     */
    public function summary()
    {
        $this->request->allowMethod(['get']);

        $regions = $this->fetchTable('RegionTbl')->find()
            ->select(self::REGION_FIELDS)
            ->order(['region_name' => 'ASC'])
            ->disableHydration()
            ->toArray();

        $sites = $this->fetchTable('SiteListTbl')->find()
            ->select(self::SITE_FIELDS)
            ->disableHydration()
            ->toArray();

        $hardware = $this->fetchTable('HwTbl')->find()
            ->select(self::HARDWARE_FIELDS)
            ->disableHydration()
            ->toArray();

        return $this->response
            ->withType('json')
            ->withStringBody(json_encode([
                'success' => true,
                'regions' => $regions,
                'sites' => $sites,
                'hardware' => $hardware,
            ]));
    }
}

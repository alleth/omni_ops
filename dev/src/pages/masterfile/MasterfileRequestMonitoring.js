// src/pages/masterfile/MasterfileRequestMonitoring.js
//
// SPV/ADM only. The Dashboard's "Pending Requests" card caps itself at 5 rows
// (see PENDING_CARD_LIMIT in MasterfileDashboard.js) and links here for the
// full picture -- every request in scope, not just PENDING ones, with SR
// Number/SR Date and an expandable-per-request detail view.
//
// Laid out as an email inbox (Gmail/Outlook-style split pane) rather than a
// spreadsheet table, per explicit request: a compact message-style list on
// the left (requester = "sender", hardware = "subject", SR#/tracking/site =
// snippet, PENDING rows rendered bold/dotted like "unread"), click one and
// its full detail opens in a reading pane on the right that stays in place
// as you click through requests. Below the lg breakpoint there's no room for
// both panes, so it degrades to single-column: list only, or detail-only
// with a Back button once something's selected (see the two panes' className
// toggles below -- no resize listener needed, it's pure Tailwind).
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import RequestDetailModal from './components/RequestDetailModal';

const PAGE_SIZE = 25;

const Icon = ({ d, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

const Sk = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

const STATUS_META = {
    PENDING: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500' },
    APPROVED: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500' },
    REJECTED: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500' },
    CANCELED: { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', dot: 'bg-gray-400' },
};
const statusMeta = (s) => STATUS_META[(s || 'PENDING').toUpperCase()] || STATUS_META.PENDING;

const StatusBadge = ({ status }) => {
    const s = (status || 'PENDING').toUpperCase();
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta(s).badge}`}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
        </span>
    );
};

const Field = ({ label, value, mono = false }) => (
    <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-gray-800 dark:text-gray-100 ${mono ? 'font-mono' : ''}`}>
            {value || '—'}
        </p>
    </div>
);

// Deterministic avatar color per user — same requester always gets the same
// color, just like a real inbox's sender avatars.
const AVATAR_COLORS = [
    'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-purple-500 to-fuchsia-600',
    'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600', 'from-cyan-500 to-blue-600',
];
const avatarColor = (id) => AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELED'];

function MasterfileRequestMonitoring() {
    const { fetchData } = useApi();
    const fetchRef = useRef(fetchData);
    useEffect(() => { fetchRef.current = fetchData; });

    const user = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
    const role = (user.user_type || 'FSE').toString().trim().toUpperCase();
    const isSPV = ['SPV', 'SUPERVISOR'].includes(role);

    const [requests, setRequests] = useState([]);
    const [siteMap, setSiteMap] = useState({});
    const [regionMap, setRegionMap] = useState({});
    const [userMap, setUserMap] = useState({});
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    // Approve/reject is deliberately NOT reimplemented here -- it reuses the
    // same RequestDetailModal every other approval entry point uses, so the
    // hardware side effects (flip to Pullout; for RELOCATION, duplicate the
    // hardware record at the destination site as On Site -- see
    // approveRequestCore in utils/requestActions.js) and the "SPV must attach
    // a newly signed document before approving" rule can't drift between
    // this page and the Dashboard's modal/bulk-approve.
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        // Scoped the same way the Dashboard's own request list is: SPV sees
        // their cluster, ADM sees everything. Every status is fetched here
        // (not just PENDING) since this page is meant for monitoring
        // everything that's been requested, approved, rejected, or canceled.
        const clusterQuery = isSPV ? `?cluster_name=${encodeURIComponent(user.cluster_name || '')}` : '';
        const [reqRes, siteRes, regionRes, userRes] = await Promise.all([
            fetchRef.current(`/api/request-tbl.json${clusterQuery}`),
            fetchRef.current('/api/site-list-tbl.json'),
            fetchRef.current('/api/region-tbl.json'),
            fetchRef.current(`/api/user-tbl.json${clusterQuery}`),
        ]);

        const list = reqRes?.requests || [];
        setRequests(list);

        const sMap = {};
        (siteRes?.siteListTbl || []).forEach(s => { sMap[s.site_code] = s; });
        setSiteMap(sMap);

        const rMap = {};
        (regionRes?.regionTbl || []).forEach(r => { rMap[String(r.region_id)] = r.region_name; });
        setRegionMap(rMap);

        const uMap = {};
        (userRes?.users || []).forEach(u => { uMap[u.id] = `${u.fname || ''} ${u.lname || ''}`.trim(); });
        setUserMap(uMap);

        setLoading(false);
    }, [isSPV, user.cluster_name]);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return requests.filter(r => {
            if (statusFilter !== 'ALL' && (r.status || 'PENDING').toUpperCase() !== statusFilter) return false;
            if (typeFilter !== 'ALL' && (r.request_type || '').toUpperCase() !== typeFilter) return false;
            if (!q) return true;
            const haystack = [
                r.user?.fname, r.user?.lname, r.user?.user_name,
                r.item_desc, r.hw_brand_name, r.hw_model,
                r.asset_num, r.serial_num, r.site_code,
                r.tracking_num, r.sr_num,
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [requests, statusFilter, typeFilter, search]);

    // Reset to page 1 whenever the filtered set changes shape
    useEffect(() => { setPage(1); }, [statusFilter, typeFilter, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const selected = useMemo(
        () => requests.find(r => r.request_id === selectedId) || null,
        [requests, selectedId]
    );

    const statusCounts = useMemo(() => {
        const counts = { ALL: requests.length, PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELED: 0 };
        requests.forEach(r => {
            const s = (r.status || 'PENDING').toUpperCase();
            if (counts[s] !== undefined) counts[s]++;
        });
        return counts;
    }, [requests]);

    const formatRelTime = (d) => {
        if (!d) return '—';
        const diff = Date.now() - new Date(d).getTime();
        const min = Math.floor(diff / 60000);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
        if (min < 1) return 'just now';
        if (min < 60) return `${min}m`;
        if (hr < 24) return `${hr}h`;
        if (day === 1) return 'yesterday';
        if (day < 7) return `${day}d`;
        return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };
    const formatDateTime = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        if (isNaN(date.getTime())) return String(d);
        return date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const siteLabel = (code) => {
        if (!code) return '—';
        const site = siteMap[code];
        if (!site) return code;
        const region = regionMap[String(site.region_id)];
        return `${code} — ${site.site_name || ''}${region ? ` (${region})` : ''}`.trim();
    };

    const initials = (req) => {
        const f = req.user?.fname?.[0] || '';
        const l = req.user?.lname?.[0] || '';
        return (f + l).toUpperCase() || '?';
    };

    const attachmentUrlFor = (req) => {
        const path = req?.attachment_path && String(req.attachment_path).trim();
        if (!path) return null;
        const currentOrigin = window.location.origin;
        const isDevHost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
        const baseUrl = isDevHost ? 'http://omniops.local' : 'http://192.168.4.95:8888';
        return `${baseUrl}${path}`;
    };

    return (
        <div className="p-5 pb-16">
            <div className="max-w-6xl mx-auto space-y-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Request Monitoring</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Every hardware request in your scope — pull-outs and relocations, all statuses.
                    </p>
                </div>

                {/* Toolbar: status tabs + search + type filter */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 shadow-sm space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                        {STATUS_TABS.map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                    statusFilter === s
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {s.charAt(0) + s.slice(1).toLowerCase()} · {statusCounts[s]}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-[220px]">
                            <Icon d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search requester, hardware, asset #, tracking #, SR #..."
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="ALL">All Types</option>
                            <option value="PULL_OUT">Pull Out</option>
                            <option value="RELOCATION">Relocation</option>
                        </select>
                    </div>
                </div>

                {/* Inbox: list + reading pane */}
                <div className="flex gap-4 items-start">
                    {/* List */}
                    <div className={`${selectedId ? 'hidden lg:flex' : 'flex'} lg:w-[420px] flex-shrink-0 flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden`}>
                        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[300px]">
                            {loading ? (
                                <div className="p-4 space-y-4">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex gap-3 items-center">
                                            <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <Sk className="h-3 w-2/3" />
                                                <Sk className="h-3 w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : pageRows.length === 0 ? (
                                <div className="py-14 text-center px-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                                        <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No requests match these filters</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {pageRows.map(req => {
                                        const isSelected = selectedId === req.request_id;
                                        const isPending = (req.status || 'PENDING').toUpperCase() === 'PENDING';
                                        const meta = statusMeta(req.status);
                                        const hwLine = [req.item_desc, req.hw_brand_name, req.hw_model].filter(Boolean).join(' ') || 'Hardware request';
                                        const snippet = [
                                            req.sr_num ? `SR# ${req.sr_num}` : null,
                                            req.tracking_num ? `Tracking ${req.tracking_num}` : null,
                                            req.site_code || null,
                                        ].filter(Boolean).join(' · ') || req.request_type?.replace('_', ' ');

                                        return (
                                            <li key={req.request_id}>
                                                <button
                                                    onClick={() => setSelectedId(req.request_id)}
                                                    className={`w-full text-left flex gap-3 px-4 py-3 transition-colors ${
                                                        isSelected
                                                            ? 'bg-indigo-50 dark:bg-indigo-950/40'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                                    }`}
                                                >
                                                    <div className="relative flex-shrink-0">
                                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(req.requested_by)} flex items-center justify-center text-white text-xs font-bold`}>
                                                            {initials(req)}
                                                        </div>
                                                        <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${meta.dot}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline justify-between gap-2">
                                                            <p className={`text-sm truncate ${isPending ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                                {req.user?.fname ? `${req.user.fname} ${req.user.lname || ''}`.trim() : 'Unknown'}
                                                            </p>
                                                            <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                                                                {formatRelTime(req.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm truncate ${isPending ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                                            {hwLine}
                                                        </p>
                                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{snippet}</p>
                                                            <StatusBadge status={req.status} />
                                                        </div>
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {!loading && filtered.length > PAGE_SIZE && (
                            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reading pane */}
                    <div className={`${selectedId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm min-h-[300px] max-h-[calc(100vh-280px)] overflow-y-auto`}>
                        {!selected ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
                                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                    <Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Select a request to view its details</p>
                            </div>
                        ) : (
                            <div className="p-6">
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="lg:hidden flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4"
                                >
                                    <Icon d="M15 19l-7-7 7-7" className="w-4 h-4" />
                                    Back to list
                                </button>

                                <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`w-11 h-11 flex-shrink-0 rounded-full bg-gradient-to-br ${avatarColor(selected.requested_by)} flex items-center justify-center text-white text-sm font-bold`}>
                                            {initials(selected)}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {[selected.item_desc, selected.hw_brand_name, selected.hw_model].filter(Boolean).join(' ') || 'Hardware Request'}
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {selected.user?.fname ? `${selected.user.fname} ${selected.user.lname || ''}`.trim() : 'Unknown'}
                                                <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                                                {selected.request_type?.replace('_', ' ') || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={selected.status} />
                                </div>

                                {isSPV && (selected.status || 'PENDING').toUpperCase() === 'PENDING' && (
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setIsApprovalModalOpen(true)}
                                            className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                        >
                                            Review to Approve / Reject
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 pt-5">
                                    <Field label="Asset #" value={selected.asset_num} mono />
                                    <Field label="Serial #" value={selected.serial_num} mono />
                                    <Field label="Site" value={siteLabel(selected.site_code)} />
                                    <Field label="Region" value={siteMap[selected.site_code] ? regionMap[String(siteMap[selected.site_code].region_id)] : null} />
                                    <Field label="SR Number" value={selected.sr_num} />
                                    <Field label="SR Date" value={selected.sr_date} />
                                    <Field label="Tracking Number" value={selected.tracking_num} mono />
                                    <Field label="Delivery Method" value={selected.delivery_method === 'courier' ? 'Courier' : selected.delivery_method === 'pickup' ? 'Personal Pickup' : selected.delivery_method} />
                                    <Field label="Delivered By" value={selected.delivered_by} />
                                    <Field label="Pickup Date" value={selected.pickup_date} />
                                    <Field label="Return Date" value={selected.return_date} />
                                    {selected.request_type?.toUpperCase() === 'RELOCATION' && (
                                        <Field label="Destination Site" value={siteLabel(selected.destination_site)} />
                                    )}
                                    <Field label="Submitted" value={formatDateTime(selected.created_at)} />
                                    {selected.approved_by && (
                                        <>
                                            <Field label={(selected.status || '').toUpperCase() === 'REJECTED' ? 'Rejected By' : 'Approved By'}
                                                value={userMap[selected.approved_by] || `User #${selected.approved_by}`} />
                                            <Field label="Decision At" value={formatDateTime(selected.approved_at)} />
                                        </>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Pull-Out Form</p>
                                        {attachmentUrlFor(selected) ? (
                                            <a href={attachmentUrlFor(selected)} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                                                <Icon d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L9 15" className="w-4 h-4" />
                                                Open File
                                            </a>
                                        ) : (
                                            <p className="text-sm text-gray-400 dark:text-gray-600">Not attached</p>
                                        )}
                                    </div>
                                </div>

                                {(selected.status || '').toUpperCase() === 'REJECTED' && selected.approval_remarks && (
                                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Rejection Reason</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.approval_remarks}</p>
                                    </div>
                                )}
                                {selected.remarks && (
                                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Remarks</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.remarks}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <RequestDetailModal
                request={selected}
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                userRole={role}
                onApprove={load}
                onReject={load}
                onCancel={load}
                onDelete={load}
                onUpdate={load}
            />
        </div>
    );
}

export default MasterfileRequestMonitoring;

// src/pages/masterfile/MasterfileRequestMonitoring.js
//
// SPV/ADM only. The Dashboard's "Pending Requests" card caps itself at 5 rows
// (see PENDING_CARD_LIMIT in MasterfileDashboard.js) and links here for the
// full picture -- every request in scope, not just PENDING ones, with SR
// Number/SR Date columns and an expandable row per request showing the full
// hardware + request detail (the same fields RequestDetailModal shows, laid
// out inline instead of in a modal since this page is built for scanning many
// rows at once).
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';

const PAGE_SIZE = 15;

const Icon = ({ d, className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

const Sk = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

const STATUS_STYLES = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    CANCELED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const StatusBadge = ({ status }) => {
    const s = (status || 'PENDING').toUpperCase();
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[s] || STATUS_STYLES.PENDING}`}>
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
    const [expandedId, setExpandedId] = useState(null);

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

        setRequests(reqRes?.requests || []);

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

    const formatDate = (d) => {
        if (!d) return '—';
        const date = new Date(d);
        if (isNaN(date.getTime())) return String(d);
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
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

    return (
        <div className="p-5 pb-16">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Request Monitoring</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Every hardware request in your scope — pull-outs and relocations, all statuses.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap gap-3 items-center shadow-sm">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELED">Canceled</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <option value="ALL">All Types</option>
                        <option value="PULL_OUT">Pull Out</option>
                        <option value="RELOCATION">Relocation</option>
                    </select>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search requester, hardware, asset #, tracking #, SR #..."
                        className="flex-1 min-w-[220px] px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    {!loading && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <Sk className="h-4 w-4 flex-shrink-0" />
                                    <Sk className="h-4 w-20" />
                                    <Sk className="h-4 flex-1" />
                                    <Sk className="h-4 w-20" />
                                    <Sk className="h-4 w-20" />
                                    <Sk className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : pageRows.length === 0 ? (
                        <div className="py-14 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                                <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">No requests match these filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                <thead className="bg-gray-50 dark:bg-gray-800/60">
                                    <tr>
                                        <th className="px-3 py-3 w-8"></th>
                                        {['Status', 'Requested By', 'Type', 'Hardware', 'SR Number', 'SR Date', 'Submitted'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                    {pageRows.map(req => {
                                        const isExpanded = expandedId === req.request_id;
                                        const region = siteMap[req.site_code] ? regionMap[String(siteMap[req.site_code].region_id)] : null;
                                        const approverName = req.approved_by ? (userMap[req.approved_by] || `User #${req.approved_by}`) : null;
                                        const hasAttachment = req.attachment_path && String(req.attachment_path).trim();
                                        const currentOrigin = window.location.origin;
                                        const isDevHost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
                                        const baseUrl = isDevHost ? 'http://omniops.local' : 'http://192.168.4.95:8888';
                                        const attachmentUrl = hasAttachment ? `${baseUrl}${req.attachment_path.trim()}` : null;

                                        return (
                                            <React.Fragment key={req.request_id}>
                                                <tr
                                                    onClick={() => setExpandedId(isExpanded ? null : req.request_id)}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-3 py-3.5 text-gray-400">
                                                        <Icon d="M9 5l7 7-7 7" className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </td>
                                                    <td className="px-4 py-3.5"><StatusBadge status={req.status} /></td>
                                                    <td className="px-4 py-3.5 text-sm text-gray-900 dark:text-gray-200 whitespace-nowrap">
                                                        {req.user?.fname ? `${req.user.fname} ${req.user.lname || ''}`.trim() : 'Unknown'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                        {req.request_type?.replace('_', ' ') || '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                                                        {[req.item_desc, req.hw_brand_name, req.hw_model].filter(Boolean).join(' ') || '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                        {req.sr_num || '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                        {req.sr_date || '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap"
                                                        title={req.created_at ? new Date(req.created_at).toLocaleString() : ''}>
                                                        {formatDate(req.created_at)}
                                                    </td>
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="bg-gray-50/60 dark:bg-gray-800/30">
                                                        <td colSpan={8} className="px-6 py-5">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                                                                <Field label="Asset #" value={req.asset_num} mono />
                                                                <Field label="Serial #" value={req.serial_num} mono />
                                                                <Field label="Site" value={siteLabel(req.site_code)} />
                                                                <Field label="Region" value={region} />
                                                                <Field label="Tracking Number" value={req.tracking_num} mono />
                                                                <Field label="Delivery Method" value={req.delivery_method === 'courier' ? 'Courier' : req.delivery_method === 'pickup' ? 'Personal Pickup' : req.delivery_method} />
                                                                <Field label="Delivered By" value={req.delivered_by} />
                                                                <Field label="Pickup Date" value={req.pickup_date} />
                                                                <Field label="Return Date" value={req.return_date} />
                                                                {req.request_type?.toUpperCase() === 'RELOCATION' && (
                                                                    <Field label="Destination Site" value={siteLabel(req.destination_site)} />
                                                                )}
                                                                <Field label="Submitted" value={formatDateTime(req.created_at)} />
                                                                {approverName && (
                                                                    <>
                                                                        <Field label={(req.status || '').toUpperCase() === 'REJECTED' ? 'Rejected By' : 'Approved By'} value={approverName} />
                                                                        <Field label="Decision At" value={formatDateTime(req.approved_at)} />
                                                                    </>
                                                                )}
                                                                <div>
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Pull-Out Form</p>
                                                                    {attachmentUrl ? (
                                                                        <a href={attachmentUrl} target="_blank" rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                                                                            <Icon d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L9 15" className="w-4 h-4" />
                                                                            Open File
                                                                        </a>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-400 dark:text-gray-600">Not attached</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {(req.status || '').toUpperCase() === 'REJECTED' && req.approval_remarks && (
                                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Rejection Reason</p>
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{req.approval_remarks}</p>
                                                                </div>
                                                            )}
                                                            {req.remarks && (
                                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Remarks</p>
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{req.remarks}</p>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filtered.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MasterfileRequestMonitoring;

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import RequestDetailModal from './components/RequestDetailModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const PLACEHOLDERS = new Set([
    'NOT_APPLICABLE', 'TAG_REMOVED_UNREADABLE', 'UNREADABLE_MISSING',
    'N/A', 'n/a', '', 'null', 'NULL',
]);
const validField = (v) => {
    const s = String(v ?? '').trim();
    return s && !PLACEHOLDERS.has(s) && !PLACEHOLDERS.has(s.toUpperCase());
};
const isOnSite = (h) =>
    ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase());

const isPulledOut = (h) =>
    ['pull out', 'pullout'].includes(String(h.hw_status || '').trim().toLowerCase());
const hasAcqDate = (h) => {
    const d = String(h.hw_date_acq || '').trim();
    return d && d.split('/').length === 3;
};

// ── Progress Ring ─────────────────────────────────────────────────────────────
const ProgressRing = ({ pct, size = 88, stroke = 8 }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.max(0, Math.min(pct, 100)) / 100) * circ;
    const col = pct >= 90 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444';
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
            style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
                className="stroke-gray-200 dark:stroke-gray-700" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
                stroke={col} strokeDasharray={String(circ)} strokeDashoffset={String(offset)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
    );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

// ── Accuracy Card ─────────────────────────────────────────────────────────────
const AccuracyCard = ({ title, icon, pct, loading, accentClass, children }) => {
    const ringLabel = pct >= 90
        ? 'text-emerald-600 dark:text-emerald-400'
        : pct >= 75
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-red-500 dark:text-red-400';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${accentClass}`}>
                {icon}
                {title}
            </span>
            <div className="flex items-center gap-4">
                {loading ? (
                    <Sk className="w-[88px] h-[88px] rounded-full flex-shrink-0" />
                ) : (
                    <div className="relative flex-shrink-0">
                        <ProgressRing pct={pct} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-base font-bold ${ringLabel}`}>{pct}%</span>
                        </div>
                    </div>
                )}
                <div className="flex-1 space-y-1.5 min-w-0">
                    {loading ? (
                        <>
                            <Sk className="h-3.5 w-3/4" />
                            <Sk className="h-3.5 w-2/3" />
                            <Sk className="h-3.5 w-1/2" />
                        </>
                    ) : children}
                </div>
            </div>
        </div>
    );
};

const Stat = ({ label, value, color = 'text-gray-700 dark:text-gray-200' }) => (
    <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 dark:text-gray-500">{label}</span>
        <span className={`font-semibold ${color}`}>{value}</span>
    </div>
);

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-3.5 h-3.5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────
function MasterfileDashboard() {
    const [hardware, setHardware] = useState([]);
    const [sites, setSites] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [requests, setRequests] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [requestLoading, setRequestLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const { fetchMany, fetchData } = useApi();
    const fetchManyRef = useRef(fetchMany);
    const fetchDataRef = useRef(fetchData);
    useEffect(() => { fetchManyRef.current = fetchMany; fetchDataRef.current = fetchData; });

    const didLoad = useRef(false);

    const user = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
    const role = (user.user_type || 'FSE').toString().trim().toUpperCase();
    const userId = user.id || user.user_id;
    const isADM = ['ADM', 'ADMIN', 'ADMINISTRATOR'].includes(role);
    const isSPV = ['SPV', 'SUPERVISOR'].includes(role);
    const isFSE = role === 'FSE';

    const assignedRegionIds = useMemo(() => {
        if (!user.region_assigned) return [];
        return user.region_assigned.split(',').map(s => s.trim()).filter(Boolean);
    }, [user.region_assigned]);

    // ── Initial data load ─────────────────────────────────────────────────────
    useEffect(() => {
        if (didLoad.current) return;
        didLoad.current = true;

        const load = async () => {
            const results = await fetchManyRef.current(
                '/api/hw-tbl.json',
                '/api/site-list-tbl.json',
                '/api/request-tbl.json'
            );
            if (!results) { setDataLoading(false); return; }

            const [hwData, sitesData, reqData] = results;
            let hw = hwData?.hwTbl || [];
            let sitesAll = sitesData?.siteListTbl || [];
            const reqAll = reqData?.requests || [];

            if (isFSE && assignedRegionIds.length > 0) {
                const regionSet = new Set(assignedRegionIds);
                sitesAll = sitesAll.filter(s => regionSet.has(String(s.region_id)));
                const siteSet = new Set(sitesAll.map(s => s.site_code));
                hw = hw.filter(h => siteSet.has(String(h.site_code || '').trim()));
            }

            setHardware(hw);
            setSites(sitesAll);
            setAllRequests(reqAll);
            setDataLoading(false);
        };

        load();
    }, [isFSE, assignedRegionIds]);

    // ── Role-filtered requests for table ──────────────────────────────────────
    const loadRequests = useCallback(async () => {
        setRequestLoading(true);
        try {
            let query = '';
            if (isFSE) query = `?requested_by=${userId}`;
            else if (isSPV) query = `?status=PENDING&cluster_name=${encodeURIComponent(user.cluster_name || '')}`;
            else if (isADM) query = '?status=PENDING';

            const res = await fetchDataRef.current(`/api/request-tbl.json${query}`);
            let list = res?.requests || [];
            if (isFSE) list = list.filter(r => r.status?.toUpperCase() !== 'CANCELED');
            setRequests(list);
        } finally {
            setRequestLoading(false);
        }
    }, [isFSE, isSPV, isADM, userId, user.cluster_name]);

    useEffect(() => { loadRequests(); }, [loadRequests]);

    // ── Computed accuracy metrics ─────────────────────────────────────────────
    const onSite = useMemo(() => hardware.filter(isOnSite), [hardware]);

    const inventoryAccuracy = useMemo(() => {
        const total = onSite.length;
        if (!total) return { pct: 0, total: 0, complete: 0, incomplete: 0 };
        const complete = onSite.filter(h =>
            validField(h.hw_asset_num) &&
            validField(h.hw_serial_num) &&
            validField(h.hw_brand_name) &&
            validField(h.hw_model)
        ).length;
        return { pct: Math.round((complete / total) * 100), total, complete, incomplete: total - complete };
    }, [onSite]);

    const managementAccuracy = useMemo(() => {
        const total = onSite.length;
        if (!total) return { pct: 0, total: 0, complete: 0, incomplete: 0, withDate: 0, missing: 0 };
        // Configuration completeness across the key management fields — not just the
        // acquisition date. The percentage is the share of filled cells across all
        // tracked fields, so partially-configured records still move the needle
        // instead of the card being pinned to the acq-date coverage alone.
        const MGMT_FIELDS = ['os_type', 'hw_host_name', 'hw_ip_add', 'hw_mac_add', 'hw_memory', 'hdd_capacity', 'hw_date_acq'];
        let filledCells = 0;
        let completeRecords = 0;
        onSite.forEach(h => {
            const filled = MGMT_FIELDS.filter(f => validField(h[f])).length;
            filledCells += filled;
            if (filled === MGMT_FIELDS.length) completeRecords++;
        });
        const withDate = onSite.filter(hasAcqDate).length;
        return {
            pct: Math.round((filledCells / (total * MGMT_FIELDS.length)) * 100),
            total,
            complete: completeRecords,
            incomplete: total - completeRecords,
            withDate,
            missing: total - withDate,
        };
    }, [onSite]);

    const directoryAccuracy = useMemo(() => {
        const total = sites.length;
        if (!total) return { pct: 0, total: 0, complete: 0, incomplete: 0 };
        const complete = sites.filter(s =>
            String(s.address || '').trim() &&
            String(s.office_type || '').trim() &&
            String(s.trxn_catered || '').trim()
        ).length;
        return { pct: Math.round((complete / total) * 100), total, complete, incomplete: total - complete };
    }, [sites]);

    const requestMetrics = useMemo(() => {
        const total = allRequests.length;
        if (!total) return { pct: 0, total: 0, pending: 0, approved: 0, rejected: 0 };
        const byStatus = (s) => allRequests.filter(r => r.status?.toUpperCase() === s).length;
        const pending = byStatus('PENDING');
        const approved = byStatus('APPROVED');
        const rejected = byStatus('REJECTED');
        const canceled = byStatus('CANCELED');
        return {
            pct: Math.round(((approved + rejected + canceled) / total) * 100),
            total, pending, approved, rejected,
        };
    }, [allRequests]);

    // ── Pull-out hardware metrics ─────────────────────────────────────────────
    const pullOutMetrics = useMemo(() => {
        const pulled = hardware.filter(isPulledOut);
        const total = pulled.length;
        if (!total) return { pct: 0, total: 0, withAttachment: 0, withRequest: 0, noRequest: 0, recent: [] };

        // Index all PULL_OUT requests by hw_id for fast lookup
        const reqByHwId = new Map();
        allRequests
            .filter(r => r.request_type?.toUpperCase() === 'PULL_OUT' && r.hw_id)
            .forEach(r => {
                const key = String(r.hw_id);
                if (!reqByHwId.has(key)) reqByHwId.set(key, []);
                reqByHwId.get(key).push(r);
            });

        let withRequest = 0;
        let withAttachment = 0;

        pulled.forEach(h => {
            const reqs = reqByHwId.get(String(h.hw_id)) || [];
            if (reqs.length > 0) {
                withRequest++;
                if (reqs.some(r => r.attachment_path && String(r.attachment_path).trim())) {
                    withAttachment++;
                }
            }
        });

        const noRequest = total - withRequest;

        // Recent PULL_OUT requests (last 6, sorted newest-first)
        const recent = allRequests
            .filter(r => r.request_type?.toUpperCase() === 'PULL_OUT')
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 6);

        return {
            pct: Math.round((withAttachment / total) * 100),
            total,
            withAttachment,
            withRequest,
            noRequest,
            recent,
        };
    }, [hardware, allRequests]);

    // ── System health ─────────────────────────────────────────────────────────
    const health = useMemo(() => {
        if (dataLoading) return null;
        const avg = (inventoryAccuracy.pct + managementAccuracy.pct + directoryAccuracy.pct) / 3;
        if (avg >= 90) return { label: 'All systems healthy', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
        if (avg >= 75) return { label: 'Needs some attention', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
        return { label: 'Action required', dot: 'bg-red-500', text: 'text-red-500 dark:text-red-400' };
    }, [dataLoading, inventoryAccuracy, managementAccuracy, directoryAccuracy]);

    // ── AI welcome message ────────────────────────────────────────────────────
    const aiMessage = useMemo(() => {
        if (dataLoading) return '';
        const inv = inventoryAccuracy;
        const mgmt = managementAccuracy;
        const dir = directoryAccuracy;
        const req = requestMetrics;

        if (isFSE) {
            const scope = assignedRegionIds.length > 1
                ? `your ${assignedRegionIds.length} assigned regions`
                : 'your region';
            if (inv.pct >= 90 && mgmt.pct >= 85) {
                return `I've reviewed ${scope} and everything's in solid shape — records are well-maintained and aging data looks complete.${req.pending > 0 ? ` You have ${req.pending} open request${req.pending > 1 ? 's' : ''} I'm tracking for you.` : ' No open requests right now — clean queue!'}`;
            }
            if (inv.pct < 75) {
                return `Heads up — I'm seeing ${inv.incomplete} on-site asset${inv.incomplete !== 1 ? 's' : ''} in ${scope} with incomplete profiles. Missing asset tags or serial numbers make tracking harder across sites. Worth cleaning up when you can.`;
            }
            return `${scope.charAt(0).toUpperCase() + scope.slice(1)} looks mostly healthy.${mgmt.missing > 0 ? ` ${mgmt.missing} asset${mgmt.missing !== 1 ? 's are' : ' is'} missing acquisition dates, which affects aging accuracy.` : ''}${req.pending > 0 ? ` You have ${req.pending} pending request${req.pending !== 1 ? 's' : ''}.` : ''}`.trim();
        }

        if (isSPV) {
            const cluster = user.cluster_name || 'your cluster';
            const pending = requests.length;
            if (pending > 0) {
                return `I'm watching ${cluster} — there ${pending === 1 ? 'is' : 'are'} ${pending} hardware request${pending !== 1 ? 's' : ''} waiting on your review. Inventory accuracy sits at ${inv.pct}%${inv.pct >= 90 ? ', which looks good' : ' — a few records could use attention'}.`;
            }
            return `${cluster} is running smoothly — no pending approvals at the moment. Inventory is at ${inv.pct}% accuracy and ${dir.complete} of ${dir.total} sites have complete directory records.`;
        }

        if (isADM) {
            const issues = [];
            if (inv.pct < 90) issues.push(`inventory completeness at ${inv.pct}%`);
            if (dir.pct < 90) issues.push(`${dir.incomplete} site${dir.incomplete !== 1 ? 's' : ''} with incomplete directory info`);
            if (req.pending > 0) issues.push(`${req.pending} pending request${req.pending !== 1 ? 's' : ''} awaiting action`);
            if (issues.length === 0) {
                return `I've reviewed all clusters — everything looks solid. Inventory records, aging data, and the site directory are all in good health. I'll keep monitoring and flag anything that changes.`;
            }
            return `I'm tracking a few things across all clusters: ${issues.join('; ')}. No critical system alerts, but these are worth a closer look.`;
        }

        return `System overview looks healthy. I'll flag anything that needs your attention.`;
    }, [dataLoading, inventoryAccuracy, managementAccuracy, directoryAccuracy, requestMetrics,
        isFSE, isSPV, isADM, assignedRegionIds, user.cluster_name, requests]);

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    }, []);

    // ── Request table helpers ─────────────────────────────────────────────────
    const formatRelTime = (dateStr) => {
        if (!dateStr) return '—';
        const diff = Date.now() - new Date(dateStr).getTime();
        const min = Math.floor(diff / 60000);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
        if (min < 1) return 'just now';
        if (min < 60) return `${min}m ago`;
        if (hr < 24) return `${hr}h ago`;
        if (day === 1) return 'yesterday';
        if (day < 7) return `${day}d ago`;
        return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const statusBadge = (req) => {
        const s = req.status?.toUpperCase() || 'PENDING';
        const map = {
            APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
            REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
            CANCELED: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-300',
        };
        if (map[s]) {
            return (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[s]}`}
                    title={s === 'REJECTED' ? req.approval_remarks || '' : undefined}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                </span>
            );
        }
        const type = req.request_type?.toUpperCase() || '';
        if (type === 'PULL_OUT') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">In Transit</span>;
        if (type === 'RELOCATION') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">Transfer</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">Pending</span>;
    };

    const toggleSelect = (id, e, status) => {
        e.stopPropagation();
        if (isFSE && status?.toUpperCase() === 'APPROVED') return;
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length > 0) { setSelectedIds([]); return; }
        setSelectedIds(
            isFSE
                ? requests.filter(r => r.status?.toUpperCase() === 'REJECTED').map(r => r.request_id)
                : requests.map(r => r.request_id)
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-5 pb-16">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Welcome Hero */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/50 dark:via-purple-950/40 dark:to-blue-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                {greeting}, {user.fname || 'User'}!
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Signed in as{' '}
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">{role}</span>
                                {' '}· @{user.user_name}
                                {user.cluster_name ? ` · ${user.cluster_name}` : ''}
                            </p>
                        </div>
                        {health && (
                            <div className="flex items-center gap-2 self-start sm:self-center bg-white/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 shadow-sm">
                                <span className={`w-2 h-2 rounded-full ${health.dot} animate-pulse`} />
                                <span className={`text-xs font-medium ${health.text}`}>{health.label}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mt-0.5">
                            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            {dataLoading ? (
                                <div className="space-y-2">
                                    <Sk className="h-4 w-full max-w-lg" />
                                    <Sk className="h-4 w-4/5 max-w-md" />
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {aiMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Accuracy Reports */}
                <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                        Accuracy Reports
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                        <AccuracyCard
                            title="Hardware Inventory"
                            pct={inventoryAccuracy.pct}
                            loading={dataLoading}
                            accentClass="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            icon={<Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                        >
                            <Stat label="On-site assets" value={inventoryAccuracy.total.toLocaleString()} />
                            <Stat label="Fully profiled" value={inventoryAccuracy.complete.toLocaleString()} color="text-emerald-600 dark:text-emerald-400" />
                            <Stat label="Missing data" value={inventoryAccuracy.incomplete.toLocaleString()}
                                color={inventoryAccuracy.incomplete > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500'} />
                        </AccuracyCard>

                        <AccuracyCard
                            title="Hardware Management"
                            pct={managementAccuracy.pct}
                            loading={dataLoading}
                            accentClass="bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                            icon={<Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                        >
                            <Stat label="On-site assets" value={managementAccuracy.total.toLocaleString()} />
                            <Stat label="Fully configured" value={managementAccuracy.complete.toLocaleString()} color="text-emerald-600 dark:text-emerald-400" />
                            <Stat label="Needs config" value={managementAccuracy.incomplete.toLocaleString()}
                                color={managementAccuracy.incomplete > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-gray-500'} />
                        </AccuracyCard>

                        <AccuracyCard
                            title="Directory"
                            pct={directoryAccuracy.pct}
                            loading={dataLoading}
                            accentClass="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            icon={<Icon d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />}
                        >
                            <Stat label="Total sites" value={directoryAccuracy.total.toLocaleString()} />
                            <Stat label="Complete records" value={directoryAccuracy.complete.toLocaleString()} color="text-emerald-600 dark:text-emerald-400" />
                            <Stat label="Incomplete" value={directoryAccuracy.incomplete.toLocaleString()}
                                color={directoryAccuracy.incomplete > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-gray-500'} />
                        </AccuracyCard>

                        <AccuracyCard
                            title="Request Monitoring"
                            pct={requestMetrics.pct}
                            loading={dataLoading}
                            accentClass="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            icon={<Icon d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />}
                        >
                            <Stat label="Total requests" value={requestMetrics.total.toLocaleString()} />
                            <Stat label="Approved" value={requestMetrics.approved.toLocaleString()} color="text-emerald-600 dark:text-emerald-400" />
                            <Stat label="Pending" value={requestMetrics.pending.toLocaleString()}
                                color={requestMetrics.pending > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-gray-500'} />
                        </AccuracyCard>
                    </div>
                </div>

                {/* Pulled Out Hardware */}
                <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                        Pulled Out Equipment
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Pull-out summary card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                {/* Ring */}
                                <div className="flex-shrink-0">
                                    {dataLoading ? (
                                        <Sk className="w-[88px] h-[88px] rounded-full" />
                                    ) : (
                                        <div className="relative">
                                            <ProgressRing pct={pullOutMetrics.pct} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-base font-bold ${pullOutMetrics.pct >= 90 ? 'text-emerald-600 dark:text-emerald-400' : pullOutMetrics.pct >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {pullOutMetrics.pct}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                                            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            Pull-Out Summary
                                        </span>
                                    </div>
                                    {dataLoading ? (
                                        <div className="space-y-1.5">
                                            <Sk className="h-3.5 w-3/4" />
                                            <Sk className="h-3.5 w-2/3" />
                                            <Sk className="h-3.5 w-1/2" />
                                            <Sk className="h-3.5 w-3/5" />
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <Stat label="Total pulled out" value={pullOutMetrics.total.toLocaleString()} />
                                            <Stat label="Has pull-out request" value={pullOutMetrics.withRequest.toLocaleString()} color="text-blue-600 dark:text-blue-400" />
                                            <Stat label="With attached form" value={pullOutMetrics.withAttachment.toLocaleString()} color="text-emerald-600 dark:text-emerald-400" />
                                            <Stat label="No documentation" value={pullOutMetrics.noRequest.toLocaleString()}
                                                color={pullOutMetrics.noRequest > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500'} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documentation coverage bar */}
                            {!dataLoading && pullOutMetrics.total > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                                        <span>Documentation coverage</span>
                                        <span className="font-medium">{pullOutMetrics.withAttachment} / {pullOutMetrics.total}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${pullOutMetrics.pct}%`,
                                                backgroundColor: pullOutMetrics.pct >= 90 ? '#10b981' : pullOutMetrics.pct >= 75 ? '#f59e0b' : '#ef4444',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent pull-out requests */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                                Recent Pull-Out Requests
                            </p>
                            {dataLoading ? (
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Sk className="w-7 h-7 rounded-lg flex-shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <Sk className="h-3 w-3/4" />
                                                <Sk className="h-3 w-1/2" />
                                            </div>
                                            <Sk className="h-5 w-16 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : pullOutMetrics.recent.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                                        <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">No pull-out requests yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {pullOutMetrics.recent.map((req, i) => {
                                        const hasFile = req.attachment_path && String(req.attachment_path).trim();
                                        const reqStatus = req.status?.toUpperCase() || 'PENDING';
                                        const statusColors = {
                                            APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                                            REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                                            PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                                            CANCELED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                                        };
                                        return (
                                            <div key={req.request_id || i}
                                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                                                onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }}>
                                                {/* File indicator */}
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${hasFile ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                    <Icon
                                                        d={hasFile
                                                            ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            : "M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.75L13.75 4a2 2 0 00-3.5 0l-6.25 11.25A2 2 0 005.07 19z"}
                                                        className={`w-4 h-4 ${hasFile ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}
                                                    />
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                                        {[req.item_desc, req.hw_brand_name, req.hw_model].filter(Boolean).join(' ') || 'Unknown hardware'}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                        {req.site_code || '—'} · {formatRelTime(req.created_at)}
                                                    </p>
                                                </div>
                                                {/* Status badge */}
                                                <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[reqStatus] || statusColors.PENDING}`}>
                                                    {reqStatus.charAt(0) + reqStatus.slice(1).toLowerCase()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'On-Site Assets',
                            value: onSite.length,
                            color: 'text-blue-600 dark:text-blue-400',
                            icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10',
                        },
                        {
                            label: 'Active Sites',
                            value: sites.length,
                            color: 'text-indigo-600 dark:text-indigo-400',
                            icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
                        },
                        {
                            label: 'Pending Requests',
                            value: requestMetrics.pending,
                            color: requestMetrics.pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400',
                            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                        },
                        {
                            label: 'Approved Requests',
                            value: requestMetrics.approved,
                            color: 'text-emerald-600 dark:text-emerald-400',
                            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                        },
                    ].map(({ label, value, color, icon }) => (
                        <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex items-center gap-3">
                            {dataLoading ? (
                                <div className="flex-1 space-y-2">
                                    <Sk className="h-6 w-16" />
                                    <Sk className="h-3 w-24" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{label}</p>
                                    </div>
                                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
                                        <Icon d={icon} className={`w-5 h-5 ${color}`} />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Requests Table */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-3 justify-between items-center">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {isFSE ? 'My Hardware Requests' : 'Pending Requests'}
                            </h3>
                            {!requestLoading && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {requests.length} {requests.length === 1 ? 'record' : 'records'}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {isFSE && selectedIds.length > 0 && (
                                <>
                                    {requests.some(r => selectedIds.includes(r.request_id) && r.status?.toUpperCase() === 'PENDING') && (
                                        <button onClick={() => alert(`Cancelling ${selectedIds.length} request(s)`)}
                                            className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                                            Cancel ({selectedIds.length})
                                        </button>
                                    )}
                                    {requests.some(r => selectedIds.includes(r.request_id) && r.status?.toUpperCase() === 'REJECTED') && (
                                        <button onClick={() => { if (window.confirm(`Delete ${selectedIds.length} rejected request(s)?`)) { setSelectedIds([]); loadRequests(); } }}
                                            className="px-3 py-1.5 text-sm font-medium bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors">
                                            Delete ({selectedIds.length})
                                        </button>
                                    )}
                                </>
                            )}
                            {isSPV && selectedIds.length > 0 && (
                                <button onClick={() => alert(`Approving ${selectedIds.length} request(s)`)}
                                    className="px-3 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                                    Approve ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {requestLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <Sk className="h-4 w-4 flex-shrink-0" />
                                    <Sk className="h-4 w-20" />
                                    <Sk className="h-4 flex-1" />
                                    <Sk className="h-4 w-24" />
                                    <Sk className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-14 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                                <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isFSE ? 'No active requests' : 'No pending requests right now'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                <thead className="bg-gray-50 dark:bg-gray-800/60">
                                    <tr>
                                        <th className="px-5 py-3 w-10">
                                            <input type="checkbox" checked={selectedIds.length > 0}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                        </th>
                                        {['Status', 'Requested By', 'Type', 'Hardware', 'Submitted'].map(h => (
                                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                                    {requests.map(req => {
                                        const selectable = !isFSE || req.status?.toUpperCase() === 'REJECTED';
                                        return (
                                            <tr key={req.request_id}
                                                onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors">
                                                <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                                                    <input type="checkbox"
                                                        checked={selectedIds.includes(req.request_id)}
                                                        onChange={e => toggleSelect(req.request_id, e, req.status)}
                                                        disabled={!selectable}
                                                        className={`h-4 w-4 text-indigo-600 border-gray-300 rounded ${!selectable ? 'opacity-40 cursor-not-allowed' : ''}`} />
                                                </td>
                                                <td className="px-5 py-3.5">{statusBadge(req)}</td>
                                                <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-gray-200 whitespace-nowrap">
                                                    {req.user?.fname ? `${req.user.fname} ${req.user.lname || ''}`.trim() : 'Unknown'}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                    {req.request_type?.replace('_', ' ') || '—'}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300 max-w-[180px] truncate">
                                                    {[req.item_desc, req.hw_brand_name, req.hw_model].filter(Boolean).join(' ') || '—'}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap"
                                                    title={req.created_at ? new Date(req.created_at).toLocaleString() : ''}>
                                                    {formatRelTime(req.created_at)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600 pt-2">
                    FSE Masterfile — Hardware Inventory &amp; Site Monitoring
                </p>
            </div>

            <RequestDetailModal
                request={selectedRequest}
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedRequest(null); }}
                userRole={role}
                onApprove={loadRequests}
                onReject={loadRequests}
                onCancel={loadRequests}
                onDelete={loadRequests}
            />
        </div>
    );
}

export default MasterfileDashboard;

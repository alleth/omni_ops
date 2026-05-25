// src/pages/masterfile/MasterfileHardwareManagement.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { useApi } from '../../hooks/useApi';

const getModalRoot = () =>
    document.getElementById('modal-root') || (() => {
        const el = document.createElement('div');
        el.id = 'modal-root';
        document.body.appendChild(el);
        return el;
    })();

// ─── Category matchers ────────────────────────────────────────────────────────
function isCpuCategory(itemDesc) {
    const d = (itemDesc || '').toLowerCase();
    if (d.includes('server')) return false;
    return d.includes('cpu') || d.includes('desktop') || d.includes('laptop') || d.includes('workstation');
}

function isServerCategory(itemDesc) {
    const d = (itemDesc || '').toLowerCase();
    if (d.includes('ups')) return false;
    return d.includes('server');
}

function isSwitchCategory(itemDesc) {
    return (itemDesc || '').toLowerCase().includes('switch');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeAge(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return null;
    const [m, d, y] = parts;
    const year = y.length === 2 ? (parseInt(y) > 50 ? 1900 + parseInt(y) : 2000 + parseInt(y)) : parseInt(y);
    const date = new Date(year, parseInt(m) - 1, parseInt(d));
    if (isNaN(date.getTime())) return null;
    const diffMs = Date.now() - date.getTime();
    return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

function formatAge(yrs) {
    if (yrs === null) return '—';
    if (yrs < 1) return `${Math.round(yrs * 12)} mo`;
    return `${yrs.toFixed(1)} yr`;
}

function ageColor(yrs) {
    if (yrs === null) return 'text-gray-400 dark:text-gray-500';
    if (yrs >= 10) return 'text-red-500 dark:text-red-400';
    if (yrs >= 5)  return 'text-amber-500 dark:text-amber-400';
    if (yrs >= 3)  return 'text-lime-600 dark:text-lime-400';
    return 'text-emerald-600 dark:text-emerald-400';
}

function parseStorageGB(str) {
    if (!str) return null;
    const match = str.replace(/,/g, '').match(/^([\d.]+)\s*(TB|GB|MB)?/i);
    if (!match) return null;
    const val = parseFloat(match[1]);
    const unit = (match[2] || 'GB').toUpperCase();
    if (unit === 'TB') return val * 1024;
    if (unit === 'MB') return val / 1024;
    return val;
}

function hddHealthBadge(capacity, freeSpace) {
    const cap  = parseStorageGB(capacity);
    const free = parseStorageGB(freeSpace);
    if (!cap || cap <= 0 || free === null) return { label: '—', cls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' };
    const pct = Math.round(((cap - free) / cap) * 100);
    if (pct >= 90) return { label: `${pct}%`, cls: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' };
    if (pct >= 75) return { label: `${pct}%`, cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' };
    return { label: `${pct}%`, cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' };
}

function isValidIp(val) {
    const v = (val || '').trim();
    if (!v || v === '0.0.0.0') return false;
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return false;
    return v.split('.').every(n => parseInt(n, 10) <= 255);
}

function isValidMac(val) {
    const v = (val || '').trim();
    return /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/.test(v);
}

function isFieldFilled(key, val) {
    if (val === null || val === undefined) return false;
    const s = String(val).trim();
    if (s === '' || s === '0') return false;
    if (key === 'hw_ip_add')  return isValidIp(s);
    if (key === 'hw_mac_add') return isValidMac(s);
    if (key === 'dotnet')     return DOTNET_OPTIONS.includes(s);
    if (key === 'core_buid')  return s.split(',').map(v => v.trim()).some(v => CORE_BUILD_OPTIONS.includes(v));
    return true;
}

function installedFacilities(row) {
    const yes = v => v === '1' || v === 1 || v === true;
    const out = [];
    if (yes(row.rsu_fac))  out.push('RSU-FAC');
    if (yes(row.mv_dto))   out.push('MV-DTO');
    if (yes(row.mv_maint)) out.push('MV-MAINT');
    if (yes(row.ims_aiu))  out.push('IMS-AIU');
    if (yes(row.dl_dto))   out.push('DL-DTO');
    if (yes(row.dl_maint)) out.push('DL-MAINT');
    return out;
}

// ─── Shared styles ─────────────────────────────────────────────────────────
const inputCls   = 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all';
const selectCls  = `${inputCls} appearance-none pr-8`;
const sectionHdr = 'text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 mt-1';
const labelCls   = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';
const roValCls   = 'py-1 text-sm text-gray-800 dark:text-gray-100';

// ─── CPU sub-view options ─────────────────────────────────────────────────────
const CPU_VIEWS = [
    { value: 'os_antivirus',    label: 'OS Type & Antivirus' },
    { value: 'core_facilities', label: 'Core Build & Facilities' },
    { value: 'hostname_ip_mac', label: 'Hostname, IP & MAC' },
    { value: 'workstep_user',   label: 'Workstep & User Assignment' },
    { value: 'hdd_age',         label: 'HDD Health & Age' },
];

// ─── Config completeness fields — scoped per CPU sub-view ─────────────────────
const CPU_VIEW_FIELDS = {
    os_antivirus:    [
        { key: 'os_type',   label: 'OS Type' },
        { key: 'hw_antivi', label: 'Antivirus' },
        { key: 'dotnet',    label: '.NET' },
    ],
    core_facilities: [
        { key: 'core_buid', label: 'Core Build' },
        { key: 'rsu_fac',   label: 'RSU-FAC',   perSite: true },
        { key: 'mv_dto',    label: 'MV-DTO',     perSite: true },
        { key: 'mv_maint',  label: 'MV-MAINT',   perSite: true },
        { key: 'ims_aiu',   label: 'IMS-AIU',    perSite: true },
        { key: 'dl_dto',    label: 'DL-DTO',     perSite: true },
        { key: 'dl_maint',  label: 'DL-MAINT',   perSite: true },
    ],
    hostname_ip_mac: [
        { key: 'hw_host_name', label: 'Hostname' },
        { key: 'hw_ip_add',    label: 'IP Address' },
        { key: 'hw_mac_add',   label: 'MAC Address' },
    ],
    workstep_user:   [
        { key: 'hw_user_name',    label: 'Assigned User' },
        { key: 'hw_primary_role', label: 'Primary Role' },
    ],
    hdd_age:         [
        { key: 'hw_memory',      label: 'Memory' },
        { key: 'hdd_capacity',   label: 'HDD Capacity' },
        { key: 'hdd_free_space', label: 'Free Space' },
        { key: 'hdd_health',     label: 'HDD Health' },
        { key: 'hw_date_acq',    label: 'Acq. Date' },
    ],
};

// ─── Server sub-view options ──────────────────────────────────────────────────
const SERVER_VIEWS = [
    { value: 'os_av_net',       label: 'OS Type, Antivirus & .NET' },
    { value: 'hostname_ip_mac', label: 'Hostname, IP & MAC' },
    { value: 'mem_hdd',         label: 'Memory, HDD Health & Age' },
];

// ─── Config completeness fields — SERVER (scoped per sub-view) and SWITCH ─────
const SERVER_VIEW_FIELDS = {
    os_av_net: [
        { key: 'os_type',   label: 'OS Type' },
        { key: 'hw_antivi', label: 'Antivirus' },
        { key: 'dotnet',    label: '.NET' },
    ],
    hostname_ip_mac: [
        { key: 'hw_host_name', label: 'Hostname' },
        { key: 'hw_ip_add',    label: 'IP Address' },
        { key: 'hw_mac_add',   label: 'MAC Address' },
    ],
    mem_hdd: [
        { key: 'hw_memory',      label: 'Memory' },
        { key: 'hdd_capacity',   label: 'HDD Capacity' },
        { key: 'hdd_free_space', label: 'Free Space' },
    ],
};

const SERVER_VIEW_SAVE_FIELDS = {
    os_av_net:       ['os_type', 'hw_antivi', 'dotnet'],
    hostname_ip_mac: ['hw_host_name', 'hw_ip_add', 'hw_mac_add'],
    mem_hdd:         ['hw_date_acq', 'hw_acq_val', 'hw_memory', 'hdd_capacity', 'hdd_free_space'],
};

const CONFIG_FIELDS = {
    SWITCH: [
        { key: 'hw_ip_add',     label: 'IP Address' },
        { key: 'hw_host_name',  label: 'Hostname' },
        { key: 'ports_working', label: 'Working Ports' },
        { key: 'ports_deffect', label: 'Defective Ports' },
    ],
};

// Fields sent to the API per CPU sub-view — prevents empty non-visible fields from
// triggering CakePHP _empty validation errors
const CPU_VIEW_SAVE_FIELDS = {
    os_antivirus:    ['os_type', 'hw_antivi', 'dotnet'],
    core_facilities: ['core_buid', 'rsu_fac', 'mv_dto', 'mv_maint', 'ims_aiu', 'dl_dto', 'dl_maint'],
    hostname_ip_mac: ['hw_host_name', 'hw_ip_add', 'hw_mac_add'],
    workstep_user:   ['hw_user_name', 'hw_primary_role'],
    hdd_age:         ['hw_date_acq', 'hw_acq_val', 'hw_memory', 'hdd_capacity', 'hdd_free_space', 'hdd_health'],
};

const ANTIVIRUS_OPTIONS  = ['eScan', 'Trend Micro', 'Kaspersky', 'Norton', 'McAfee', 'Avast', 'Windows Defender', 'ESET', 'Symantec', 'None'];
const CORE_BUILD_OPTIONS = ['OR/CR', 'DL DEMERIT'];

// Boolean DB columns — send '0'/'1', never omit them
const BOOL_SAVE_FIELDS  = new Set(['rsu_fac', 'mv_dto', 'mv_maint', 'ims_aiu', 'dl_dto', 'dl_maint']);
const DOTNET_OPTIONS    = ['v2.0', 'v3.5', 'v4.0', 'v4.5', 'v4.6', 'v4.6.1', 'v4.7', 'v4.7.1', 'v4.7.2', 'v4.8', 'v4.8.1', 'Not Installed'];
const OS_TYPE_OPTIONS        = ['Windows XP', 'Windows 7', 'Windows 10 32-Bit', 'Windows 10 64-Bit', 'Windows 11'];
const OS_SERVER_TYPE_OPTIONS = ['Windows Server 2003', 'Windows Server 2008', 'Windows Server 2008 R2', 'Windows Server 2012', 'Windows Server 2012 R2', 'Windows Server 2016', 'Windows Server 2019', 'Windows Server 2022', 'Windows Server 2025'];
const WORKSTEP_OPTIONS  = ['Evaluator', 'Data Encoder', 'PhotoSig', 'InputClerk', 'Approving Officer', 'Hearing Officer', 'Cashier', 'Releasing'];
const MEMORY_OPTIONS     = ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB', '48GB', '64GB', '128GB', '256GB'];
const HDD_CAP_OPTIONS    = ['120GB', '128GB', '160GB', '240GB', '256GB', '320GB', '500GB', '512GB', '1TB', '2TB', '4TB', '8TB'];

function ConfigCompletionCard({ rows, category, cpuView, serverView }) {
    const fields = category === 'CPU'
        ? (CPU_VIEW_FIELDS[cpuView]    || CPU_VIEW_FIELDS.os_antivirus)
        : category === 'SERVER'
        ? (SERVER_VIEW_FIELDS[serverView] || SERVER_VIEW_FIELDS.os_av_net)
        : CONFIG_FIELDS[category];

    if (!fields || rows.length === 0) return null;

    const unitTotal = rows.length;
    const sites     = [...new Set(rows.map(r => r.site_code).filter(Boolean))];
    const siteTotal = sites.length;
    const hasPerSite = fields.some(f => f.perSite);

    const fieldStats = fields.map(f => {
        if (f.perSite) {
            const filled = sites.filter(site =>
                rows.some(r => r.site_code === site && isFieldFilled(f.key, r[f.key]))
            ).length;
            return { ...f, filled, total: siteTotal, pct: siteTotal > 0 ? Math.round((filled / siteTotal) * 100) : 0, unit: 'sites' };
        }
        const filled = rows.filter(r => isFieldFilled(f.key, r[f.key])).length;
        return { ...f, filled, total: unitTotal, pct: Math.round((filled / unitTotal) * 100), unit: 'units' };
    });
    const overallPct = Math.round(fieldStats.reduce((s, f) => s + f.pct, 0) / fieldStats.length);

    const pctColor = pct =>
        pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
        pct >= 50 ? 'text-amber-500 dark:text-amber-400' :
                    'text-red-500 dark:text-red-400';

    const barColor = pct =>
        pct >= 80 ? 'bg-emerald-500' :
        pct >= 50 ? 'bg-amber-500' :
                    'bg-red-500';

    const ringColor =
        overallPct >= 80 ? 'ring-emerald-200 dark:ring-emerald-800/40' :
        overallPct >= 50 ? 'ring-amber-200 dark:ring-amber-800/40' :
                           'ring-red-200 dark:ring-red-800/40';

    const viewLabel = category === 'CPU'
        ? CPU_VIEWS.find(v => v.value === cpuView)?.label
        : category === 'SERVER'
        ? SERVER_VIEWS.find(v => v.value === serverView)?.label
        : null;

    return (
        <div className={`border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 p-4 ring-1 ${ringColor}`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Configuration Completeness</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {unitTotal.toLocaleString()} unit{unitTotal !== 1 ? 's' : ''}
                        {hasPerSite && <span> &middot; {siteTotal.toLocaleString()} site{siteTotal !== 1 ? 's' : ''}</span>}
                        &nbsp;&middot; {fields.length} fields tracked
                        {viewLabel && <span className="ml-1.5 opacity-60">({viewLabel})</span>}
                    </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <span className={`text-3xl font-bold tabular-nums leading-none ${pctColor(overallPct)}`}>
                        {overallPct}%
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">overall</p>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
                {fieldStats.map(f => (
                    <div key={f.key}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate mr-1">{f.label}</span>
                            <span className={`text-xs font-semibold tabular-nums flex-shrink-0 ${pctColor(f.pct)}`}>{f.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${barColor(f.pct)}`}
                                style={{ width: `${f.pct}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">{f.filled}/{f.total} {f.unit}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Reusable form primitives ──────────────────────────────────────────────────
function SelectInput({ name, value, onChange, children, disabled }) {
    return (
        <div className="relative">
            <select name={name} value={value ?? ''} onChange={onChange} disabled={disabled}
                className={selectCls + (disabled ? ' opacity-50 cursor-not-allowed' : '')}
            >
                {children}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </span>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            {children}
        </div>
    );
}

function ReadField({ label, value }) {
    return (
        <div>
            <p className={labelCls}>{label}</p>
            <p className={roValCls}>{value || '—'}</p>
        </div>
    );
}

function CheckField({ label, name, value, onChange }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
                type="checkbox"
                name={name}
                checked={value === '1' || value === 1 || value === true}
                onChange={e => onChange({ target: { name, value: e.target.checked ? '1' : '' } })}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        </label>
    );
}

// ─── Chevron icon for filter selects ─────────────────────────────────────────
const ChevronDown = () => (
    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    </span>
);

// ─── Config Modal ─────────────────────────────────────────────────────────────
function ConfigModal({ hw, siteMap, regionMap, cpuView, serverView, onClose, onSaved }) {
    const { postData, loading: saving } = useApi();
    const [form, setForm]       = useState({ ...hw });
    const [saveError, setSaveError] = useState(null);
    const [saved,     setSaved]     = useState(false);

    if (!hw) return null;

    const isCpu           = isCpuCategory(hw.item_desc);
    const hasSystemFields = isServerCategory(hw.item_desc);
    const hasPortFields   = isSwitchCategory(hw.item_desc);

    const site       = siteMap[hw.site_code] || {};
    const regionName = regionMap[String(site.region_id || '')] || regionMap[String(hw.region_name || '')] || '—';
    const ageYrs     = computeAge(hw.hw_date_acq);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setSaveError(null);
        setSaved(false);
    };

    const buildPayload = (keys) => {
        const p = { hw_id: form.hw_id };
        keys.forEach(f => {
            const v = form[f];
            if (BOOL_SAVE_FIELDS.has(f)) {
                // Boolean columns: always include, normalise to '0' / '1'
                p[f] = (v === '1' || v === 1 || v === true) ? '1' : '0';
            } else if (v !== null && v !== undefined && v !== '') {
                // Text/select fields: only include when non-empty.
                // Omitting empty fields prevents CakePHP notEmpty validation
                // errors for optional columns that already have a value in the DB.
                p[f] = v;
            }
        });
        return p;
    };

    const handleSave = async () => {
        setSaveError(null);
        const payload = isCpu
            ? buildPayload(CPU_VIEW_SAVE_FIELDS[cpuView] || [])
            : isServerCategory(hw.item_desc)
            ? buildPayload(SERVER_VIEW_SAVE_FIELDS[serverView] || [])
            : buildPayload(Object.keys(form));
        const res = await postData('/api/hw-tbl/update.json', payload);
        if (res?.success) {
            setSaved(true);
            onSaved({ ...form });
        } else {
            setSaveError(res?.message || res?.error || 'Failed to save. Please try again.');
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl rounded-2xl shadow-2xl ring-1 ring-gray-200/70 dark:ring-gray-700/50 bg-white dark:bg-gray-900 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {hw.hw_asset_num || '—'}
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {hw.item_desc} &middot; {hw.hw_brand_name} {hw.hw_model} &middot; {hw.site_code}
                            {isCpu && <span className="ml-1.5 text-indigo-400">&middot; {CPU_VIEWS.find(v => v.value === cpuView)?.label}</span>}
                            {!isCpu && hasSystemFields && <span className="ml-1.5 text-sky-400">&middot; {SERVER_VIEWS.find(v => v.value === serverView)?.label}</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {saveError && (
                    <div className="mx-6 mt-3 px-3 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs rounded-lg flex-shrink-0">
                        {saveError}
                    </div>
                )}
                {saved && (
                    <div className="mx-6 mt-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex-shrink-0">
                        Configuration saved successfully.
                    </div>
                )}

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">

                    {/* Hardware Identity — always shown, read-only */}
                    <div>
                        <p className={sectionHdr}>Hardware Identity</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <ReadField label="Asset #"    value={hw.hw_asset_num} />
                            <ReadField label="Serial #"   value={hw.hw_serial_num} />
                            <ReadField label="Status"     value={hw.hw_status} />
                            <div>
                                <p className={labelCls}>Age</p>
                                <p className={`py-1 text-sm font-medium ${ageColor(ageYrs)}`}>{formatAge(ageYrs)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            <ReadField label="Region" value={regionName} />
                            <ReadField label="Site"   value={`${hw.site_code}${site.site_name ? ` – ${site.site_name}` : ''}`} />
                            <ReadField label="Brand"  value={hw.hw_brand_name} />
                            <ReadField label="Model"  value={hw.hw_model} />
                        </div>
                    </div>

                    {/* ── CPU: only show the section matching the active sub-view ── */}
                    {isCpu ? (
                        <>
                            {/* OS Type & Antivirus */}
                            {cpuView === 'os_antivirus' && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>System</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="OS Type">
                                                <SelectInput name="os_type" value={form.os_type || ''} onChange={handleChange}>
                                                    <option value="">— Select OS —</option>
                                                    {OS_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                            <Field label="Antivirus">
                                                <SelectInput name="hw_antivi" value={form.hw_antivi || ''} onChange={handleChange}>
                                                    <option value="">— Select antivirus —</option>
                                                    {ANTIVIRUS_OPTIONS.filter(o => o).map(o => (
                                                        <option key={o} value={o}>{o}</option>
                                                    ))}
                                                </SelectInput>
                                            </Field>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Software</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label=".NET Framework Version">
                                                <SelectInput name="dotnet" value={form.dotnet || ''} onChange={handleChange}>
                                                    <option value="">— Select version —</option>
                                                    {DOTNET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Core Build & Facilities */}
                            {cpuView === 'core_facilities' && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Core Build</p>
                                        <div className="flex flex-wrap gap-4">
                                            {CORE_BUILD_OPTIONS.map(opt => {
                                                const vals = (form.core_buid || '').split(',').map(s => s.trim()).filter(v => CORE_BUILD_OPTIONS.includes(v));
                                                return (
                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={vals.includes(opt)}
                                                            onChange={e => {
                                                                const current = (form.core_buid || '').split(',').map(s => s.trim()).filter(Boolean);
                                                                const updated = e.target.checked
                                                                    ? [...new Set([...current, opt])]
                                                                    : current.filter(v => v !== opt);
                                                                handleChange({ target: { name: 'core_buid', value: updated.join(', ') } });
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Installed Utilities</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            <CheckField label="RSU-FAC"  name="rsu_fac"  value={form.rsu_fac}  onChange={handleChange} />
                                            <CheckField label="MV-DTO"   name="mv_dto"   value={form.mv_dto}   onChange={handleChange} />
                                            <CheckField label="MV-MAINT" name="mv_maint" value={form.mv_maint} onChange={handleChange} />
                                            <CheckField label="IMS-AIU"  name="ims_aiu"  value={form.ims_aiu}  onChange={handleChange} />
                                            <CheckField label="DL-DTO"   name="dl_dto"   value={form.dl_dto}   onChange={handleChange} />
                                            <CheckField label="DL-MAINT" name="dl_maint" value={form.dl_maint} onChange={handleChange} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Hostname, IP & MAC */}
                            {cpuView === 'hostname_ip_mac' && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Network</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Hostname">
                                                <input type="text" name="hw_host_name" value={form.hw_host_name || ''} onChange={handleChange} className={inputCls} placeholder="e.g. NCR-PC-001" />
                                            </Field>
                                            <Field label="IP Address">
                                                <input type="text" name="hw_ip_add" value={form.hw_ip_add || ''} onChange={handleChange} className={inputCls} placeholder="e.g. 192.168.1.100" />
                                            </Field>
                                            <Field label="MAC Address">
                                                <input type="text" name="hw_mac_add" value={form.hw_mac_add || ''} onChange={handleChange} className={inputCls} placeholder="e.g. AA:BB:CC:DD:EE:FF" />
                                            </Field>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Workstep & User Assignment */}
                            {cpuView === 'workstep_user' && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>User &amp; Assignment</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Assigned User">
                                                <input type="text" name="hw_user_name" value={form.hw_user_name || ''} onChange={handleChange} className={inputCls} placeholder="e.g. Juan Dela Cruz" />
                                            </Field>
                                            <div>
                                                <p className={labelCls}>Primary Role / Workstep</p>
                                                <div className="flex flex-wrap gap-y-2 gap-x-4 pt-1">
                                                    {WORKSTEP_OPTIONS.map(opt => {
                                                        const vals = (form.hw_primary_role || '').split(',').map(s => s.trim()).filter(Boolean);
                                                        return (
                                                            <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={vals.includes(opt)}
                                                                    onChange={e => {
                                                                        const current = (form.hw_primary_role || '').split(',').map(s => s.trim()).filter(Boolean);
                                                                        const updated = e.target.checked
                                                                            ? [...new Set([...current, opt])]
                                                                            : current.filter(v => v !== opt);
                                                                        handleChange({ target: { name: 'hw_primary_role', value: updated.join(', ') } });
                                                                    }}
                                                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* HDD Health & Age */}
                            {cpuView === 'hdd_age' && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Acquisition</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Acquisition Date (MM/DD/YYYY)">
                                                <input type="text" name="hw_date_acq" value={form.hw_date_acq || ''} onChange={handleChange} className={inputCls} placeholder="e.g. 01/15/2020" />
                                            </Field>
                                            <Field label="Acquisition Value">
                                                <input type="text" name="hw_acq_val" value={form.hw_acq_val || ''} onChange={handleChange} className={inputCls} placeholder="e.g. 45000" />
                                            </Field>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Memory &amp; Storage</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Memory (RAM)">
                                                <SelectInput name="hw_memory" value={form.hw_memory || ''} onChange={handleChange}>
                                                    <option value="">— Select RAM —</option>
                                                    {MEMORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 mt-4">
                                            <Field label="HDD Capacity">
                                                <SelectInput name="hdd_capacity" value={form.hdd_capacity || ''} onChange={handleChange}>
                                                    <option value="">— Select capacity —</option>
                                                    {HDD_CAP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                            <Field label="HDD Free Space">
                                                <input type="text" name="hdd_free_space" value={form.hdd_free_space || ''} onChange={handleChange} className={inputCls} placeholder="e.g. 120GB" />
                                            </Field>
                                            <div>
                                                <p className={labelCls}>Space Used (auto)</p>
                                                {(() => {
                                                    const h = hddHealthBadge(form.hdd_capacity, form.hdd_free_space);
                                                    return h.label === '—'
                                                        ? <p className={roValCls + ' text-gray-400 dark:text-gray-500'}>—</p>
                                                        : <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-semibold ${h.cls}`}>{h.label} used</span>;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        /* ── Server / Switch: form scoped by view ─────────────── */
                        <>
                            {/* Acquisition — Server: mem_hdd only; Switch: always */}
                            {(!hasSystemFields || serverView === 'mem_hdd') && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Acquisition</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Acquisition Date (MM/DD/YYYY)">
                                                <input type="text" name="hw_date_acq" value={form.hw_date_acq || ''} onChange={handleChange} className={inputCls} placeholder="e.g. 01/15/2020" />
                                            </Field>
                                            <Field label="Acquisition Value">
                                                <input type="text" name="hw_acq_val" value={form.hw_acq_val || ''} onChange={handleChange} className={inputCls} placeholder="e.g. 45000" />
                                            </Field>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Network — Server: hostname_ip_mac only; Switch: never (Switch uses Ports) */}
                            {!hasPortFields && (!hasSystemFields || serverView === 'hostname_ip_mac') && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Network</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Hostname">
                                                <input type="text" name="hw_host_name" value={form.hw_host_name || ''} onChange={handleChange} className={inputCls} placeholder="e.g. NCR-PC-001" />
                                            </Field>
                                            <Field label="IP Address">
                                                <input type="text" name="hw_ip_add" value={form.hw_ip_add || ''} onChange={handleChange} className={inputCls} placeholder="e.g. 192.168.1.100" />
                                            </Field>
                                            <Field label="MAC Address">
                                                <input type="text" name="hw_mac_add" value={form.hw_mac_add || ''} onChange={handleChange} className={inputCls} placeholder="e.g. AA:BB:CC:DD:EE:FF" />
                                            </Field>
                                        </div>
                                    </div>
                                </>
                            )}

                            {hasPortFields && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Ports</p>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Field label="Working Ports">
                                                <input type="number" name="ports_working" value={form.ports_working || ''} onChange={handleChange} min="0" className={inputCls} />
                                            </Field>
                                            <Field label="Defective Ports">
                                                <input type="number" name="ports_deffect" value={form.ports_deffect || ''} onChange={handleChange} min="0" className={inputCls} />
                                            </Field>
                                            <div>
                                                <p className={labelCls}>Total Ports</p>
                                                <p className={`${roValCls} font-semibold`}>
                                                    {(parseInt(form.ports_working) || 0) + (parseInt(form.ports_deffect) || 0) || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {hasSystemFields && serverView === 'os_av_net' && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>System</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="OS Type">
                                                <SelectInput name="os_type" value={form.os_type || ''} onChange={handleChange}>
                                                    <option value="">— Select OS —</option>
                                                    {OS_SERVER_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                            <Field label="Antivirus">
                                                <SelectInput name="hw_antivi" value={form.hw_antivi || ''} onChange={handleChange}>
                                                    <option value="">— Select antivirus —</option>
                                                    {ANTIVIRUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Software</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label=".NET Framework Version">
                                                <SelectInput name="dotnet" value={form.dotnet || ''} onChange={handleChange}>
                                                    <option value="">— Select version —</option>
                                                    {DOTNET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                        </div>
                                    </div>
                                </>
                            )}

                            {hasSystemFields && serverView === 'mem_hdd' && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-800" />
                                    <div>
                                        <p className={sectionHdr}>Memory &amp; Storage</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Memory (RAM)">
                                                <SelectInput name="hw_memory" value={form.hw_memory || ''} onChange={handleChange}>
                                                    <option value="">— Select RAM —</option>
                                                    {MEMORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 mt-4">
                                            <Field label="HDD Capacity">
                                                <SelectInput name="hdd_capacity" value={form.hdd_capacity || ''} onChange={handleChange}>
                                                    <option value="">— Select capacity —</option>
                                                    {HDD_CAP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                                </SelectInput>
                                            </Field>
                                            <Field label="HDD Free Space">
                                                <input type="text" name="hdd_free_space" value={form.hdd_free_space || ''} onChange={handleChange} className={inputCls} placeholder="e.g. 120GB" />
                                            </Field>
                                            <div>
                                                <p className={labelCls}>Space Used (auto)</p>
                                                {(() => {
                                                    const h = hddHealthBadge(form.hdd_capacity, form.hdd_free_space);
                                                    return h.label === '—'
                                                        ? <p className={roValCls + ' text-gray-400 dark:text-gray-500'}>—</p>
                                                        : <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-semibold ${h.cls}`}>{h.label} used</span>;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        Close
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>,
        getModalRoot()
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function MasterfileHardwareManagement() {
    const { fetchData } = useApi();

    const [hardware,  setHardware]  = useState([]);
    const [siteMap,   setSiteMap]   = useState({});
    const [regionMap, setRegionMap] = useState({});
    const [loading,   setLoading]   = useState(true);
    const [loadError, setLoadError] = useState(null);
    const didLoad = useRef(false);

    const [search,           setSearch]           = useState('');
    const [filterHwCategory, setFilterHwCategory] = useState('');
    const [cpuView,          setCpuView]          = useState('os_antivirus');
    const [serverView,       setServerView]       = useState('os_av_net');
    const [filterRegion,     setFilterRegion]     = useState('');
    const [filterSite,       setFilterSite]       = useState('');
    const [currentPage,      setCurrentPage]      = useState(0);
    const [pageSize,         setPageSize]         = useState(30);
    const [selected,         setSelected]         = useState(null);
    const [allRegions,       setAllRegions]       = useState([]);

    // ── Role detection ─────────────────────────────────────────────────────
    const user = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; } }, []);
    const role  = (user.user_type || 'FSE').toString().trim().toUpperCase();
    const isFSE = !['ADM', 'ADMIN', 'ADMINISTRATOR', 'SPV', 'SUPERVISOR'].includes(role);

    // ── Allowed region IDs ────────────────────────────────────────────────
    const allowedRegionIds = useMemo(() => {
        if (!allRegions.length) return [];
        if (role === 'ADM' && user.cluster_name === 'All Cluster') {
            return allRegions.map(r => String(r.region_id));
        }
        if (['SPV', 'SUPERVISOR'].includes(role) && user.cluster_name) {
            return allRegions
                .filter(r => String(r.cluster_name || '').trim() === user.cluster_name)
                .map(r => String(r.region_id));
        }
        return (user.region_assigned || '').split(',').map(s => s.trim()).filter(Boolean);
    }, [allRegions, role, user]);

    // ── Base hardware: on-site, scoped to user's regions ──────────────────
    const baseHardware = useMemo(() => {
        if (!allowedRegionIds.length) return [];
        return hardware.filter(h => {
            if (!['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())) return false;
            if (h.site_code === 'VM-Server') return false;
            const site = siteMap[h.site_code];
            if (!site) return false;
            return allowedRegionIds.includes(String(site.region_id));
        });
    }, [hardware, siteMap, allowedRegionIds]);

    const scopeLabel = useMemo(() => {
        if (role === 'ADM' && user.cluster_name === 'All Cluster') return null;
        if (['SPV', 'SUPERVISOR'].includes(role)) return `Cluster: ${user.cluster_name || '—'}`;
        const names = allowedRegionIds.map(id => regionMap[id]).filter(Boolean);
        return `Region: ${names.join(', ') || '—'}`;
    }, [role, user, allowedRegionIds, regionMap]);

    useEffect(() => {
        if (didLoad.current) return;
        didLoad.current = true;

        const load = async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const [hwRes, siteRes, regRes] = await Promise.all([
                    fetchData('/api/hw-tbl.json'),
                    fetchData('/api/site-list-tbl.json'),
                    fetchData('/api/region-tbl.json'),
                ]);
                if (hwRes?.hwTbl)         setHardware(hwRes.hwTbl);
                if (siteRes?.siteListTbl) {
                    const sm = {};
                    siteRes.siteListTbl.forEach(s => { sm[s.site_code] = s; });
                    setSiteMap(sm);
                }
                if (regRes?.regionTbl) {
                    const rm = {};
                    regRes.regionTbl.forEach(r => { rm[String(r.region_id)] = r.region_name; });
                    setRegionMap(rm);
                    setAllRegions(regRes.regionTbl);
                }
            } catch {
                setLoadError('Failed to load hardware data. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ── Filter option lists ────────────────────────────────────────────────
    const regionOptions = useMemo(() => {
        const seen = new Set();
        return baseHardware
            .map(h => String(h.region_name || ''))
            .filter(v => v && !seen.has(v) && seen.add(v))
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    }, [baseHardware]);

    const sitesForRegion = useMemo(() => {
        const seen = new Set();
        return baseHardware
            .filter(h => !filterRegion || String(h.region_name) === filterRegion)
            .map(h => h.site_code)
            .filter(v => v && !seen.has(v) && seen.add(v))
            .sort();
    }, [baseHardware, filterRegion]);

    // ── Search placeholder — reflects current view's searchable columns ──────
    const searchPlaceholder = useMemo(() => {
        if (!filterHwCategory) return 'Search asset, serial, brand, model, site…';
        if (filterHwCategory === 'CPU') {
            if (cpuView === 'os_antivirus')    return 'Search asset, serial, site, OS type, antivirus, .NET…';
            if (cpuView === 'core_facilities') return 'Search asset, serial, site, core build…';
            if (cpuView === 'hostname_ip_mac') return 'Search asset, serial, site, hostname, IP, MAC…';
            if (cpuView === 'workstep_user')   return 'Search asset, serial, site, user, primary role…';
            if (cpuView === 'hdd_age')         return 'Search asset, serial, site, memory, HDD capacity…';
        }
        if (filterHwCategory === 'SERVER') {
            if (serverView === 'os_av_net')       return 'Search asset, serial, site, OS type, antivirus, .NET…';
            if (serverView === 'hostname_ip_mac') return 'Search asset, serial, site, hostname, IP, MAC…';
            if (serverView === 'mem_hdd')         return 'Search asset, serial, site, memory, HDD capacity…';
        }
        return 'Search asset, serial, brand, model, site…';
    }, [filterHwCategory, cpuView, serverView]);

    // ── Filtered rows ──────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return baseHardware.filter(h => {
            if (filterHwCategory === 'CPU'    && !isCpuCategory(h.item_desc))    return false;
            if (filterHwCategory === 'SERVER' && !isServerCategory(h.item_desc)) return false;
            if (filterHwCategory === 'SWITCH' && !isSwitchCategory(h.item_desc)) return false;
            if (filterRegion && String(h.region_name) !== filterRegion) return false;
            if (filterSite   && h.site_code !== filterSite) return false;
            if (term) {
                const site = siteMap[h.site_code];
                // Common identifiers: always searched regardless of view
                const s = (f) => (h[f] || '').toLowerCase().includes(term);
                if (s('hw_asset_num') || s('hw_serial_num') || s('hw_brand_name') || s('hw_model') ||
                    s('site_code')    || (site?.site_name || '').toLowerCase().includes(term)) return true;

                // View-specific fields
                if (filterHwCategory === 'CPU') {
                    if (cpuView === 'os_antivirus')    return s('os_type') || s('hw_antivi') || s('dotnet');
                    if (cpuView === 'core_facilities') return s('core_buid');
                    if (cpuView === 'hostname_ip_mac') return s('hw_host_name') || s('hw_ip_add') || s('hw_mac_add');
                    if (cpuView === 'workstep_user')   return s('hw_user_name') || s('hw_primary_role');
                    if (cpuView === 'hdd_age')         return s('hw_memory') || s('hdd_capacity') || s('hw_date_acq');
                }
                if (filterHwCategory === 'SERVER') {
                    if (serverView === 'os_av_net')       return s('os_type') || s('hw_antivi') || s('dotnet');
                    if (serverView === 'hostname_ip_mac') return s('hw_host_name') || s('hw_ip_add') || s('hw_mac_add');
                    if (serverView === 'mem_hdd')         return s('hw_memory') || s('hdd_capacity') || s('hw_date_acq');
                }
                // No category selected: broad search
                if (!filterHwCategory) {
                    return s('hw_ip_add') || s('hw_host_name') || s('os_type') || s('hw_user_name');
                }
                return false;
            }
            return true;
        }).sort((a, b) => {
            const rDiff = (parseInt(a.region_name, 10) || 0) - (parseInt(b.region_name, 10) || 0);
            if (rDiff !== 0) return rDiff;
            const sDiff = (a.site_code || '').localeCompare(b.site_code || '');
            if (sDiff !== 0) return sDiff;
            return (a.hw_asset_num || '').localeCompare(b.hw_asset_num || '');
        });
    }, [baseHardware, search, filterHwCategory, filterRegion, filterSite, siteMap]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged      = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const resetPage = () => setCurrentPage(0);
    const setFilter = setter => val => { setter(val); resetPage(); };

    const handleSaved = updatedRow => {
        setHardware(prev => prev.map(h => h.hw_id === updatedRow.hw_id ? { ...h, ...updatedRow } : h));
        setSelected(s => s ? { ...s, ...updatedRow } : s);
    };

    const generateExcelReport = () => {
        if (!filtered.length) return;

        const commonHeaders = ['Region', 'Site Code', 'Site Name', 'Asset #', 'Serial #', 'Brand', 'Model'];
        const commonExtract = row => {
            const site = siteMap[row.site_code];
            const regionName = regionMap[row.region_name] || row.region_name || '';
            return [
                regionName,
                row.site_code || '',
                site?.site_name || '',
                row.hw_asset_num || '',
                row.hw_serial_num || '',
                row.hw_brand_name || '',
                row.hw_model || '',
            ];
        };

        let headers = [];
        let extractRow;

        if (filterHwCategory === 'CPU') {
            if (cpuView === 'os_antivirus') {
                headers = [...commonHeaders, 'OS Type', 'Antivirus', '.NET Framework'];
                extractRow = row => [...commonExtract(row), row.os_type || '', row.hw_antivi || '', row.dotnet || ''];
            } else if (cpuView === 'core_facilities') {
                headers = [...commonHeaders, 'Core Build', 'Facilities Installed'];
                extractRow = row => [
                    ...commonExtract(row),
                    (row.core_buid || '').split(',').map(s => s.trim()).filter(Boolean).join(', '),
                    installedFacilities(row).join(', '),
                ];
            } else if (cpuView === 'hostname_ip_mac') {
                headers = [...commonHeaders, 'Hostname', 'IP Address', 'MAC Address'];
                extractRow = row => [...commonExtract(row), row.hw_host_name || '', row.hw_ip_add || '', row.hw_mac_add || ''];
            } else if (cpuView === 'workstep_user') {
                headers = [...commonHeaders, 'Primary Role', 'Assigned User'];
                extractRow = row => [...commonExtract(row), row.hw_primary_role || '', row.hw_user_name || ''];
            } else {
                headers = [...commonHeaders, 'Memory', 'HDD Health (%)', 'HDD Capacity', 'Free Space', 'Acq. Date', 'Age'];
                extractRow = row => {
                    const health = hddHealthBadge(row.hdd_capacity, row.hdd_free_space);
                    return [...commonExtract(row), row.hw_memory || '', health.label, row.hdd_capacity || '', row.hdd_free_space || '', row.hw_date_acq || '', formatAge(computeAge(row.hw_date_acq))];
                };
            }
        } else if (filterHwCategory === 'SERVER') {
            if (serverView === 'os_av_net') {
                headers = [...commonHeaders, 'OS Type', 'Antivirus', '.NET Framework'];
                extractRow = row => [...commonExtract(row), row.os_type || '', row.hw_antivi || '', row.dotnet || ''];
            } else if (serverView === 'hostname_ip_mac') {
                headers = [...commonHeaders, 'Hostname', 'IP Address', 'MAC Address'];
                extractRow = row => [...commonExtract(row), row.hw_host_name || '', row.hw_ip_add || '', row.hw_mac_add || ''];
            } else {
                headers = [...commonHeaders, 'Memory', 'HDD Health (%)', 'HDD Capacity', 'Free Space', 'Acq. Date', 'Age'];
                extractRow = row => {
                    const health = hddHealthBadge(row.hdd_capacity, row.hdd_free_space);
                    return [...commonExtract(row), row.hw_memory || '', health.label, row.hdd_capacity || '', row.hdd_free_space || '', row.hw_date_acq || '', formatAge(computeAge(row.hw_date_acq))];
                };
            }
        } else if (filterHwCategory === 'SWITCH') {
            headers = [...commonHeaders, 'Working Ports', 'Defective Ports', 'Total Ports', 'Acq. Date', 'Age'];
            extractRow = row => {
                const total    = parseInt(row.ports_num) || 0;
                const defective = parseInt(row.ports_def) || 0;
                return [...commonExtract(row), total - defective || '', defective || '', total || '', row.hw_date_acq || '', formatAge(computeAge(row.hw_date_acq))];
            };
        } else {
            headers = [...commonHeaders, 'Item Type', 'IP Address', 'OS Type', 'Memory', 'HDD Health (%)', 'Acq. Date', 'Age'];
            extractRow = row => {
                const health = hddHealthBadge(row.hdd_capacity, row.hdd_free_space);
                return [...commonExtract(row), row.item_desc || '', row.hw_ip_add || '', row.os_type || '', row.hw_memory || '', health.label, row.hw_date_acq || '', formatAge(computeAge(row.hw_date_acq))];
            };
        }

        const rows = filtered.map(extractRow);
        const wsData = [headers, ...rows];

        // Auto column widths
        const colWidths = headers.map((h, ci) => {
            const max = rows.reduce((m, r) => Math.max(m, String(r[ci] || '').length), h.length);
            return { wch: Math.min(Math.max(max + 2, 12), 45) };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = colWidths;

        const categoryLabel = filterHwCategory || 'All';
        const subLabel = filterHwCategory === 'CPU'
            ? CPU_VIEWS.find(v => v.value === cpuView)?.label
            : filterHwCategory === 'SERVER'
                ? SERVER_VIEWS.find(v => v.value === serverView)?.label
                : null;
        const sheetName = subLabel ? subLabel.slice(0, 31) : categoryLabel;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        const regionLabel = filterRegion ? (regionMap[filterRegion] || filterRegion).replace(/[^a-zA-Z0-9]/g, '_') : 'AllRegions';
        const siteLabel   = filterSite ? `_${filterSite}` : '';
        const dateStr     = new Date().toISOString().slice(0, 10);
        const filename    = `Hardware_${categoryLabel}${subLabel ? '_' + subLabel.replace(/[^a-zA-Z0-9]/g, '_') : ''}_${regionLabel}${siteLabel}_${dateStr}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    if (loadError) {
        return <div className="p-6 text-center text-sm text-red-500 dark:text-red-400">{loadError}</div>;
    }

    // ── Table style helpers ────────────────────────────────────────────────
    const thCls = 'px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap';
    const tdCls = 'px-4 py-3 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap';

    const colCount = (() => {
        if (filterHwCategory === 'CPU') {
            // Asset | Serial | Brand/Model | Site | [view-specific cols]
            if (cpuView === 'os_antivirus')    return 7; // + OS Type, Antivirus, .NET
            if (cpuView === 'hostname_ip_mac') return 7; // + Hostname, IP, MAC
            if (cpuView === 'hdd_age')         return 9; // + Memory, HDD Health, Capacity, Free Space, Age
            return 6; // core_facilities, workstep_user: + 2 view cols
        }
        if (filterHwCategory === 'SERVER') return serverView === 'mem_hdd' ? 9 : 7;
        if (filterHwCategory === 'SWITCH') return 8;
        return 10;
    })();

    const SkeletonRows = () => (
        <>
            {[...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse border-t border-gray-100 dark:border-gray-800">
                    {[...Array(colCount)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );

    // ── Dynamic table header ───────────────────────────────────────────────
    const renderHeader = () => {
        if (filterHwCategory === 'CPU') {
            if (cpuView === 'os_antivirus') return (
                <tr>
                    <th className={thCls}>Asset #</th>
                    <th className={thCls}>Serial #</th>
                    <th className={thCls}>Brand / Model</th>
                    <th className={thCls}>Site</th>
                    <th className={thCls}>OS Type</th>
                    <th className={thCls}>Antivirus</th>
                    <th className={thCls}>.NET Framework</th>
                </tr>
            );
            if (cpuView === 'core_facilities') return (
                <tr>
                    <th className={thCls}>Asset #</th>
                    <th className={thCls}>Serial #</th>
                    <th className={thCls}>Brand / Model</th>
                    <th className={thCls}>Site</th>
                    <th className={thCls}>Core Build</th>
                    <th className={thCls}>Facilities Installed</th>
                </tr>
            );
            if (cpuView === 'hostname_ip_mac') return (
                <tr>
                    <th className={thCls}>Asset #</th>
                    <th className={thCls}>Serial #</th>
                    <th className={thCls}>Brand / Model</th>
                    <th className={thCls}>Site</th>
                    <th className={thCls}>Hostname</th>
                    <th className={thCls}>IP Address</th>
                    <th className={thCls}>MAC Address</th>
                </tr>
            );
            if (cpuView === 'workstep_user') return (
                <tr>
                    <th className={thCls}>Asset #</th>
                    <th className={thCls}>Serial #</th>
                    <th className={thCls}>Brand / Model</th>
                    <th className={thCls}>Site</th>
                    <th className={thCls}>Workstep / Primary Role</th>
                    <th className={thCls}>Assigned User</th>
                </tr>
            );
            // hdd_age
            return (
                <tr>
                    <th className={thCls}>Asset #</th>
                    <th className={thCls}>Serial #</th>
                    <th className={thCls}>Brand / Model</th>
                    <th className={thCls}>Site</th>
                    <th className={thCls}>Memory</th>
                    <th className={thCls}>HDD Health</th>
                    <th className={thCls}>HDD Capacity</th>
                    <th className={thCls}>Free Space</th>
                    <th className={thCls}>Age</th>
                </tr>
            );
        }
        if (filterHwCategory === 'SERVER') {
            if (serverView === 'mem_hdd') return (
                <tr>
                    <th className={thCls}>Asset #</th>
                    <th className={thCls}>Serial #</th>
                    <th className={thCls}>Brand / Model</th>
                    <th className={thCls}>Site</th>
                    <th className={thCls}>Memory</th>
                    <th className={thCls}>HDD Health</th>
                    <th className={thCls}>HDD Capacity</th>
                    <th className={thCls}>Free Space</th>
                    <th className={thCls}>Age</th>
                </tr>
            );
            if (serverView === 'hostname_ip_mac') return (
                <tr>
                    <th className={thCls}>Asset #</th>
                    <th className={thCls}>Serial #</th>
                    <th className={thCls}>Brand / Model</th>
                    <th className={thCls}>Site</th>
                    <th className={thCls}>Hostname</th>
                    <th className={thCls}>IP Address</th>
                    <th className={thCls}>MAC Address</th>
                </tr>
            );
            return (
                <tr>
                    <th className={thCls}>Asset #</th>
                    <th className={thCls}>Serial #</th>
                    <th className={thCls}>Brand / Model</th>
                    <th className={thCls}>Site</th>
                    <th className={thCls}>OS Type</th>
                    <th className={thCls}>Antivirus</th>
                    <th className={thCls}>.NET Framework</th>
                </tr>
            );
        }
        if (filterHwCategory === 'SWITCH') return (
            <tr>
                <th className={thCls}>Asset #</th>
                <th className={thCls}>Serial #</th>
                <th className={thCls}>Brand / Model</th>
                <th className={thCls}>Site</th>
                <th className={thCls}>Working Ports</th>
                <th className={thCls}>Defective Ports</th>
                <th className={thCls}>Total Ports</th>
                <th className={thCls}>Age</th>
            </tr>
        );
        // Generic
        return (
            <tr>
                <th className={thCls}>Asset #</th>
                <th className={thCls}>Serial #</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Brand / Model</th>
                <th className={thCls}>Site</th>
                <th className={thCls}>IP Address</th>
                <th className={thCls}>OS Type</th>
                <th className={thCls}>Memory</th>
                <th className={thCls}>HDD Health</th>
                <th className={thCls}>Age</th>
            </tr>
        );
    };

    // ── Dynamic table rows ─────────────────────────────────────────────────
    const renderRow = (row, i) => {
        const site       = siteMap[row.site_code];
        const rowCls     = `cursor-pointer transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/20 ${i % 2 !== 0 ? 'bg-gray-50/40 dark:bg-gray-800/20' : ''}`;
        const assetCell  = (
            <td className={`${tdCls} font-medium text-indigo-600 dark:text-indigo-400`}>
                {row.hw_asset_num || '—'}
            </td>
        );
        const serialCell = (
            <td className={`${tdCls} font-mono text-xs text-gray-500 dark:text-gray-400`}>
                {row.hw_serial_num || '—'}
            </td>
        );
        const brandModel = <td className={tdCls}>{row.hw_brand_name || '—'} {row.hw_model || ''}</td>;
        const siteCell   = (
            <td className={`${tdCls} text-gray-600 dark:text-gray-300`}>
                <span className="font-medium">{row.site_code || '—'}</span>
                {site?.site_name && (
                    <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">– {site.site_name}</span>
                )}
            </td>
        );
        const dash = <span className="text-gray-300 dark:text-gray-600">—</span>;

        if (filterHwCategory === 'CPU') {
            if (cpuView === 'os_antivirus') return (
                <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                    {assetCell}
                    {serialCell}
                    {brandModel}
                    {siteCell}
                    <td className={`${tdCls} text-xs`}>{row.os_type   || dash}</td>
                    <td className={`${tdCls} text-xs`}>{row.hw_antivi || dash}</td>
                    <td className={`${tdCls} text-xs font-mono`}>{row.dotnet || dash}</td>
                </tr>
            );
            if (cpuView === 'core_facilities') {
                const chips = installedFacilities(row);
                return (
                    <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                        {assetCell}
                        {serialCell}
                        {brandModel}
                        {siteCell}
                        <td className={tdCls}>
                            {(() => {
                                const chips = (row.core_buid || '').split(',').map(s => s.trim()).filter(v => CORE_BUILD_OPTIONS.includes(v));
                                return chips.length > 0
                                    ? <div className="flex flex-wrap gap-1">
                                        {chips.map(c => (
                                            <span key={c} className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                                                {c}
                                            </span>
                                        ))}
                                      </div>
                                    : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>;
                            })()}
                        </td>
                        <td className={tdCls}>
                            {chips.length > 0
                                ? <div className="flex flex-wrap gap-1">
                                    {chips.map(c => (
                                        <span key={c} className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                                            {c}
                                        </span>
                                    ))}
                                  </div>
                                : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                            }
                        </td>
                    </tr>
                );
            }
            if (cpuView === 'hostname_ip_mac') return (
                <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                    {assetCell}
                    {serialCell}
                    {brandModel}
                    {siteCell}
                    <td className={`${tdCls} font-mono text-xs`}>{row.hw_host_name || dash}</td>
                    <td className={`${tdCls} font-mono text-xs`}>{row.hw_ip_add    || dash}</td>
                    <td className={`${tdCls} font-mono text-xs`}>{row.hw_mac_add   || dash}</td>
                </tr>
            );
            if (cpuView === 'workstep_user') {
                const roles = (row.hw_primary_role || '').split(',').map(s => s.trim()).filter(Boolean);
                return (
                    <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                        {assetCell}
                        {serialCell}
                        {brandModel}
                        {siteCell}
                        <td className={tdCls}>
                            {roles.length > 0
                                ? <div className="flex flex-wrap gap-1">
                                    {roles.map(r => (
                                        <span key={r} className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                                            {r}
                                        </span>
                                    ))}
                                  </div>
                                : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                            }
                        </td>
                        <td className={`${tdCls} text-xs`}>{row.hw_user_name || dash}</td>
                    </tr>
                );
            }
            // hdd_age
            const ageYrs = computeAge(row.hw_date_acq);
            const health = hddHealthBadge(row.hdd_capacity, row.hdd_free_space);
            return (
                <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                    {assetCell}
                    {serialCell}
                    {brandModel}
                    {siteCell}
                    <td className={`${tdCls} text-xs`}>{row.hw_memory || dash}</td>
                    <td className={tdCls}>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${health.cls}`}>
                            {health.label}
                        </span>
                    </td>
                    <td className={`${tdCls} text-xs`}>{row.hdd_capacity   || dash}</td>
                    <td className={`${tdCls} text-xs`}>{row.hdd_free_space || dash}</td>
                    <td className={`${tdCls} font-medium ${ageColor(ageYrs)}`}>{formatAge(ageYrs)}</td>
                </tr>
            );
        }

        if (filterHwCategory === 'SERVER') {
            const ageYrs = computeAge(row.hw_date_acq);
            if (serverView === 'mem_hdd') {
                const health = hddHealthBadge(row.hdd_capacity, row.hdd_free_space);
                return (
                    <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                        {assetCell}
                        {serialCell}
                        {brandModel}
                        {siteCell}
                        <td className={`${tdCls} text-xs`}>{row.hw_memory || dash}</td>
                        <td className={tdCls}>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${health.cls}`}>
                                {health.label}
                            </span>
                        </td>
                        <td className={`${tdCls} text-xs`}>{row.hdd_capacity   || dash}</td>
                        <td className={`${tdCls} text-xs`}>{row.hdd_free_space || dash}</td>
                        <td className={`${tdCls} font-medium ${ageColor(ageYrs)}`}>{formatAge(ageYrs)}</td>
                    </tr>
                );
            }
            if (serverView === 'hostname_ip_mac') return (
                <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                    {assetCell}
                    {serialCell}
                    {brandModel}
                    {siteCell}
                    <td className={`${tdCls} font-mono text-xs`}>{row.hw_host_name || dash}</td>
                    <td className={`${tdCls} font-mono text-xs`}>{row.hw_ip_add    || dash}</td>
                    <td className={`${tdCls} font-mono text-xs`}>{row.hw_mac_add   || dash}</td>
                </tr>
            );
            return (
                <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                    {assetCell}
                    {serialCell}
                    {brandModel}
                    {siteCell}
                    <td className={`${tdCls} text-xs`}>{row.os_type   || dash}</td>
                    <td className={`${tdCls} text-xs`}>{row.hw_antivi || dash}</td>
                    <td className={`${tdCls} text-xs font-mono`}>{row.dotnet || dash}</td>
                </tr>
            );
        }

        if (filterHwCategory === 'SWITCH') {
            const working   = parseInt(row.ports_working) || 0;
            const defective = parseInt(row.ports_deffect) || 0;
            const total     = working + defective;
            const ageYrs    = computeAge(row.hw_date_acq);
            return (
                <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                    {assetCell}
                    {serialCell}
                    {brandModel}
                    {siteCell}
                    <td className={`${tdCls} font-medium text-emerald-600 dark:text-emerald-400`}>
                        {working > 0 ? working : dash}
                    </td>
                    <td className={`${tdCls} font-medium text-red-500 dark:text-red-400`}>
                        {defective > 0 ? defective : dash}
                    </td>
                    <td className={`${tdCls} font-semibold text-gray-700 dark:text-gray-200`}>
                        {total > 0 ? total : dash}
                    </td>
                    <td className={`${tdCls} font-medium ${ageColor(ageYrs)}`}>{formatAge(ageYrs)}</td>
                </tr>
            );
        }

        // Generic row
        const ageYrs = computeAge(row.hw_date_acq);
        const health = hddHealthBadge(row.hdd_capacity, row.hdd_free_space);
        return (
            <tr key={row.hw_id} onClick={() => setSelected(row)} className={rowCls}>
                {assetCell}
                {serialCell}
                <td className={`${tdCls} text-gray-500 dark:text-gray-400`}>{row.item_desc || '—'}</td>
                {brandModel}
                {siteCell}
                <td className={`${tdCls} font-mono text-xs`}>{row.hw_ip_add  || dash}</td>
                <td className={`${tdCls} text-xs`}>{row.os_type    || dash}</td>
                <td className={`${tdCls} text-xs`}>{row.hw_memory  || dash}</td>
                <td className={tdCls}>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${health.cls}`}>
                        {health.label}
                    </span>
                </td>
                <td className={`${tdCls} font-medium ${ageColor(ageYrs)}`}>{formatAge(ageYrs)}</td>
            </tr>
        );
    };

    const viewLabel = filterHwCategory === 'CPU'
        ? CPU_VIEWS.find(v => v.value === cpuView)?.label
        : null;

    const startEntry = filtered.length > 0 ? currentPage * pageSize + 1 : 0;
    const endEntry   = Math.min((currentPage + 1) * pageSize, filtered.length);

    return (
        <div className="p-5 space-y-4">
            {/* Title */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Hardware Management</h1>
                        {scopeLabel && (
                            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                                {scopeLabel}
                            </span>
                        )}
                        {viewLabel && (
                            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50">
                                {viewLabel}
                            </span>
                        )}
                    </div>
                    {!loading && filterHwCategory && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {filtered.length.toLocaleString()} of {baseHardware.length.toLocaleString()} units — click a row to view or edit configuration
                        </p>
                    )}
                </div>
                {!loading && filtered.length > 0 && (
                    <button
                        onClick={generateExcelReport}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Generate Report
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <input
                    value={search}
                    onChange={e => { setSearch(e.target.value); resetPage(); }}
                    placeholder={searchPlaceholder}
                    className="w-72 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />

                {/* Hardware type: CPU / Server / Switch */}
                <div className="relative">
                    <select
                        value={filterHwCategory}
                        onChange={e => { setFilter(setFilterHwCategory)(e.target.value); }}
                        className={`${selectCls} w-40`}
                    >
                        <option value="" disabled>Select Type…</option>
                        <option value="CPU">CPU / PC</option>
                        <option value="SERVER">Server</option>
                        <option value="SWITCH">Switch</option>
                    </select>
                    <ChevronDown />
                </div>

                {/* CPU sub-view selector */}
                {filterHwCategory === 'CPU' && (
                    <div className="relative">
                        <select
                            value={cpuView}
                            onChange={e => { setCpuView(e.target.value); resetPage(); }}
                            className={`${selectCls} w-56`}
                        >
                            {CPU_VIEWS.map(v => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                        </select>
                        <ChevronDown />
                    </div>
                )}

                {/* Server sub-view selector */}
                {filterHwCategory === 'SERVER' && (
                    <div className="relative">
                        <select
                            value={serverView}
                            onChange={e => { setServerView(e.target.value); resetPage(); }}
                            className={`${selectCls} w-56`}
                        >
                            {SERVER_VIEWS.map(v => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                        </select>
                        <ChevronDown />
                    </div>
                )}

                {/* Region */}
                <div className="relative">
                    <select
                        value={filterRegion}
                        onChange={e => { setFilter(setFilterRegion)(e.target.value); setFilterSite(''); }}
                        className={`${selectCls} w-48`}
                    >
                        {(!isFSE || regionOptions.length > 1) && <option value="">All Regions</option>}
                        {regionOptions.map(id => <option key={id} value={id}>{regionMap[id] || id}</option>)}
                    </select>
                    <ChevronDown />
                </div>

                {/* Site — shows code + name */}
                <div className="relative">
                    <select
                        value={filterSite}
                        onChange={e => setFilter(setFilterSite)(e.target.value)}
                        className={`${selectCls} w-52`}
                    >
                        <option value="">All Sites</option>
                        {sitesForRegion.map(s => (
                            <option key={s} value={s}>
                                {s}{siteMap[s]?.site_name ? ` – ${siteMap[s].site_name}` : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown />
                </div>

                {(search || filterHwCategory || filterRegion || filterSite) && (
                    <button
                        onClick={() => { setSearch(''); setFilterHwCategory(''); setFilterRegion(''); setFilterSite(''); resetPage(); }}
                        className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Clear
                    </button>
                )}

                {/* Rows per page + entry count */}
                <div className="ml-auto flex items-center gap-3">
                    {filterHwCategory && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Show</span>
                            <div className="relative">
                                <select
                                    value={pageSize}
                                    onChange={e => { setPageSize(Number(e.target.value)); resetPage(); }}
                                    className="pl-2 pr-6 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 appearance-none"
                                >
                                    {[10, 25, 30, 50, 100].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                                <ChevronDown />
                            </div>
                        </div>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {filtered.length > 0 ? `${startEntry}–${endEntry} of ${filtered.length.toLocaleString()}` : '—'}
                    </span>
                </div>
            </div>

            {/* Table — only shown after a hardware type is selected */}
            {!filterHwCategory ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Select a hardware type to get started</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Choose CPU / PC, Server, or Switch from the filter above</p>
                    <div className="flex gap-3">
                        {[
                            { label: 'CPU / PC',  value: 'CPU',    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                            { label: 'Server',    value: 'SERVER', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
                            { label: 'Switch',    value: 'SWITCH', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                        ].map(t => (
                            <button
                                key={t.value}
                                onClick={() => { setFilterHwCategory(t.value); resetPage(); }}
                                className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all group"
                            >
                                <svg className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                                </svg>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                {!loading && filtered.length > 0 && (
                    <ConfigCompletionCard rows={filtered} category={filterHwCategory} cpuView={cpuView} serverView={serverView} />
                )}
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                            {renderHeader()}
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <SkeletonRows />
                            ) : paged.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                                        No records match your current filters.
                                    </td>
                                </tr>
                            ) : (
                                paged.map((row, i) => renderRow(row, i))
                            )}
                        </tbody>
                    </table>
                </div>
                </>
            )}

            {/* Pagination */}
            {filterHwCategory && totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Config modal */}
            {selected && (
                <ConfigModal
                    hw={selected}
                    siteMap={siteMap}
                    regionMap={regionMap}
                    cpuView={cpuView}
                    serverView={serverView}
                    onClose={() => setSelected(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}

export default MasterfileHardwareManagement;

// src/pages/masterfile/MasterfileInventory.js
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useApi } from '../../hooks/useApi';
import AddHardwareModal from './components/AddHardwareModal';
import BulkRequestModal from './components/BulkRequestModal';

// ── Skeleton components ──
const SkeletonRow = () => (
    <tr>
        {[...Array(9)].map((_, i) => (
            <td key={i} className="px-3 py-3">
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-xs animate-pulse" />
            </td>
        ))}
    </tr>
);

const SkeletonTableCard = () => (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-3 py-3 w-10"></th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Region</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Site</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Asset</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Serial</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Brand</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Model</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-20">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
            </table>
        </div>
    </div>
);

// Minimalist Toast Component
const Toast = ({ message, type = 'error', onClose }) => {
    const bgColor = type === 'error'
        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';

    useEffect(() => {
        const timer = setTimeout(onClose, type === 'error' ? 8000 : 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-6 right-6 z-[60] p-4 rounded-xl border shadow-xl max-w-lg ${bgColor} flex items-start gap-3 text-sm`}>
            <div className="flex-1 whitespace-pre-wrap leading-relaxed">{message}</div>
            <button onClick={onClose} className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">×</button>
        </div>
    );
};

// ── Field-level mini bar (inside expanded accuracy card) ──
const FieldBar = ({ label, pct, filled, total, note }) => {
    const color = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2">
            <div className="w-36 shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">{label}</span>
                {note && <span className="text-xs text-gray-400 dark:text-gray-500 italic">{note}</span>}
            </div>
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden min-w-0">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-9 text-right shrink-0">{pct}%</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 w-20 text-right shrink-0">{filled.toLocaleString()} / {total.toLocaleString()}</span>
        </div>
    );
};

// ── Accuracy summary card (click opens a modal) ──
const AccuracyCard = ({ title, pct, colorClass = 'bg-emerald-500', badge, badgeClass, hint, onClick }) => {
    const barPct = pct !== null && pct !== undefined ? Math.min(100, Math.max(0, pct)) : null;
    return (
        <button
            onClick={onClick}
            className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden text-left hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
        >
            <div className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
                    {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    {badge != null && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}`}>{badge}</span>
                    )}
                    {barPct !== null && (
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{barPct}%</span>
                    )}
                    <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                </div>
            </div>
            {barPct !== null && (
                <div className="px-5 pb-4">
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-2.5 rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${barPct}%` }} />
                    </div>
                </div>
            )}
        </button>
    );
};

// ── Accuracy detail modal ──
const AccuracyModal = ({ title, onClose, children }) => {
    const elRef = useRef(null);
    if (!elRef.current) elRef.current = document.createElement('div');
    useEffect(() => {
        let root = document.getElementById('modal-root');
        if (!root) { root = document.createElement('div'); root.id = 'modal-root'; document.body.appendChild(root); }
        root.appendChild(elRef.current);
        const el = elRef.current;
        return () => { if (el.parentNode) el.parentNode.removeChild(el); };
    }, []);
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto px-6 py-5 flex-1">
                    {children}
                </div>
            </div>
        </div>,
        elRef.current
    );
};

// ── Hardware detail modal (pull-out view) ──
const DetailField = ({ label, value, mono = false }) => {
    const display = String(value ?? '').trim() || '—';
    return (
        <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
            <p className={`text-sm font-medium text-gray-800 dark:text-gray-100 ${mono ? 'font-mono' : ''} ${display === '—' ? 'text-gray-400 dark:text-gray-600' : ''}`}>
                {display}
            </p>
        </div>
    );
};

const getFileUrl = (path) => {
    if (!path) return null;
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return `http://omniops.local${path}`;
    }
    return path;
};

const HardwareDetailModal = ({ item, request, siteMap, regionMap, onClose, onAttachSuccess }) => {
    const { postFormData } = useApi();
    const user = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);

    const [attachFile, setAttachFile] = useState(null);
    const [attachLoading, setAttachLoading] = useState(false);
    const [attachError, setAttachError] = useState('');
    const [attachSuccess, setAttachSuccess] = useState(false);
    const [imgPreviewUrl, setImgPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const hasAttachment = request && String(request.attachment_path || '').trim();
    const fileUrl = hasAttachment ? getFileUrl(request.attachment_path) : null;

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
            setAttachError('Only PDF, JPG, or PNG files are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setAttachError('File size must be under 5 MB.');
            return;
        }
        setAttachError('');
        setAttachFile(file);
        setImgPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleSubmit = async () => {
        if (!attachFile) { setAttachError('Please select a file first.'); return; }
        setAttachLoading(true);
        setAttachError('');
        try {
            let result;
            if (request?.request_id) {
                // Request exists but no file — update attachment
                const fd = new FormData();
                fd.append('attachment', attachFile);
                result = await postFormData(
                    `/api/request-tbl/updateAttachment/${request.request_id}.json`,
                    fd
                );
            } else {
                // No request at all — create a minimal pull-out record with attachment
                const now = new Date();
                const mysqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
                const payload = {
                    request_type: 'PULL_OUT',
                    requested_by: user?.id || user?.user_id || 1,
                    requested_at: mysqlDatetime,
                    updated_at: mysqlDatetime,
                    status: 'PENDING',
                    site_code: item.site_code || null,
                    asset_num: item.hw_asset_num || null,
                    serial_num: item.hw_serial_num || null,
                    item_desc: item.item_desc || null,
                    hw_brand_name: item.hw_brand_name || null,
                    hw_model: item.hw_model || null,
                    quantity: 1,
                    items: [{
                        hw_id: item.hw_id,
                        site_code: item.site_code || null,
                        asset_num: item.hw_asset_num || null,
                        serial_num: item.hw_serial_num || null,
                        item_desc: item.item_desc || null,
                        hw_brand_name: item.hw_brand_name || null,
                        hw_model: item.hw_model || null,
                        quantity: 1,
                    }],
                };
                const fd = new FormData();
                fd.append('data', JSON.stringify(payload));
                fd.append('attachment', attachFile);
                result = await postFormData('/api/request-tbl.json', fd);
            }

            if (result?.success) {
                setAttachSuccess(true);
                setTimeout(() => { onAttachSuccess?.(); onClose(); }, 1500);
            } else {
                setAttachError(result?.message || 'Upload failed. Please try again.');
            }
        } catch (err) {
            setAttachError('Upload failed: ' + (err.message || 'Unknown error'));
        } finally {
            setAttachLoading(false);
        }
    };

    if (!item) return null;

    const root = document.getElementById('modal-root') || (() => {
        const el = document.createElement('div');
        el.id = 'modal-root';
        document.body.appendChild(el);
        return el;
    })();

    const site = siteMap?.[item.site_code];
    const regionName = site ? (regionMap?.[String(site.region_id)] || '—') : '—';
    const siteDisplay = site ? `${site.site_code} – ${site.site_name || ''}`.trim() : (item.site_code || '—');

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Pull-Out Details</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.item_desc || 'Hardware'} · {item.hw_asset_num || '—'}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">

                    {/* Hardware */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Hardware</p>
                        <div className="grid grid-cols-2 gap-4">
                            <DetailField label="Type" value={item.item_desc} />
                            <DetailField label="Status" value={item.hw_status} />
                            <DetailField label="Brand" value={item.hw_brand_name} />
                            <DetailField label="Model" value={item.hw_model} />
                            <DetailField label="Asset Number" value={item.hw_asset_num} mono />
                            <DetailField label="Serial Number" value={item.hw_serial_num} mono />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Location</p>
                        <div className="grid grid-cols-2 gap-4">
                            <DetailField label="Region" value={regionName} />
                            <DetailField label="Site" value={siteDisplay} />
                        </div>
                    </div>

                    {/* ── Pull-Out Form section ── */}
                    <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Pull-Out Form</p>

                        {hasAttachment ? (
                            /* ── Case 1: attachment exists — view only ── */
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Attachment on file</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono truncate">{request.attachment_path}</p>
                                    </div>
                                </div>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View File
                                </a>
                                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                                    File is locked once submitted. Contact your supervisor to replace it.
                                </p>
                            </div>
                        ) : (
                            /* ── Case 2 & 3: no attachment — allow upload ── */
                            <div className="space-y-4">
                                {/* Status banner */}
                                {request ? (
                                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3.5">
                                        <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                        </svg>
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            A pull-out request was filed but no form was attached. Upload the form below.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3.5">
                                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-xs text-red-700 dark:text-red-300">
                                            No pull-out form on file for this hardware.
                                        </p>
                                    </div>
                                )}

                                {/* Disclaimer */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        <span className="font-semibold">Note:</span> This hardware was pulled out under the previous system which did not require an online request. You can upload the pull-out form here as documentation. Once submitted, the file cannot be replaced — contact your supervisor if a correction is needed.
                                    </p>
                                </div>

                                {/* Upload zone */}
                                {!attachSuccess ? (
                                    <>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDrop={handleDrop}
                                            onDragOver={e => e.preventDefault()}
                                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                                                attachFile
                                                    ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/15'
                                            }`}
                                        >
                                            {!attachFile ? (
                                                <div className="space-y-2">
                                                    <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Click or drag file here</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">PDF, JPG, PNG · Max 5 MB</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    {imgPreviewUrl ? (
                                                        <img src={imgPreviewUrl} alt="preview" className="max-h-28 object-contain rounded border border-gray-200 dark:border-gray-700" />
                                                    ) : (
                                                        <svg className="w-10 h-10 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z" />
                                                        </svg>
                                                    )}
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate max-w-xs">{attachFile.name}</p>
                                                    <p className="text-xs text-gray-400">({(attachFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setAttachFile(null); setImgPreviewUrl(null); setAttachError(''); }}
                                                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />

                                        {attachError && (
                                            <p className="text-xs text-red-600 dark:text-red-400">{attachError}</p>
                                        )}

                                        <button
                                            onClick={handleSubmit}
                                            disabled={!attachFile || attachLoading}
                                            className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                                !attachFile || attachLoading
                                                    ? 'bg-indigo-300 dark:bg-indigo-800 cursor-not-allowed text-white'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            {attachLoading ? 'Uploading…' : 'Submit Attachment'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 py-4 text-emerald-600 dark:text-emerald-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm font-medium">Attachment uploaded successfully!</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Request details (if any) */}
                    {request && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Request Details</p>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Request #{request.request_id}</span>
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        {(request.status || 'PENDING').toUpperCase()}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <DetailField label="Submitted" value={request.created_at ? new Date(request.created_at).toLocaleDateString() : null} />
                                    {request.delivery_method && (
                                        <DetailField label="Delivery" value={request.delivery_method === 'courier' ? 'Courier' : 'Personal Pickup'} />
                                    )}
                                    {request.tracking_num && <DetailField label="Tracking No." value={request.tracking_num} mono />}
                                    {request.delivered_by && <DetailField label="Delivered By" value={request.delivered_by} />}
                                    {request.pickup_date && <DetailField label="Pickup Date" value={request.pickup_date} />}
                                    {request.return_date && <DetailField label="Return Date" value={request.return_date} />}
                                </div>
                                {request.remarks && (
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Remarks</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{request.remarks}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>,
        root
    );
};

function MasterfileInventory() {
    const { fetchData, postFormData } = useApi();

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const role = (user.user_type || 'FSE').toString().trim().toUpperCase();
    const isFSE = role === 'FSE';

    const [hardware, setHardware] = useState([]);
    const [allSites, setAllSites] = useState([]);
    const [availableRegions, setAvailableRegions] = useState([]);
    const [allowedRegionIds, setAllowedRegionIds] = useState([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedSite, setSelectedSite] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [baseLoading, setBaseLoading] = useState(true);
    const [hardwareLoading, setHardwareLoading] = useState(false);

    const [hwTypes, setHwTypes] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [statusFilter, setStatusFilter] = useState('On Site');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [editHardware, setEditHardware] = useState(null);
    const [highlightedRowId, setHighlightedRowId] = useState(null);

    // Checkbox selection
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectedSiteCode, setSelectedSiteCode] = useState(null);
    const [selectedItemDesc, setSelectedItemDesc] = useState(null);

    // Bulk modal control
    const [bulkModalProps, setBulkModalProps] = useState({
        isOpen: false,
        actionType: '',
        selectedItems: [],
    });

    const [toast, setToast] = useState(null);
    const [viewDetailItem, setViewDetailItem] = useState(null);
    const [pulloutRequests, setPulloutRequests] = useState([]);
    const [accuracyModal, setAccuracyModal] = useState(null); // null | 'profile' | 'duplicates' | 'attachment'

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
    };

    const userRegionIds = useMemo(() => {
        if (!user.region_assigned) return [];
        return user.region_assigned.split(',').map(id => id.trim()).filter(Boolean);
    }, [user.region_assigned]);

    const stableFetchData = useRef(fetchData);
    useEffect(() => { stableFetchData.current = fetchData; }, [fetchData]);

    useEffect(() => {
        const loadBaseData = async () => {
            setBaseLoading(true);
            try {
                const [siteRes, regionRes] = await Promise.all([
                    stableFetchData.current('/api/site-list-tbl.json'),
                    stableFetchData.current('/api/region-tbl.json'),
                ]);

                if (siteRes?.siteListTbl) setAllSites(siteRes.siteListTbl);

                let allowedRegions = [];

                if (role === 'ADM' && user.cluster_name === 'All Cluster') {
                    allowedRegions = regionRes.regionTbl;
                } else if (['SPV', 'SUPERVISOR'].includes(role) && user.cluster_name) {
                    allowedRegions = regionRes.regionTbl.filter(
                        r => String(r.cluster_name).trim() === user.cluster_name
                    );
                } else {
                    allowedRegions = regionRes.regionTbl.filter(r =>
                        userRegionIds.includes(String(r.region_id))
                    );
                }

                const regionIds = allowedRegions.map(r => String(r.region_id));

                setAvailableRegions(allowedRegions);
                setAllowedRegionIds(regionIds);

                if (allowedRegions.length === 1) {
                    setSelectedRegion(String(allowedRegions[0].region_id));
                }
            } catch (err) {
                console.error('Failed to load base data:', err);
            } finally {
                setBaseLoading(false);
            }
        };

        loadBaseData();
    }, [userRegionIds, role, user.cluster_name]);

    useEffect(() => {
        const loadHardware = async () => {
            setHardwareLoading(true);
            try {
                const isPullOutView = statusFilter === 'Pull Out';

                const [hwResult, reqResult] = await Promise.all([
                    stableFetchData.current('/api/hw-tbl.json'),
                    isPullOutView
                        ? stableFetchData.current('/api/request-tbl.json')
                        : Promise.resolve(null),
                ]);

                const allHw = hwResult?.hwTbl || [];

                let filteredHw;
                if (statusFilter === 'On Site') {
                    filteredHw = allHw.filter(item =>
                        item.hw_status === 'On Site' || item.hw_status === 'Onsite'
                    );
                } else if (isPullOutView) {
                    filteredHw = allHw.filter(item =>
                        item.hw_status === 'Pull Out' || item.hw_status === 'Pullout'
                    );
                } else {
                    filteredHw = allHw;
                }

                setHardware(filteredHw);
                setPulloutRequests(reqResult?.requests || []);

                const typeMap = {};
                filteredHw.forEach(item => {
                    const type = (item.item_desc || '').trim();
                    if (type) typeMap[type.toLowerCase()] = type;
                });
                setHwTypes(Object.values(typeMap).sort());
            } catch (err) {
                console.error('Failed to load hardware:', err);
                setHardware([]);
                setHwTypes([]);
            } finally {
                setHardwareLoading(false);
            }
        };

        loadHardware();
    }, [statusFilter]);

    // Reset selection when filter/page changes
    useEffect(() => {
        setSelectedRows(new Set());
        setSelectedSiteCode(null);
        setSelectedItemDesc(null);
    }, [selectedRegion, selectedSite, selectedType, statusFilter, currentPage]);

    // Memoized lookups
    const siteMap = useMemo(() => {
        const map = {};
        allSites.forEach(site => { map[site.site_code] = site; });
        return map;
    }, [allSites]);

    const regionMap = useMemo(() => {
        const map = {};
        availableRegions.forEach(r => { map[String(r.region_id)] = r.region_name; });
        return map;
    }, [availableRegions]);

    const filteredSites = selectedRegion
        ? allSites.filter(site => String(site.region_id) === selectedRegion)
        : allSites.filter(site =>
            allowedRegionIds.length === 0 || allowedRegionIds.includes(String(site.region_id))
        );

    const filteredHardware = hardware
        .filter(h => {
            if (h.site_code === 'VM-Server') return false;
            const site = siteMap[h.site_code];
            if (!site) return false;
            return allowedRegionIds.length === 0 || allowedRegionIds.includes(String(site.region_id));
        })
        .filter(h => !selectedRegion || filteredSites.some(s => s.site_code === h.site_code))
        .filter(h => !selectedSite || h.site_code === selectedSite)
        .filter(h => !selectedType || h.item_desc === selectedType)
        .filter(h => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const site = siteMap[h.site_code];
            const regionName = site ? (regionMap[String(site.region_id)] || '') : '';
            return (
                (h.hw_asset_num || '').toLowerCase().includes(term) ||
                (h.hw_serial_num || '').toLowerCase().includes(term) ||
                (h.item_desc || '').toLowerCase().includes(term) ||
                (h.hw_brand_name || '').toLowerCase().includes(term) ||
                (h.hw_model || '').toLowerCase().includes(term) ||
                (h.site_code || '').toLowerCase().includes(term) ||
                (site?.site_name || '').toLowerCase().includes(term) ||
                regionName.toLowerCase().includes(term)
            );
        });

    const sortedHardware = useMemo(() => {
        return [...filteredHardware].sort((a, b) => {
            const siteA = siteMap[a.site_code];
            const siteB = siteMap[b.site_code];

            const regionIdA = siteA ? Number(siteA.region_id) || 999999 : 999999;
            const regionIdB = siteB ? Number(siteB.region_id) || 999999 : 999999;

            if (regionIdA < regionIdB) return -1;
            if (regionIdA > regionIdB) return 1;

            const siteCodeA = siteA?.site_code || '';
            const siteCodeB = siteB?.site_code || '';
            return siteCodeA.localeCompare(siteCodeB);
        });
    }, [filteredHardware, siteMap]);

    const totalPages = Math.ceil(sortedHardware.length / rowsPerPage);
    const paginatedHardware = sortedHardware.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Index pull-out requests by hw_id (most recent per hardware)
    const pulloutRequestMap = useMemo(() => {
        const map = new Map();
        [...pulloutRequests]
            .filter(r => r.request_type?.toUpperCase() === 'PULL_OUT' && r.hw_id)
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .forEach(r => {
                const key = String(r.hw_id);
                if (!map.has(key)) map.set(key, r);
            });
        return map;
    }, [pulloutRequests]);

    // ── Accuracy stats (computed from full filtered+sorted set, not paginated) ──
    const PLACEHOLDER_VALUES = new Set([
        'NOT_APPLICABLE', 'TAG_REMOVED_UNREADABLE', 'UNREADABLE_MISSING',
        'N/A', 'No Tag', 'Unreadable', 'n/a', 'null', 'NULL', 'Not Set', '',
    ]);
    const validField = (v) => {
        const s = String(v ?? '').trim();
        return s && !PLACEHOLDER_VALUES.has(s) && !PLACEHOLDER_VALUES.has(s.toUpperCase());
    };

    const accuracyStats = useMemo(() => {
        const total = sortedHardware.length;
        if (!total) return null;

        const isCpuItem = h => {
            const d = (h.item_desc || '').toLowerCase();
            return d.includes('cpu') || d.includes('desktop') || d.includes('laptop') || d.includes('workstation');
        };
        const PROFILE_FIELDS = [
            { key: 'hw_asset_num', label: 'Asset Number' },
            { key: 'hw_serial_num', label: 'Serial Number' },
            { key: 'item_desc', label: 'Item Type' },
            { key: 'hw_brand_name', label: 'Brand' },
            { key: 'hw_model', label: 'Model' },
            { key: 'os_type', label: 'OS Type', filter: isCpuItem, note: 'CPU/PC only' },
        ];
        const fieldStats = PROFILE_FIELDS.map(({ key, label, filter, note }) => {
            const subset = filter ? sortedHardware.filter(filter) : sortedHardware;
            const subTotal = subset.length;
            const filled = subset.filter(h => validField(h[key])).length;
            return { key, label, note, filled, missing: subTotal - filled, total: subTotal, pct: subTotal > 0 ? Math.round((filled / subTotal) * 100) : 100 };
        });

        const fullyProfiled = sortedHardware.filter(h =>
            validField(h.hw_asset_num) &&
            validField(h.hw_serial_num) &&
            validField(h.hw_brand_name) &&
            validField(h.hw_model)
        ).length;

        if (statusFilter === 'Pull Out') {
            const withAttachment = sortedHardware.filter(h => {
                const req = pulloutRequestMap.get(String(h.hw_id));
                return req && String(req.attachment_path || '').trim();
            }).length;
            const noAttachmentItems = sortedHardware.filter(h => {
                const req = pulloutRequestMap.get(String(h.hw_id));
                return !(req && String(req.attachment_path || '').trim());
            });
            return {
                isPullOut: true,
                total,
                fullyProfiled,
                profilePct: Math.round((fullyProfiled / total) * 100),
                fieldStats,
                withAttachment,
                attachPct: pulloutRequests.length > 0 ? Math.round((withAttachment / total) * 100) : null,
                noAttachment: total - withAttachment,
                noAttachmentItems,
            };
        }

        // Duplicate detection among on-site hardware
        const assetGroups = new Map();
        const serialGroups = new Map();
        sortedHardware.forEach(h => {
            if (validField(h.hw_asset_num)) {
                const k = String(h.hw_asset_num).trim();
                if (!assetGroups.has(k)) assetGroups.set(k, []);
                assetGroups.get(k).push(h);
            }
            if (validField(h.hw_serial_num)) {
                const k = String(h.hw_serial_num).trim();
                if (!serialGroups.has(k)) serialGroups.set(k, []);
                serialGroups.get(k).push(h);
            }
        });
        const dupAssets = [...assetGroups.entries()]
            .filter(([, items]) => items.length > 1)
            .map(([value, items]) => ({ value, items }))
            .sort((a, b) => b.items.length - a.items.length);
        const dupSerials = [...serialGroups.entries()]
            .filter(([, items]) => items.length > 1)
            .map(([value, items]) => ({ value, items }))
            .sort((a, b) => b.items.length - a.items.length);

        return {
            isPullOut: false,
            total,
            fullyProfiled,
            profilePct: Math.round((fullyProfiled / total) * 100),
            fieldStats,
            incompleteProfile: total - fullyProfiled,
            dupAssets,
            dupSerials,
            totalDuplicates: dupAssets.length + dupSerials.length,
        };
    }, [sortedHardware, statusFilter, pulloutRequestMap, pulloutRequests.length]); // eslint-disable-line react-hooks/exhaustive-deps

    const showRegionDropdown = availableRegions.length > 1;
    const isLoading = baseLoading || hardwareLoading;

    const selectClasses =
        'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 ' +
        'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ' +
        'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ' +
        'transition-colors appearance-none cursor-pointer ' +
        'disabled:opacity-60 disabled:cursor-not-allowed';

    const selectStyle = {
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '1.2em',
        paddingRight: '2.5rem',
    };

    // Checkbox selection logic – MAX 5 ITEMS + strict same site/type
    const toggleRowSelection = (item) => {
        const hwId = item.hw_id;
        const currentSiteCode = item.site_code;
        const currentItemDesc = item.item_desc?.trim() || '';

        const selectedSet = new Set(selectedRows);

        if (selectedSet.has(hwId)) {
            // Deselecting – safe
            selectedSet.delete(hwId);
            if (selectedSet.size === 0) {
                setSelectedSiteCode(null);
                setSelectedItemDesc(null);
            }
            setSelectedRows(selectedSet);
            return;
        }

        // Max 5 items limit
        if (selectedSet.size >= 5) {
            showToast('Maximum of 5 hardware items allowed for bulk action', 'error');
            return;
        }

        // If first selection – set reference
        if (selectedSet.size === 0) {
            selectedSet.add(hwId);
            setSelectedSiteCode(currentSiteCode);
            setSelectedItemDesc(currentItemDesc);
            setSelectedRows(selectedSet);
            return;
        }

        // Subsequent selection – must match the reference site and type
        const firstSelectedId = [...selectedSet][0];
        const firstSelectedItem = hardware.find(h => h.hw_id === firstSelectedId);

        if (firstSelectedItem) {
            const firstSiteCode = firstSelectedItem.site_code;
            const firstItemDesc = firstSelectedItem.item_desc?.trim() || '';

            if (
                firstSiteCode !== currentSiteCode ||
                firstItemDesc !== currentItemDesc
            ) {
                showToast('Only hardware from the same site and same type can be selected together', 'error');
                return;
            }
        }

        // All checks passed – add it
        selectedSet.add(hwId);
        setSelectedRows(selectedSet);
    };

    // Open bulk modal – extra safety check
    const openBulkModal = (action) => {
        if (selectedRows.size === 0) {
            showToast('Please select at least one item', 'error');
            return;
        }

        if (selectedRows.size > 5) {
            showToast('Maximum of 5 hardware items allowed (template limit)', 'error');
            return;
        }

        const selectedItemsArray = sortedHardware.filter(item => selectedRows.has(item.hw_id));

        setBulkModalProps({
            isOpen: true,
            actionType: action,
            selectedItems: selectedItemsArray,
        });
    };

    const handleAddHardwareSubmit = async (hardwareData) => {
        setSubmitLoading(true);
        try {
            const formDataToSend = new FormData();

            formDataToSend.append('region_id', hardwareData.region_id || '');
            formDataToSend.append('site_code', hardwareData.site_code || '');
            formDataToSend.append('asset_num', hardwareData.asset_num || '');
            formDataToSend.append('serial_num', hardwareData.serial_num || '');
            formDataToSend.append('item_desc', hardwareData.item_desc || '');
            formDataToSend.append('sub_major_type', hardwareData.sub_major_type || '');
            formDataToSend.append('hw_brand_name', hardwareData.hw_brand_name || '');
            formDataToSend.append('hw_model', hardwareData.hw_model || '');
            formDataToSend.append('os_type', hardwareData.os_type || '');

            formDataToSend.append('hw_status', 'On Site');
            formDataToSend.append('region_name', hardwareData.region_id || '');

            let assetValue = hardwareData.asset_num || '';
            if (!assetValue && hardwareData.assetTagType) {
                if (hardwareData.assetTagType === 'NOT_APPLICABLE') assetValue = 'N/A';
                else if (hardwareData.assetTagType === 'TAG_REMOVED_UNREADABLE') assetValue = 'No Tag';
            }
            formDataToSend.append('asset_num', assetValue);
            formDataToSend.append('hw_asset_num', assetValue);

            let serialValue = hardwareData.serial_num || '';
            if (!serialValue && hardwareData.serialTagType) {
                if (hardwareData.serialTagType === 'NOT_APPLICABLE') serialValue = 'N/A';
                else if (hardwareData.serialTagType === 'UNREADABLE_MISSING') serialValue = 'Unreadable';
            }
            formDataToSend.append('serial_num', serialValue);
            formDataToSend.append('hw_serial_num', serialValue);

            formDataToSend.append('hw_date_acq', new Date().toISOString().split('T')[0]);
            formDataToSend.append('hw_acq_val', '0.00');
            formDataToSend.append('hw_host_name', 'Not Set');
            formDataToSend.append('hw_ip_add', 'Not Set');
            formDataToSend.append('hw_mac_add', 'Not Set');
            formDataToSend.append('hw_user_name', 'Not Set');
            formDataToSend.append('hw_primary_role', 'Not Set');
            formDataToSend.append('user_id', user.id || user.user_id || 1);

            const placeholders = ['N/A', 'No Tag', 'Unreadable', 'NOT_APPLICABLE', 'TAG_REMOVED_UNREADABLE', 'UNREADABLE_MISSING'];

            const newAssetNum = assetValue.trim();
            const newSerialNum = serialValue.trim();

            let hasDuplicate = false;

            if (
                (newAssetNum && !placeholders.includes(newAssetNum)) ||
                (newSerialNum && !placeholders.includes(newSerialNum))
            ) {
                const currentHardware = await fetchData('/api/hw-tbl.json');
                const existingHw = currentHardware?.hwTbl || [];

                const activeStatuses = ['On Site', 'Active', 'Installed'];

                const duplicateAsset = existingHw.find(item =>
                    item.hw_id !== editHardware?.hw_id &&
                    item.hw_asset_num?.trim() === newAssetNum &&
                    activeStatuses.includes(item.hw_status?.trim())
                );

                const duplicateSerial = existingHw.find(item =>
                    item.hw_id !== editHardware?.hw_id &&
                    item.hw_serial_num?.trim() === newSerialNum &&
                    activeStatuses.includes(item.hw_status?.trim())
                );

                if (duplicateAsset || duplicateSerial) {
                    hasDuplicate = true;
                    const duplicate = duplicateAsset || duplicateSerial;
                    const field = duplicateAsset ? 'Asset No' : 'Serial No';
                    const value = duplicateAsset ? newAssetNum : newSerialNum;

                    const site = siteMap[duplicate.site_code];
                    const regionName = site ? regionMap[String(site.region_id)] : 'Unknown Region';
                    const siteInfo = site ? `${site.site_code} – ${site.site_name || 'Unnamed'}` : duplicate.site_code || 'Unknown Site';

                    showToast(
                        `Duplicate ${field}: "${value}" already exists with active status (${duplicate.hw_status}).\n` +
                        `Location: ${regionName} → ${siteInfo}\n` +
                        `Existing record ID: ${duplicate.hw_id || 'unknown'}\n\n` +
                        `Please use a different ${field.toLowerCase()}.`,
                        'error'
                    );
                }
            }

            if (!hasDuplicate) {
                await postFormData('/api/hw-tbl/add.json', formDataToSend);

                showToast('Hardware added successfully!', 'success');
                setIsModalOpen(false);

                const updatedResponse = await fetchData('/api/hw-tbl.json');
                const updatedHw = updatedResponse?.hwTbl || [];
                const filteredHw = updatedHw.filter(item =>
                    item.hw_status === 'On Site' || item.hw_status === 'Onsite'
                );
                setHardware(filteredHw);
            }
        } catch (err) {
            console.error('Submit error:', err);
            showToast('Failed to add hardware: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEditHardwareSubmit = async (hardwareData) => {
        setSubmitLoading(true);
        try {
            const formDataToSend = new FormData();

            formDataToSend.append('hw_id', editHardware.hw_id);

            formDataToSend.append('region_id', hardwareData.region_id || '');
            formDataToSend.append('site_code', hardwareData.site_code || '');
            formDataToSend.append('asset_num', hardwareData.asset_num || '');
            formDataToSend.append('serial_num', hardwareData.serial_num || '');
            formDataToSend.append('item_desc', hardwareData.item_desc || '');
            formDataToSend.append('sub_major_type', hardwareData.sub_major_type || '');
            formDataToSend.append('hw_brand_name', hardwareData.hw_brand_name || '');
            formDataToSend.append('hw_model', hardwareData.hw_model || '');
            formDataToSend.append('os_type', hardwareData.os_type || '');

            formDataToSend.append('hw_status', editHardware.hw_status || 'On Site');

            formDataToSend.append('region_name', hardwareData.region_id || '');

            let assetValue = hardwareData.asset_num || '';
            if (!assetValue && hardwareData.assetTagType) {
                if (hardwareData.assetTagType === 'NOT_APPLICABLE') assetValue = 'N/A';
                else if (hardwareData.assetTagType === 'TAG_REMOVED_UNREADABLE') assetValue = 'No Tag';
            }
            formDataToSend.append('asset_num', assetValue);
            formDataToSend.append('hw_asset_num', assetValue);

            let serialValue = hardwareData.serial_num || '';
            if (!serialValue && hardwareData.serialTagType) {
                if (hardwareData.serialTagType === 'NOT_APPLICABLE') serialValue = 'N/A';
                else if (hardwareData.serialTagType === 'UNREADABLE_MISSING') serialValue = 'Unreadable';
            }
            formDataToSend.append('serial_num', serialValue);
            formDataToSend.append('hw_serial_num', serialValue);

            formDataToSend.append('hw_date_acq', editHardware.hw_date_acq || new Date().toISOString().split('T')[0]);
            formDataToSend.append('hw_acq_val', editHardware.hw_acq_val || '0.00');
            formDataToSend.append('hw_host_name', editHardware.hw_host_name || 'Not Set');
            formDataToSend.append('hw_ip_add', editHardware.hw_ip_add || 'Not Set');
            formDataToSend.append('hw_mac_add', editHardware.hw_mac_add || 'Not Set');
            formDataToSend.append('hw_user_name', editHardware.hw_user_name || 'Not Set');
            formDataToSend.append('hw_primary_role', editHardware.hw_primary_role || 'Not Set');
            formDataToSend.append('user_id', user.id || user.user_id || 1);

            const placeholders = ['N/A', 'No Tag', 'Unreadable', 'NOT_APPLICABLE', 'TAG_REMOVED_UNREADABLE', 'UNREADABLE_MISSING'];

            const newAssetNum = assetValue.trim();
            const newSerialNum = serialValue.trim();

            let hasDuplicate = false;

            if (
                (newAssetNum && !placeholders.includes(newAssetNum)) ||
                (newSerialNum && !placeholders.includes(newSerialNum))
            ) {
                const currentHardware = await fetchData('/api/hw-tbl.json');
                const existingHw = currentHardware?.hwTbl || [];

                const activeStatuses = ['On Site', 'Active', 'Installed'];

                const duplicateAsset = existingHw.find(item =>
                    item.hw_id !== editHardware.hw_id &&
                    item.hw_asset_num?.trim() === newAssetNum &&
                    activeStatuses.includes(item.hw_status?.trim())
                );

                const duplicateSerial = existingHw.find(item =>
                    item.hw_id !== editHardware.hw_id &&
                    item.hw_serial_num?.trim() === newSerialNum &&
                    activeStatuses.includes(item.hw_status?.trim())
                );

                if (duplicateAsset || duplicateSerial) {
                    hasDuplicate = true;
                    const duplicate = duplicateAsset || duplicateSerial;
                    const field = duplicateAsset ? 'Asset No' : 'Serial No';
                    const value = duplicateAsset ? newAssetNum : newSerialNum;

                    const site = siteMap[duplicate.site_code];
                    const regionName = site ? regionMap[String(site.region_id)] : 'Unknown Region';
                    const siteInfo = site ? `${site.site_code} – ${site.site_name || 'Unnamed'}` : duplicate.site_code || 'Unknown Site';

                    showToast(
                        `Cannot update: Duplicate ${field}: "${value}" already exists with active status (${duplicate.hw_status}).\n` +
                        `Location: ${regionName} → ${siteInfo}\n` +
                        `Existing record ID: ${duplicate.hw_id || 'unknown'}\n\n` +
                        `Please use a different ${field.toLowerCase()}.`,
                        'error'
                    );
                }
            }

            if (!hasDuplicate) {
                await postFormData('/api/hw-tbl/update.json', formDataToSend);

                showToast('Hardware updated successfully!', 'success');
                setIsModalOpen(false);
                setEditHardware(null);

                setHighlightedRowId(editHardware.hw_id);
                setTimeout(() => setHighlightedRowId(null), 4000);

                const updatedResponse = await fetchData('/api/hw-tbl.json');
                const updatedHw = updatedResponse?.hwTbl || [];
                const filteredHw = updatedHw.filter(item =>
                    statusFilter === 'On Site'
                        ? item.hw_status === 'On Site' || item.hw_status === 'Onsite'
                        : item.hw_status === 'Pull Out' || item.hw_status === 'Pullout'
                );
                setHardware(filteredHw);
            }
        } catch (err) {
            console.error('Update error:', err);
            showToast('Failed to update hardware: ' + (err.message || 'Unknown error'), 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditHardware(item);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Hardware Inventory</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    View hardware by status
                </p>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {!baseLoading && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {showRegionDropdown && (
                            <div className="space-y-1.5">
                                <label className="block text-xs text-gray-600 dark:text-gray-400">Region</label>
                                <select
                                    value={selectedRegion}
                                    onChange={e => { setSelectedRegion(e.target.value); setSelectedSite(''); setCurrentPage(1); }}
                                    className={selectClasses}
                                    style={selectStyle}
                                >
                                    <option value="">All regions</option>
                                    {availableRegions.map(r => (
                                        <option key={r.region_id} value={r.region_id}>{r.region_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs text-gray-600 dark:text-gray-400">Site</label>
                            <select
                                value={selectedSite}
                                onChange={e => { setSelectedSite(e.target.value); setCurrentPage(1); }}
                                disabled={!selectedRegion && showRegionDropdown}
                                className={`${selectClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                style={selectStyle}
                            >
                                <option value="">All sites</option>
                                {filteredSites.map(s => (
                                    <option key={s.site_code} value={s.site_code}>
                                        {s.site_code} – {s.site_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs text-gray-600 dark:text-gray-400">Type</label>
                            <select
                                value={selectedType}
                                onChange={e => { setSelectedType(e.target.value); setCurrentPage(1); }}
                                disabled={isLoading}
                                className={`${selectClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                style={selectStyle}
                            >
                                <option value="">All types</option>
                                {hwTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs text-gray-600 dark:text-gray-400">Search</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                                placeholder="Asset, serial, type, brand, model, site…"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Accuracy Report Cards ── */}
            {!baseLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hardwareLoading ? (
                        [...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 py-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1.5">
                                        <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                        <div className="h-3 w-52 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                    </div>
                                    <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </div>
                                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
                            </div>
                        ))
                    ) : accuracyStats ? (
                        !accuracyStats.isPullOut ? (
                            <>
                                <AccuracyCard
                                    title="Profile Accuracy"
                                    pct={accuracyStats.profilePct}
                                    colorClass={
                                        accuracyStats.profilePct >= 90 ? 'bg-emerald-500'
                                        : accuracyStats.profilePct >= 75 ? 'bg-amber-400'
                                        : 'bg-red-500'
                                    }
                                    hint={`${accuracyStats.fullyProfiled.toLocaleString()} of ${accuracyStats.total.toLocaleString()} fully profiled · click for field breakdown`}
                                    onClick={() => setAccuracyModal('profile')}
                                />
                                <AccuracyCard
                                    title="Duplicate Entries"
                                    badge={
                                        accuracyStats.totalDuplicates === 0
                                            ? 'None found'
                                            : `${accuracyStats.totalDuplicates} group${accuracyStats.totalDuplicates !== 1 ? 's' : ''}`
                                    }
                                    badgeClass={
                                        accuracyStats.totalDuplicates === 0
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    }
                                    hint="Duplicate asset or serial numbers among On Site hardware · click to review"
                                    onClick={() => setAccuracyModal('duplicates')}
                                />
                            </>
                        ) : (
                            <>
                                <AccuracyCard
                                    title="Profile Accuracy"
                                    pct={accuracyStats.profilePct}
                                    colorClass={accuracyStats.profilePct >= 90 ? 'bg-emerald-500' : 'bg-amber-400'}
                                    hint={`${accuracyStats.fullyProfiled.toLocaleString()} of ${accuracyStats.total.toLocaleString()} fully profiled · click for field breakdown`}
                                    onClick={() => setAccuracyModal('profile')}
                                />
                                <AccuracyCard
                                    title="Attachment Coverage"
                                    pct={accuracyStats.attachPct}
                                    colorClass={
                                        accuracyStats.attachPct === null ? 'bg-gray-300'
                                        : accuracyStats.attachPct >= 75 ? 'bg-emerald-500'
                                        : 'bg-amber-400'
                                    }
                                    badge={`${accuracyStats.withAttachment} / ${accuracyStats.total} have a file`}
                                    badgeClass="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                    hint="Pull-out forms on file · click to see hardware without attachment"
                                    onClick={() => setAccuracyModal('attachment')}
                                />
                            </>
                        )
                    ) : null}
                </div>
            )}

            {/* ── Accuracy detail modals ── */}
            {accuracyStats && accuracyModal === 'profile' && (
                <AccuracyModal title="Profile Accuracy — Field Breakdown" onClose={() => setAccuracyModal(null)}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {accuracyStats.fullyProfiled.toLocaleString()} of {accuracyStats.total.toLocaleString()} records have asset number, serial number, brand, and model filled in.
                    </p>
                    <div className="space-y-3">
                        {accuracyStats.fieldStats.map(f => (
                            <FieldBar key={f.key} label={f.label} pct={f.pct} filled={f.filled} total={f.total} note={f.note} />
                        ))}
                    </div>
                </AccuracyModal>
            )}

            {accuracyStats && accuracyModal === 'duplicates' && (
                <AccuracyModal title="Duplicate Entries" onClose={() => setAccuracyModal(null)}>
                    {accuracyStats.totalDuplicates === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No duplicate asset numbers or serial numbers detected among On Site hardware.</p>
                    ) : (
                        <div className="space-y-6">
                            {accuracyStats.dupAssets.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                        Asset Number · {accuracyStats.dupAssets.length} duplicate group{accuracyStats.dupAssets.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="space-y-2">
                                        {accuracyStats.dupAssets.map(({ value, items }) => (
                                            <div key={value} className="rounded-lg border border-red-100 dark:border-red-900/30 overflow-hidden">
                                                <div className="bg-red-50 dark:bg-red-900/20 px-3 py-1.5 flex items-center gap-2">
                                                    <span className="text-xs font-mono font-semibold text-red-700 dark:text-red-400">{value}</span>
                                                    <span className="text-xs text-red-400 dark:text-red-500">· {items.length} entries</span>
                                                </div>
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                                            <th className="px-3 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium">Type</th>
                                                            <th className="px-3 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium">Brand / Model</th>
                                                            <th className="px-3 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium">Site</th>
                                                            <th className="px-3 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium">Region</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map(h => {
                                                            const site = siteMap?.[h.site_code];
                                                            const regionName = site ? (regionMap?.[String(site.region_id)] || h.region_name) : h.region_name;
                                                            return (
                                                                <tr key={h.hw_id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{h.item_desc || '—'}</td>
                                                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{[h.hw_brand_name, h.hw_model].filter(Boolean).join(' / ') || '—'}</td>
                                                                    <td className="px-3 py-1.5 font-mono text-gray-700 dark:text-gray-300">{h.site_code || '—'}</td>
                                                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{regionName || '—'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {accuracyStats.dupSerials.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                                        Serial Number · {accuracyStats.dupSerials.length} duplicate group{accuracyStats.dupSerials.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="space-y-2">
                                        {accuracyStats.dupSerials.map(({ value, items }) => (
                                            <div key={value} className="rounded-lg border border-amber-100 dark:border-amber-900/30 overflow-hidden">
                                                <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 flex items-center gap-2">
                                                    <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400">{value}</span>
                                                    <span className="text-xs text-amber-400 dark:text-amber-500">· {items.length} entries</span>
                                                </div>
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                                            <th className="px-3 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium">Type</th>
                                                            <th className="px-3 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium">Brand / Model</th>
                                                            <th className="px-3 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium">Site</th>
                                                            <th className="px-3 py-1.5 text-left text-gray-500 dark:text-gray-400 font-medium">Region</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map(h => {
                                                            const site = siteMap?.[h.site_code];
                                                            const regionName = site ? (regionMap?.[String(site.region_id)] || h.region_name) : h.region_name;
                                                            return (
                                                                <tr key={h.hw_id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{h.item_desc || '—'}</td>
                                                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{[h.hw_brand_name, h.hw_model].filter(Boolean).join(' / ') || '—'}</td>
                                                                    <td className="px-3 py-1.5 font-mono text-gray-700 dark:text-gray-300">{h.site_code || '—'}</td>
                                                                    <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{regionName || '—'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </AccuracyModal>
            )}

            {accuracyStats && accuracyModal === 'attachment' && (
                <AccuracyModal title="Attachment Coverage — Missing Forms" onClose={() => setAccuracyModal(null)}>
                    {accuracyStats.noAttachment === 0 ? (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">All pulled-out hardware has a pull-out form on file.</p>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {accuracyStats.noAttachment} pulled-out item{accuracyStats.noAttachment !== 1 ? 's have' : ' has'} no form on file.
                            </p>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Asset</th>
                                        <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Type</th>
                                        <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Site</th>
                                        <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Region</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accuracyStats.noAttachmentItems.map(h => {
                                        const site = siteMap?.[h.site_code];
                                        const regionName = site ? (regionMap?.[String(site.region_id)] || h.region_name) : h.region_name;
                                        return (
                                            <tr key={h.hw_id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                                <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">{h.hw_asset_num || '—'}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{h.item_desc || '—'}</td>
                                                <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">{h.site_code || '—'}</td>
                                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{regionName || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AccuracyModal>
            )}

            {baseLoading ? (
                <SkeletonTableCard />
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">Hardware</h2>

                            <div className="inline-flex rounded-md border border-gray-300/70 dark:border-gray-700/70 bg-gray-100/80 dark:bg-gray-800/80 p-0.5 shadow-sm">
                                <button
                                    type="button"
                                    disabled={hardwareLoading}
                                    onClick={() => {
                                        setStatusFilter('On Site');
                                        setCurrentPage(1);
                                        setSelectedRows(new Set());
                                        setSelectedSiteCode(null);
                                        setSelectedItemDesc(null);
                                    }}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                        statusFilter === 'On Site'
                                            ? 'bg-green-600 text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    On-site
                                </button>
                                <button
                                    type="button"
                                    disabled={hardwareLoading}
                                    onClick={() => {
                                        setStatusFilter('Pull Out');
                                        setCurrentPage(1);
                                        setSelectedRows(new Set());
                                        setSelectedSiteCode(null);
                                        setSelectedItemDesc(null);
                                    }}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                        statusFilter === 'Pull Out'
                                            ? 'bg-red-600 text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-gray-700/50'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    Pull Out
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {isFSE && selectedRows.size === 0 && (
                                <button
                                    onClick={() => {
                                        setEditHardware(null);
                                        setIsModalOpen(true);
                                    }}
                                    className="px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                    + Add Hardware
                                </button>
                            )}

                            {selectedRows.size > 0 && isFSE && statusFilter === 'On Site' && (
                                <>
                                    <button
                                        onClick={() => openBulkModal('pullout')}
                                        className="px-4 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors shadow-sm"
                                    >
                                        Pull Out Form({selectedRows.size})
                                    </button>
                                    <button
                                        onClick={() => openBulkModal('relocation')}
                                        className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm"
                                    >
                                        Relocation Form ({selectedRows.size})
                                    </button>
                                </>
                            )}

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Rows</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className={selectClasses}
                                    style={selectStyle}
                                >
                                    {[10, 25, 50, 100, 200].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>

                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {sortedHardware.length} item{sortedHardware.length !== 1 ? 's' : ''}
                            </span>

                            {selectedRows.size > 0 && (
                                <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                    ({selectedRows.size} selected)
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                                <th className="px-3 py-3 w-10 text-left"></th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Region</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Site</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Asset</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Serial</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Brand</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Model</th>
                                {(isFSE || statusFilter === 'Pull Out') && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-24">Actions</th>}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {hardwareLoading ? (
                                [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                            ) : paginatedHardware.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No matching hardware
                                    </td>
                                </tr>
                            ) : (
                                paginatedHardware.map((item, idx) => {
                                    const site = siteMap[item.site_code];
                                    const regionName = site ? regionMap[String(site.region_id)] : null;
                                    const isPullOut = statusFilter === 'Pull Out';
                                    const rowTextClass = isPullOut
                                        ? 'text-gray-400 dark:text-gray-500'
                                        : 'text-gray-900 dark:text-gray-100';
                                    const secondaryTextClass = isPullOut
                                        ? 'text-gray-400 dark:text-gray-500'
                                        : 'text-gray-600 dark:text-gray-300';
                                    const isHighlighted = highlightedRowId === item.hw_id;

                                    const isSelected = selectedRows.has(item.hw_id);
                                    const isCheckboxDisabled = isPullOut;

                                    return (
                                        <tr
                                            key={idx}
                                            className={`transition-colors duration-1000 ${isHighlighted ? 'highlighted-row' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}
                                        >
                                            <td className="px-3 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleRowSelection(item)}
                                                    disabled={isCheckboxDisabled}
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </td>
                                            <td className={`px-3 py-3 text-sm ${secondaryTextClass}`}>
                                                {regionName || '—'}
                                            </td>
                                            <td className={`px-3 py-3 text-sm ${secondaryTextClass}`}>
                                                {site ? `${site.site_code} – ${site.site_name || '—'}` : '—'}
                                            </td>
                                            <td className={`px-3 py-3 text-sm ${rowTextClass}`}>
                                              <span className={item.hw_asset_num ? 'font-medium' : ''}>
                                                {item.hw_asset_num || '—'}
                                              </span>
                                            </td>
                                            <td className={`px-3 py-3 text-sm ${secondaryTextClass}`}>
                                                {item.hw_serial_num || '—'}
                                            </td>
                                            <td className={`px-3 py-3 text-sm ${secondaryTextClass}`}>{item.item_desc || '—'}</td>
                                            <td className={`px-3 py-3 text-sm ${secondaryTextClass}`}>{item.hw_brand_name || '—'}</td>
                                            <td className={`px-3 py-3 text-sm ${secondaryTextClass}`}>{item.hw_model || '—'}</td>
                                            {(isFSE || statusFilter === 'Pull Out') && (
                                                <td className="px-3 py-3 text-sm">
                                                    {isFSE && statusFilter === 'On Site' ? (
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                    ) : statusFilter === 'Pull Out' ? (
                                                        <button
                                                            onClick={() => setViewDetailItem(item)}
                                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium"
                                                        >
                                                            View Details
                                                        </button>
                                                    ) : null}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>

                    {!hardwareLoading && paginatedHardware.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center px-5 py-3 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2 mt-3 sm:mt-0">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-40 transition-colors"
                                >
                                    Prev
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 disabled:opacity-40 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <AddHardwareModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditHardware(null);
                }}
                onSubmit={editHardware ? handleEditHardwareSubmit : handleAddHardwareSubmit}
                loading={submitLoading}
                allSites={allSites}
                availableRegions={availableRegions}
                allowedRegionIds={allowedRegionIds}
                role={role}
                initialData={editHardware}
            />

            <BulkRequestModal
                isOpen={bulkModalProps.isOpen}
                onClose={() => setBulkModalProps({ ...bulkModalProps, isOpen: false })}
                selectedItems={bulkModalProps.selectedItems}
                actionType={bulkModalProps.actionType}
                siteMap={siteMap}
                regionMap={regionMap}
                allowedSites={filteredSites}
                onSuccess={() => {
                    setSelectedRows(new Set());
                    setSelectedSiteCode(null);
                    setSelectedItemDesc(null);
                    showToast('Request processed successfully', 'success');
                }}
                postFormData={postFormData}
                user={user}
            />

            <HardwareDetailModal
                item={viewDetailItem}
                request={viewDetailItem ? pulloutRequestMap.get(String(viewDetailItem.hw_id)) : null}
                siteMap={siteMap}
                regionMap={regionMap}
                onClose={() => setViewDetailItem(null)}
                onAttachSuccess={async () => {
                    const reqResult = await stableFetchData.current('/api/request-tbl.json');
                    setPulloutRequests(reqResult?.requests || []);
                    setViewDetailItem(null);
                }}
            />
        </div>
    );
}

export default MasterfileInventory;

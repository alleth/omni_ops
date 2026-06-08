// src/pages/masterfile/components/RequestDetailModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../../../hooks/useApi';
import { createPortal } from 'react-dom';

export default function RequestDetailModal({
                                               request,
                                               isOpen,
                                               onClose,
                                               userRole,
                                               onApprove,
                                               onReject,
                                               onCancel,
                                               onDelete,           // New optional prop to refresh list after delete
                                           }) {
    const { fetchData, postData, postFormData } = useApi();

    // ── State ──
    const [currentRequest, setCurrentRequest] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [siteMap, setSiteMap] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState(''); // 'approve' | 'reject' | 'cancel' | 'delete'
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [approverName, setApproverName] = useState('');
    const [mounted, setMounted] = useState(false);

    // Attachment replacement
    const [newAttachment, setNewAttachment] = useState(null);
    const [showReplaceOverlay, setShowReplaceOverlay] = useState(false);

    // Stable fetchData
    const stableFetchData = useRef(fetchData);
    useEffect(() => {
        stableFetchData.current = fetchData;
    }, [fetchData]);

    // Reset when new request opens
    useEffect(() => {
        setMounted(true);
        if (request && request.request_id) {
            setCurrentRequest(request);
            setImageLoaded(false);
            setLoadProgress(0);
            setNewAttachment(null);
            setShowReplaceOverlay(false);
        }
    }, [request]);

    // Load sites
    const loadSites = useCallback(async () => {
        if (!isOpen) return;
        try {
            const res = await stableFetchData.current('/api/site-list-tbl.json');
            const sites = res?.siteListTbl || [];
            const map = {};
            sites.forEach(site => map[site.site_code] = site.site_name || 'Unknown Site');
            setSiteMap(map);
        } catch (err) {
            console.error('Failed to load sites:', err);
        }
    }, [isOpen]);

    useEffect(() => {
        loadSites();
    }, [loadSites]);

    // Load approver
    const loadApprover = useCallback(async () => {
        if (!currentRequest?.approved_by) {
            setApproverName('');
            return;
        }
        try {
            const res = await stableFetchData.current(`/api/user-tbl/view/${currentRequest.approved_by}.json`);
            const user = res?.userTbl || res?.UserTbl || {};
            const fullName = `${user.fname || ''} ${user.lname || ''}`.trim();
            setApproverName(fullName || `User #${currentRequest.approved_by}`);
        } catch (err) {
            setApproverName(`User #${currentRequest.approved_by}`);
        }
    }, [currentRequest]);

    useEffect(() => {
        if (currentRequest?.status?.toUpperCase() === 'APPROVED') loadApprover();
    }, [loadApprover, currentRequest]);

    const refreshRequest = async () => {
        if (!currentRequest?.request_id) return;
        try {
            const res = await stableFetchData.current(`/api/request-tbl/view/${currentRequest.request_id}.json`);
            if (res?.requestTbl) setCurrentRequest(res.requestTbl);
        } catch (err) {
            console.error('Refresh failed:', err);
        }
    };

    // Image loading progress
    useEffect(() => {
        if (!currentRequest || !isOpen || newAttachment) return;
        const attachmentPath = currentRequest.attachment_path;
        const hasAttachment = attachmentPath && typeof attachmentPath === 'string' && attachmentPath.trim() !== '';
        const fileExtension = hasAttachment ? attachmentPath.split('.').pop()?.toLowerCase() : '';
        const isImage = hasAttachment && ['jpg', 'jpeg', 'png'].includes(fileExtension);

        if (!hasAttachment || !isImage || imageLoaded) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 10;
            if (progress >= 95) progress = 95;
            setLoadProgress(Math.min(100, Math.floor(progress)));
        }, 110);

        return () => clearInterval(interval);
    }, [currentRequest, isOpen, imageLoaded, newAttachment]);

    if (!mounted || !isOpen || !currentRequest?.request_id) return null;

    const modalRoot = document.getElementById('modal-root') || document.body;

    const isFSE = userRole === 'FSE';
    const isSPV = ['SPV', 'SUPERVISOR'].includes(userRole);
    const statusUpper = currentRequest.status?.toUpperCase() || 'PENDING';
    const isPullOut = currentRequest.request_type?.toUpperCase() === 'PULL_OUT';
    const isRelocation = currentRequest.request_type?.toUpperCase() === 'RELOCATION';

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 45) return 'just now';
        if (diffMin < 1) return 'just now';
        if (diffMin === 1) return '1 minute ago';
        if (diffMin < 60) return `${diffMin} minutes ago`;
        if (diffHr === 1) return '1 hour ago';
        if (diffHr < 24) return `${diffHr} hours ago`;
        if (diffDay === 1) return 'yesterday';
        if (diffDay < 7) return `${diffDay} days ago`;

        const isThisYear = date.getFullYear() === now.getFullYear();
        if (isThisYear) return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const fullDateTime = currentRequest.created_at ? new Date(currentRequest.created_at).toLocaleString() : '—';

    const attachmentPath = currentRequest.attachment_path;
    const hasAttachment = attachmentPath && typeof attachmentPath === 'string' && attachmentPath.trim() !== '';
    const currentOrigin = window.location.origin;
    // Dev (CRA on localhost) points at the omniops.local backend; in production the
    // attachment is served from the same origin, so use a relative path.
    const isDevHost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
    const baseUrl = isDevHost ? 'http://omniops.local' : '';
    const originalAttachmentUrl = hasAttachment ? `${baseUrl}${attachmentPath.trim()}` : null;

    let fileExtension = '';
    if (hasAttachment && !newAttachment) {
        const parts = attachmentPath.split('.');
        fileExtension = parts.length > 1 ? parts.pop().toLowerCase() : '';
    } else if (newAttachment) {
        fileExtension = newAttachment.name.split('.').pop()?.toLowerCase() || '';
    }
    const isPdf = fileExtension === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png'].includes(fileExtension);

    // Download current attachment
    const handleDownload = () => {
        if (!originalAttachmentUrl) return;
        const link = document.createElement('a');
        link.href = originalAttachmentUrl;
        link.download = `request_${currentRequest.request_id}_attachment.${fileExtension || 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Select new file
    const handleNewAttachmentSelect = (e) => {
        const file = e.target.files[0];
        if (file) setNewAttachment(file);
    };

    // Hardware functions
    const updateHardwareStatus = async (hwId) => {
        if (!hwId) return true;
        try {
            const payload = { hw_id: hwId, hw_status: 'Pullout', updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ') };
            const result = await postData('/api/hw-tbl/update.json', payload);
            return result?.success || false;
        } catch (err) {
            console.error('Hardware update error:', err);
            return false;
        }
    };

    const duplicateHardwareForRelocation = async () => {
        if (!currentRequest.hw_id || !currentRequest.destination_site) return false;
        try {
            const res = await stableFetchData.current(`/api/hw-tbl/view/${currentRequest.hw_id}.json`);
            const original = res?.hwTbl || res?.HwTbl || {};
            if (!original.hw_id) return false;

            const newHwData = {
                region_name: original.region_name || '',
                site_code: currentRequest.destination_site,
                hw_asset_num: original.hw_asset_num || '',
                hw_serial_num: original.hw_serial_num || '',
                item_desc: original.item_desc || '',
                hw_brand_name: original.hw_brand_name || '',
                hw_model: original.hw_model || '',
                hw_status: 'On Site',
                user_id: original.user_id || 1,
                hw_date_acq: original.hw_date_acq || new Date().toISOString().slice(0, 10),
                hw_acq_val: original.hw_acq_val || 0,
                hw_host_name: original.hw_host_name || `reloc-${Date.now()}`,
                hw_ip_add: original.hw_ip_add || '0.0.0.0',
                hw_mac_add: original.hw_mac_add || '00:00:00:00:00:00',
                hw_user_name: original.hw_user_name || 'System',
                hw_primary_role: original.hw_primary_role || 'User',
                hw_remarks: original.hw_remarks || `Relocated from ${original.site_code || 'previous site'}`,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            const result = await postData('/api/hw-tbl/add.json', newHwData);
            return result?.success || false;
        } catch (err) {
            console.error('Error duplicating hardware for relocation:', err);
            return false;
        }
    };

    // Delete request (FSE only on REJECTED)
    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete rejected request #${currentRequest.request_id}? This action cannot be undone.`)) {
            return;
        }

        setLoadingAction('delete');
        setActionLoading(true);

        try {
            // Using your existing delete endpoint
            const res = await fetch(`${window.location.origin.includes('localhost') ? '' : ''}/api/request-tbl/delete/${currentRequest.request_id}.json`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });

            const result = await res.json();

            if (result?.message?.toLowerCase().includes('success') || result?.success) {
                alert('Request deleted successfully');
                // Refresh the list in dashboard
                onDelete?.() || onReject?.();
                onClose(); // close modal
            } else {
                alert('Failed to delete request. Please try again.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting request. Please check your connection.');
        } finally {
            setActionLoading(false);
            setLoadingAction('');
        }
    };

    // Action handlers
    const handleAction = async (action) => {
        if (action === 'reject') {
            setShowRejectModal(true);
            return;
        }

        if (action === 'approve' && isSPV && !newAttachment) {
            alert('Please select a new signed document before approving.');
            return;
        }

        const confirmMsg = action === 'approve'
            ? `Approve request #${currentRequest.request_id}?`
            : `Cancel your request #${currentRequest.request_id}?`;

        if (!window.confirm(confirmMsg)) return;

        setLoadingAction(action);
        await executeAction(action, '');
        setLoadingAction('');
    };

    const handleRejectSubmit = async () => {
        setLoadingAction('reject');
        await executeAction('reject', rejectionReason.trim());
        setLoadingAction('');
        setShowRejectModal(false);
        setRejectionReason('');
    };

    const executeAction = async (action, reason = '') => {
        setActionLoading(true);
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        let newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'CANCELED';

        const payload = {
            request_id: currentRequest.request_id,
            status: newStatus,
            updated_at: now,
        };

        if (action === 'approve' || action === 'reject') {
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            payload.approved_by = user?.id || user?.user_id || 1;
            payload.approved_at = now;
        }
        if (action === 'reject' && reason) payload.approval_remarks = reason;

        try {
            if (action === 'approve' && newAttachment) {
                const formData = new FormData();
                formData.append('attachment', newAttachment);
                formData.append('request_id', currentRequest.request_id);

                const uploadResult = await postFormData(`/api/request-tbl/update-attachment/${currentRequest.request_id}.json`, formData);
                if (!uploadResult?.success) {
                    alert('Failed to upload new attachment.');
                    setActionLoading(false);
                    return;
                }
            }

            const result = await postData('/api/request-tbl/update.json', payload);
            if (!result?.success) {
                alert(`Failed to ${action} request`);
                return;
            }

            if (action === 'approve') {
                if (isRelocation && currentRequest.hw_id) {
                    await updateHardwareStatus(currentRequest.hw_id);
                    await duplicateHardwareForRelocation();
                } else if (isPullOut && currentRequest.hw_id) {
                    await updateHardwareStatus(currentRequest.hw_id);
                }
            }

            await refreshRequest();
            alert(`Request ${action}ed successfully!`);

            if (action === 'approve') onApprove?.();
            else if (action === 'reject') onReject?.();
            else if (action === 'cancel') onCancel?.();

        } catch (err) {
            console.error(err);
            alert(`Error: ${err.message || 'Network error'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = () => {
        if (statusUpper === 'APPROVED') return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">Approved</span>;
        if (statusUpper === 'REJECTED') return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">Rejected</span>;
        if (statusUpper === 'CANCELED') return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-200">Canceled</span>;
        if (isPullOut) return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">In Transit</span>;
        if (isRelocation) return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">Transfer to {currentRequest.destination_site || 'N/A'}</span>;
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-200">{currentRequest.status || 'Pending'}</span>;
    };

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <div className="relative w-full max-w-4xl mx-4 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/60 shadow-xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 tracking-tight">Request Details</h2>
                        <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5 lg:grid lg:grid-cols-2 lg:gap-6">
                        {/* Left: Attachment Preview (unchanged from your last version) */}
                        <div className="flex flex-col mb-6 lg:mb-0">
                            <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">Attached Document</h4>
                            <div
                                className="relative flex-1 bg-gray-50/40 dark:bg-gray-900/20 rounded-xl border border-gray-200/80 dark:border-gray-800/60 overflow-hidden flex items-center justify-center min-h-[240px] max-h-[340px]"
                                onMouseEnter={() => isSPV && statusUpper === 'PENDING' && setShowReplaceOverlay(true)}
                                onMouseLeave={() => setShowReplaceOverlay(false)}
                            >
                                {newAttachment ? (
                                    isImage ? (
                                        <img src={URL.createObjectURL(newAttachment)} alt="New Attachment" className="w-full h-full object-contain" />
                                    ) : isPdf ? (
                                        <div className="text-center p-8">
                                            <div className="text-6xl mb-4">📄</div>
                                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">PDF File</p>
                                            <p className="text-sm text-gray-500 mt-2">{newAttachment.name}</p>
                                            <p className="text-xs text-green-600 mt-4">Ready to upload on Approve</p>
                                        </div>
                                    ) : (
                                        <div className="text-center p-6">
                                            <p className="text-lg font-medium">File selected</p>
                                            <p className="text-sm text-gray-500">{newAttachment.name}</p>
                                        </div>
                                    )
                                ) : hasAttachment ? (
                                    isImage ? (
                                        <>
                                            <img
                                                src={originalAttachmentUrl}
                                                alt="Attachment Preview"
                                                className="w-full h-full object-contain"
                                                onLoad={() => { setImageLoaded(true); setLoadProgress(100); }}
                                            />
                                            {!imageLoaded && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/70 dark:bg-gray-950/70">
                                                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading preview...</p>
                                                    <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mt-1">{loadProgress}%</p>
                                                </div>
                                            )}
                                        </>
                                    ) : isPdf ? (
                                        <div className="text-center p-8 flex flex-col items-center">
                                            <div className="text-7xl mb-6">📄</div>
                                            <p className="text-xl font-medium text-gray-700 dark:text-gray-300">PDF Document</p>
                                            <p className="text-sm text-gray-500 mt-2 mb-6">{currentRequest.attachment_path?.split('/').pop()}</p>
                                            <a
                                                href={originalAttachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L9 15" />
                                                </svg>
                                                Open PDF in New Tab
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 space-y-4">
                                            <div className="text-gray-600 dark:text-gray-400">
                                                <p className="text-lg font-medium mb-2">File ({fileExtension.toUpperCase()})</p>
                                                <p className="text-sm">Inline preview not available</p>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center p-6 space-y-3">
                                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No attachment found</p>
                                    </div>
                                )}

                                {isSPV && statusUpper === 'PENDING' && showReplaceOverlay && !newAttachment && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                                        <p className="text-white text-sm font-medium mb-4 px-6 text-center">Replace with signed document</p>
                                        <div className="flex gap-3">
                                            <label className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-900 rounded-lg cursor-pointer text-sm font-medium">
                                                Choose File
                                                <input type="file" className="hidden" onChange={handleNewAttachmentSelect} />
                                            </label>
                                            <button onClick={handleDownload} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">Download</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Details (unchanged) */}
                        <div className="space-y-5">
                            {statusUpper === 'REJECTED' && currentRequest.approval_remarks && (
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-5">
                                    <h4 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Rejection Reason</h4>
                                    <p className="text-red-800 dark:text-red-200 whitespace-pre-wrap leading-relaxed">{currentRequest.approval_remarks}</p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h4>
                                <div className="mt-1">{getStatusBadge()}</div>
                            </div>

                            {statusUpper === 'APPROVED' && (
                                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-5">
                                    <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Approval Information</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Approved By</span><span className="font-medium text-gray-900 dark:text-gray-100">{approverName || 'Loading...'}</span></div>
                                        <div><span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Approved At</span><span className="font-medium text-gray-900 dark:text-gray-100">{currentRequest.approved_at ? new Date(currentRequest.approved_at).toLocaleString() : '—'}</span></div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-5 text-sm">
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Requested By</h4>
                                    <p className="text-gray-900 dark:text-gray-100">
                                        {currentRequest.user?.fname ? `${currentRequest.user.fname} ${currentRequest.user.lname || ''}` : 'Unknown'}
                                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{currentRequest.user?.user_name || '—'}</span>
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</h4>
                                    <p className="text-gray-900 dark:text-gray-100 font-medium">{currentRequest.request_type?.replace('_', ' ') || '—'}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Created</h4>
                                    <p className="text-gray-900 dark:text-gray-100">
                                        {formatRelativeTime(currentRequest.created_at)}
                                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5" title={fullDateTime}>{fullDateTime}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">Hardware</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Type</span><span className="text-gray-900 dark:text-gray-100">{currentRequest.item_desc || '—'}</span></div>
                                    <div><span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Brand & Model</span><span className="text-gray-900 dark:text-gray-100">{currentRequest.hw_brand_name || '—'} {currentRequest.hw_model || ''}</span></div>
                                    <div><span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Asset #</span><span className="text-gray-900 dark:text-gray-100">{currentRequest.asset_num || '—'}</span></div>
                                    <div><span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Serial #</span><span className="text-gray-900 dark:text-gray-100">{currentRequest.serial_num || '—'}</span></div>
                                    <div><span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Site</span><span className="text-gray-900 dark:text-gray-100">{currentRequest.site_code || '—'}</span></div>
                                </div>
                            </div>

                            {isRelocation && (
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">Site Transfer</h4>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="text-xs text-gray-500 dark:text-gray-400">From</span> {currentRequest.site_code ? `${currentRequest.site_code} - ${siteMap[currentRequest.site_code] ?? 'Unknown Site'}` : '—'}</div>
                                        <div><span className="text-xs text-gray-500 dark:text-gray-400">To</span> {currentRequest.destination_site ? `${currentRequest.destination_site} - ${siteMap[currentRequest.destination_site] ?? 'Unknown Site'}` : '—'}</div>
                                    </div>
                                </div>
                            )}

                            {isPullOut && currentRequest.tracking_num && (
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">Tracking Number</h4>
                                    <p className="text-gray-900 dark:text-gray-100 font-medium">{currentRequest.tracking_num}</p>
                                </div>
                            )}

                            {currentRequest.remarks && (
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">Remarks</h4>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{currentRequest.remarks}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap justify-end gap-4 px-6 pb-6">
                        <button onClick={onClose} disabled={actionLoading} className={`px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>Close</button>

                        {isFSE && statusUpper === 'PENDING' && (
                            <button onClick={() => handleAction('cancel')} disabled={actionLoading} className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''} bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300`}>
                                {actionLoading && loadingAction === 'cancel' ? 'Cancelling...' : 'Cancel Request'}
                            </button>
                        )}

                        {/* Delete Button - Only for FSE on REJECTED requests */}
                        {isFSE && statusUpper === 'REJECTED' && (
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                                    ${actionLoading && loadingAction === 'delete'
                                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                                    : 'bg-red-600 hover:bg-red-700 text-white'}`}
                            >
                                {actionLoading && loadingAction === 'delete' ? (
                                    'Deleting...'
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.595 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.595-1.858L5 7m5-4v6m4-6v6m1-10V9a1 1 0 00-1 1v1M12 4v6m2-3V9a1 1 0 00-1 1v1" />
                                        </svg>
                                        Delete Request
                                    </>
                                )}
                            </button>
                        )}

                        {isSPV && statusUpper === 'PENDING' && (
                            <>
                                <button
                                    onClick={() => handleAction('approve')}
                                    disabled={actionLoading || !newAttachment}
                                    className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors
                                        ${actionLoading || !newAttachment
                                        ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                        : 'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300'}`}
                                >
                                    {actionLoading && loadingAction === 'approve' ? 'Approving...' : 'Approve'}
                                </button>

                                <button onClick={() => handleAction('reject')} disabled={actionLoading} className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''} bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300`}>
                                    {actionLoading && loadingAction === 'reject' ? 'Rejecting...' : 'Reject'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Rejection Reason Modal */}
            {showRejectModal && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}>
                    <div className="bg-white dark:bg-gray-950 rounded-xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-gray-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Rejection Reason</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please provide a reason for rejecting this request (optional).</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason here..."
                            className="w-full h-32 p-4 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                        />
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={() => { setShowRejectModal(false); setRejectionReason(''); }} className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Cancel</button>
                            <button onClick={handleRejectSubmit} disabled={actionLoading} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''} bg-red-600 hover:bg-red-700 text-white`}>
                                {actionLoading && loadingAction === 'reject' ? 'Rejecting...' : 'Reject Request'}
                            </button>
                        </div>
                    </div>
                </div>,
                modalRoot
            )}
        </>,
        modalRoot
    );
}

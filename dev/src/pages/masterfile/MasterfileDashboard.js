// src/pages/masterfile/MasterfileDashboard.js
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import RequestDetailModal from './components/RequestDetailModal';

const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

function MasterfileDashboard() {
    const [displayTags, setDisplayTags] = useState([]);
    const [loading, setLoading] = useState(false);

    const [requests, setRequests] = useState([]);
    const [requestLoading, setRequestLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // Modal state
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { fetchData } = useApi();

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const role = (user.user_type || 'FSE').toString().trim().toUpperCase();
    const userId = user.id || user.user_id;

    // Parse assigned regions for FSE
    const assignedRegionIds = useMemo(() => {
        if (!user.region_assigned) return [];
        return user.region_assigned
            .split(',')
            .map(id => id.trim())
            .filter(id => id);
    }, [user.region_assigned]);

    const stableFetchData = useRef(fetchData);
    useEffect(() => {
        stableFetchData.current = fetchData;
    }, [fetchData]);

    // Relative time formatter
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

    // Status badge
    const getRequestStatus = (req) => {
        const status = req.status?.toUpperCase() || 'PENDING';

        if (status === 'APPROVED') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
                    Approved
                </span>
            );
        }
        if (status === 'REJECTED') {
            return (
                <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 cursor-help"
                    title={req.approval_remarks || 'No reason provided'}
                >
                    Rejected
                </span>
            );
        }
        if (status === 'CANCELED') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-200">
                    Canceled
                </span>
            );
        }

        const type = req.request_type?.toUpperCase() || '';
        if (type === 'PULL_OUT') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                    In Transit
                </span>
            );
        }
        if (type === 'RELOCATION') {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
                    Transfer to {req.destination_site || 'N/A'}
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-200">
                {status || 'Pending'}
            </span>
        );
    };

    // Load requests
    const loadRequests = useCallback(async () => {
        setRequestLoading(true);
        try {
            let query = '';
            if (role === 'FSE') {
                query = `?requested_by=${userId}`;
            } else if (['SPV', 'SUPERVISOR'].includes(role)) {
                query = `?status=PENDING&cluster_name=${encodeURIComponent(user.cluster_name || '')}`;
            } else if (['ADM', 'ADMIN', 'ADMINISTRATOR'].includes(role)) {
                query = '?status=PENDING';
            }

            const endpoint = query ? `/api/request-tbl.json${query}` : '/api/request-tbl.json';

            const res = await stableFetchData.current(endpoint);
            let allRequests = res?.requests || [];

            if (role === 'FSE') {
                allRequests = allRequests.filter(r => r.status?.toUpperCase() !== 'CANCELED');
            }

            setRequests(allRequests);
        } catch (err) {
            console.error('Failed to load requests:', err);
            setRequests([]);
        } finally {
            setRequestLoading(false);
        }
    }, [role, userId, user.cluster_name]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    // Modal handlers
    const openDetailModal = (req) => {
        setSelectedRequest(req);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
    };

    // Toggle single checkbox - prevent selecting APPROVED for FSE
    const toggleSelect = (id, e, status) => {
        e.stopPropagation();

        const upperStatus = status?.toUpperCase();

        if (role === 'FSE' && upperStatus === 'APPROVED') {
            alert("Approved requests cannot be selected for deletion.");
            return;
        }

        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Smart Select All - only REJECTED for FSE
    const toggleSelectAll = () => {
        if (selectedIds.length > 0) {
            setSelectedIds([]);
            return;
        }

        if (role === 'FSE') {
            // Only select REJECTED requests
            const rejectedIds = requests
                .filter(r => r.status?.toUpperCase() === 'REJECTED')
                .map(r => r.request_id);
            setSelectedIds(rejectedIds);
        } else {
            // For SPV/Admin - select all
            setSelectedIds(requests.map(r => r.request_id));
        }
    };

    // Bulk Cancel (PENDING only)
    const handleCancel = () => {
        if (selectedIds.length === 0) return alert('No requests selected');
        alert(`Cancelling ${selectedIds.length} request(s)`);
        // TODO: Implement bulk cancel API
    };

    // Bulk Delete (REJECTED only)
    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return alert('No requests selected');
        if (!window.confirm(`Delete ${selectedIds.length} rejected request(s)? This action cannot be undone.`)) return;

        alert(`Deleting ${selectedIds.length} rejected request(s)`);
        // TODO: Implement bulk delete API
        loadRequests();
        setSelectedIds([]);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const getHealthMessage = () => {
        if (role === 'FSE') {
            return assignedRegionIds.length > 0
                ? `Your assigned regions look stable — no major hardware issues reported recently.`
                : `No regions currently assigned. All good for now.`;
        }
        if (['SPV', 'SUPERVISOR'].includes(role)) {
            return user.cluster_name
                ? `Cluster ${user.cluster_name} is in good shape — sites appear healthy.`
                : `No cluster assigned yet. Everything looks calm.`;
        }
        if (['ADM', 'ADMIN', 'ADMINISTRATOR'].includes(role)) {
            return `All clusters under your watch are performing well — no critical alerts at the moment.`;
        }
        return `System overview looks clean — keep up the great work!`;
    };

    return (
        <div className="p-5">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Welcome + Health Card */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                        {getGreeting()}, {user.fname || 'User'}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Logged in as <strong>{role}</strong> • @{user.user_name}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                        {getHealthMessage()}
                    </p>
                </div>

                {/* Monitoring Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Accuracy of Hardware Inventory</h3>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">98%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Devices in good condition • Checked today</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Site Uptime</h3>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">99.4%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Average last 30 days • Looks solid</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Open Service Request</h3>
                        <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">3</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Low priority • Under review</p>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {role === 'FSE' ? 'My Hardware Requests' : 'Pending Requests'}
                        </h3>

                        <div className="flex gap-3">
                            {role === 'FSE' && selectedIds.length > 0 && (
                                <>
                                    {requests.some(r => selectedIds.includes(r.request_id) && r.status?.toUpperCase() === 'PENDING') && (
                                        <button
                                            onClick={handleCancel}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                                        >
                                            Cancel Selected ({selectedIds.length})
                                        </button>
                                    )}

                                    {requests.some(r => selectedIds.includes(r.request_id) && r.status?.toUpperCase() === 'REJECTED') && (
                                        <button
                                            onClick={handleDeleteSelected}
                                            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.595 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.595-1.858L5 7m5-4v6m4-6v6m1-10V9a1 1 0 00-1 1v1M12 4v6m2-3V9a1 1 0 00-1 1v1" />
                                            </svg>
                                            Delete Selected ({selectedIds.length})
                                        </button>
                                    )}
                                </>
                            )}

                            {['SPV', 'SUPERVISOR'].includes(role) && selectedIds.length > 0 && (
                                <button
                                    onClick={() => alert(`Approving ${selectedIds.length} request(s)`)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Approve Selected ({selectedIds.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {requestLoading ? (
                        <div className="p-6">
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex gap-6">
                                        <Skeleton className="h-5 w-5 rounded" />
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-5 w-64" />
                                        <Skeleton className="h-5 w-32" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                            {role === 'FSE' ? 'No active requests (canceled ones are hidden)' : 'No pending requests right now'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Request Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hardware Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {requests.map((req) => {
                                    const isApproved = req.status?.toUpperCase() === 'APPROVED';
                                    const isSelectable = role !== 'FSE' || req.status?.toUpperCase() === 'REJECTED';

                                    return (
                                        <tr
                                            key={req.request_id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer"
                                            onClick={() => openDetailModal(req)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(req.request_id)}
                                                    onChange={(e) => toggleSelect(req.request_id, e, req.status)}
                                                    disabled={!isSelectable}
                                                    className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${!isSelectable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getRequestStatus(req)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                {req.user?.fname ? `${req.user.fname} ${req.user.lname || ''}` : 'Unknown User'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                {req.request_type?.replace('_', ' ') || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                {req.item_desc || ''} {req.hw_brand_name || ''} {req.hw_model || ''}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <span title={req.created_at ? new Date(req.created_at).toLocaleString() : ''}>
                                                    {formatRelativeTime(req.created_at)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                <RequestDetailModal
                    request={selectedRequest}
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    userRole={role}
                    onApprove={loadRequests}
                    onReject={loadRequests}
                    onCancel={loadRequests}
                    onDelete={loadRequests}
                />

                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        FSE Masterfile — Hardware Inventory & Site Monitoring
                    </p>
                </div>
            </div>
        </div>
    );
}

export default MasterfileDashboard;

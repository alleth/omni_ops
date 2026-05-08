// src/pages/masterfile/MasterfileInventory.js
import React, { useEffect, useState, useMemo, useRef } from 'react';
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
                const result = await stableFetchData.current('/api/hw-tbl.json');
                const allHw = result?.hwTbl || [];

                let filteredHw;

                if (statusFilter === 'On Site') {
                    filteredHw = allHw.filter(item =>
                        item.hw_status === 'On Site' || item.hw_status === 'Onsite'
                    );
                } else if (statusFilter === 'Pull Out') {
                    filteredHw = allHw.filter(item =>
                        item.hw_status === 'Pull Out' ||
                        item.hw_status === 'Pullout'
                    );
                } else {
                    filteredHw = allHw; // fallback
                }

                setHardware(filteredHw);

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
            return (
                (h.asset_num || '').toLowerCase().includes(term) ||
                (h.serial_num || '').toLowerCase().includes(term) ||
                (h.item_desc || '').toLowerCase().includes(term) ||
                (h.hw_brand_name || '').toLowerCase().includes(term) ||
                (h.hw_model || '').toLowerCase().includes(term)
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

    const showRegionDropdown = availableRegions.length > 1;
    const isLoading = baseLoading || hardwareLoading;

    const selectClasses =
        'w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 ' +
        'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ' +
        'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ' +
        'transition-colors appearance-none cursor-pointer ' +
        'bg-no-repeat bg-[length:1.2em] bg-[right_1rem_center] ' +
        'disabled:opacity-60 disabled:cursor-not-allowed';

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

        const selectedItemsArray = paginatedHardware.filter(item => selectedRows.has(item.hw_id));

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
                                placeholder="Asset, serial, type…"
                            />
                        </div>
                    </div>
                </div>
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
                                {isFSE && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-20">Actions</th>}
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
                                            {isFSE && (
                                                <td className="px-3 py-3 text-sm">
                                                    {statusFilter === 'On Site' ? (
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium cursor-default">
                                                            View Details
                                                          </span>
                                                    )}
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
        </div>
    );
}

export default MasterfileInventory;

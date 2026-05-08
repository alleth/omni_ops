// src/pages/masterfile/components/SiteDetailsModal.jsx
import React, { useState } from 'react';
import Select from 'react-select';
import { useApi } from '../../../hooks/useApi'; // adjust path if needed

const SiteDetailsModal = ({ site: initialSite, regions, allSites = [], onClose, onSaveSuccess, mode = 'view' }) => {
    const { postData, loading: apiLoading } = useApi();

    const isCreate = mode === 'create';

    const defaultSite = {
        site_id: null,
        region_id: '',
        office_type: '',
        site_code: '',
        site_name: '',
        site_address: '',
        site_partnership: '',
        cluster_name: '',
        trxn_catered: '',
        physical_site_count: 1,
        node_working: 0,
        node_defective: 0,
    };

    const [currentSite, setCurrentSite] = useState(isCreate ? defaultSite : initialSite);
    const [isEditing, setIsEditing] = useState(isCreate);
    const [formData, setFormData] = useState({
        ... (isCreate ? defaultSite : initialSite),
        trxn_catered: (isCreate ? defaultSite : initialSite).trxn_catered ?? '',
        physical_site_count: Number((isCreate ? defaultSite : initialSite).physical_site_count) || 1,
        node_working: Number((isCreate ? defaultSite : initialSite).node_working) || 0,
        node_defective: Number((isCreate ? defaultSite : initialSite).node_defective) || 0,
        office_type: (isCreate ? defaultSite : initialSite).office_type ?? '',
        site_partnership: (isCreate ? defaultSite : initialSite).site_partnership ?? '',
    });

    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const handleRegionChange = (e) => {
        const regionId = e.target.value;
        const selectedRegion = regions[regionId];
        const clusterName = selectedRegion?.cluster_name || '';

        setFormData(prev => ({
            ...prev,
            region_id: regionId,
            cluster_name: clusterName,
        }));
    };

    const isFormValid = isCreate
        ? formData.site_code.trim() !== '' &&
        formData.site_name.trim() !== '' &&
        formData.region_id !== '' &&
        formData.office_type !== ''
        : true;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? 0 : Number(value),
        }));
    };

    const handleDualServerChange = (e) => {
        const value = e.target.value;
        const newCount = value === 'Yes' ? 2 : 1;
        setFormData(prev => ({
            ...prev,
            physical_site_count: newCount,
        }));
    };

    const handleTrxnChange = (selected) => {
        const values = selected ? selected.map(item => item.value).join(',') : '';
        setFormData(prev => ({ ...prev, trxn_catered: values }));
    };

    const handleSave = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);

        if (isCreate && !isFormValid) {
            setErrorMsg('Please fill in all required fields (Site Code, Site Name, Region, Office Type)');
            return;
        }

        // Duplicate site_code validation (only for create mode)
        if (isCreate) {
            const enteredCode = formData.site_code.trim().toLowerCase();
            const codeExists = allSites.some(s =>
                s.site_code?.trim().toLowerCase() === enteredCode
            );

            if (codeExists) {
                setErrorMsg('Site Code already exists. Please use a unique code.');
                return;
            }
        }

        const finalData = {
            ...formData,
            physical_site_count: formData.physical_site_count === 2 ? 2 : 1,
        };

        const endpoint = isCreate ? '/api/site-list-tbl/add' : `/api/site-list-tbl/edit/${currentSite.site_id}`;

        try {
            const response = await postData(endpoint, finalData);

            if (response && (response.success || response.siteListTbl)) {
                setSuccessMsg(isCreate ? 'Site created successfully!' : 'Site updated successfully!');

                if (!isCreate) {
                    const updatedSite = { ...currentSite, ...finalData };
                    setCurrentSite(updatedSite);
                }

                setIsEditing(false);

                if (isCreate) {
                    setTimeout(() => {
                        onClose();
                        onSaveSuccess?.();
                    }, 1500);
                } else {
                    onSaveSuccess?.();
                }
            } else {
                throw new Error('Operation failed - unexpected response');
            }
        } catch (err) {
            console.error('Save error:', err);
            setErrorMsg(err.message || 'Failed to save site. Please try again.');
        }
    };

    const handleDelete = async () => {
        setDeleteError(null);
        try {
            const response = await postData(`/api/site-list-tbl/delete/${currentSite.site_id}`, {}, 'DELETE');
            if (response?.success) {
                setSuccessMsg('Site deleted');
                setShowDeleteConfirm(false);
                onSaveSuccess?.();
                setTimeout(onClose, 1200);
            } else {
                throw new Error('Delete failed');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setDeleteError('Failed to delete');
        }
    };

    const displaySite = isEditing ? formData : currentSite;
    const computedNodesTotal = Number(displaySite.node_working || 0) - Number(displaySite.node_defective || 0);

    const dualServerDisplay = (() => {
        const count = Number(displaySite.physical_site_count);
        if (count === 2) return 'Yes';
        if (count === 1) return 'No';
        return '—';
    })();

    const dualServerSelectValue = Number(formData.physical_site_count) === 2 ? 'Yes' : 'No';

    const officeTypeOptions = [
        'NRU - New Registration Unit',
        'Regional Office',
        'MAIDRS - Manufacturers, Assemblers, Importers, Rebuilders and Dealers',
        'Operations Division',
        'District Office',
        'Extension Office',
        'Licensing Center',
        'DLRO - Driver\'s License Renewal Office',
        'E-Patrol',
    ];

    const ownershipOptions = [
        'Government',
        'Proponent',
        'LGU - Local Government Unit',
    ];

    const trxnOptions = [
        { value: 'DL', label: 'DL - Driver\'s License' },
        { value: 'MV', label: 'MV - Motor Vehicle' },
        { value: 'LETAS', label: 'LETAS - Law Enforcement & Traffic Adjudication System' },
        { value: 'MAIDRS', label: 'MAIDRS' },
        { value: 'MV New', label: 'MV New - MV New Registration' },
        { value: 'None', label: 'None' },
    ];

    const selectedTrxn = trxnOptions.filter(opt =>
        formData.trxn_catered?.split(',').map(v => v.trim()).includes(opt.value)
    );

    const viewTrxnPills = (displaySite.trxn_catered ?? '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

    // Placeholder for future Office Chief profile
    const officeChiefProfile = {
        name: 'Not assigned',
        position: displaySite.office_type === 'Regional Office' ? 'Regional Director' : 'Office Head',
        birthday: '—',
        designationDate: '—',
        assignmentDate: '—',
        photo: null,
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-950 rounded-xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {isCreate ? 'New Site' : `${displaySite.site_code || '—'} · ${displaySite.site_name || '—'}`}
                        {isEditing && !isCreate && <span className="ml-2 text-sm text-indigo-500">(edit)</span>}
                    </h2>
                    <div className="flex items-center gap-3">
                        {!isEditing && !isCreate && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </>
                        )}

                        {isEditing && (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={apiLoading || (isCreate && !isFormValid)}
                                    className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                        (isFormValid || !isCreate) && !apiLoading
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    }`}
                                >
                                    {apiLoading ? 'Saving...' : (isCreate ? 'Create' : 'Save')}
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Messages */}
                {errorMsg && (
                    <div className="mx-6 mt-4 px-4 py-2 bg-red-50/80 text-red-800 dark:bg-red-950/50 dark:text-red-300 text-sm rounded-lg">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="mx-6 mt-4 px-4 py-2 bg-green-50/80 text-green-800 dark:bg-green-950/50 dark:text-green-300 text-sm rounded-lg">
                        {successMsg}
                    </div>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="mx-6 mt-4 p-5 bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-lg">
                        <p className="text-red-800 dark:text-red-300 font-medium mb-4">
                            Delete this site? This cannot be undone.
                        </p>
                        {deleteError && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{deleteError}</p>}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={apiLoading}
                                className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    apiLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                            >
                                {apiLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Office Chief - minimalist */}
                {!isCreate && !isEditing && (
                    <div className="mx-6 mt-5 p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-lg border border-gray-200/50 dark:border-gray-800/50">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {officeChiefProfile.position}
                        </h3>
                        <div className="flex items-start gap-3 text-sm">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg overflow-hidden">
                                {officeChiefProfile.photo ? (
                                    <img src={officeChiefProfile.photo} alt={officeChiefProfile.name} className="w-full h-full object-cover" />
                                ) : (
                                    '?'
                                )}
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Name:</span>{' '}
                                    <span className="text-gray-900 dark:text-gray-100 font-medium">{officeChiefProfile.name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Birthday:</span>{' '}
                                    <span className="text-gray-900 dark:text-gray-100">{officeChiefProfile.birthday}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Designated:</span>{' '}
                                    <span className="text-gray-900 dark:text-gray-100">{officeChiefProfile.designationDate}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">Assigned here:</span>{' '}
                                    <span className="text-gray-900 dark:text-gray-100">{officeChiefProfile.assignmentDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <div className="p-6 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Region */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    Region <span className="text-red-500">*</span>
                                </label>
                                {isEditing ? (
                                    <div className="relative">
                                        <select
                                            name="region_id"
                                            value={formData.region_id ?? ''}
                                            onChange={handleRegionChange}
                                            className="w-full px-3 py-2 pr-8 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Select</option>
                                            {Object.entries(regions).map(([id, name]) => (
                                                <option key={id} value={id}>
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2 text-sm text-gray-900 dark:text-gray-200">
                                        {regions[displaySite.region_id] || displaySite.region_id || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Office Type */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    Office Type <span className="text-red-500">*</span>
                                </label>
                                {isEditing ? (
                                    <div className="relative">
                                        <select
                                            name="office_type"
                                            value={formData.office_type ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 pr-8 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Select</option>
                                            {officeTypeOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2 text-sm text-gray-900 dark:text-gray-200">
                                        {displaySite.office_type || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Site Code */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    Site Code <span className="text-red-500">*</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="site_code"
                                        value={formData.site_code ?? ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        required
                                    />
                                ) : (
                                    <div className="py-2 text-sm text-gray-900 dark:text-gray-200">
                                        {displaySite.site_code || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Site Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    Site Name <span className="text-red-500">*</span>
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="site_name"
                                        value={formData.site_name ?? ''}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        required
                                    />
                                ) : (
                                    <div className="py-2 text-sm text-gray-900 dark:text-gray-200">
                                        {displaySite.site_name || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    Address
                                </label>
                                {isEditing ? (
                                    <textarea
                                        name="site_address"
                                        value={formData.site_address ?? ''}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    />
                                ) : (
                                    <div className="py-2 text-sm text-gray-900 dark:text-gray-200 whitespace-pre-wrap">
                                        {displaySite.site_address || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Ownership */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    Ownership
                                </label>
                                {isEditing ? (
                                    <div className="relative">
                                        <select
                                            name="site_partnership"
                                            value={formData.site_partnership ?? ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 pr-8 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Select</option>
                                            {ownershipOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2 text-sm text-gray-900 dark:text-gray-200">
                                        {displaySite.site_partnership || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Transactions Catered */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                    Transactions Catered
                                </label>
                                {isEditing ? (
                                    <Select
                                        isMulti
                                        options={trxnOptions}
                                        value={selectedTrxn}
                                        onChange={handleTrxnChange}
                                        placeholder="Select..."
                                        isClearable
                                        closeMenuOnSelect={false}
                                        hideSelectedOptions={false}
                                        classNames={{
                                            control: () => 'border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 min-h-[34px] text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
                                            menu: () => 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md mt-1 text-xs',
                                            option: ({ isSelected, isFocused }) =>
                                                `px-3 py-1.5 text-xs cursor-pointer ${
                                                    isSelected ? 'bg-indigo-600 text-white' :
                                                        isFocused ? 'bg-indigo-50 dark:bg-indigo-950/50' : ''
                                                }`,
                                            multiValue: () => 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-full px-2 py-0.5 text-xs',
                                            multiValueLabel: () => 'font-medium text-xs',
                                            multiValueRemove: () => 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-xs',
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {viewTrxnPills.length > 0 ? (
                                            viewTrxnPills.map((item, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50"
                                                >
                          {item}
                        </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure */}
                    <div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Infrastructure
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                    Dual Server
                                </label>
                                {isEditing ? (
                                    <div className="relative">
                                        <select
                                            value={dualServerSelectValue}
                                            onChange={handleDualServerChange}
                                            className="w-full px-3 py-2 pr-8 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                        {dualServerDisplay}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                    Nodes Total
                                </label>
                                <div className="py-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {computedNodesTotal}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                    Working
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="node_working"
                                        value={formData.node_working}
                                        onChange={handleNumberChange}
                                        min="0"
                                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                ) : (
                                    <div className="py-2 text-sm text-green-600 dark:text-green-400">
                                        {displaySite.node_working || 0}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                    Defective
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="node_defective"
                                        value={formData.node_defective}
                                        onChange={handleNumberChange}
                                        min="0"
                                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                ) : (
                                    <div className="py-2 text-sm text-red-600 dark:text-red-400">
                                        {displaySite.node_defective || 0}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SiteDetailsModal;

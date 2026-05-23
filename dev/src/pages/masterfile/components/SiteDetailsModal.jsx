// src/pages/masterfile/components/SiteDetailsModal.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import { useApi } from '../../../hooks/useApi';

const modalRoot = document.getElementById('modal-root') || (() => {
    const el = document.createElement('div');
    el.id = 'modal-root';
    document.body.appendChild(el);
    return el;
})();

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
    { value: 'DL',     label: 'DL – Driver\'s License' },
    { value: 'MV',     label: 'MV – Motor Vehicle' },
    { value: 'LETAS',  label: 'LETAS – Law Enforcement & Traffic Adjudication System' },
    { value: 'MAIDRS', label: 'MAIDRS' },
    { value: 'MV New', label: 'MV New – MV New Registration' },
    { value: 'None',   label: 'None' },
];

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

function Field({ label, children }) {
    return (
        <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
            <div className="text-sm text-gray-900 dark:text-gray-100">{children}</div>
        </div>
    );
}

function SelectWrapper({ children }) {
    return <div className="relative">{children}<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></span></div>;
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all';
const selectCls = `${inputCls} appearance-none pr-8`;

export default function SiteDetailsModal({ site: initialSite, regions, allSites = [], onClose, onSaveSuccess, mode = 'view' }) {
    const { postData, loading: apiLoading } = useApi();
    const isCreate = mode === 'create';

    const seed = isCreate ? defaultSite : initialSite;
    const [currentSite, setCurrentSite]   = useState(seed);
    const [isEditing, setIsEditing]        = useState(isCreate);
    const [formData, setFormData]          = useState({
        ...seed,
        trxn_catered:        seed.trxn_catered ?? '',
        physical_site_count: Number(seed.physical_site_count) || 1,
        node_working:        Number(seed.node_working)        || 0,
        node_defective:      Number(seed.node_defective)      || 0,
        office_type:         seed.office_type      ?? '',
        site_partnership:    seed.site_partnership ?? '',
    });

    const [errorMsg,           setErrorMsg]           = useState(null);
    const [successMsg,         setSuccessMsg]         = useState(null);
    const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
    const [deleteError,        setDeleteError]        = useState(null);

    const display = isEditing ? formData : currentSite;

    const isFormValid = !isCreate || (
        formData.site_code.trim() !== '' &&
        formData.site_name.trim() !== '' &&
        formData.region_id        !== '' &&
        formData.office_type      !== ''
    );

    const handleInput   = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleNumber  = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value === '' ? 0 : Number(e.target.value) }));
    const handleRegion  = e => setFormData(p => ({ ...p, region_id: e.target.value }));
    const handleDual    = e => setFormData(p => ({ ...p, physical_site_count: e.target.value === 'Yes' ? 2 : 1 }));
    const handleTrxn    = sel => setFormData(p => ({ ...p, trxn_catered: sel ? sel.map(i => i.value).join(',') : '' }));

    const handleSave = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);

        if (isCreate && !isFormValid) {
            setErrorMsg('Site Code, Site Name, Region and Office Type are required.');
            return;
        }

        if (isCreate) {
            const code = formData.site_code.trim().toLowerCase();
            if (allSites.some(s => s.site_code?.trim().toLowerCase() === code)) {
                setErrorMsg('Site Code already exists. Please use a unique code.');
                return;
            }
        }

        const endpoint = isCreate
            ? '/api/site-list-tbl/add'
            : `/api/site-list-tbl/edit/${currentSite.site_id}`;

        try {
            const res = await postData(endpoint, { ...formData, physical_site_count: formData.physical_site_count === 2 ? 2 : 1 });
            if (res?.success || res?.siteListTbl) {
                setSuccessMsg(isCreate ? 'Site created.' : 'Changes saved.');
                if (!isCreate) setCurrentSite({ ...currentSite, ...formData });
                setIsEditing(false);
                if (isCreate) {
                    setTimeout(() => { onClose(); onSaveSuccess?.(); }, 1200);
                } else {
                    onSaveSuccess?.();
                }
            } else {
                throw new Error('Unexpected response');
            }
        } catch (err) {
            setErrorMsg(err.message || 'Failed to save. Please try again.');
        }
    };

    const handleDelete = async () => {
        setDeleteError(null);
        try {
            const res = await postData(`/api/site-list-tbl/delete/${currentSite.site_id}`, {}, 'DELETE');
            if (res?.success) {
                setSuccessMsg('Site deleted.');
                setShowDeleteConfirm(false);
                onSaveSuccess?.();
                setTimeout(onClose, 1000);
            } else {
                throw new Error('Delete failed');
            }
        } catch (err) {
            setDeleteError('Failed to delete. Please try again.');
        }
    };

    const trxnPills    = (display.trxn_catered ?? '').split(',').map(v => v.trim()).filter(Boolean);
    const selectedTrxn = trxnOptions.filter(o => formData.trxn_catered?.split(',').map(v => v.trim()).includes(o.value));
    const dualDisplay  = Number(display.physical_site_count) === 2 ? 'Yes' : 'No';
    const nodesTotal   = Number(display.node_working || 0) - Number(display.node_defective || 0);

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
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                            {isCreate ? 'Add New Site' : (display.site_name || '—')}
                        </h2>
                        {!isCreate && display.site_code && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{display.site_code}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        {!isEditing && !isCreate && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/70 border border-red-200 dark:border-red-800/50 transition-colors"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                        {isEditing && (
                            <>
                                {!isCreate && (
                                    <button
                                        onClick={() => { setIsEditing(false); setFormData({ ...currentSite }); setErrorMsg(null); }}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={apiLoading || (isCreate && !isFormValid)}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                        (isFormValid || !isCreate) && !apiLoading
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {apiLoading ? 'Saving…' : (isCreate ? 'Create Site' : 'Save Changes')}
                                </button>
                            </>
                        )}
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

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                    {/* Inline messages */}
                    {errorMsg && (
                        <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm rounded-lg">
                            {errorMsg}
                        </div>
                    )}
                    {successMsg && (
                        <div className="px-4 py-2.5 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 text-sm rounded-lg">
                            {successMsg}
                        </div>
                    )}

                    {/* Delete confirmation */}
                    {showDeleteConfirm && (
                        <div className="px-4 py-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-lg space-y-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                Delete <span className="font-bold">{currentSite.site_code}</span>? This cannot be undone.
                            </p>
                            {deleteError && <p className="text-xs text-red-600 dark:text-red-400">{deleteError}</p>}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={apiLoading}
                                    className="px-4 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {apiLoading ? 'Deleting…' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Site Information */}
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Site Information</p>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            {/* Region */}
                            <Field label="Region *">
                                {isEditing ? (
                                    <SelectWrapper>
                                        <select name="region_id" value={formData.region_id ?? ''} onChange={handleRegion} className={selectCls}>
                                            <option value="">Select region</option>
                                            {Object.entries(regions).map(([id, name]) => (
                                                <option key={id} value={id}>{name}</option>
                                            ))}
                                        </select>
                                    </SelectWrapper>
                                ) : (
                                    regions[display.region_id] || display.region_id || '—'
                                )}
                            </Field>

                            {/* Office Type */}
                            <Field label="Office Type *">
                                {isEditing ? (
                                    <SelectWrapper>
                                        <select name="office_type" value={formData.office_type ?? ''} onChange={handleInput} className={selectCls}>
                                            <option value="">Select type</option>
                                            {officeTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </SelectWrapper>
                                ) : (
                                    display.office_type || '—'
                                )}
                            </Field>

                            {/* Site Code */}
                            <Field label="Site Code *">
                                {isEditing ? (
                                    <input type="text" name="site_code" value={formData.site_code ?? ''} onChange={handleInput} className={inputCls} placeholder="e.g. NCR-001" />
                                ) : (
                                    display.site_code || '—'
                                )}
                            </Field>

                            {/* Site Name */}
                            <Field label="Site Name *">
                                {isEditing ? (
                                    <input type="text" name="site_name" value={formData.site_name ?? ''} onChange={handleInput} className={inputCls} />
                                ) : (
                                    display.site_name || '—'
                                )}
                            </Field>

                            {/* Address — full width */}
                            <div className="col-span-2">
                                <Field label="Address">
                                    {isEditing ? (
                                        <textarea name="site_address" value={formData.site_address ?? ''} onChange={handleInput} rows={2} className={`${inputCls} resize-none`} />
                                    ) : (
                                        <span className="whitespace-pre-wrap">{display.site_address || '—'}</span>
                                    )}
                                </Field>
                            </div>

                            {/* Ownership */}
                            <Field label="Ownership">
                                {isEditing ? (
                                    <SelectWrapper>
                                        <select name="site_partnership" value={formData.site_partnership ?? ''} onChange={handleInput} className={selectCls}>
                                            <option value="">Select</option>
                                            {ownershipOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </SelectWrapper>
                                ) : (
                                    display.site_partnership || '—'
                                )}
                            </Field>

                            {/* Transactions Catered */}
                            <Field label="Transactions Catered">
                                {isEditing ? (
                                    <Select
                                        isMulti
                                        options={trxnOptions}
                                        value={selectedTrxn}
                                        onChange={handleTrxn}
                                        placeholder="Select…"
                                        isClearable
                                        closeMenuOnSelect={false}
                                        hideSelectedOptions={false}
                                        unstyled
                                        classNames={{
                                            control: ({ isFocused }) =>
                                                `border ${isFocused ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg bg-white dark:bg-gray-800 px-3 py-1.5 text-sm cursor-pointer min-h-[38px]`,
                                            menu: () => 'mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl text-sm z-10 overflow-hidden',
                                            option: ({ isSelected, isFocused }) =>
                                                `px-3 py-2 cursor-pointer ${isSelected ? 'bg-indigo-600 text-white' : isFocused ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`,
                                            multiValue: () => 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 mr-1 my-0.5',
                                            multiValueLabel: () => 'font-medium text-xs',
                                            multiValueRemove: () => 'text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 ml-0.5 cursor-pointer',
                                            placeholder: () => 'text-gray-400 dark:text-gray-500 text-sm',
                                            input: () => 'text-gray-900 dark:text-gray-100 text-sm',
                                            valueContainer: () => 'flex flex-wrap gap-0',
                                            indicatorsContainer: () => 'flex items-center',
                                            clearIndicator: () => 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer',
                                            dropdownIndicator: () => 'p-1 text-gray-400 cursor-pointer',
                                        }}
                                    />
                                ) : (
                                    trxnPills.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                                            {trxnPills.map((item, i) => (
                                                <span key={i} className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    ) : '—'
                                )}
                            </Field>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-800" />

                    {/* Infrastructure */}
                    <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Infrastructure</p>

                        <div className="grid grid-cols-4 gap-4">
                            <Field label="Dual Server">
                                {isEditing ? (
                                    <SelectWrapper>
                                        <select value={Number(formData.physical_site_count) === 2 ? 'Yes' : 'No'} onChange={handleDual} className={selectCls}>
                                            <option value="No">No</option>
                                            <option value="Yes">Yes</option>
                                        </select>
                                    </SelectWrapper>
                                ) : (
                                    <span className={dualDisplay === 'Yes' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>{dualDisplay}</span>
                                )}
                            </Field>

                            <Field label="Nodes Total">
                                <span className="font-semibold">{nodesTotal}</span>
                            </Field>

                            <Field label="Working">
                                {isEditing ? (
                                    <input type="number" name="node_working" value={formData.node_working} onChange={handleNumber} min="0" className={inputCls} />
                                ) : (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{display.node_working || 0}</span>
                                )}
                            </Field>

                            <Field label="Defective">
                                {isEditing ? (
                                    <input type="number" name="node_defective" value={formData.node_defective} onChange={handleNumber} min="0" className={inputCls} />
                                ) : (
                                    <span className="text-red-500 dark:text-red-400 font-medium">{display.node_defective || 0}</span>
                                )}
                            </Field>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        modalRoot
    );
}

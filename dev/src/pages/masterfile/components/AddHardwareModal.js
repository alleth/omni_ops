// src/pages/masterfile/components/AddHardwareModal.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Select from 'react-select';
import { useApi } from '../../../hooks/useApi';
import { createPortal } from 'react-dom';

const modalRoot = document.getElementById('modal-root') || (() => {
    const el = document.createElement('div');
    el.id = 'modal-root';
    document.body.appendChild(el);
    return el;
})();

const AddHardwareModal = ({
                              isOpen,
                              onClose,
                              onSubmit,
                              loading: externalLoading = false,
                              allSites = [],
                              availableRegions = [],
                              allowedRegionIds = [],
                              role = 'FSE',
                              initialData = null,
                          }) => {
    const { fetchData } = useApi();

    const isEditMode = !!initialData;

    const initialRegionId = useMemo(() => {
        if (['ADM', 'ADMIN', 'ADMINISTRATOR'].includes(role)) {
            return availableRegions.length > 0 ? String(availableRegions[0].region_id) : '';
        }
        const filtered = availableRegions.filter(r => allowedRegionIds.includes(String(r.region_id)));
        return filtered.length === 1 ? String(filtered[0].region_id) : '';
    }, [availableRegions, allowedRegionIds, role]);

    const [formData, setFormData] = useState({
        region_id: initialRegionId,
        site_code: '',
        asset_num: '',
        serial_num: '',
        item_desc: '',
        hw_brand_name: '',
        hw_model: '',
        os_type: '',
    });

    const [selectedSubMajorType, setSelectedSubMajorType] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const [itemDescriptions, setItemDescriptions] = useState([]);
    const [fetchingItems, setFetchingItems] = useState(false);

    const [brands, setBrands] = useState([]);
    const [fetchingBrands, setFetchingBrands] = useState(false);

    const [models, setModels] = useState([]);
    const [fetchingModels, setFetchingModels] = useState(false);

    const [assetTagType, setAssetTagType] = useState('');
    const [serialTagType, setSerialTagType] = useState('NORMAL');

    const hasLoaded = useRef(false);
    const lastFetchedDesc = useRef(null);
    const lastFetchedBrand = useRef(null);

    // react-select applies an inline `color` to singleValue/input that overrides
    // Tailwind `dark:` classes, leaving selected text dark in dark mode. Track the
    // dark class on <html> and set the color via the styles prop so it wins.
    const [isDark, setIsDark] = useState(
        () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );
    useEffect(() => {
        const root = document.documentElement;
        const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const selectStyles = useMemo(() => ({
        control: (base) => ({
            ...base,
            borderColor: 'inherit',
            boxShadow: 'none',
            '&:hover': { borderColor: 'inherit' },
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        singleValue: (base) => ({ ...base, color: isDark ? '#f3f4f6' : '#111827' }),
        input: (base) => ({ ...base, color: isDark ? '#f3f4f6' : '#111827' }),
        placeholder: (base) => ({ ...base, color: isDark ? '#9ca3af' : '#6b7280' }),
    }), [isDark]);

    // Reset / pre-fill form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && initialData) {
                const existingAsset = initialData.hw_asset_num || initialData.asset_num || '';
                const existingSerial = initialData.hw_serial_num || initialData.serial_num || '';

                let detectedAssetTag = '';
                let displayAssetNum = existingAsset;

                if (existingAsset === 'N/A') {
                    detectedAssetTag = 'NOT_APPLICABLE';
                    displayAssetNum = '';
                } else if (existingAsset === 'No Tag') {
                    detectedAssetTag = 'TAG_REMOVED_UNREADABLE';
                    displayAssetNum = '';
                } else if (existingAsset.startsWith('PE ')) {
                    detectedAssetTag = 'PE';
                    displayAssetNum = existingAsset.replace(/^PE /, '');
                } else if (existingAsset.startsWith('CI ')) {
                    detectedAssetTag = 'CI';
                    displayAssetNum = existingAsset.replace(/^CI /, '');
                }

                let detectedSerialTag = 'NORMAL';
                if (existingSerial === 'N/A') {
                    detectedSerialTag = 'NOT_APPLICABLE';
                } else if (existingSerial === 'Unreadable') {
                    detectedSerialTag = 'UNREADABLE_MISSING';
                }

                setFormData({
                    region_id: initialData.region_id || initialRegionId,
                    site_code: initialData.site_code || '',
                    asset_num: displayAssetNum,
                    serial_num: existingSerial,
                    item_desc: initialData.item_desc || '',
                    hw_brand_name: initialData.hw_brand_name || '',
                    hw_model: initialData.hw_model || '',
                    os_type: initialData.os_type || '',
                });

                setAssetTagType(detectedAssetTag);
                setSerialTagType(detectedSerialTag);
                setSelectedSubMajorType(initialData.sub_major_type || '');
            } else {
                setFormData({
                    region_id: initialRegionId,
                    site_code: '',
                    asset_num: '',
                    serial_num: '',
                    item_desc: '',
                    hw_brand_name: '',
                    hw_model: '',
                    os_type: '',
                });
                setAssetTagType('');
                setSerialTagType('NORMAL');
                setSelectedSubMajorType('');
            }
            setShowSuccess(false);
        }
    }, [isOpen, isEditMode, initialData, initialRegionId]);

    // Asset tag type options
    const assetTagOptions = [
        { value: 'PE', label: 'PE (with prefix)' },
        { value: 'CI', label: 'CI (with prefix)' },
        { value: 'NOT_APPLICABLE', label: 'No Tag' },
        { value: 'TAG_REMOVED_UNREADABLE', label: 'Tag Removed / Unreadable' },
    ];

    // Serial tag type options
    const serialTagOptions = [
        { value: 'NORMAL', label: 'Normal Serial' },
        { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
        { value: 'UNREADABLE_MISSING', label: 'Unreadable / Missing' },
    ];

    // OS Type options
    const osTypeOptions = [
        { value: 'Windows XP', label: 'Windows XP' },
        { value: 'Windows 10 32-Bit', label: 'Win 10 32-Bit' },
        { value: 'Windows 10 64-Bit', label: 'Win 10 64-Bit' },
        { value: 'Windows 11', label: 'Windows 11' },
    ];

    const showOsType = formData.item_desc === 'CPU-PC';

    // ── Memoized values ───────────────────────────────────────────────
    const userRegions = useMemo(() => {
        if (['ADM', 'ADMIN', 'ADMINISTRATOR'].includes(role)) return availableRegions;
        return availableRegions.filter(r => allowedRegionIds.includes(String(r.region_id)));
    }, [availableRegions, allowedRegionIds, role]);

    const filteredSites = useMemo(() => {
        if (!formData.region_id) return [];
        return allSites.filter(site => String(site.region_id) === formData.region_id);
    }, [allSites, formData.region_id]);

    const fseSites = useMemo(() => {
        if (role !== 'FSE') return [];
        return allSites.filter(site => allowedRegionIds.includes(String(site.region_id)));
    }, [allSites, allowedRegionIds, role]);

    const hardwareOptions = useMemo(() => {
        return itemDescriptions.map(item => ({
            value: item.item_desc,
            label: item.item_desc,
        }));
    }, [itemDescriptions]);

    const selectedHardware = useMemo(() => {
        return hardwareOptions.find(option => option.value === formData.item_desc) || null;
    }, [hardwareOptions, formData.item_desc]);

    const brandOptions = useMemo(() => {
        return brands.map(brand => ({
            value: brand,
            label: brand,
        }));
    }, [brands]);

    const selectedBrand = useMemo(() => {
        return brandOptions.find(opt => opt.value === formData.hw_brand_name) || null;
    }, [brandOptions, formData.hw_brand_name]);

    const modelOptions = useMemo(() => {
        return models.map(model => ({
            value: model,
            label: model,
        }));
    }, [models]);

    const selectedModel = useMemo(() => {
        return modelOptions.find(opt => opt.value === formData.hw_model) || null;
    }, [modelOptions, formData.hw_model]);

    // ── Fetch brands ──
    useEffect(() => {
        if (!formData.item_desc) return;
        if (lastFetchedDesc.current === formData.item_desc) return;

        const loadBrands = async () => {
            setFetchingBrands(true);
            lastFetchedDesc.current = formData.item_desc;

            try {
                const res = await fetchData(`/api/item-brand?item_desc=${encodeURIComponent(formData.item_desc)}`);
                let brandList = res?.itemBrand || [];
                const filteredBrands = brandList
                    .filter(item => item?.item_desc === formData.item_desc && item?.brand)
                    .map(item => item.brand.trim());
                const uniqueSorted = [...new Set(filteredBrands)].sort((a, b) => a.localeCompare(b));
                setBrands(uniqueSorted);
            } catch (err) {
                console.error('Error loading brands:', err);
            } finally {
                setFetchingBrands(false);
            }
        };

        loadBrands();
    }, [formData.item_desc, fetchData]);

    // ── Fetch models ──
    useEffect(() => {
        if (!formData.item_desc || !formData.hw_brand_name) return;

        const cacheKey = `${formData.item_desc}|${formData.hw_brand_name}`;
        if (lastFetchedBrand.current === cacheKey) return;

        const loadModels = async () => {
            setFetchingModels(true);
            lastFetchedBrand.current = cacheKey;

            try {
                const res = await fetchData(
                    `/api/item-models?item_desc=${encodeURIComponent(formData.item_desc)}&brand=${encodeURIComponent(formData.hw_brand_name)}`
                );
                let modelList = res?.itemModels || [];
                const filteredModels = modelList
                    .filter(item => item?.item_desc === formData.item_desc && item?.brand === formData.hw_brand_name && item?.model)
                    .map(item => item.model.trim());
                const uniqueSorted = [...new Set(filteredModels)].sort((a, b) => a.localeCompare(b));
                setModels(uniqueSorted);
            } catch (err) {
                console.error('Error loading models:', err);
            } finally {
                setFetchingModels(false);
            }
        };

        loadModels();
    }, [formData.item_desc, formData.hw_brand_name, fetchData]);

    // ── Load item descriptions ──
    useEffect(() => {
        if (!isOpen || hasLoaded.current) return;
        hasLoaded.current = true;

        const loadItemDescriptions = async () => {
            setFetchingItems(true);
            try {
                const res = await fetchData('/api/item-description');
                let data = res?.itemDescription || res?.itemDescriptions || res || [];
                if (!Array.isArray(data)) data = [data];

                const filtered = data.filter(item => item && typeof item.item_desc === 'string');
                const sorted = [...filtered].sort((a, b) => a.item_desc.localeCompare(b.item_desc));
                setItemDescriptions(sorted);
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setFetchingItems(false);
            }
        };

        loadItemDescriptions();
    }, [fetchData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'region_id') next.site_code = '';
            return next;
        });
    };

    const handleAssetTagTypeChange = (option) => {
        const type = option ? option.value : '';
        setAssetTagType(type);
        setFormData(prev => ({ ...prev, asset_num: '' }));
    };

    const handleAssetNumChange = (e) => {
        const rawValue = e.target.value.trim();
        setFormData(prev => ({ ...prev, asset_num: rawValue }));
    };

    const handleSerialTagTypeChange = (option) => {
        const type = option ? option.value : 'NORMAL';
        setSerialTagType(type);
        setFormData(prev => ({ ...prev, serial_num: '' }));
    };

    const handleSerialNumChange = (e) => {
        setFormData(prev => ({ ...prev, serial_num: e.target.value.trim() }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Re-apply prefix ONLY before sending to backend
        let finalAssetNum = formData.asset_num?.trim() || '';
        if (assetTagType === 'PE' && finalAssetNum && !finalAssetNum.startsWith('PE ')) {
            finalAssetNum = 'PE ' + finalAssetNum;
        } else if (assetTagType === 'CI' && finalAssetNum && !finalAssetNum.startsWith('CI ')) {
            finalAssetNum = 'CI ' + finalAssetNum;
        } else if (assetTagType === 'NOT_APPLICABLE') {
            finalAssetNum = 'N/A';
        } else if (assetTagType === 'TAG_REMOVED_UNREADABLE') {
            finalAssetNum = 'No Tag';
        }

        let finalSerialNum = formData.serial_num?.trim() || '';
        if (serialTagType === 'NOT_APPLICABLE') {
            finalSerialNum = 'N/A';
        } else if (serialTagType === 'UNREADABLE_MISSING') {
            finalSerialNum = 'Unreadable';
        }

        onSubmit({
            ...formData,
            asset_num: finalAssetNum,
            serial_num: finalSerialNum,
            assetTagType,
            serialTagType,
            sub_major_type: selectedSubMajorType,
        });
    };

    if (!isOpen) return null;

    const showRegionDropdown = userRegions.length > 1;
    const sitesToShow = showRegionDropdown ? filteredSites : fseSites;
    const siteDisabledBase = showRegionDropdown && !formData.region_id;

    // Disable region and site inputs in edit mode
    const regionDisabled = isEditMode;
    const siteDisabled = isEditMode || siteDisabledBase;

    // Find current region name and site name for display in edit mode
    const currentRegionName = isEditMode && formData.region_id
        ? userRegions.find(r => String(r.region_id) === String(formData.region_id))?.region_name || 'Unknown Region'
        : '';

    const currentSiteName = isEditMode && formData.site_code
        ? allSites.find(s => s.site_code === formData.site_code)?.site_name || formData.site_code || 'Unknown Site'
        : '';

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
        >
            <div
                className={`
          relative w-full max-w-md mx-4 p-6 rounded-xl shadow-2xl ring-1
          transform transition-all duration-300 ease-out
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ring-gray-200/70 dark:ring-gray-700/50
        `}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold tracking-tight">
                        {isEditMode ? 'Edit Hardware' : 'Add Hardware'}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={externalLoading}
                        className="p-2 rounded-full transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Success Message (only for add mode) */}
                {showSuccess && !isEditMode && (
                    <div className="mb-5 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-200 text-xs flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Added successfully</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {showRegionDropdown && (
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Region
                            </label>
                            {isEditMode ? (
                                <input
                                    type="text"
                                    value={currentRegionName}
                                    readOnly
                                    disabled
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            ) : (
                                <div className="relative">
                                    <select
                                        name="region_id"
                                        value={formData.region_id}
                                        onChange={handleChange}
                                        disabled={externalLoading}
                                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none"
                                        required
                                    >
                                        <option value="">Select Region</option>
                                        {userRegions.map(r => (
                                            <option key={r.region_id} value={r.region_id}>
                                                {r.region_name}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Site <span className="text-red-500">*</span>
                        </label>
                        {isEditMode ? (
                            <input
                                type="text"
                                value={`${formData.site_code} – ${currentSiteName}`}
                                readOnly
                                disabled
                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        ) : (
                            <div className="relative">
                                <select
                                    name="site_code"
                                    value={formData.site_code}
                                    onChange={handleChange}
                                    disabled={externalLoading || siteDisabledBase}
                                    className={`w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none ${siteDisabledBase ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    required
                                >
                                    <option value="">Select Site</option>
                                    {sitesToShow.map(site => (
                                        <option key={site.site_code} value={site.site_code}>
                                            {site.site_code} – {site.site_name || 'Unnamed'}
                                        </option>
                                    ))}
                                </select>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
                            </div>
                        )}
                    </div>

                    {/* Hardware Type */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                            Hardware Type <span className="text-red-500">*</span>
                        </label>

                        {fetchingItems ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : itemDescriptions.length === 0 ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400">No types</div>
                        ) : (
                            <Select
                                options={hardwareOptions}
                                value={selectedHardware}
                                onChange={(option) => {
                                    const newDesc = option ? option.value : '';
                                    const selectedItem = itemDescriptions.find(item => item.item_desc === newDesc);
                                    const subMajor = selectedItem ? (selectedItem.sub_major_type || '') : '';

                                    setFormData(prev => ({
                                        ...prev,
                                        item_desc: newDesc,
                                        hw_brand_name: '',
                                        hw_model: '',
                                        os_type: '',
                                    }));

                                    setSelectedSubMajorType(subMajor);
                                }}
                                placeholder="Select type..."
                                isSearchable
                                isClearable
                                isDisabled={externalLoading || fetchingItems}
                                className="text-xs"
                                classNames={{
                                    control: ({ isFocused }) =>
                                        `border ${isFocused ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-300 dark:border-gray-600'}
                     bg-white dark:bg-gray-800 rounded-lg min-h-[38px] px-3 shadow-sm transition-all text-xs disabled:opacity-60`,
                                    valueContainer: () => 'px-1 py-1 text-xs',
                                    input: () => 'text-xs m-0 p-0',
                                    singleValue: () => 'text-xs text-gray-900 dark:text-gray-100',
                                    placeholder: () => 'text-xs text-gray-500 dark:text-gray-400',
                                    menu: () =>
                                        'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl mt-1 z-50 text-xs',
                                    menuList: () => 'p-1 max-h-56 overflow-auto',
                                    option: ({ isFocused, isSelected }) =>
                                        `px-3 py-2 cursor-pointer rounded text-xs transition-colors ${
                                            isSelected ? 'bg-indigo-600 text-white' : isFocused ? 'bg-indigo-50 dark:bg-indigo-800/30' : 'hover:bg-indigo-50 dark:hover:bg-indigo-800/20'
                                        }`,
                                    dropdownIndicator: () => 'text-gray-500 px-2',
                                    clearIndicator: () => 'text-gray-500 hover:text-gray-700 px-1',
                                    indicatorSeparator: () => 'bg-gray-300 dark:bg-gray-600 mx-1 my-1',
                                }}
                                styles={selectStyles}
                                menuPortalTarget={document.body}
                            />
                        )}
                    </div>

                    {/* OS Type */}
                    {showOsType && (
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                OS Type <span className="text-red-500">*</span>
                            </label>
                            <Select
                                options={osTypeOptions}
                                value={osTypeOptions.find(opt => opt.value === formData.os_type) || null}
                                onChange={(option) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        os_type: option ? option.value : '',
                                    }));
                                }}
                                placeholder="Select OS..."
                                isSearchable={false}
                                isClearable
                                isDisabled={externalLoading}
                                className="text-xs"
                                classNames={{
                                    control: ({ isFocused }) =>
                                        `border ${isFocused ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-300 dark:border-gray-600'}
                     bg-white dark:bg-gray-800 rounded-lg min-h-[38px] px-3 shadow-sm transition-all text-xs disabled:opacity-60`,
                                    valueContainer: () => 'px-1 py-1 text-xs',
                                    input: () => 'text-xs m-0 p-0',
                                    singleValue: () => 'text-xs text-gray-900 dark:text-gray-100',
                                    placeholder: () => 'text-xs text-gray-500 dark:text-gray-400',
                                    menu: () =>
                                        'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl mt-1 z-50 text-xs',
                                    menuList: () => 'p-1 max-h-56 overflow-auto',
                                    option: ({ isFocused, isSelected }) =>
                                        `px-3 py-2 cursor-pointer rounded text-xs transition-colors ${
                                            isSelected ? 'bg-indigo-600 text-white' : isFocused ? 'bg-indigo-50 dark:bg-indigo-800/30' : 'hover:bg-indigo-50 dark:hover:bg-indigo-800/20'
                                        }`,
                                    dropdownIndicator: () => 'text-gray-500 px-2',
                                    clearIndicator: () => 'text-gray-500 hover:text-gray-700 px-1',
                                    indicatorSeparator: () => 'bg-gray-300 dark:bg-gray-600 mx-1 my-1',
                                }}
                                styles={selectStyles}
                                menuPortalTarget={document.body}
                            />
                        </div>
                    )}

                    {/* Brand */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Brand</label>
                        <Select
                            options={brandOptions}
                            value={selectedBrand}
                            onChange={(option) => {
                                const newBrand = option ? option.value : '';
                                setFormData(prev => ({
                                    ...prev,
                                    hw_brand_name: newBrand,
                                    hw_model: '',
                                }));
                            }}
                            placeholder={
                                !formData.item_desc ? "Select type first" :
                                    fetchingBrands ? "Loading..." :
                                        brands.length === 0 ? "No brands" : "Select brand..."
                            }
                            isSearchable
                            isClearable
                            isDisabled={externalLoading || !formData.item_desc || fetchingBrands}
                            className="text-xs"
                            classNames={{
                                control: ({ isFocused }) =>
                                    `border ${isFocused ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-300 dark:border-gray-600'}
                     bg-white dark:bg-gray-800 rounded-lg min-h-[38px] px-3 shadow-sm transition-all text-xs disabled:opacity-60`,
                                valueContainer: () => 'px-1 py-0.5 text-xs',
                                input: () => 'text-xs m-0 p-0',
                                singleValue: () => 'text-xs text-gray-900 dark:text-gray-100',
                                placeholder: () => 'text-xs text-gray-500 dark:text-gray-400',
                                menu: () =>
                                    'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl mt-1 z-50 text-xs',
                                menuList: () => 'p-1 max-h-56 overflow-auto',
                                option: ({ isFocused, isSelected }) =>
                                    `px-3 py-2 cursor-pointer rounded text-xs transition-colors ${
                                        isSelected ? 'bg-indigo-600 text-white' : isFocused ? 'bg-indigo-50 dark:bg-indigo-800/30' : 'hover:bg-indigo-50 dark:hover:bg-indigo-800/20'
                                    }`,
                                dropdownIndicator: () => 'text-gray-500 px-2',
                                clearIndicator: () => 'text-gray-500 hover:text-gray-700 px-1',
                                indicatorSeparator: () => 'bg-gray-300 dark:bg-gray-600 mx-1 my-1',
                            }}
                            styles={selectStyles}
                            menuPortalTarget={document.body}
                        />
                    </div>

                    {/* Model */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Model</label>
                        <Select
                            options={modelOptions}
                            value={selectedModel}
                            onChange={(option) =>
                                setFormData(prev => ({
                                    ...prev,
                                    hw_model: option ? option.value : '',
                                }))
                            }
                            placeholder={
                                !formData.hw_brand_name ? "Select brand first" :
                                    fetchingModels ? "Loading..." :
                                        models.length === 0 ? "No models" : "Select model..."
                            }
                            isSearchable
                            isClearable
                            isDisabled={externalLoading || !formData.hw_brand_name || fetchingModels}
                            className="text-xs"
                            classNames={{
                                control: ({ isFocused }) =>
                                    `border ${isFocused ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-300 dark:border-gray-600'}
                     bg-white dark:bg-gray-800 rounded-lg min-h-[38px] px-3 shadow-sm transition-all text-xs disabled:opacity-60`,
                                valueContainer: () => 'px-1 py-0.5 text-xs',
                                input: () => 'text-xs m-0 p-0',
                                singleValue: () => 'text-xs text-gray-900 dark:text-gray-100',
                                placeholder: () => 'text-xs text-gray-500 dark:text-gray-400',
                                menu: () =>
                                    'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl mt-1 z-50 text-xs',
                                menuList: () => 'p-1 max-h-56 overflow-auto',
                                option: ({ isFocused, isSelected }) =>
                                    `px-3 py-2 cursor-pointer rounded text-xs transition-colors ${
                                        isSelected ? 'bg-indigo-600 text-white' : isFocused ? 'bg-indigo-50 dark:bg-indigo-800/30' : 'hover:bg-indigo-50 dark:hover:bg-indigo-800/20'
                                    }`,
                                dropdownIndicator: () => 'text-gray-500 px-2',
                                clearIndicator: () => 'text-gray-500 hover:text-gray-700 px-1',
                                indicatorSeparator: () => 'bg-gray-300 dark:bg-gray-600 mx-1 my-1',
                            }}
                            styles={selectStyles}
                            menuPortalTarget={document.body}
                        />
                    </div>

                    {/* Asset No Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Asset Tag Type
                            </label>
                            <Select
                                options={assetTagOptions}
                                value={assetTagOptions.find(opt => opt.value === assetTagType) || null}
                                onChange={handleAssetTagTypeChange}
                                placeholder="Tag type..."
                                isSearchable={false}
                                isClearable={false}
                                isDisabled={externalLoading}
                                className="text-xs"
                                classNames={{
                                    control: ({ isFocused }) =>
                                        `border ${isFocused ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-300 dark:border-gray-600'}
                     bg-white dark:bg-gray-800 rounded-lg min-h-[38px] px-3 shadow-sm transition-all text-xs disabled:opacity-60`,
                                    menu: () =>
                                        'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl mt-1 z-50 text-xs',
                                    option: ({ isFocused, isSelected }) =>
                                        `px-3 py-2 cursor-pointer rounded text-xs transition-colors ${
                                            isSelected ? 'bg-indigo-600 text-white' : isFocused ? 'bg-indigo-50 dark:bg-indigo-800/30' : 'hover:bg-indigo-50 dark:hover:bg-indigo-800/20'
                                        }`,
                                }}
                                styles={selectStyles}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Asset No
                            </label>

                            {assetTagType === 'PE' || assetTagType === 'CI' ? (
                                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 text-xs font-medium">
                    {assetTagType}
                  </span>
                                    <input
                                        type="text"
                                        value={formData.asset_num}
                                        onChange={handleAssetNumChange}
                                        placeholder="Number only"
                                        disabled={externalLoading}
                                        className="w-full pl-14 pr-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-60 transition-all"
                                    />
                                </div>
                            ) : assetTagType ? (
                                <div className="py-2.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3">
                                    {assetTagType === 'NOT_APPLICABLE'
                                        ? 'Not applicable (N/A)'
                                        : 'Tag removed / unreadable (No Tag)'}
                                </div>
                            ) : (
                                <div className="py-2.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3">
                                    Select type first
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Serial Tag Type
                            </label>
                            <Select
                                options={serialTagOptions}
                                value={serialTagOptions.find(opt => opt.value === serialTagType) || null}
                                onChange={handleSerialTagTypeChange}
                                placeholder="Serial type..."
                                isSearchable={false}
                                isClearable={false}
                                isDisabled={externalLoading}
                                className="text-xs"
                                classNames={{
                                    control: ({ isFocused }) =>
                                        `border ${isFocused ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-gray-300 dark:border-gray-600'}
                     bg-white dark:bg-gray-800 rounded-lg min-h-[38px] px-3 shadow-sm transition-all text-xs disabled:opacity-60`,
                                    menu: () =>
                                        'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl mt-1 z-50 text-xs',
                                    option: ({ isFocused, isSelected }) =>
                                        `px-3 py-2 cursor-pointer rounded text-xs transition-colors ${
                                            isSelected ? 'bg-indigo-600 text-white' : isFocused ? 'bg-indigo-50 dark:bg-indigo-800/30' : 'hover:bg-indigo-50 dark:hover:bg-indigo-800/20'
                                        }`,
                                }}
                                styles={selectStyles}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Serial No
                            </label>

                            {serialTagType === 'NORMAL' ? (
                                <input
                                    type="text"
                                    name="serial_num"
                                    value={formData.serial_num}
                                    onChange={handleSerialNumChange}
                                    placeholder="Enter serial"
                                    disabled={externalLoading}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-60 transition-all"
                                />
                            ) : serialTagType === 'NOT_APPLICABLE' ? (
                                <div className="py-2.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3">
                                    Not applicable (N/A)
                                </div>
                            ) : (
                                <div className="py-2.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3">
                                    Unreadable / missing
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={externalLoading}
                            className="px-5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={externalLoading || fetchingItems || fetchingBrands || fetchingModels}
                            className="px-5 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            {externalLoading ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isEditMode ? 'Updating...' : 'Adding...'}
                                </>
                            ) : (
                                isEditMode ? 'Update Hardware' : 'Add Hardware'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        modalRoot
    );
};

export default AddHardwareModal;

// src/pages/masterfile/MasterfileReports.js
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ArrowDownTrayIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import { useApi } from '../../hooks/useApi';

// ── Searchable dropdown — same look as the Inventory filters ──
const searchSelectClassNames = {
    control: ({ isFocused, isDisabled }) =>
        `border rounded-xl bg-white dark:bg-gray-800 px-2 min-h-[42px] text-sm ${
            isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        } ${isFocused ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-300 dark:border-gray-600'}`,
    menu: () => 'mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl text-sm overflow-hidden',
    menuList: () => 'max-h-60 overflow-y-auto',
    option: ({ isSelected, isFocused }) =>
        `px-3 py-2 cursor-pointer ${
            isSelected ? 'bg-indigo-600 text-white'
            : isFocused ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
            : 'text-gray-800 dark:text-gray-200'
        }`,
    placeholder: () => 'text-gray-400 dark:text-gray-500',
    singleValue: () => 'text-gray-900 dark:text-gray-100',
    input: () => 'text-gray-900 dark:text-gray-100',
    noOptionsMessage: () => 'px-3 py-2 text-gray-400 dark:text-gray-500',
    dropdownIndicator: () => 'p-1 text-gray-400',
    clearIndicator: () => 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer',
    indicatorSeparator: () => 'hidden',
};

const SearchableSelect = ({ value, onChange, options, placeholder, isDisabled = false, isClearable = true }) => (
    <Select
        unstyled
        isClearable={isClearable}
        isDisabled={isDisabled}
        placeholder={placeholder}
        options={options}
        value={options.find(o => o.value === value) || null}
        onChange={opt => onChange(opt ? opt.value : '')}
        classNames={searchSelectClassNames}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
    />
);

const isOnSite = (item) => item.hw_status === 'On Site' || item.hw_status === 'Onsite';

function MasterfileReports() {
    const { fetchData } = useApi();

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const role = (user.user_type || 'FSE').toString().trim().toUpperCase();

    const [allHardware, setAllHardware] = useState([]);
    const [allSites, setAllSites] = useState([]);
    const [availableRegions, setAvailableRegions] = useState([]);
    const [allowedRegionIds, setAllowedRegionIds] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [loading, setLoading] = useState(true);

    const userRegionIds = useMemo(() => {
        if (!user.region_assigned) return [];
        return user.region_assigned.split(',').map(id => id.trim()).filter(Boolean);
    }, [user.region_assigned]);

    const stableFetchData = useRef(fetchData);
    useEffect(() => { stableFetchData.current = fetchData; }, [fetchData]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [hwRes, siteRes, regionRes] = await Promise.all([
                    stableFetchData.current('/api/hw-tbl.json'),
                    stableFetchData.current('/api/site-list-tbl.json'),
                    stableFetchData.current('/api/region-tbl.json'),
                ]);

                setAllHardware(hwRes?.hwTbl || []);
                setAllSites(siteRes?.siteListTbl || []);

                const regions = regionRes?.regionTbl || [];
                let allowedRegions;
                if ((role === 'ADM' && user.cluster_name === 'All Cluster') || role === 'ROO') {
                    allowedRegions = regions;
                } else if (['SPV', 'SUPERVISOR'].includes(role) && user.cluster_name) {
                    allowedRegions = regions.filter(
                        r => String(r.cluster_name).trim() === user.cluster_name
                    );
                } else {
                    allowedRegions = regions.filter(r =>
                        userRegionIds.includes(String(r.region_id))
                    );
                }

                setAvailableRegions(allowedRegions);
                setAllowedRegionIds(allowedRegions.map(r => String(r.region_id)));
                if (allowedRegions.length === 1) {
                    setSelectedRegion(String(allowedRegions[0].region_id));
                }
            } catch (err) {
                console.error('Failed to load report data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const regionMap = useMemo(() => {
        const map = {};
        availableRegions.forEach(r => { map[String(r.region_id)] = r.region_name; });
        return map;
    }, [availableRegions]);

    // Sites in scope: selected region, or all allowed regions when none selected
    const scopedSites = useMemo(() => {
        return allSites
            .filter(s => selectedRegion
                ? String(s.region_id) === selectedRegion
                : allowedRegionIds.includes(String(s.region_id)))
            .sort((a, b) => {
                const regionDiff = (Number(a.region_id) || 0) - (Number(b.region_id) || 0);
                if (regionDiff !== 0) return regionDiff;
                return String(a.site_code).localeCompare(String(b.site_code));
            });
    }, [allSites, selectedRegion, allowedRegionIds]);

    // counts[site_code][item_desc] over On Site hardware in scope,
    // plus the column list ordered by overall total (most common type first)
    const { hwTypeColumns, siteCounts, columnTotals, grandTotal } = useMemo(() => {
        const scopedSiteCodes = new Set(scopedSites.map(s => s.site_code));

        const counts = {};
        const typeTotals = {};

        allHardware.forEach(item => {
            if (!isOnSite(item)) return;
            if (item.site_code === 'VM-Server') return;
            if (!scopedSiteCodes.has(item.site_code)) return;

            const type = (item.item_desc || '').trim();
            if (!type) return;

            if (!counts[item.site_code]) counts[item.site_code] = {};
            counts[item.site_code][type] = (counts[item.site_code][type] || 0) + 1;
            typeTotals[type] = (typeTotals[type] || 0) + 1;
        });

        const columns = Object.keys(typeTotals).sort((a, b) => {
            const diff = typeTotals[b] - typeTotals[a];
            return diff !== 0 ? diff : a.localeCompare(b);
        });

        return {
            hwTypeColumns: columns,
            siteCounts: counts,
            columnTotals: typeTotals,
            grandTotal: Object.values(typeTotals).reduce((sum, n) => sum + n, 0),
        };
    }, [allHardware, scopedSites]);

    // Only list sites that have at least one On Site unit
    const reportRows = useMemo(() => {
        return scopedSites
            .filter(site => siteCounts[site.site_code])
            .map(site => {
                const counts = siteCounts[site.site_code];
                const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
                return { site, counts, total };
            });
    }, [scopedSites, siteCounts]);

    const handleDownload = () => {
        const regionLabel = selectedRegion
            ? (regionMap[selectedRegion] || `Region_${selectedRegion}`)
            : 'All_Regions';
        const dateStr = new Date().toISOString().split('T')[0];

        const header = ['Region', 'Site', ...hwTypeColumns, 'Total'];
        const rows = reportRows.map(({ site, counts, total }) => [
            regionMap[String(site.region_id)] || site.region_id,
            `${site.site_code} – ${site.site_name || ''}`,
            ...hwTypeColumns.map(type => counts[type] || 0),
            total,
        ]);
        const totalsRow = ['', 'TOTAL', ...hwTypeColumns.map(type => columnTotals[type] || 0), grandTotal];

        const wsData = [header, ...rows, totalsRow];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
            { wch: 18 },
            { wch: 32 },
            ...hwTypeColumns.map(type => ({ wch: Math.max(type.length + 2, 8) })),
            { wch: 8 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Site Hardware Count');
        XLSX.writeFile(wb, `Site_Hardware_Count_${regionLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.xlsx`);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Reports</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Downloadable summary reports of the hardware inventory
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <DocumentChartBarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Site Hardware Count
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            On Site hardware per site, broken down by hardware type
                        </p>
                    </div>

                    <div className="flex items-end gap-3">
                        <div className="space-y-1.5 w-56">
                            <label className="block text-xs text-gray-600 dark:text-gray-400">Region</label>
                            <SearchableSelect
                                value={selectedRegion}
                                onChange={setSelectedRegion}
                                options={availableRegions.map(r => ({ value: String(r.region_id), label: r.region_name }))}
                                placeholder="All regions"
                                isDisabled={loading}
                                isClearable={availableRegions.length > 1}
                            />
                        </div>
                        <button
                            onClick={handleDownload}
                            disabled={loading || reportRows.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Download Excel
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-2.5 py-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        ))}
                    </div>
                ) : reportRows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No On Site hardware found for the selected region.
                    </p>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/60">
                                <tr>
                                    <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Region</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">Site</th>
                                    {hwTypeColumns.map(type => (
                                        <th key={type} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">{type}</th>
                                    ))}
                                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {reportRows.map(({ site, counts, total }) => (
                                    <tr key={site.site_code} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-3 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            {regionMap[String(site.region_id)] || site.region_id}
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100 whitespace-nowrap font-medium">
                                            {site.site_code} – {site.site_name || ''}
                                        </td>
                                        {hwTypeColumns.map(type => (
                                            <td key={type} className="px-3 py-2.5 text-center tabular-nums">
                                                {counts[type]
                                                    ? <span className="text-gray-900 dark:text-gray-100">{counts[type]}</span>
                                                    : <span className="text-gray-300 dark:text-gray-600">–</span>}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-indigo-700 dark:text-indigo-300">{total}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 dark:bg-gray-800/60 border-t-2 border-gray-200 dark:border-gray-700">
                                <tr>
                                    <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-3 py-3" />
                                    <td className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                                        Total ({reportRows.length} {reportRows.length === 1 ? 'site' : 'sites'})
                                    </td>
                                    {hwTypeColumns.map(type => (
                                        <td key={type} className="px-3 py-3 text-center tabular-nums font-semibold text-gray-900 dark:text-gray-100">
                                            {columnTotals[type] || 0}
                                        </td>
                                    ))}
                                    <td className="px-3 py-3 text-center tabular-nums font-bold text-indigo-700 dark:text-indigo-300">{grandTotal}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MasterfileReports;

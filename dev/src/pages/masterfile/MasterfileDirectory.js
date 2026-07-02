// src/pages/masterfile/MasterfileDirectory.js
import React, { useMemo, useState, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { useApi } from '../../hooks/useApi';
import SiteDetailsModal from './components/SiteDetailsModal';

function MasterfileDirectory() {
    const { fetchData, loading, error } = useApi();

    const [sites, setSites] = useState([]);
    const [regions, setRegions] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedSite, setSelectedSite] = useState(null);
    const [modalMode, setModalMode] = useState('view');

    // ROO is a read-only viewer: can browse/filter sites but not add/edit/delete
    const role = (() => {
        try { return (JSON.parse(sessionStorage.getItem('user') || '{}').user_type || 'FSE').toString().trim().toUpperCase(); }
        catch { return 'FSE'; }
    })();
    const isReadOnly = role === 'ROO';

    useEffect(() => {
        const loadData = async () => {
            const regionsResult = await fetchData('/api/region-tbl');
            if (regionsResult?.regionTbl?.length) {
                const regionMap = {};
                regionsResult.regionTbl.forEach(r => {
                    regionMap[r.region_id] = r.region_name || r.region_id;
                });
                setRegions(regionMap);
            }

            const sitesResult = await fetchData('/api/site-list-tbl');
            if (sitesResult?.siteListTbl?.length) {
                setSites(sitesResult.siteListTbl);
            }
        };

        loadData();
    }, []);

    // ── Summary counts (recomputed whenever the sites list changes, e.g. after a delete) ──
    const siteStats = useMemo(() => {
        const has = (site, needle) => (site.office_type || '').toLowerCase().includes(needle);
        const trxnSet = (site) => new Set(
            (site.trxn_catered || '').split(',').map(v => v.trim().toUpperCase()).filter(Boolean)
        );
        return {
            total: sites.length,
            nru: sites.filter(s => has(s, 'nru') || has(s, 'new registration')).length,
            dlro: sites.filter(s => has(s, 'dlro') || has(s, "driver's license renewal")).length,
            // "Mixed" = caters to MV, DL and LETAS all together
            mixed: sites.filter(s => {
                const t = trxnSet(s);
                return t.has('MV') && t.has('DL') && t.has('LETAS');
            }).length,
            districtOffice: sites.filter(s => has(s, 'district office')).length,
            licensing: sites.filter(s => has(s, 'licensing center')).length,
        };
    }, [sites]);

    const statCards = [
        { label: 'Total Sites', value: siteStats.total, accent: 'text-gray-900 dark:text-gray-100' },
        { label: 'NRU', value: siteStats.nru, accent: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'DLRO', value: siteStats.dlro, accent: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Mixed Trxn (MV/DL/LETAS)', value: siteStats.mixed, accent: 'text-amber-600 dark:text-amber-400' },
        { label: 'District Office', value: siteStats.districtOffice, accent: 'text-sky-600 dark:text-sky-400' },
        { label: 'Licensing Center', value: siteStats.licensing, accent: 'text-rose-600 dark:text-rose-400' },
    ];

    const columnHelper = createColumnHelper();

    const columns = useMemo(
        () => [
            columnHelper.accessor('region_id', {
                id: 'region',
                header: 'Region',
                cell: ({ row }) => regions[row.original.region_id] || row.original.region_id || '—',
            }),
            columnHelper.accessor('office_type', {
                header: 'Office Type',
                cell: (info) => info.getValue() || '—',
            }),
            columnHelper.display({
                id: 'site',
                header: 'Site',
                cell: ({ row }) => {
                    const { site_code, site_name } = row.original;
                    return `${site_code || ''} - ${site_name || ''}`.trim() || '—';
                },
            }),
            columnHelper.accessor('trxn_catered', {
                header: 'Trxn Catered',
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (!value || value.trim() === '') return '—';
                    const items = value.split(',').map(item => item.trim()).filter(Boolean);
                    if (items.length === 0) return '—';
                    return (
                        <div className="flex flex-wrap gap-1.5">
                            {items.map((item, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('site_address', {
                header: 'Address',
                cell: (info) => info.getValue() || '—',
            }),
            columnHelper.accessor('site_partnership', {
                header: 'Ownership',
                cell: (info) => info.getValue() || '—',
            }),
        ],
        [regions]
    );

    const globalFilterFn = (row, columnId, filterValue) => {
        const value = filterValue?.toLowerCase() || '';
        if (!value) return true;

        const original = row.original;
        const searchable = [
            original.site_code?.toLowerCase() || '',
            original.site_name?.toLowerCase() || '',
            original.office_type?.toLowerCase() || '',
            original.site_address?.toLowerCase() || '',
            original.trxn_catered?.toLowerCase() || '',
            original.site_partnership?.toLowerCase() || '',
            regions[original.region_id]?.toLowerCase() || '',
        ];

        return searchable.some(text => text.includes(value));
    };

    const table = useReactTable({
        data: sites,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            {columns.map((_, i) => (
                <td key={i} className="px-5 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </td>
            ))}
        </tr>
    );

    const openCreateModal = () => {
        const emptySite = {
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
        setSelectedSite(emptySite);
        setModalMode('create');
    };

    const handleModalClose = () => {
        setSelectedSite(null);
        setModalMode('view');
    };

    if (error) {
        return (
            <div className="p-6 text-center text-red-600 dark:text-red-400">{error}</div>
        );
    }

    return (
        <div className="p-5 space-y-5">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    Sites
                </h1>

                {!isReadOnly && (
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <span>+</span> Add New Site
                    </button>
                )}
            </div>

            {/* Summary counts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {statCards.map(card => (
                    <div
                        key={card.label}
                        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3"
                    >
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{card.label}</p>
                        <p className={`mt-1 text-2xl font-semibold ${card.accent}`}>
                            {loading ? '—' : card.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="w-full sm:w-80">
                    <input
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Search site code, name, address..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>Rows per page:</span>
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                    >
                        {[10, 20, 50, 100].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>

                    <span className="whitespace-nowrap">
                        {table.getFilteredRowModel().rows.length > 0
                            ? `${(table.getState().pagination.pageIndex * table.getState().pagination.pageSize) + 1}–${Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length
                            )} of ${table.getFilteredRowModel().rows.length}`
                            : '—'}
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/60">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    onClick={header.column.getToggleSortingHandler()}
                                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/40"
                                >
                                    <div className="flex items-center gap-1">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.column.getCanSort() && (
                                            <span className="text-gray-400 dark:text-gray-500 text-xs">
                                                {{ asc: '↑', desc: '↓' }[header.column.getIsSorted()] ?? '↕'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {loading ? (
                        <>
                            {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
                        </>
                    ) : table.getRowModel().rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                No sites found
                            </td>
                        </tr>
                    ) : (
                        table.getRowModel().rows.map((row, index) => (
                            <tr
                                key={row.id}
                                onClick={() => {
                                    setSelectedSite(row.original);
                                    setModalMode('view');
                                }}
                                className={`
                                    cursor-pointer
                                    ${index % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-gray-800/30'}
                                    hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors
                                `}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id} className="px-5 py-3.5 text-sm text-gray-800 dark:text-gray-200">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center sm:justify-end gap-2 pt-2">
                <button
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="px-4 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                    Previous
                </button>
                <button
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="px-4 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                    Next
                </button>
            </div>

            {selectedSite && (
                <SiteDetailsModal
                    site={selectedSite}
                    regions={regions}
                    allSites={sites}  // ← pass full sites list for duplicate check
                    onClose={handleModalClose}
                    onSaveSuccess={() => {
                        const refresh = async () => {
                            const result = await fetchData('/api/site-list-tbl');
                            if (result?.siteListTbl?.length) {
                                setSites(result.siteListTbl);
                            }
                        };
                        refresh();
                    }}
                    mode={modalMode}
                    readOnly={isReadOnly}
                />
            )}
        </div>
    );
}

export default MasterfileDirectory;

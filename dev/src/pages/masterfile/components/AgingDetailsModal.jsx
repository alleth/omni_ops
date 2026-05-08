// src/pages/masterfile/components/AgingDetailsModal.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const modalRoot = document.getElementById('modal-root') || (() => {
    const el = document.createElement('div');
    el.id = 'modal-root';
    document.body.appendChild(el);
    return el;
})();

const AGE_BUCKETS = [
    { label: 'Critical', range: '10+ yrs',  color: '#ef4444', min: 10, max: Infinity },
    { label: 'At Risk',  range: '5–10 yrs', color: '#f59e0b', min: 5,  max: 10 },
    { label: 'Stable',   range: '3–5 yrs',  color: '#84cc16', min: 3,  max: 5 },
    { label: 'Optimal',  range: '< 3 yrs',  color: '#10b981', min: 0,  max: 3 },
];

function ageBucketColor(ageYears) {
    if (ageYears >= 10) return '#ef4444';
    if (ageYears >= 5)  return '#f59e0b';
    if (ageYears >= 3)  return '#84cc16';
    return '#10b981';
}

function buildBuckets(items) {
    return AGE_BUCKETS.map(b => {
        // items are already sorted oldest-first, so first match = oldest in that bucket
        const inBucket = items.filter(i => i.ageYears >= b.min && i.ageYears < b.max);
        return { ...b, count: inBucket.length, oldestAge: inBucket[0]?.age ?? null };
    });
}

export default function AgingDetailsModal({
    show,
    onHide,
    hardwareAging,
    hardwareAgingFilter,
    isDarkMode,
    detailedAgingList = [],
    noAcqDateByType = {},
}) {
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    if (!show) return null;

    const toggleGroup = (type) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            next.has(type) ? next.delete(type) : next.add(type);
            return next;
        });
    };

    // Group by hardware type
    const groupMap = detailedAgingList.reduce((acc, item) => {
        if (!acc[item.item_desc]) acc[item.item_desc] = [];
        acc[item.item_desc].push(item);
        return acc;
    }, {});

    // Include types that only exist in noAcqDateByType (no dated items at all)
    Object.keys(noAcqDateByType).forEach(type => {
        if (!groupMap[type]) groupMap[type] = [];
    });

    const sortedGroups = Object.entries(groupMap)
        .map(([type, items]) => ({
            type,
            items,
            maxAge: items[0]?.ageYears ?? 0,
            count: items.length,
            buckets: buildBuckets(items),
            noDateCount: noAcqDateByType[type] || 0,
        }))
        .sort((groupA, groupB) => {
            const critA = groupA.buckets.find(b => b.label === 'Critical')?.count ?? 0;
            const critB = groupB.buckets.find(b => b.label === 'Critical')?.count ?? 0;
            return critB - critA;
        });

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onHide}
        >
            <div
                className={`relative w-full max-w-4xl mx-4 rounded-2xl shadow-2xl ring-1 flex flex-col max-h-[90vh]
                    ${isDarkMode ? 'bg-gray-900 text-gray-100 ring-gray-700/50' : 'bg-white text-gray-900 ring-gray-200/70'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 pt-6 pb-4 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">
                            Hardware Aging Details
                            {hardwareAgingFilter && (
                                <span className="ml-3 text-base font-normal opacity-60">— {hardwareAgingFilter}</span>
                            )}
                        </h2>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {detailedAgingList.length.toLocaleString()} units &middot; {sortedGroups.length} hardware types &middot; click a type to expand
                            {Object.values(noAcqDateByType).reduce((s, n) => s + n, 0) > 0 && (
                                <span className="ml-1 text-gray-400">
                                    &middot; <span className="text-amber-500 font-medium">{Object.values(noAcqDateByType).reduce((s, n) => s + n, 0).toLocaleString()} no date recorded</span>
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onHide}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
                    {sortedGroups.length === 0 ? (
                        <p className={`text-center py-16 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            No acquisition date data available
                        </p>
                    ) : (
                        sortedGroups.map(({ type, items, count, maxAge, buckets, noDateCount }) => {
                            const isExpanded = expandedGroups.has(type);

                            return (
                                <div
                                    key={type}
                                    className={`rounded-xl border overflow-hidden transition-colors ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                                >
                                    {/* Clickable group header */}
                                    <button
                                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                                            isDarkMode
                                                ? 'bg-gray-800 hover:bg-gray-750'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                        onClick={() => toggleGroup(type)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: ageBucketColor(maxAge) }}
                                            />
                                            <span className={`font-semibold text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                                {type}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                {count.toLocaleString()} units
                                            </span>
                                        </div>
                                        <svg
                                            className={`w-4 h-4 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Age bucket summary — always visible */}
                                    <div className={`grid grid-cols-5 divide-x text-xs ${isDarkMode ? 'divide-gray-700 bg-gray-900/60' : 'divide-gray-200 bg-white'}`}>
                                        {buckets.map(b => (
                                            <div key={b.label} className="px-3 py-2.5 flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                                                    <span className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{b.label}</span>
                                                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>{b.range}</span>
                                                </div>
                                                <span className={`text-base font-bold leading-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                                    {b.count.toLocaleString()}
                                                    <span className={`text-xs font-normal ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>units</span>
                                                </span>
                                                {b.oldestAge ? (
                                                    <span className="truncate" style={{ color: b.color, fontSize: '10px' }}>
                                                        up to {b.oldestAge}
                                                    </span>
                                                ) : (
                                                    <span className={`${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} style={{ fontSize: '10px' }}>—</span>
                                                )}
                                            </div>
                                        ))}

                                        {/* No date column */}
                                        <div className="px-3 py-2.5 flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                                                <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No Date</span>
                                            </div>
                                            <span className={`text-base font-bold leading-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                                {noDateCount.toLocaleString()}
                                                <span className={`text-xs font-normal ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>units</span>
                                            </span>
                                            <span className={`${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} style={{ fontSize: '10px' }}>
                                                not recorded
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expanded: full item table */}
                                    {isExpanded && (
                                        <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className={isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}>
                                                        <th className="px-3 py-2 text-left font-medium">Site</th>
                                                        <th className="px-3 py-2 text-left font-medium">Brand</th>
                                                        <th className="px-3 py-2 text-left font-medium">Model</th>
                                                        <th className="px-3 py-2 text-left font-medium">Acq. Date</th>
                                                        <th className="px-3 py-2 text-left font-medium">Age</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className={`border-t ${isDarkMode ? 'border-gray-700/50 even:bg-gray-800/30' : 'border-gray-100 even:bg-gray-50/60'}`}
                                                        >
                                                            <td className={`px-3 py-2 font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.site_code}</td>
                                                            <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.brand}</td>
                                                            <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.model}</td>
                                                            <td className={`px-3 py-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.acq_date}</td>
                                                            <td className="px-3 py-2 font-medium" style={{ color: ageBucketColor(item.ageYears) }}>{item.age}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className={`flex justify-end px-6 py-4 border-t flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                        onClick={onHide}
                        className="px-6 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        modalRoot
    );
}

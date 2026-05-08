// src/pages/masterfile/components/HardwareSummaryLeft.jsx
import React from 'react';
import { Card } from 'react-bootstrap';

export default function HardwareSummaryLeft({
                                                cpuServerBrandsWithModels = [],
                                                cpuPcData = { total: 0, osList: [] },
                                                cpuPcModelsByOs = [],           // ← NEW PROP: models grouped by OS
                                                upsData = { total: 0, items: [] },
                                                monitorsData = { total: 0, items: [] },
                                                utilitiesData = { totalInstalled: 0, list: [] },
                                                networkEquipmentData = { total: 0, items: [] },
                                                showAllUPS = false,
                                                setShowAllUPS = () => {},
                                                showAllMonitors = false,
                                                setShowAllMonitors = () => {},
                                                showAllNetwork = false,
                                                setShowAllNetwork = () => {},
                                                isDarkMode,
                                            }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* CPU-SERVER BRANDS */}
                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`px-4 py-4 mb-5 rounded-lg border ${
                        isDarkMode
                            ? 'bg-indigo-950/50 border-indigo-800/40 text-indigo-50'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                CPU-Server Brand & Model
                            </h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {cpuServerBrandsWithModels.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-8">No On-Site CPU-Servers</p>
                        ) : (
                            cpuServerBrandsWithModels.map(({ brand, count: total, modelList = [] }) => {
                                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'];

                                return (
                                    <div key={brand} className="group relative">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div
                                                    className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${
                                                        brand.toLowerCase().includes('dell')
                                                            ? 'bg-blue-500'
                                                            : brand.toLowerCase().includes('hp')
                                                                ? 'bg-green-500'
                                                                : 'bg-gray-500'
                                                    }`}
                                                />
                                                <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                    {brand}
                                                </span>
                                            </div>

                                            <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-inner">
                                                <div className="h-full flex">
                                                    {modelList.length > 0 ? (
                                                        modelList.map((m, i) => (
                                                            <div
                                                                key={i}
                                                                style={{
                                                                    width: `${total > 0 ? (m.count / total) * 100 : 0}%`,
                                                                    backgroundColor: colors[i % colors.length],
                                                                }}
                                                                className="h-full first:rounded-l-full last:rounded-r-full"
                                                            />
                                                        ))
                                                    ) : (
                                                        <div
                                                            className="w-full h-full rounded-full"
                                                            style={{
                                                                backgroundColor: brand.toLowerCase().includes('dell')
                                                                    ? '#3b82f6'
                                                                    : brand.toLowerCase().includes('hp')
                                                                        ? '#10b981'
                                                                        : '#6b7280',
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            <span className={`text-sm font-bold min-w-[40px] text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {total}
                                            </span>
                                        </div>

                                        {modelList.length > 0 && (
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                                                <div
                                                    className={`px-4 py-3 rounded-lg shadow-2xl text-xs border min-w-max ${
                                                        isDarkMode ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-300'
                                                    }`}
                                                >
                                                    <div className="font-semibold mb-2 text-sm">{brand} Models</div>
                                                    {modelList.map((m, i) => (
                                                        <div key={i} className="flex items-center gap-3 py-1">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                                            <span className="font-medium">{m.model}</span>
                                                            <span className="ml-auto">({m.count})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div
                                                    className={`absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 rotate-45 ${
                                                        isDarkMode ? 'bg-gray-900 border-l border-t border-gray-700' : 'bg-white border-l border-t border-gray-300'
                                                    }`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Workstation OS Distribution – with model tooltip on hover */}
                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`px-4 py-4 mb-4 rounded-lg border ${
                        isDarkMode
                            ? 'bg-teal-950/50 border-teal-800/40 text-teal-50'
                            : 'bg-teal-50 border-teal-200 text-teal-900'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Workstation
                            </h3>
                            <div className="text-right">
                                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Total
                                </p>
                                <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {cpuPcData.total.toLocaleString('en-US')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {cpuPcData.osList.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-8">No PCs</p>
                        ) : (
                            <>
                                {cpuPcData.osList.slice(0, 7).map(({ os, count, percent }) => {
                                    const maxCount = cpuPcData.osList[0]?.count || 1;
                                    const barWidth = (count / maxCount) * 100;

                                    // Find the models for this OS
                                    const osData = cpuPcModelsByOs.find(o => o.os === os) || { modelList: [] };

                                    return (
                                        <div key={os} className="group relative flex items-center text-xs h-8">
                                            {/* Subtle background bar */}
                                            <div className="absolute inset-0 overflow-hidden rounded-none">
                                                <div
                                                    className="absolute top-0 bottom-0 right-0 transition-all duration-1000 ease-out"
                                                    style={{ width: `${barWidth}%`, backgroundColor: '#3b82f6', opacity: 0.20 }}
                                                />
                                            </div>

                                            {/* OS name */}
                                            <span
                                                className={`font-medium relative z-10 whitespace-nowrap px-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                            >
                                                {os}
                                            </span>

                                            {/* Count + percent */}
                                            <div className="relative z-10 flex-1 flex justify-end pr-3">
                                                <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                    {count.toLocaleString('en-US')}
                                                    <span className="ml-1.5 text-gray-500">({percent}%)</span>
                                                </span>
                                            </div>

                                            {/* Tooltip: models breakdown */}
                                            {osData.modelList.length > 0 && (
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                                                    <div
                                                        className={`px-4 py-3 rounded-lg shadow-2xl text-xs border min-w-[220px] ${
                                                            isDarkMode ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="font-semibold mb-2 text-sm">{os} Models</div>
                                                        {osData.modelList.slice(0, 8).map((m, i) => (
                                                            <div key={i} className="flex items-center gap-3 py-1">
                                                                <div className="w-3 h-3 rounded-full bg-blue-500/70" />
                                                                <span className="font-medium truncate max-w-[140px]">{m.model}</span>
                                                                <span className="ml-auto font-semibold">{m.count}</span>
                                                            </div>
                                                        ))}
                                                        {osData.modelList.length > 8 && (
                                                            <div className="text-xs text-gray-500 mt-1 italic">
                                                                +{osData.modelList.length - 8} more models
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Arrow pointer */}
                                                    <div
                                                        className={`absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 rotate-45 ${
                                                            isDarkMode ? 'bg-gray-900 border-l border-t border-gray-700' : 'bg-white border-l border-t border-gray-300'
                                                        }`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {cpuPcData.osList.length > 7 && (
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        +{cpuPcData.osList.length - 7} more
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </Card>

                {/* UPS */}
                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`mx-0 px-4 py-4 mb-5 rounded-lg border ${
                        isDarkMode
                            ? 'bg-emerald-950/50 border-emerald-800/40 text-emerald-50'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Uninterruptible Power Supply (UPS)
                            </h3>
                            <div className="text-right">
                                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Total
                                </p>
                                <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {upsData.total.toLocaleString('en-US')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                        {upsData.items.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-8">No UPS recorded</p>
                        ) : (
                            <>
                                {(showAllUPS ? upsData.items : upsData.items.slice(0, 7)).map(({ item_desc, count, percent }) => (
                                    <div key={item_desc} className="flex justify-between">
                                        <span className={`truncate max-w-[68%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {item_desc}
                                        </span>
                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                            {count.toLocaleString('en-US')} <span className="text-xs text-gray-500">({percent}%)</span>
                                        </span>
                                    </div>
                                ))}

                                {upsData.items.length > 7 && (
                                    <button
                                        onClick={() => setShowAllUPS((prev) => !prev)}
                                        className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-colors ${
                                            isDarkMode ? 'text-blue-400 border-gray-700 hover:bg-gray-700/50' : 'text-blue-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {showAllUPS ? '↑ Show Less' : `+ ${upsData.items.length - 7} more`}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </Card>

                {/* Monitors */}
                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`mx-0 px-4 py-3 mb-5 rounded-md border ${
                        isDarkMode
                            ? 'bg-cyan-950/50 border-cyan-800/40 text-cyan-50'
                            : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Monitors
                            </h3>
                            <div className="text-right">
                                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Total
                                </p>
                                <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {monitorsData.total.toLocaleString('en-US')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                        {monitorsData.items.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-8">No monitors recorded</p>
                        ) : (
                            <>
                                {(showAllMonitors ? monitorsData.items : monitorsData.items.slice(0, 7)).map(({ item_desc, count, percent }) => (
                                    <div key={item_desc} className="flex justify-between">
                                        <span className={`truncate max-w-[68%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {item_desc}
                                        </span>
                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                            {count.toLocaleString('en-US')} <span className="text-xs text-gray-500">({percent}%)</span>
                                        </span>
                                    </div>
                                ))}

                                {monitorsData.items.length > 7 && (
                                    <button
                                        onClick={() => setShowAllMonitors((prev) => !prev)}
                                        className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-colors ${
                                            isDarkMode ? 'text-blue-400 border-gray-700 hover:bg-gray-700/50' : 'text-blue-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {showAllMonitors ? '↑ Show Less' : `+ ${monitorsData.items.length - 7} more`}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </Card>

                {/* Utilities Availability */}
                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`px-4 py-4 mb-5 rounded-lg border ${
                        isDarkMode
                            ? 'bg-violet-950/50 border-violet-800/40 text-violet-50'
                            : 'bg-violet-50 border-violet-200 text-violet-900'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Utilities Availability
                            </h3>
                            <div className="text-right">
                                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Total
                                </p>
                                <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {utilitiesData.totalInstalled.toLocaleString('en-US')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                        {utilitiesData.list.map(({ label, count }) => (
                            <div key={label} className="flex justify-between">
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{label}</span>
                                <span
                                    className={`font-semibold ${
                                        count > 0
                                            ? isDarkMode
                                                ? 'text-green-400'
                                                : 'text-green-600'
                                            : isDarkMode
                                                ? 'text-gray-500'
                                                : 'text-gray-400'
                                    }`}
                                >
                                    {count.toLocaleString('en-US')}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Network Equipment */}
                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`px-4 py-4 mb-5 rounded-lg border ${
                        isDarkMode
                            ? 'bg-rose-950/50 border-rose-800/40 text-rose-50'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Network Equipment
                            </h3>
                            <div className="text-right">
                                <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Total
                                </p>
                                <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {networkEquipmentData.total.toLocaleString('en-US')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                        {networkEquipmentData.items.length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-8">No network equipment recorded</p>
                        ) : (
                            <>
                                {(showAllNetwork ? networkEquipmentData.items : networkEquipmentData.items.slice(0, 7)).map(({ item_desc, count, percent }) => (
                                    <div key={item_desc} className="flex justify-between">
                                        <span className={`truncate max-w-[68%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {item_desc}
                                        </span>
                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                            {count.toLocaleString('en-US')} <span className="text-xs text-gray-500">({percent}%)</span>
                                        </span>
                                    </div>
                                ))}

                                {networkEquipmentData.items.length > 7 && (
                                    <button
                                        onClick={() => setShowAllNetwork((prev) => !prev)}
                                        className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-colors ${
                                            isDarkMode ? 'text-blue-400 border-gray-700 hover:bg-gray-700/50' : 'text-blue-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {showAllNetwork ? '↑ Show Less' : `+ ${networkEquipmentData.items.length - 7} more`}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </Card>

            </div>

            {/* Placeholder card */}
            <Card className={`p-6 rounded-lg shadow-sm text-center ${isDarkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <p className={`text-sm font-medium py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    More inventory details coming soon
                </p>
            </Card>
        </div>
    );
}

// src/pages/masterfile/components/HardwareSummaryRight.jsx
import React from 'react';
import { Card } from 'react-bootstrap';
import { Doughnut } from 'react-chartjs-2';

export default function HardwareSummaryRight({
                                                 printerDisplayData,
                                                 printerFilterType,
                                                 setPrinterFilterType,
                                                 availablePrinterTypes,
                                                 showAllPrinters,
                                                 setShowAllPrinters,
                                                 hardwareAging,
                                                 hardwareAgingFilter,
                                                 setHardwareAgingFilter,
                                                 availableHardwareTypes,
                                                 peripheralsData,
                                                 showAllPeripherals,
                                                 setShowAllPeripherals,
                                                 otherEquipmentData,
                                                 isDarkMode,
                                                 showAgingDetails,
                                                 setShowAgingDetails
                                             }) {
    return (
        <div className="space-y-6">

            {/* PRINTER CARD */}
            <Card className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4 gap-3">
                    <h3
                        className={`
                          inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider
                          ${isDarkMode
                                        ? 'bg-blue-900/50 text-blue-100'
                                        : 'bg-blue-100 text-blue-800'}
                        `}
                    >
                        Printer Types
                        {printerFilterType && <span className="lowercase ml-1">— {printerFilterType} Models</span>}
                    </h3>

                    <select
                        value={printerFilterType}
                        onChange={(e) => {
                            setPrinterFilterType(e.target.value || '');
                            setShowAllPrinters(false);
                        }}
                        className={`text-xs font-medium rounded-md border px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer ${
                            isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                                : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
                        }`}
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '12px'
                        }}
                    >
                        <option value="">All Types</option>
                        {availablePrinterTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <p className={`text-base font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Total: {printerDisplayData.total.toLocaleString('en-US')}
                </p>

                <div className="space-y-2.5">
                    {printerDisplayData.list.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-8">No Printers Found</p>
                    ) : (
                        <>
                            {(showAllPrinters ? printerDisplayData.list : printerDisplayData.list.slice(0, 8)).map(({ label, count, percent }) => {
                                const maxCount = printerDisplayData.list[0]?.count || 1;
                                const barWidth = (count / maxCount) * 100;

                                const color = printerFilterType
                                    ? '#3b82f6'
                                    : {
                                    LaserJet: '#3b82f6',
                                    InkJet: '#8b5cf6',
                                    DeskJet: '#ec4899',
                                    'Dot Matrix': '#f59e0b'
                                }[label] || '#94a3b8';

                                return (
                                    <div key={label} className="grid grid-cols-3 gap-3 items-center text-xs">
                                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                                          {label}
                                        </span>
                                        <div className="relative overflow-hidden h-7 col-span-2">
                                            <div
                                                className="absolute inset-y-0 right-0 opacity-20 transition-all duration-1000 ease-out"
                                                style={{ width: `${barWidth}%`, backgroundColor: color }}
                                            />
                                            <div className="relative flex justify-end items-center h-full pr-2">
                                                <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                  {count.toLocaleString('en-US')}
                                                    <span className="ml-1.5 text-gray-500">({percent}%)</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {printerDisplayData.list.length > 8 && (
                                <button
                                    onClick={() => setShowAllPrinters(prev => !prev)}
                                    className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-all hover:bg-opacity-10 ${
                                        isDarkMode
                                            ? 'text-blue-400 border-gray-700 hover:bg-gray-700'
                                            : 'text-blue-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {showAllPrinters ? '← Show Less' : `+ ${printerDisplayData.list.length - 8} more`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </Card>

            {/* HARDWARE AGING CARD */}
            <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-900/90 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h3
                                className={`
                  inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold
                  ${isDarkMode
                                    ? 'bg-purple-900/50 text-purple-100'
                                    : 'bg-purple-100 text-purple-800'}
                `}
                            >
                                Hardware Aging
                            </h3>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {hardwareAging.title}
                            </p>
                        </div>

                        <select
                            value={hardwareAgingFilter}
                            onChange={(e) => setHardwareAgingFilter(e.target.value)}
                            className={`w-full sm:w-48 text-xs font-medium rounded-md border px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-colors appearance-none cursor-pointer bg-inherit ${
                                isDarkMode
                                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '12px'
                            }}
                        >
                            {availableHardwareTypes.map(type => (
                                <option key={type} value={type === 'All Hardware' ? '' : type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {hardwareAging.total === 0 ? (
                    <p className={`text-center text-sm py-14 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        No acquisition date available for selected hardware
                    </p>
                ) : (
                    <div className="space-y-6">
                        <div className="w-48 h-48 mx-auto">
                            <Doughnut
                                data={hardwareAging.chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    cutout: '70%',
                                    plugins: { legend: { display: false }, tooltip: { enabled: true } },
                                }}
                            />
                        </div>

                        <div className="space-y-2 text-xs">
                            {hardwareAging.chartData.labels.map((label, i) => {
                                const count = hardwareAging.chartData.datasets[0].data[i];
                                const percent = hardwareAging.total > 0
                                    ? Math.round((count / hardwareAging.total) * 100)
                                    : 0;

                                return (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: hardwareAging.chartData.datasets[0].backgroundColor[i] }}
                                            />
                                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {label}
                      </span>
                                        </div>
                                        <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {count.toLocaleString('en-US')}
                                            <span className="ml-1.5 text-gray-500">({percent}%)</span>
                    </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-700/30 dark:border-gray-700/50">
                            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                Total:
                                <span className="font-semibold text-gray-300 dark:text-gray-200">
                  {hardwareAging.totalText}
                </span>
                            </div>

                            <button
                                onClick={() => setShowAgingDetails(true)}
                                className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                }`}
                            >
                                View Details
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* PERIPHERALS CARD */}
            <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`px-4 py-4 mb-5 rounded-lg border ${
                    isDarkMode
                        ? 'bg-green-950/50 border-green-800/40 text-green-50'
                        : 'bg-green-50 border-green-200 text-green-900'
                }`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                            Peripherals
                        </h3>
                        <div className="text-right">
                            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Total
                            </p>
                            <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {peripheralsData.total.toLocaleString('en-US')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5 text-sm">
                    {peripheralsData.items.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-8">No peripherals recorded</p>
                    ) : (
                        <>
                            {(showAllPeripherals ? peripheralsData.items : peripheralsData.items.slice(0, 7)).map(({ item_desc, count, percent }) => (
                                <div key={item_desc} className="flex justify-between">
                        <span className={`truncate max-w-[68%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {item_desc}
                        </span>
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {count.toLocaleString('en-US')} <span className="text-xs text-gray-500">({percent}%)</span>
                        </span>
                                </div>
                            ))}

                            {peripheralsData.items.length > 7 && (
                                <button
                                    onClick={() => setShowAllPeripherals(prev => !prev)}
                                    className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-colors ${
                                        isDarkMode ? 'text-blue-400 border-gray-700 hover:bg-gray-700/50' : 'text-blue-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {showAllPeripherals ? '↑ Show Less' : `+ ${peripheralsData.items.length - 7} more`}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </Card>


            {/* OTHER EQUIPMENT CARD */}
            <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`px-4 py-4 mb-5 rounded-lg border ${
                    isDarkMode
                        ? 'bg-amber-950/50 border-amber-800/40 text-amber-50'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                            Other Equipment
                        </h3>
                        <div className="text-right">
                            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Total
                            </p>
                            <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {otherEquipmentData.total.toLocaleString('en-US')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5 text-sm">
                    {otherEquipmentData.items.length === 0 ? (
                        <p className="text-xs text-gray-500">No equipment recorded</p>
                    ) : (
                        otherEquipmentData.items.slice(0, 7).map(({ item_desc, count, percent }) => (
                            <div key={item_desc} className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {item_desc}
                    </span>
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {count.toLocaleString('en-US')} <span className="text-xs text-gray-500">({percent}%)</span>
                    </span>
                            </div>
                        ))
                    )}
                    {otherEquipmentData.items.length > 7 && (
                        <p className="text-xs text-gray-500 mt-2">+{otherEquipmentData.items.length - 7} more</p>
                    )}
                </div>
            </Card>
        </div>
    );
}

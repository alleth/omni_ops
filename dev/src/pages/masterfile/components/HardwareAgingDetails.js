// omni_ops/dev/src/pages/masterfile/components/HardwareAgingDetails.js
import React from 'react';
import { Doughnut } from 'react-chartjs-2';

export const HardwareAgingDetails = ({ data, isDarkMode, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4" onClick={onClose}>
        <div className={`w-full max-w-7xl max-h-screen overflow-y-auto rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'} p-8`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Hardware Aging Details</h2>
                <button onClick={onClose} className="text-4xl opacity-70 hover:opacity-100">&times;</button>
            </div>

            <div className="grid lg:grid-cols-2 gap-10 mb-12">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Current Distribution by Type & Age</h3>
                    <div className="w-96 h-96 mx-auto">
                        <Doughnut data={data.multiRing} options={{ cutout: '45%', plugins: { legend: { position: 'bottom', labels: { color: isDarkMode ? '#e2e8f0' : '#1f2937' } } }}} />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Projected Aging (No Refresh)</h3>
                    <div className="space-y-6">
                        {[1, 2, 3].map(y => (
                            <div key={y} className="flex items-center gap-4">
                                <span className="w-32 text-sm font-medium">In {y} year{y > 1 ? 's' : ''}:</span>
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full flex">
                                            <div style={{ width: `${data.projected[y]['0-3']}%`, backgroundColor: '#10b981' }} />
                                            <div style={{ width: `${data.projected[y]['3-5']}%`, backgroundColor: '#84cc16' }} />
                                            <div style={{ width: `${data.projected[y]['5-7']}%`, backgroundColor: '#f59e0b' }} />
                                            <div style={{ width: `${data.projected[y]['7+']}%`, backgroundColor: '#ef4444' }} />
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${data.projected[y]['7+'] > 30 ? 'text-red-600' : 'text-gray-600'}`}>
                    {data.projected[y]['7+']}% critical
                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
                    High-Risk Assets <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full">Immediate Action</span>
                </h3>
                <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
                    <table className="w-full text-sm">
                        <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                        <tr>
                            <th className="text-left p-4">Site</th>
                            <th className="text-left p-4">Type</th>
                            <th className="text-left p-4">Model</th>
                            <th className="text-left p-4">Age</th>
                            <th className="text-right p-4">Risk Score</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.highRisk.map((item, i) => (
                            <tr key={i} className={isDarkMode ? 'border-t border-gray-700' : 'border-t'}>
                                <td className="p-4">{item.site}</td>
                                <td className="p-4">{item.type}</td>
                                <td className="p-4 font-medium">{item.model}</td>
                                <td className="p-4 text-red-600 font-bold">{item.age} yrs</td>
                                <td className="p-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${item.risk >= 80 ? 'bg-red-600' : item.risk >= 60 ? 'bg-orange-600' : 'bg-yellow-600'}`}>
                      {item.risk}
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
                <button className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Export PNG</button>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Export Report</button>
            </div>
        </div>
    </div>
);

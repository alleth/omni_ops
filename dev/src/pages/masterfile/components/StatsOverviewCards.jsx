// src/pages/masterfile/components/StatsOverviewCards.jsx
import React from 'react';
import { Card } from 'react-bootstrap';

export default function StatsOverviewCards({ stats, isDarkMode }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Sites */}
            <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-blue-900 border-blue-800' : 'bg-blue-100 border-blue-200'}`}>
                <Card.Body className="p-0">
                    <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                        Total Sites
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
                        {stats.totalSites.toLocaleString('en-US')}
                    </p>
                </Card.Body>
            </Card>

            {/* Dual Server Sites */}
            <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-purple-900 border-purple-800' : 'bg-purple-100 border-purple-200'}`}>
                <Card.Body className="p-0">
                    <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-purple-700'}`}>
                        Dual Server Sites
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                        {stats.dualServerSites.toLocaleString('en-US')}
                    </p>
                </Card.Body>
            </Card>

            {/* CPU-Servers (On Site) */}
            <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-green-900 border-green-800' : 'bg-green-100 border-green-200'}`}>
                <Card.Body className="p-0">
                    <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-green-700'}`}>
                        CPU-Servers (On Site)
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                        {stats.cpuServers.toLocaleString('en-US')}
                    </p>
                </Card.Body>
            </Card>

            {/* VM-Servers */}
            <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-teal-900 border-teal-800' : 'bg-teal-100 border-teal-200'}`}>
                <Card.Body className="p-0">
                    <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-teal-700'}`}>
                        VM-Servers
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-teal-900'}`}>
                        {stats.vmServers.toLocaleString('en-US')}
                    </p>
                </Card.Body>
            </Card>

            {/* On-Site Hardware card has been temporarily removed */}
        </div>
    );
}

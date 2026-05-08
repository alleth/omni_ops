// src/pages/masterfile/MasterfileLanding.js
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Navbar, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useApi } from '../../hooks/useApi';

import StatsOverviewCards from './components/StatsOverviewCards';
import HardwareSummaryLeft from './components/HardwareSummaryLeft';
import HardwareSummaryRight from './components/HardwareSummaryRight';
import AgingDetailsModal from "./components/AgingDetailsModal";

// ───── CENTER TEXT PLUGIN (DARK MODE AWARE) ─────
ChartJS.register(ArcElement, Tooltip, Legend, {
    id: 'doughnutCenterText',
    afterDraw(chart) {
        if (!chart.config.data.totalText) return;

        const { ctx } = chart;
        const isDark = document.documentElement.classList.contains('dark');

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#6b7280';
        ctx.fillText('Total', chart.width / 2, chart.height / 2 - 18);

        ctx.font = 'bold 36px Inter, system-ui, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.fillText(chart.config.data.totalText, chart.width / 2, chart.height / 2 + 12);

        ctx.restore();
    }
});

// ───── MINIMALIST SKELETON COMPONENTS ─────
const SkeletonNavbar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </div>
        </div>
    </div>
);

const SkeletonSidebar = () => (
    <div className="fixed top-16 left-0 z-40 w-full md:w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="p-5 space-y-6">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="space-y-4">
                <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-50 dark:bg-gray-800/50 rounded animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);

const SkeletonStats = () => (
    <div className="max-w-7xl mx-auto space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-80 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
                    <div className="h-80 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-64 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-80 bg-gray-50 dark:bg-gray-800/60 rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);

// ───── SKELETON FOR SITE DROPDOWN BUTTON ─────
const SkeletonSiteDropdownButton = () => (
    <div className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse" />
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
        </div>
    </div>
);

// ───── SKELETON FOR SITE DROPDOWN ITEMS ─────
const SkeletonSiteItem = () => (
    <div className="px-4 py-2.5">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse mb-1.5" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
    </div>
);

function MasterfileLanding() {
    const navigate = useNavigate();
    const { fetchData } = useApi();

    const [regions, setRegions] = useState([]);
    const [allSites, setAllSites] = useState([]);
    const [allHardware, setAllHardware] = useState([]);
    const [displayedSites, setDisplayedSites] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState({ region_id: null, region_name: 'LTO National' });
    const [selectedSiteCode, setSelectedSiteCode] = useState(null); // null = All sites
    const [regionsAndSitesReady, setRegionsAndSitesReady] = useState(false);
    const [hardwareReady, setHardwareReady] = useState(false);
    const [error, setError] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [printerFilterType, setPrinterFilterType] = useState('');
    const [showAllPrinters, setShowAllPrinters] = useState(false);
    const [showAllPeripherals, setShowAllPeripherals] = useState(false);
    const [showAllNetwork, setShowAllNetwork] = useState(false);
    const [showAllUPS, setShowAllUPS] = useState(false);
    const [showAllMonitors, setShowAllMonitors] = useState(false);
    const [hardwareAgingFilter, setHardwareAgingFilter] = useState('');

    const [sitesDropdownOpen, setSitesDropdownOpen] = useState(false);
    const [siteSearchTerm, setSiteSearchTerm] = useState('');

    const dropdownRef = useRef(null);
    const sidebarRef = useRef(null);
    const overlayRef = useRef(null);
    const didLoad = useRef(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        if (didLoad.current) return;
        didLoad.current = true;

        const loadData = async () => {
            try {
                const [regionsData, sitesData, hardwareData] = await Promise.all([
                    fetchData('/api/region-tbl.json'),
                    fetchData('/api/site-list-tbl.json'),
                    fetchData('/api/hw-tbl.json')
                ]);

                setRegions(regionsData?.regionTbl || []);
                setAllSites(sitesData?.siteListTbl || []);
                setRegionsAndSitesReady(true);

                setAllHardware(hardwareData?.hwTbl || []);
                setHardwareReady(true);
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load masterfile data');
            }
        };

        loadData();
    }, [fetchData]);

    useEffect(() => {
        if (!allSites.length) return;

        const validSites = allSites.filter(s => String(s.office_type || '').trim() !== 'E-Patrol');
        let filtered = validSites;

        if (selectedRegion) {
            if (selectedRegion.region_name === 'LTO National') {
                filtered = validSites.filter(s => String(s.region_id).trim() !== '15');
            } else if (selectedRegion.region_id) {
                const target = String(selectedRegion.region_id).trim();
                filtered = validSites.filter(s => String(s.region_id).trim() === target);
            }
        }

        // Sort by site_code
        filtered = [...filtered].sort((a, b) =>
            String(a.site_code || '').localeCompare(String(b.site_code || ''), undefined, { numeric: true, sensitivity: 'base' })
        );

        setDisplayedSites(filtered);
        setSelectedSiteCode(null); // reset to "All sites"

        console.log('Displayed sites count:', filtered.length, 'for region:', selectedRegion?.region_name || 'All Regions');
    }, [selectedRegion, allSites]);

    const selectSite = (siteCode) => {
        setSelectedSiteCode(siteCode);
        setSitesDropdownOpen(false);
        setSiteSearchTerm('');
    };

    const filteredSites = useMemo(() => {
        if (!siteSearchTerm.trim()) return displayedSites;

        const term = siteSearchTerm.toLowerCase().trim();
        return displayedSites.filter(site =>
            String(site.site_code || '').toLowerCase().includes(term) ||
            String(site.site_name || '').toLowerCase().includes(term)
        );
    }, [displayedSites, siteSearchTerm]);

    const filteredDataHardware = useMemo(() => {
        if (!selectedSiteCode) {
            return allHardware.filter(h => displayedSites.some(s => s.site_code === String(h.site_code || '').trim()));
        }
        return allHardware.filter(h => String(h.site_code || '').trim() === selectedSiteCode);
    }, [allHardware, selectedSiteCode, displayedSites]);

    const filteredDataSites = useMemo(() => {
        if (!selectedSiteCode) return displayedSites;
        return displayedSites.filter(s => s.site_code === selectedSiteCode);
    }, [displayedSites, selectedSiteCode]);

    const stats = useMemo(() => {
        const onSiteCpuServers = filteredDataHardware.filter(h =>
            String(h.item_desc || '').trim().toLowerCase() === 'cpu-server' &&
            ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
        );

        return {
            totalSites: filteredDataSites.length,
            cpuServers: onSiteCpuServers.length,
            dualServerSites: Math.floor(filteredDataSites.filter(s => String(s.physical_site_count || '').trim() === '2').length / 2),
            onSiteHardware: filteredDataHardware.filter(h => ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase()) && String(h.item_desc || '').trim().toLowerCase() !== 'vm-server').length,
            vmServers: filteredDataHardware.filter(h => String(h.item_desc || '').trim().toLowerCase() === 'vm-server' && ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())).length,
        };
    }, [filteredDataSites, filteredDataHardware]);

    const cpuServerBrands = useMemo(() => {
        const onSiteCpuServers = filteredDataHardware.filter(h =>
            String(h.item_desc || '').trim().toLowerCase() === 'cpu-server' &&
            ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
        );

        const group = {};
        onSiteCpuServers.forEach(h => {
            let rawBrand = String(h.hw_brand_name || 'Unknown').trim();
            if (!rawBrand || rawBrand.toLowerCase() === 'n/a' || rawBrand === 'null') rawBrand = 'Unknown';
            const key = rawBrand.toLowerCase();
            if (!group[key]) group[key] = { brand: rawBrand, count: 0 };
            group[key].count++;
        });

        return Object.values(group).sort((a, b) => b.count - a.count);
    }, [filteredDataHardware]);

    const cpuServerBrandsWithModels = useMemo(() => {
        return cpuServerBrands.map(brandObj => {
            const onSiteCpuServersForBrand = filteredDataHardware.filter(h =>
                String(h.item_desc || '').trim().toLowerCase() === 'cpu-server' &&
                ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase()) &&
                String(h.hw_brand_name || '').trim().toLowerCase() === brandObj.brand.toLowerCase()
            );

            const modelMap = onSiteCpuServersForBrand.reduce((acc, h) => {
                const model = String(h.hw_model || 'Unknown').trim() || 'Unknown';
                if (model && model !== 'null' && model !== 'n/a') {
                    acc[model] = (acc[model] || 0) + 1;
                }
                return acc;
            }, {});

            const modelList = Object.entries(modelMap)
                .map(([model, count]) => ({ model, count }))
                .sort((a, b) => b.count - a.count);

            return { ...brandObj, modelList };
        });
    }, [cpuServerBrands, filteredDataHardware]);

    // 1. OS distribution (cleaner keys + display)
    const cpuPcData = useMemo(() => {
        const group = {};
        let total = 0;

        filteredDataHardware.forEach(h => {
            if (
                String(h.item_desc || '').trim().toLowerCase() === 'cpu-pc' &&
                ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
            ) {
                total++;

                // ─── Aggressive normalization for grouping ───
                let raw = String(h.os_type || 'Unknown').trim();
                let normalized = raw
                    .toLowerCase()
                    .replace(/\s+/g, ' ')           // multiple spaces → one
                    .replace(/32\s*bit/gi, '32-bit')
                    .replace(/64\s*bit/gi, '64-bit')
                    .replace(/windows\s*10\s*32\s*-?\s*bit/gi, 'windows 10 32-bit')
                    .replace(/windows\s*10\s*64\s*-?\s*bit/gi, 'windows 10 64-bit')
                    .replace(/windows\s*11\s*32\s*-?\s*bit/gi, 'windows 11 32-bit')
                    .replace(/windows\s*11\s*64\s*-?\s*bit/gi, 'windows 11 64-bit')
                    .replace(/windows\s*(\d+)\s*bit/gi, 'windows $1 bit')   // fallback
                    .trim();

                // Final clean key for grouping
                const key = normalized;

                if (!group[key]) {
                    group[key] = { count: 0, rawExamples: [] };
                }
                group[key].count++;

                // Keep first nice-looking raw value for display (or the most common one)
                if (group[key].rawExamples.length < 3) {
                    group[key].rawExamples.push(raw);
                }
            }
        });

        // Decide best display name per group
        const osList = Object.entries(group)
            .map(([key, { count, rawExamples }]) => {
                let display = key;

                // Make display prettier
                if (key.includes('windows 10 32-bit')) display = 'Windows 10 32-Bit';
                else if (key.includes('windows 10 64-bit')) display = 'Windows 10 64-Bit';
                else if (key.includes('windows 11 32-bit')) display = 'Windows 11 32-Bit';
                else if (key.includes('windows 11 64-bit')) display = 'Windows 11 64-Bit';

                // ─── Add special cases for older Windows versions ───
                else if (key.includes('windows xp')) display = 'Windows XP';
                else if (key.includes('windows vista')) display = 'Windows Vista';
                else if (key.includes('windows 7')) display = 'Windows 7';
                else if (key.includes('windows 8.1')) display = 'Windows 8.1';
                else if (key.includes('windows 8')) display = 'Windows 8';

                else if (key.includes('windows')) {
                    // Fallback: capitalize nicely
                    display = key
                        .replace(/\bwindows\b/gi, 'Windows')
                        .replace(/\b(\d+)\b/g, ' $1 ')
                        .replace(/\s+bit\b/gi, '-Bit')
                        .trim();
                } else {
                    display = key.charAt(0).toUpperCase() + key.slice(1);
                }

                const percent = total > 0 ? (count / total * 100).toFixed(1) : 0;

                return { os: display, count, percent };
            })
            .sort((a, b) => b.count - a.count);

        return { total, osList };
    }, [filteredDataHardware]);


    const cpuPcModelsByOs = useMemo(() => {
        const grouped = {};

        filteredDataHardware.forEach(h => {
            if (
                String(h.item_desc || '').trim().toLowerCase() === 'cpu-pc' &&
                ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
            ) {
                let osRaw = String(h.os_type || 'Unknown').trim();

                // ─── Use exactly the same normalization as above! ───
                let osKey = osRaw
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .replace(/32\s*bit/gi, '32-bit')
                    .replace(/64\s*bit/gi, '64-bit')
                    .replace(/windows\s*10\s*32\s*-?\s*bit/gi, 'windows 10 32-bit')
                    .replace(/windows\s*10\s*64\s*-?\s*bit/gi, 'windows 10 64-bit')
                    .replace(/windows\s*11\s*32\s*-?\s*bit/gi, 'windows 11 32-bit')
                    .replace(/windows\s*11\s*64\s*-?\s*bit/gi, 'windows 11 64-bit')
                    .replace(/windows\s*(\d+)\s*bit/gi, 'windows $1 bit')
                    .trim();

                // Decide display name (same logic as above)
                let displayOs = osKey;
                if (osKey.includes('windows 10 32-bit')) displayOs = 'Windows 10 32-Bit';
                else if (osKey.includes('windows 10 64-bit')) displayOs = 'Windows 10 64-Bit';
                else if (osKey.includes('windows 11 32-bit')) displayOs = 'Windows 11 32-Bit';
                else if (osKey.includes('windows 11 64-bit')) displayOs = 'Windows 11 64-Bit';
                else if (osKey.includes('windows xp')) displayOs = 'Windows XP';
                else if (osKey.includes('windows vista')) displayOs = 'Windows Vista';
                else if (osKey.includes('windows 7')) displayOs = 'Windows 7';
                else if (osKey.includes('windows 8.1')) displayOs = 'Windows 8.1';
                else if (osKey.includes('windows 8')) displayOs = 'Windows 8';
                else {
                    displayOs = osKey
                        .replace(/\bwindows\b/gi, 'Windows')
                        .replace(/\bxp\b/gi, 'XP')
                        .replace(/\bvista\b/gi, 'Vista')
                        .replace(/\b(\d+(?:\.\d+)?)\b/g, ' $1 ')
                        .replace(/\s+bit\b/gi, '-Bit')
                        .replace(/\s+/g, ' ')
                        .trim();
                }

                if (!grouped[osKey]) {
                    grouped[osKey] = {
                        display: displayOs,
                        models: {}
                    };
                }

                let model = String(h.hw_model || 'Unknown').trim();
                if (!model || model.toLowerCase() === 'n/a' || model === 'null') model = 'Unknown';

                const normalizedModelKey = model
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .trim();

                if (!grouped[osKey].models[normalizedModelKey]) {
                    grouped[osKey].models[normalizedModelKey] = {
                        display: model,   // keep original casing
                        count: 0
                    };
                }
                grouped[osKey].models[normalizedModelKey].count++;
            }
        });

        return Object.values(grouped).map(osGroup => {
            const modelList = Object.entries(osGroup.models)
                .map(([_, { display, count }]) => ({ model: display, count }))
                .sort((a, b) => b.count - a.count);

            return {
                os: osGroup.display,
                modelList
            };
        });
    }, [filteredDataHardware]);

    const availableHardwareTypes = useMemo(() => {
        const types = new Set();
        filteredDataHardware.forEach(h => {
            const desc = String(h.item_desc || '').trim();
            if (desc && desc.toLowerCase() !== 'n/a') {
                types.add(desc);
            }
        });
        return ['All Hardware', ...Array.from(types).sort()];
    }, [filteredDataHardware]);

    const hardwareAging = useMemo(() => {
        const now = new Date();
        const buckets = { '0-3': 0, '3-5': 0, '5-10': 0, '10+': 0 };
        let total = 0;

        filteredDataHardware.forEach(h => {
            // Only count hardware that is currently "on site"
            if (!['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())) return;

            // Apply item_desc filter if a specific type is selected
            if (hardwareAgingFilter && hardwareAgingFilter !== 'All Hardware') {
                if (String(h.item_desc || '').trim() !== hardwareAgingFilter) return;
            }

            if (!h.hw_date_acq) return;

            const parts = h.hw_date_acq.trim().split('/');
            if (parts.length !== 3) return;

            let [month, day, year] = parts.map(p => parseInt(p, 10));
            if (year < 50) year += 2000;
            else if (year < 100) year += 1900;

            const acqDate = new Date(year, month - 1, day);
            if (isNaN(acqDate.getTime())) return;

            const ageYears = (now - acqDate) / (1000 * 60 * 60 * 24 * 365.25);

            if (ageYears < 3) buckets['0-3']++;
            else if (ageYears < 5) buckets['3-5']++;
            else if (ageYears < 10) buckets['5-10']++;
            else buckets['10+']++;

            total++;
        });

        const isDark = document.documentElement.classList.contains('dark');

        const title = hardwareAgingFilter && hardwareAgingFilter !== 'All Hardware'
            ? hardwareAgingFilter
            : 'All On-Site Hardware';

        return {
            total,
            totalText: total.toLocaleString('en-US'),
            title,
            chartData: {
                totalText: total.toLocaleString('en-US'),
                labels: ['3 years below', '3–5 years', '5–10 years', '10+ years'],
                datasets: [{
                    data: [buckets['0-3'], buckets['3-5'], buckets['5-10'], buckets['10+']],
                    backgroundColor: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'],
                    borderColor: isDark ? '#1f2937' : '#ffffff',
                    borderWidth: 4,
                    hoverBorderWidth: 6,
                }]
            }
        };
    }, [filteredDataHardware, hardwareAgingFilter]);


    const detailedAgingList = useMemo(() => {
        const list = [];
        const now = new Date();

        filteredDataHardware.forEach(h => {
            if (!['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())) return;

            if (hardwareAgingFilter && hardwareAgingFilter !== 'All Hardware') {
                if (String(h.item_desc || '').trim() !== hardwareAgingFilter) return;
            }

            if (!h.hw_date_acq) return;

            const parts = h.hw_date_acq.trim().split('/');
            if (parts.length !== 3) return;
            let [month, day, year] = parts.map(p => parseInt(p, 10));
            if (year < 50) year += 2000;
            else if (year < 100) year += 1900;

            const acqDate = new Date(year, month - 1, day);
            if (isNaN(acqDate.getTime())) return;

            let years = now.getFullYear() - acqDate.getFullYear();
            let months = now.getMonth() - acqDate.getMonth();
            let days = now.getDate() - acqDate.getDate();

            if (days < 0) {
                months--;
                days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
            }
            if (months < 0) {
                years--;
                months += 12;
            }

            const ageStr = `${years} years ${months} months ${days} days`.replace(/\s0 (years|months|days)/g, '').trim();

            list.push({
                site_code: String(h.site_code || 'N/A'),
                brand: String(h.hw_brand_name || 'Unknown'),
                model: String(h.hw_model || 'Unknown'),
                item_desc: String(h.item_desc || 'N/A'),
                acq_date: h.hw_date_acq,
                age: ageStr,
                ageYears: (now - acqDate) / (1000 * 60 * 60 * 24 * 365.25),
            });
        });

        return list.sort((a, b) => b.ageYears - a.ageYears);
    }, [filteredDataHardware, hardwareAgingFilter]);

    const noAcqDateByType = useMemo(() => {
        const map = {};
        filteredDataHardware.forEach(h => {
            if (!['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())) return;
            if (hardwareAgingFilter && hardwareAgingFilter !== 'All Hardware') {
                if (String(h.item_desc || '').trim() !== hardwareAgingFilter) return;
            }
            const raw = h.hw_date_acq ? h.hw_date_acq.trim() : '';
            const hasValidDate = raw && raw.split('/').length === 3;
            if (hasValidDate) return;
            const type = String(h.item_desc || 'Unknown').trim();
            map[type] = (map[type] || 0) + 1;
        });
        return map;
    }, [filteredDataHardware, hardwareAgingFilter]);

    const [showAgingDetails, setShowAgingDetails] = useState(false);

    const availablePrinterTypes = useMemo(() => {
        const types = new Set();
        filteredDataHardware.forEach(h => {
            if (!['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())) return;
            const desc = String(h.item_desc || '').toLowerCase();
            const sub = String(h.sub_major_type || '').toLowerCase();
            if (desc.includes('printer') || sub.includes('printer')) {
                if (desc.includes('laserjet') || sub.includes('laserjet')) types.add('LaserJet');
                else if (desc.includes('inkjet') || sub.includes('inkjet')) types.add('InkJet');
                else if (desc.includes('deskjet') || sub.includes('deskjet')) types.add('DeskJet');
                else if (desc.includes('dot matrix') || sub.includes('dot matrix')) types.add('Dot Matrix');
            }
        });
        return Array.from(types).sort();
    }, [filteredDataHardware]);

    const printerDisplayData = useMemo(() => {
        let items = [];

        if (!printerFilterType) {
            const types = ['LaserJet', 'InkJet', 'DeskJet', 'Dot Matrix'];
            items = types.map(type => {
                const count = filteredDataHardware.filter(h =>
                    (String(h.item_desc || '').toLowerCase().includes(type.toLowerCase()) ||
                        String(h.sub_major_type || '').toLowerCase().includes(type.toLowerCase())) &&
                    ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
                ).length;
                return { label: type, count };
            }).filter(i => i.count > 0);
        } else {
            const modelMap = {};

            filteredDataHardware.forEach(h => {
                if (!['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())) return;

                const desc = String(h.item_desc || '').toLowerCase();
                const sub = String(h.sub_major_type || '').toLowerCase();
                const matches = desc.includes(printerFilterType.toLowerCase()) || sub.includes(printerFilterType.toLowerCase());
                if (!matches) return;

                let rawModel = String(h.hw_model || 'Unknown').trim();
                if (!rawModel || rawModel === 'null' || rawModel.toLowerCase() === 'n/a') rawModel = 'Unknown';

                let cleanModel = rawModel
                    .toLowerCase()
                    .replace(/\b(hp|hewlett packard|epson|canon|brother|inkjet)\b\s*/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                const displayModel = cleanModel
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                const key = cleanModel || 'unknown';
                if (!modelMap[key]) {
                    modelMap[key] = { display: displayModel || 'Unknown', count: 0 };
                }
                modelMap[key].count++;
            });

            items = Object.values(modelMap)
                .map(m => ({ label: m.display, count: m.count }))
                .sort((a, b) => b.count - a.count);
        }

        const total = items.reduce((sum, i) => sum + i.count, 0);
        const list = items.map(item => ({
            ...item,
            percent: total > 0 ? Math.round((item.count / total) * 100) : 0
        }));

        return { list, total };
    }, [filteredDataHardware, printerFilterType]);

    const otherEquipmentData = useMemo(() => {
        const raw = filteredDataHardware
            .filter(h =>
                String(h.sub_major_type || '').trim() === 'Other Equipment' &&
                ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
            );

        const map = {};

        const normalize = (str) => {
            if (!str) return 'unknown item';
            let normalized = String(str).trim().toLowerCase();
            if (normalized.includes('lto kiosk') || normalized.includes('capacitive interactive display')) return 'lto kiosk';
            if (normalized.includes('mouse')) return 'mouse';
            if (normalized.includes('keyboard')) return 'keyboard';
            if (normalized.includes('webcam')) return 'webcam';
            if (normalized.includes('headset')) return 'headset';
            if (normalized.includes('ups')) return 'ups';
            if (normalized.includes('scanner')) return 'scanner';
            if (normalized.includes('projector')) return 'projector';
            return normalized;
        };

        raw.forEach(h => {
            const rawDesc = String(h.item_desc || '').trim();
            if (!rawDesc || rawDesc.toLowerCase() === 'n/a') return;

            const key = normalize(rawDesc);
            const display = rawDesc;

            if (!map[key]) {
                map[key] = { key, display: rawDesc, count: 0 };
            }
            map[key].count++;

            if (key === 'lto kiosk' && rawDesc.toLowerCase().includes('lto kiosk') && rawDesc.length < map[key].display.length) {
                map[key].display = rawDesc;
            }
        });

        const list = Object.values(map)
            .map(item => ({
                item_desc: item.display,
                count: item.count,
                percent: 0
            }))
            .sort((a, b) => b.count - a.count);

        const total = list.reduce((sum, i) => sum + i.count, 0);

        const finalList = list.map(item => ({
            ...item,
            percent: total > 0 ? Number((item.count / total * 100).toFixed(1)) : 0
        }));

        return { total, items: finalList };
    }, [filteredDataHardware]);

    const utilitiesData = useMemo(() => {
        const filteredHw = filteredDataHardware.filter(h =>
            ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
        );

        const utilities = [
            { key: 'rsu_fac', label: 'RSU Facility' },
            { key: 'mv_dto', label: 'MV DTO' },
            { key: 'mv_maint', label: 'MV Maintenance' },
            { key: 'ims_aiu', label: 'IMS AIU' },
            { key: 'dl_dto', label: 'DL DTO' },
            { key: 'dl_maint', label: 'DL Maintenance' },
        ];

        const result = utilities.map(util => ({
            label: util.label,
            count: filteredHw.filter(h => String(h[util.key] || '').trim() === '1').length
        }));

        const totalInstalled = result.reduce((sum, u) => sum + u.count, 0);

        return {
            list: result.sort((a, b) => b.count - a.count),
            totalInstalled
        };
    }, [filteredDataHardware]);

    const peripheralsData = useMemo(() => {
        const raw = filteredDataHardware.filter(h =>
            (String(h.sub_major_type || '').trim() === 'Peripherals' ||
                String(h.sub_major_type || '').trim() === 'Other Peripherals') &&
            ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
        );

        const map = {};

        const normalize = (str) => String(str || '').trim().toLowerCase();

        raw.forEach(h => {
            const desc = String(h.item_desc || '').trim();
            if (!desc || desc.toLowerCase() === 'n/a') return;

            const key = normalize(desc);
            if (!map[key]) {
                map[key] = { item_desc: desc, count: 0 };
            }
            map[key].count++;
        });

        const list = Object.values(map)
            .sort((a, b) => b.count - a.count);

        const total = list.reduce((sum, i) => sum + i.count, 0);

        const finalList = list.map(item => ({
            ...item,
            percent: total > 0 ? Number((item.count / total * 100).toFixed(1)) : 0
        }));

        return { total, items: finalList };
    }, [filteredDataHardware]);

    const networkEquipmentData = useMemo(() => {
        const raw = filteredDataHardware.filter(h =>
            String(h.sub_major_type || '').trim() === 'Network Equipment' &&
            ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
        );

        const map = {};

        const normalize = (str) => String(str || '').trim().toLowerCase();

        raw.forEach(h => {
            const desc = String(h.item_desc || '').trim();
            if (!desc || desc.toLowerCase() === 'n/a') return;

            const key = normalize(desc);
            if (!map[key]) map[key] = { item_desc: desc, count: 0 };
            map[key].count++;
        });

        const list = Object.values(map).sort((a, b) => b.count - a.count);
        const total = list.reduce((sum, i) => sum + i.count, 0);

        const finalList = list.map(item => ({
            ...item,
            percent: total > 0 ? Number((item.count / total * 100).toFixed(1)) : 0
        }));

        return { total, items: finalList };
    }, [filteredDataHardware]);

    const upsData = useMemo(() => {
        const raw = filteredDataHardware.filter(h =>
            String(h.sub_major_type || '').trim() === 'UPS' &&
            ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
        );

        const map = {};
        const normalize = (str) => String(str || '').trim().toLowerCase();

        raw.forEach(h => {
            const desc = String(h.item_desc || '').trim();
            if (!desc || desc.toLowerCase() === 'n/a') return;

            const key = normalize(desc);
            if (!map[key]) map[key] = { item_desc: desc, count: 0 };
            map[key].count++;
        });

        const list = Object.values(map).sort((a, b) => b.count - a.count);
        const total = list.reduce((sum, i) => sum + i.count, 0);

        const finalList = list.map(item => ({
            ...item,
            percent: total > 0 ? Number((item.count / total * 100).toFixed(1)) : 0
        }));

        return { total, items: finalList };
    }, [filteredDataHardware]);

    const monitorsData = useMemo(() => {
        const raw = filteredDataHardware.filter(h =>
            String(h.sub_major_type || '').trim() === 'Monitor' &&
            ['on site', 'onsite'].includes(String(h.hw_status || '').trim().toLowerCase())
        );

        const map = {};
        const normalize = (str) => String(str || '').trim().toLowerCase();

        raw.forEach(h => {
            const desc = String(h.item_desc || '').trim();
            if (!desc || desc.toLowerCase() === 'n/a') return;

            const key = normalize(desc);
            if (!map[key]) map[key] = { item_desc: desc, count: 0 };
            map[key].count++;
        });

        const list = Object.values(map).sort((a, b) => b.count - a.count);
        const total = list.reduce((sum, i) => sum + i.count, 0);

        const finalList = list.map(item => ({
            ...item,
            percent: total > 0 ? Number((item.count / total * 100).toFixed(1)) : 0
        }));

        return { total, items: finalList };
    }, [filteredDataHardware]);

    const getDisplayedRegions = () => {
        if (selectedRegion?.region_name === 'LTO National') {
            return regions.filter(r => String(r.region_id).trim() !== '15');
        }
        return regions;
    };

    const toggleSidebar = () => setSidebarOpen(prev => !prev);
    const closeSidebar = () => setSidebarOpen(false);

    useEffect(() => {
        const handleClickOutside = e => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
            if (sitesDropdownOpen && !e.target.closest('.sites-dropdown-container')) {
                setSitesDropdownOpen(false);
                setSiteSearchTerm('');
            }
            if (sidebarOpen && overlayRef.current && overlayRef.current.contains(e.target)) closeSidebar();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen, sitesDropdownOpen, sidebarOpen]);

    if (error) {
        return <Alert variant="danger" className="m-8">Error loading data: {error}</Alert>;
    }

    const displayedRegions = getDisplayedRegions();

    const selectedSite = selectedSiteCode ? displayedSites.find(s => s.site_code === selectedSiteCode) : null;

    return (
        <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            {/* NAVBAR */}
            <Navbar className={`fixed top-0 left-0 right-0 z-50 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm`}>
                <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                />
                            </svg>
                        </button>

                        <Navbar.Brand
                            as={Link}
                            to="/masterfile"
                            className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                            Masterfile v2.0
                        </Navbar.Brand>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                                isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDarkMode ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.708.708a1 1 0 01-1.414-1.414l.707-.708a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8 0 1010.586 10.586z" />
                                </svg>
                            )}
                        </button>

                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate('/masterfile/login')}
                            className="text-sm font-medium px-4 sm:px-5 py-1.5 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            </Navbar>

            {sidebarOpen && <div ref={overlayRef} className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeSidebar}/>}

            {/* SIDEBAR */}
            <aside
                ref={sidebarRef}
                className={`fixed top-16 left-0 z-50 w-full md:w-64 h-[calc(100vh-4rem)] border-r transform transition-transform duration-300 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                <div className="p-6 h-full flex flex-col space-y-5">
                    <div className="flex justify-end md:hidden">
                        <button onClick={closeSidebar} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    {/* Region Dropdown */}
                    <div ref={dropdownRef} className="relative">
                        {regionsAndSitesReady ? (
                            <>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className={`w-full px-4 py-3 text-sm font-medium rounded-lg border transition-all flex items-center justify-between ${
                                        selectedRegion
                                            ? isDarkMode
                                                ? 'bg-blue-900/40 border-blue-700 text-blue-100'
                                                : 'bg-blue-50 border-blue-300 text-blue-900'
                                            : isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="truncate text-sm">{selectedRegion?.region_name || 'All Regions'}</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>

                                {dropdownOpen && (
                                    <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-xl max-h-64 overflow-y-auto text-sm ${
                                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                    }`}>
                                        <button
                                            onClick={() => { setSelectedRegion(null); setDropdownOpen(false); }}
                                            className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-opacity-10 ${
                                                !selectedRegion ? (isDarkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-50 text-blue-900') : (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                                            }`}
                                        >
                                            <span>All Regions</span>
                                            {!selectedRegion && <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                                        </button>

                                        <button
                                            onClick={() => { setSelectedRegion({region_id: null, region_name: 'LTO National'}); setDropdownOpen(false); }}
                                            className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-opacity-10 ${
                                                selectedRegion?.region_name === 'LTO National' ? (isDarkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-50 text-blue-900') : (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                                            }`}
                                        >
                                            <span>LTO National</span>
                                            {selectedRegion?.region_name === 'LTO National' && <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                                        </button>

                                        {displayedRegions.map(r => (
                                            <button
                                                key={r.region_id}
                                                onClick={() => { setSelectedRegion(r); setDropdownOpen(false); }}
                                                className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-opacity-10 ${
                                                    selectedRegion?.region_id === r.region_id ? (isDarkMode ? 'bg-blue-900/50 text-blue-100' : 'bg-blue-50 text-blue-900') : (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                                                }`}
                                            >
                                                <span>{r.region_name}</span>
                                                {selectedRegion?.region_id === r.region_id && <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        )}
                    </div>

                    {/* Sites Dropdown with full skeleton */}
                    <div className="relative sites-dropdown-container">
                        {regionsAndSitesReady ? (
                            <button
                                onClick={() => setSitesDropdownOpen(!sitesDropdownOpen)}
                                className={`w-full px-4 py-3 text-sm font-medium rounded-lg border transition-all flex items-center justify-between ${
                                    selectedSiteCode
                                        ? isDarkMode
                                            ? 'bg-blue-900/40 border-blue-700 text-blue-100'
                                            : 'bg-blue-50 border-blue-300 text-blue-900'
                                        : isDarkMode
                                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <span className="truncate text-sm">
                                    {selectedSiteCode
                                        ? `${selectedSite?.site_code} — ${selectedSite?.site_name}`
                                        : 'All sites'}
                                </span>
                                <svg
                                    className={`w-4 h-4 transition-transform ${sitesDropdownOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                        ) : (
                            <SkeletonSiteDropdownButton />
                        )}

                        {sitesDropdownOpen && (
                            <div className={`absolute z-50 w-full mt-1 border rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col text-xs ${
                                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}>
                                <div className="p-3 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                                    <input
                                        type="text"
                                        value={siteSearchTerm}
                                        onChange={(e) => setSiteSearchTerm(e.target.value)}
                                        placeholder="Search site code or name..."
                                        className={`w-full px-3 py-1.5 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-blue-500/30 ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500'
                                                : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
                                        }`}
                                        autoFocus
                                        disabled={!regionsAndSitesReady}
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {!regionsAndSitesReady || displayedSites.length === 0 ? (
                                        // Full skeleton loading
                                        <div className="space-y-1 px-2 py-2">
                                            {[...Array(12)].map((_, i) => (
                                                <SkeletonSiteItem key={i} />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => selectSite(null)}
                                                className={`w-full px-4 py-2 text-left text-xs flex items-center justify-between hover:bg-opacity-10 transition-colors ${
                                                    !selectedSiteCode
                                                        ? isDarkMode
                                                            ? 'bg-blue-900/30 text-blue-100'
                                                            : 'bg-blue-50 text-blue-900'
                                                        : isDarkMode
                                                            ? 'hover:bg-gray-700 text-gray-200'
                                                            : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                            >
                                                <span className="truncate">All sites</span>
                                            </button>

                                            {filteredSites.map(site => (
                                                <button
                                                    key={site.site_id}
                                                    onClick={() => selectSite(site.site_code)}
                                                    className={`w-full px-4 py-2 text-left text-xs flex items-center justify-between hover:bg-opacity-10 transition-colors ${
                                                        selectedSiteCode === site.site_code
                                                            ? isDarkMode
                                                                ? 'bg-blue-900/30 text-blue-100'
                                                                : 'bg-blue-50 text-blue-900'
                                                            : isDarkMode
                                                                ? 'hover:bg-gray-700 text-gray-200'
                                                                : 'hover:bg-gray-50 text-gray-700'
                                                    }`}
                                                >
                                                    <span className="truncate">{site.site_code} — {site.site_name}</span>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className={`flex-1 px-6 py-12 mt-16 md:ml-64 min-h-screen ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-blue-50 to-white'}`}>
                <AgingDetailsModal
                    show={showAgingDetails}
                    onHide={() => setShowAgingDetails(false)}
                    hardwareAging={hardwareAging}
                    hardwareAgingFilter={hardwareAgingFilter}
                    isDarkMode={isDarkMode}
                    detailedAgingList={detailedAgingList}
                    noAcqDateByType={noAcqDateByType}
                />

                <div className="max-w-7xl mx-auto pb-20">
                    {hardwareReady ? (
                        <>
                            <StatsOverviewCards stats={stats} isDarkMode={isDarkMode} />

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8 space-y-6">
                                    <HardwareSummaryLeft
                                        cpuServerBrandsWithModels={cpuServerBrandsWithModels}
                                        cpuPcData={cpuPcData}
                                        upsData={upsData}
                                        monitorsData={monitorsData}
                                        utilitiesData={utilitiesData}
                                        networkEquipmentData={networkEquipmentData}
                                        showAllUPS={showAllUPS}
                                        setShowAllUPS={setShowAllUPS}
                                        showAllMonitors={showAllMonitors}
                                        setShowAllMonitors={setShowAllMonitors}
                                        showAllNetwork={showAllNetwork}
                                        setShowAllNetwork={setShowAllNetwork}
                                        isDarkMode={isDarkMode}
                                        showAgingDetails={showAgingDetails}
                                        setShowAgingDetails={setShowAgingDetails}
                                        cpuPcModelsByOs={cpuPcModelsByOs}
                                    />
                                </div>

                                <div className="lg:col-span-4 space-y-6">
                                    <HardwareSummaryRight
                                        printerDisplayData={printerDisplayData}
                                        printerFilterType={printerFilterType}
                                        setPrinterFilterType={setPrinterFilterType}
                                        availablePrinterTypes={availablePrinterTypes}
                                        showAllPrinters={showAllPrinters}
                                        setShowAllPrinters={setShowAllPrinters}
                                        hardwareAging={hardwareAging}
                                        hardwareAgingFilter={hardwareAgingFilter}
                                        setHardwareAgingFilter={setHardwareAgingFilter}
                                        availableHardwareTypes={availableHardwareTypes}
                                        peripheralsData={peripheralsData}
                                        showAllPeripherals={showAllPeripherals}
                                        setShowAllPeripherals={setShowAllPeripherals}
                                        otherEquipmentData={otherEquipmentData}
                                        detailedAgingList={detailedAgingList}
                                        isDarkMode={isDarkMode}
                                        showAgingDetails={showAgingDetails}
                                        setShowAgingDetails={setShowAgingDetails}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <SkeletonStats />
                    )}
                </div>
            </main>

            <footer className={`py-4 text-center text-xs border-t ${isDarkMode ? 'text-gray-500 border-gray-700' : 'text-gray-500 border-gray-100'}`}>
                &copy; 2025 All-In-One App. All rights reserved.
            </footer>
        </div>
    );
}

export default MasterfileLanding;

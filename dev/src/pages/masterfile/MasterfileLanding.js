import React, { useState, useEffect, useRef } from 'react';
import { Container, Navbar, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

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

// ───── SKELETON COMPONENTS (MIRROR YOUR FINAL DASHBOARD LAYOUT) ─────

// Skeleton Navbar – matches your real navbar
const SkeletonNavbar = () => (
    <div className="fixed top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="py-4 px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </div>
        </div>
    </div>
);

// Skeleton Sidebar – matches your sidebar with region dropdown + site list
const SkeletonSidebar = () => (
    <div className="fixed top-16 left-0 z-40 w-full md:w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
            {/* Region Dropdown */}
            <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />

            {/* Select All + Sites */}
            <div className="space-y-3">
                <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="h-9 bg-gray-50 dark:bg-gray-700/50 rounded animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);

// Skeleton Main Content – EXACTLY matches your final card layout
const SkeletonStats = () => (
    <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            ))}
        </div>

        {/* Main Grid – Left 8 cols, Right 4 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column – 8 cols */}
            <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CPU-Server Brands */}
                    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg p-6 animate-pulse space-y-4">
                        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                <div className="h-4 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        ))}
                    </div>

                    {/* CPU-PC OS */}
                    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg p-5 animate-pulse">
                        <div className="flex justify-between mb-4">
                            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="space-y-3">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="flex justify-between">
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* UPS, Monitors, Utilities, Network, Other Equipment */}
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg p-5 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                            <div className="space-y-3">
                                {[...Array(6)].map((_, j) => (
                                    <div key={j} className="flex justify-between">
                                        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column – 4 cols */}
            <div className="lg:col-span-4 space-y-6">
                {/* Printer Card */}
                <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                    <div className="flex justify-between mb-4">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="grid grid-cols-3 gap-3">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                <div className="col-span-2 h-7 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hardware Aging */}
                <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-lg p-5 animate-pulse flex flex-col items-center">
                    <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                    <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="mt-6 space-y-3 w-full">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peripherals */}
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg p-5 animate-pulse">
                    <div className="flex justify-between mb-4">
                        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="space-y-3">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
// ───── MAIN COMPONENT ─────
function MasterfileLanding() {
    const navigate = useNavigate();
    const [regions, setRegions] = useState([]);
    const [allSites, setAllSites] = useState([]);
    const [allHardware, setAllHardware] = useState([]);
    const [displayedSites, setDisplayedSites] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedSiteCodes, setSelectedSiteCodes] = useState(new Set());
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [printerFilterType, setPrinterFilterType] = useState(''); // Printer filter state
    const [showAllPrinters, setShowAllPrinters] = useState(false);
    const [showAllPeripherals, setShowAllPeripherals] = useState(false);
    const [showAllNetwork, setShowAllNetwork] = useState(false);
    const [showAllUPS, setShowAllUPS] = useState(false);   // ← ADD THIS LINE
    const [showAllMonitors, setShowAllMonitors] = useState(false);

    const dropdownRef = useRef(null);
    const sidebarRef = useRef(null);
    const overlayRef = useRef(null);

    const API_BASE = 'http://omniops.local';

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    // ───── FETCH DATA ─────
    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/region-tbl`, { headers: { Accept: 'application/json' } });
                if (!res.ok) throw new Error(`Regions: ${res.status}`);
                const data = await res.json();
                setRegions(data.regionTbl || data.data || []);
            } catch (err) { console.error(err); }
        };
        fetchRegions();
    }, []);

    useEffect(() => {
        const fetchSites = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/site-list-tbl`, { headers: { Accept: 'application/json' } });
                if (!res.ok) throw new Error(`Sites: ${res.status}`);
                const data = await res.json();
                const sites = data.siteListTbl || data.data || [];
                const sorted = sites.sort((a, b) => {
                    const ra = String(a.region_id).trim();
                    const rb = String(b.region_id).trim();
                    if (ra !== rb) return ra.localeCompare(rb, undefined, { numeric: true });
                    return a.site_code.localeCompare(b.site_code);
                });
                setAllSites(sorted);
            } catch (err) { console.error(err); }
        };
        fetchSites();
    }, []);

    useEffect(() => {
        const fetchHardware = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/hw-tbl`, { headers: { Accept: 'application/json' } });
                if (!res.ok) throw new Error(`Hardware: ${res.status}`);
                const data = await res.json();
                const hw = data.data || data.hwTbl || data || [];
                setAllHardware(hw);
            } catch (err) {
                console.error('Failed to load hardware:', err);
                setError('Failed to load hardware data');
            }
        };
        fetchHardware();
    }, []);

    useEffect(() => {
        if (regions.length && allSites.length && allHardware.length) setIsReady(true);
    }, [regions, allSites, allHardware]);

    const formatNumber = (num) => num.toLocaleString('en-US');

    // ───── SITE FILTERING LOGIC ─────
    useEffect(() => {
        if (!allSites.length) return;

        const validSites = allSites.filter(s => String(s.office_type || '').trim() !== 'E-Patrol');
        let filtered = validSites;

        if (selectedRegion) {
            if (selectedRegion.region_name === 'LTO National') {
                filtered = validSites.filter(s => String(s.region_id).trim() !== '15');
            } else {
                const target = String(selectedRegion.region_id).trim();
                filtered = validSites.filter(s => String(s.region_id).trim() === target);
            }
        }

        setDisplayedSites(filtered);
        const allCodes = new Set(filtered.map(s => s.site_code));
        setSelectedSiteCodes(allCodes);
    }, [selectedRegion, allSites]);

    const toggleSite = (siteCode) => {
        setSelectedSiteCodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(siteCode)) newSet.delete(siteCode);
            else newSet.add(siteCode);
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedSiteCodes.size === displayedSites.length) {
            setSelectedSiteCodes(new Set());
        } else {
            setSelectedSiteCodes(new Set(displayedSites.map(s => s.site_code)));
        }
    };

    const filteredDataHardware = React.useMemo(() => {
        if (selectedSiteCodes.size === 0) return [];
        return allHardware.filter(h => selectedSiteCodes.has(String(h.site_code || '').trim()));
    }, [allHardware, selectedSiteCodes]);

    const filteredDataSites = displayedSites.filter(s => selectedSiteCodes.has(s.site_code));

    // ───── STATS ─────
    const stats = React.useMemo(() => {
        const onSiteCpuServers = filteredDataHardware.filter(h =>
            String(h.item_desc || '').trim().toLowerCase() === 'cpu-server' &&
            String(h.hw_status || '').trim().toLowerCase() === 'on site'
        );

        return {
            totalSites: filteredDataSites.length,
            cpuServers: onSiteCpuServers.length,
            dualServerSites: Math.floor(filteredDataSites.filter(s => String(s.physical_site_count || '').trim() === '2').length / 2),
            onSiteHardware: filteredDataHardware.filter(h => String(h.hw_status || '').trim().toLowerCase() === 'on site' && String(h.item_desc || '').trim().toLowerCase() !== 'vm-server').length,
            vmServers: filteredDataHardware.filter(h => String(h.item_desc || '').trim().toLowerCase() === 'vm-server' && String(h.hw_status || '').trim().toLowerCase() === 'on site').length,
        };
    }, [filteredDataSites, filteredDataHardware]);

    // ───── CPU-SERVER BRANDS ─────
    const cpuServerBrands = React.useMemo(() => {
        const onSiteCpuServers = filteredDataHardware.filter(h =>
            String(h.item_desc || '').trim().toLowerCase() === 'cpu-server' &&
            String(h.hw_status || '').trim().toLowerCase() === 'on site'
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

    // ───── CPU-PC OS DISTRIBUTION ─────
    const cpuPcData = React.useMemo(() => {
        const group = {};
        let total = 0;
        filteredDataHardware.forEach(h => {
            if (String(h.item_desc || '').trim().toLowerCase() === 'cpu-pc' && String(h.hw_status || '').trim().toLowerCase() === 'on site') {
                total++;
                let raw = String(h.os_type || 'Unknown').trim();
                let key = raw.toLowerCase().replace(/\s+/g, ' ').replace(/bit/g, 'bit');
                key = key.replace(/windows\s*(\d+)\s*64\s*bit/gi, (m, v) => `windows ${v} 64bit`);
                if (!group[key]) group[key] = { original: raw, count: 0 };
                group[key].count++;
                if (group[key].count > (group[key].maxCount || 0)) group[key].display = raw;
            }
        });
        const osList = Object.values(group)
            .map(g => {
                let display = g.display || g.original;
                if (display.toLowerCase().includes('windows 10 64bit')) display = 'Windows 10 64-bit';
                else if (display.toLowerCase().includes('windows 11 64bit')) display = 'Windows 11 64-bit';
                return { os: display, count: g.count, percent: total > 0 ? (g.count / total * 100).toFixed(1) : 0 };
            })
            .sort((a, b) => b.count - a.count);
        return { total, osList };
    }, [filteredDataHardware]);

    // ───── HARDWARE AGING ─────
    const hardwareAging = React.useMemo(() => {
        const now = new Date();
        const buckets = { '0-3': 0, '3-5': 0, '5-7': 0, '7+': 0 };
        let total = 0;

        filteredDataHardware.forEach(h => {
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
            else if (ageYears < 7) buckets['5-7']++;
            else buckets['7+']++;
            total++;
        });

        const isDark = document.documentElement.classList.contains('dark');

        return {
            total,
            totalText: formatNumber(total),
            chartData: {
                totalText: formatNumber(total),
                labels: ['0–3 years', '3–5 years', '5–7 years', '7+ years'],
                datasets: [{
                    data: [buckets['0-3'], buckets['3-5'], buckets['5-7'], buckets['7+']],
                    backgroundColor: ['#10b981', '#84cc16', '#f59e0b', '#ef4444'],
                    borderColor: isDark ? '#1f2937' : '#ffffff',
                    borderWidth: 4,
                    hoverBorderWidth: 6,
                }]
            }
        };
    }, [filteredDataHardware]);

    // ───── PRINTER FILTER & DISPLAY LOGIC ─────
    const availablePrinterTypes = React.useMemo(() => {
        const types = new Set();
        filteredDataHardware.forEach(h => {
            if (String(h.hw_status || '').trim().toLowerCase() !== 'on site') return;
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

    const printerDisplayData = React.useMemo(() => {
        let items = [];

        if (!printerFilterType) {
            const types = ['LaserJet', 'InkJet', 'DeskJet', 'Dot Matrix'];
            items = types.map(type => {
                const count = filteredDataHardware.filter(h =>
                    (String(h.item_desc || '').toLowerCase().includes(type.toLowerCase()) ||
                        String(h.sub_major_type || '').toLowerCase().includes(type.toLowerCase())) &&
                    String(h.hw_status || '').trim().toLowerCase() === 'on site'
                ).length;
                return { label: type, count };
            }).filter(i => i.count > 0);
        } else {
            // MODEL BREAKDOWN — WITH SMART CLEANING (CASE & BRAND INSENSITIVE)
            const modelMap = {};

            filteredDataHardware.forEach(h => {
                if (String(h.hw_status || '').trim().toLowerCase() !== 'on site') return;

                const desc = String(h.item_desc || '').toLowerCase();
                const sub = String(h.sub_major_type || '').toLowerCase();
                const matches = desc.includes(printerFilterType.toLowerCase()) || sub.includes(printerFilterType.toLowerCase());
                if (!matches) return;

                let rawModel = String(h.hw_model || 'Unknown').trim();
                if (!rawModel || rawModel === 'null' || rawModel.toLowerCase() === 'n/a') rawModel = 'Unknown';

                // Clean model name: remove brand prefix, normalize case/spacing
                let cleanModel = rawModel
                    .toLowerCase()
                    .replace(/\b(hp|hewlett packard|epson|canon|brother|inkjet)\b\s*/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                // Capitalize first letter of each word for display
                const displayModel = cleanModel
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                // Use cleaned version as key, display nice version
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

    // ───── OTHER EQUIPMENT DISTRIBUTION (CASE-INSENSITIVE + SMART MERGING) ─────
    const otherEquipmentData = React.useMemo(() => {
        const raw = filteredDataHardware
            .filter(h =>
                String(h.sub_major_type || '').trim() === 'Other Equipment' &&
                String(h.hw_status || '').trim().toLowerCase() === 'on site'
            );

        const map = {};

        // Normalize function: lowercase + smart replacements
        const normalize = (str) => {
            if (!str) return 'unknown item';
            let normalized = String(str).trim().toLowerCase();

            // Specific known merges
            if (normalized.includes('lto kiosk') || normalized.includes('capacitive interactive display')) {
                return 'lto kiosk';
            }
            if (normalized.includes('mouse')) return 'mouse';
            if (normalized.includes('keyboard')) return 'keyboard';
            if (normalized.includes('webcam')) return 'webcam';
            if (normalized.includes('headset')) return 'headset';
            if (normalized.includes('ups')) return 'ups';
            if (normalized.includes('scanner')) return 'scanner';
            if (normalized.includes('projector')) return 'projector';

            return normalized;
        };

        // Group by normalized key
        raw.forEach(h => {
            const rawDesc = String(h.item_desc || '').trim();
            if (!rawDesc || rawDesc.toLowerCase() === 'n/a') return;

            const key = normalize(rawDesc);
            const display = rawDesc; // Keep original capitalization for display (we'll pick the cleanest later)

            if (!map[key]) {
                map[key] = { key, display: rawDesc, count: 0 };
            }
            map[key].count++;

            // Prefer shorter/cleaner name if it contains the keyword
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

    // ───── UTILITIES AVAILABILITY CARD DATA ─────
    const utilitiesData = React.useMemo(() => {
        const filteredHw = filteredDataHardware.filter(h =>
            String(h.hw_status || '').trim().toLowerCase() === 'on site'
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

    // ───── PERIPHERALS DISTRIBUTION (MERGED "Peripherals" + "Other Peripherals") ─────
    const peripheralsData = React.useMemo(() => {
        const raw = filteredDataHardware.filter(h =>
            (String(h.sub_major_type || '').trim() === 'Peripherals' ||
                String(h.sub_major_type || '').trim() === 'Other Peripherals') &&
            String(h.hw_status || '').trim().toLowerCase() === 'on site'
        );

        const map = {};

        const normalize = (str) => {
            if (!str) return 'unknown';
            return String(str).trim().toLowerCase();
        };

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
            .sort((a, b) => b.count - a.count)
            .map(item => ({ ...item }));

        const total = list.reduce((sum, i) => sum + i.count, 0);

        const finalList = list.map(item => ({
            ...item,
            percent: total > 0 ? Number((item.count / total * 100).toFixed(1)) : 0
        }));

        return { total, items: finalList };
    }, [filteredDataHardware]);

    // ───── NETWORK EQUIPMENT DISTRIBUTION ─────
    const networkEquipmentData = React.useMemo(() => {
        const raw = filteredDataHardware.filter(h =>
            String(h.sub_major_type || '').trim() === 'Network Equipment' &&
            String(h.hw_status || '').trim().toLowerCase() === 'on site'
        );

        const map = {};

        const normalize = (str) => {
            if (!str) return 'unknown';
            return String(str).trim().toLowerCase();
        };

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

    // ───── UPS DISTRIBUTION ─────
    const upsData = React.useMemo(() => {
        const raw = filteredDataHardware.filter(h =>
            String(h.sub_major_type || '').trim() === 'UPS' &&
            String(h.hw_status || '').trim().toLowerCase() === 'on site'
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

    // ───── MONITORS DISTRIBUTION ─────
    const monitorsData = React.useMemo(() => {
        const raw = filteredDataHardware.filter(h =>
            String(h.sub_major_type || '').trim() === 'Monitor' &&
            String(h.hw_status || '').trim().toLowerCase() === 'on site'
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


    // ───── REGION & SIDEBAR LOGIC ─────
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
            if (sidebarOpen && overlayRef.current && overlayRef.current.contains(e.target)) closeSidebar();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    if (!isReady) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <SkeletonNavbar />
                <SkeletonSidebar />
                <div className="flex-1 px-6 py-12 mt-16 md:ml-64">
                    <SkeletonStats />
                </div>
            </div>
        );
    }

    const displayedRegions = getDisplayedRegions();

    return (
        <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            {/* NAVBAR */}
            <Navbar className={`fixed top-0 z-50 w-full border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-sm`}>
                <Container className="py-4 px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={toggleSidebar} className="md:hidden w-9 h-9 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                        <Navbar.Brand as={Link} to="/masterfile" className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Masterfile v2.0
                        </Navbar.Brand>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                            {isDarkMode ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.708.708a1 1 0 01-1.414-1.414l.707-.708a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8 0 1010.586 10.586z" /></svg>
                            )}
                        </button>
                        <Button variant="outline-primary" size="sm" onClick={() => navigate('/masterfile/login')} className="text-sm font-medium px-4 py-1.5 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50">
                            Sign In
                        </Button>
                    </div>
                </Container>
            </Navbar>

            {/* MOBILE OVERLAY */}
            {sidebarOpen && <div ref={overlayRef} className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeSidebar} />}

            {/* SIDEBAR */}
            <aside ref={sidebarRef} className={`fixed top-16 left-0 z-50 w-full md:w-64 h-[calc(100vh-4rem)] border-r transform transition-transform duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-end mb-4 md:hidden">
                        <button onClick={closeSidebar} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* REGION DROPDOWN */}
                    <div ref={dropdownRef} className="relative mb-4">
                        <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`w-full px-4 py-3 text-left text-sm font-medium rounded-lg border transition-all flex items-center justify-between ${selectedRegion ? (isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-100' : 'bg-blue-50 border-blue-300 text-blue-900') : (isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100')}`}>
                            <span>{selectedRegion?.region_name || 'All Region'}</span>
                            <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {dropdownOpen && (
                            <div className={`absolute z-50 w-full mt-2 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <button onClick={() => { setSelectedRegion(null); setDropdownOpen(false); }} className={`w-full px-4 py-3 text-left text-sm flex justify-between ${!selectedRegion ? (isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-900') : (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')}`}>
                                    <span>All Region</span>
                                    {!selectedRegion && <i className="fas fa-check text-blue-500 text-xs"></i>}
                                </button>
                                <button onClick={() => { setSelectedRegion({ region_id: null, region_name: 'LTO National' }); setDropdownOpen(false); }} className={`w-full px-4 py-3 text-left text-sm flex justify-between ${selectedRegion?.region_name === 'LTO National' ? (isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-900') : (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')}`}>
                                    <span>LTO National</span>
                                    {selectedRegion?.region_name === 'LTO National' && <i className="fas fa-check text-blue-500 text-xs"></i>}
                                </button>
                                {displayedRegions.map(r => (
                                    <button key={r.region_id} onClick={() => { setSelectedRegion(r); setDropdownOpen(false); }} className={`w-full px-4 py-3 text-left text-sm flex justify-between ${selectedRegion?.region_id === r.region_id ? (isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-900') : (isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')}`}>
                                        <span>{r.region_name}</span>
                                        {selectedRegion?.region_id === r.region_id && <i className="fas fa-check text-blue-500 text-xs"></i>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SITES LIST */}
                    <div className="flex-1 flex flex-col">
                        {displayedSites.length > 0 && (
                            <label className={`flex items-center space-x-2 p-2 rounded cursor-pointer text-xs font-medium mb-2 ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-800'}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedSiteCodes.size === displayedSites.length}
                                    onChange={toggleSelectAll}
                                    className="w-3.5 h-3.5 text-blue-600 rounded"
                                />
                                <span>Select All Sites</span>
                            </label>
                        )}
                        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem - 3rem)' }}>
                            {displayedSites.length === 0 ? (
                                <p className={`text-xs text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>No sites available</p>
                            ) : (
                                <div className="space-y-1">
                                    {displayedSites.map(s => (
                                        <label key={s.site_id} className={`flex items-center space-x-2 py-1.5 px-2 rounded cursor-pointer text-xs ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedSiteCodes.has(s.site_code)}
                                                onChange={() => toggleSite(s.site_code)}
                                                className="w-3.5 h-3.5 text-blue-600 rounded"
                                            />
                                            <span>{s.site_code} - {s.site_name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className={`flex-1 px-6 py-12 mt-16 md:ml-64 min-h-screen ${isDarkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-blue-50 to-white'}`}>
                <div className="max-w-7xl mx-auto pb-20">
                    {error && <Alert variant="danger" className="mb-6">{error}</Alert>}

                    {/* TOP STAT CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
                        <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-blue-900 border-blue-800' : 'bg-blue-100 border-blue-200'}`}>
                            <Card.Body className="p-0">
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>Total Sites</p>
                                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>{formatNumber(stats.totalSites)}</p>
                            </Card.Body>
                        </Card>
                        <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-purple-900 border-purple-800' : 'bg-purple-100 border-purple-200'}`}>
                            <Card.Body className="p-0">
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-purple-700'}`}>Dual Server Sites</p>
                                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>{formatNumber(stats.dualServerSites)}</p>
                            </Card.Body>
                        </Card>
                        <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-green-900 border-green-800' : 'bg-green-100 border-green-200'}`}>
                            <Card.Body className="p-0">
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-green-700'}`}>CPU-Servers (On Site)</p>
                                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>{formatNumber(stats.cpuServers)}</p>
                            </Card.Body>
                        </Card>
                        <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-teal-900 border-teal-800' : 'bg-teal-100 border-teal-200'}`}>
                            <Card.Body className="p-0">
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-teal-700'}`}>VM-Servers</p>
                                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-teal-900'}`}>{formatNumber(stats.vmServers)}</p>
                            </Card.Body>
                        </Card>
                        <Card className={`border rounded-lg p-4 shadow-sm ${isDarkMode ? 'bg-orange-900 border-orange-800' : 'bg-orange-100 border-orange-200'}`}>
                            <Card.Body className="p-0">
                                <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-orange-700'}`}>On-Site Hardware</p>
                                <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-orange-900'}`}>{formatNumber(stats.onSiteHardware)}</p>
                            </Card.Body>
                        </Card>
                    </div>

                    {/* MAIN LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CPU-SERVER BRANDS */}
                                {/* CPU-SERVER BRANDS – VISIBLE PROGRESS BAR + ORIGINAL TOOLTIP */}
                                <Card className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <h3 className={`text-sm font-medium mb-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>CPU-Server Brands</h3>
                                    <div className="space-y-4">
                                        {cpuServerBrands.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-8">No On-Site CPU-Servers</p>
                                        ) : (
                                            cpuServerBrands.map(({brand, count: total}) => {
                                                const modelMap = filteredDataHardware
                                                    .filter(h =>
                                                        String(h.item_desc || '').trim().toLowerCase() === 'cpu-server' &&
                                                        String(h.hw_status || '').trim().toLowerCase() === 'on site' &&
                                                        String(h.hw_brand_name || '').trim().toLowerCase() === brand.toLowerCase()
                                                    )
                                                    .reduce((acc, h) => {
                                                        const model = String(h.hw_model || 'Unknown').trim() || 'Unknown';
                                                        if (model && model !== 'null' && model !== 'n/a') {
                                                            acc[model] = (acc[model] || 0) + 1;
                                                        }
                                                        return acc;
                                                    }, {});

                                                const modelList = Object.entries(modelMap)
                                                    .map(([model, count]) => ({model, count}))
                                                    .sort((a, b) => b.count - a.count);

                                                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'];

                                                return (
                                                    <div key={brand} className="group relative">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${brand.toLowerCase().includes('dell') ? 'bg-blue-500' : brand.toLowerCase().includes('hp') ? 'bg-green-500' : 'bg-gray-500'}`} />
                                                                <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                                    {brand}
                                                                </span>
                                                            </div>

                                                            {/* Taller & more visible bar (12px) */}
                                                            <div className="flex-1 h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-inner">
                                                                <div className="h-full flex">
                                                                    {modelList.length > 0 ? (
                                                                        modelList.map((m, i) => (
                                                                            <div
                                                                                key={i}
                                                                                style={{
                                                                                    width: `${(m.count / total) * 100}%`,
                                                                                    backgroundColor: colors[i % colors.length],
                                                                                }}
                                                                                className="h-full first:rounded-l-full last:rounded-r-full"
                                                                            />
                                                                        ))
                                                                    ) : (
                                                                        <div
                                                                            className="w-full h-full rounded-full"
                                                                            style={{backgroundColor: brand.toLowerCase().includes('dell') ? '#3b82f6' : brand.toLowerCase().includes('hp') ? '#10b981' : '#6b7280'}}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <span className={`text-sm font-bold min-w-[40px] text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {total}
                                                            </span>
                                                        </div>

                                                        {/* YOUR ORIGINAL TOOLTIP – UNTOUCHED */}
                                                        {modelList.length > 0 && (
                                                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                                                                <div className={`px-4 py-3 rounded-lg shadow-2xl text-xs border min-w-max ${isDarkMode ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-300'}`}>
                                                                    <div className="font-semibold mb-2 text-sm">{brand} Models</div>
                                                                    {modelList.map((m, i) => (
                                                                        <div key={i} className="flex items-center gap-3 py-1">
                                                                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: colors[i % colors.length]}} />
                                                                            <span className="font-medium">{m.model}</span>
                                                                            <span className="ml-auto">({m.count})</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className={`absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 rotate-45 ${isDarkMode ? 'bg-gray-900 border-l border-t border-gray-700' : 'bg-white border-l border-t border-gray-300'}`} />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </Card>

                                {/* CPU-PC OS DISTRIBUTION */}
                                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        {/* Title */}
                                        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            Workstation OS Distribution
                                        </h3>

                                        {/* Total – Big & Bold */}
                                        <div className="text-right">
                                            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Total
                                            </p>
                                            <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {formatNumber(cpuPcData.total)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-sm">
                                        {cpuPcData.osList.length === 0 ? (
                                            <p className="text-xs text-gray-500">No PCs</p>
                                        ) : (
                                            cpuPcData.osList.slice(0, 7).map(({os, count, percent}) => (
                                                <div key={os} className="flex justify-between">
                                                    <span
                                                        className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{os}</span>
                                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                        {formatNumber(count)} <span
                                                        className="text-xs text-gray-500">({percent}%)</span>
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                        {cpuPcData.osList.length > 7 && (
                                            <p className="text-xs text-gray-500 mt-2">+{cpuPcData.osList.length - 7} more</p>
                                        )}
                                    </div>
                                </Card>

                                {/* UPS CARD – TOTAL TOP-RIGHT + EXPANDABLE */}
                                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            Uninterruptible Power <br/> Supply (UPS)
                                        </h3>
                                        <div className="text-right">
                                            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Total
                                            </p>
                                            <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {formatNumber(upsData.total)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-sm">
                                        {upsData.items.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-8">No UPS recorded</p>
                                        ) : (
                                            <>
                                                {(showAllUPS ? upsData.items : upsData.items.slice(0, 7))
                                                    .map(({ item_desc, count, percent }) => (
                                                        <div key={item_desc} className="flex justify-between">
                                                            <span className={`truncate max-w-[68%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {item_desc}
                                                            </span>
                                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                                {formatNumber(count)} <span className="text-xs text-gray-500">({percent}%)</span>
                                                            </span>
                                                        </div>
                                                    ))}

                                                {upsData.items.length > 7 && (
                                                    <button
                                                        onClick={() => setShowAllUPS(prev => !prev)}
                                                        className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-colors ${
                                                            isDarkMode
                                                                ? 'text-blue-400 border-gray-700 hover:bg-gray-700/50'
                                                                : 'text-blue-600 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {showAllUPS ? 'Show Less' : `+ ${upsData.items.length - 7} more`}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card>
                                {/* MONITORS CARD – TOTAL TOP-RIGHT + EXPANDABLE */}
                                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            Monitors
                                        </h3>
                                        <div className="text-right">
                                            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Total
                                            </p>
                                            <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {formatNumber(monitorsData.total)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-sm">
                                        {monitorsData.items.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-8">No monitors recorded</p>
                                        ) : (
                                            <>
                                                {(showAllMonitors ? monitorsData.items : monitorsData.items.slice(0, 7))
                                                    .map(({ item_desc, count, percent }) => (
                                                        <div key={item_desc} className="flex justify-between">
                                                            <span className={`truncate max-w-[68%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {item_desc}
                                                            </span>
                                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                                {formatNumber(count)} <span className="text-xs text-gray-500">({percent}%)</span>
                                                            </span>
                                                        </div>
                                                    ))}

                                                {monitorsData.items.length > 7 && (
                                                    <button
                                                        onClick={() => setShowAllMonitors(prev => !prev)}
                                                        className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-colors ${
                                                            isDarkMode
                                                                ? 'text-blue-400 border-gray-700 hover:bg-gray-700/50'
                                                                : 'text-blue-600 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {showAllMonitors ? 'Show Less' : `+ ${monitorsData.items.length - 7} more`}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card>

                                {/* UTILITIES AVAILABILITY CARD */}
                                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        {/* Title */}
                                        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            Utilities Availablity
                                        </h3>

                                        {/* Total – Big & Bold */}
                                        <div className="text-right">
                                            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Total
                                            </p>
                                            <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formatNumber(utilitiesData.totalInstalled)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-sm">
                                        {utilitiesData.list.length === 0 ? (
                                            <p className="text-xs text-gray-500">No data</p>
                                        ) : (
                                            utilitiesData.list.map(({label, count}) => (
                                                <div key={label} className="flex justify-between">
                                                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                                        {label}
                                                    </span>
                                                    <span
                                                        className={`font-semibold ${count > 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>
                                                        {formatNumber(count)}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Card>

                                {/* NETWORK EQUIPMENT CARD – TOTAL TOP-RIGHT + EXPANDABLE */}
                                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            Network Equipment
                                        </h3>
                                        <div className="text-right">
                                            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Total
                                            </p>
                                            <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {formatNumber(networkEquipmentData.total)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-sm">
                                        {networkEquipmentData.items.length === 0 ? (
                                            <p className="text-xs text-gray-500 text-center py-8">No network equipment recorded</p>
                                        ) : (
                                            <>
                                                {(showAllNetwork ? networkEquipmentData.items : networkEquipmentData.items.slice(0, 7))
                                                    .map(({ item_desc, count, percent }) => (
                                                        <div key={item_desc} className="flex justify-between">
                                                            <span className={`truncate max-w-[68%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {item_desc}
                                                            </span>
                                                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                                {formatNumber(count)}{' '}
                                                                <span className="text-xs text-gray-500">({percent}%)</span>
                                                            </span>
                                                        </div>
                                                    ))}

                                                {networkEquipmentData.items.length > 7 && (
                                                    <button
                                                        onClick={() => setShowAllNetwork(prev => !prev)}
                                                        className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-colors ${
                                                            isDarkMode
                                                                ? 'text-blue-400 border-gray-700 hover:bg-gray-700/50'
                                                                : 'text-blue-600 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {showAllNetwork
                                                            ? '↑ Show Less'
                                                            : `+ ${networkEquipmentData.items.length - 7} more`
                                                        }
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card>

                                {/* OTHER EQUIPMENT CARD */}
                                <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        {/* Title */}
                                        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            Other Equipment
                                        </h3>

                                        {/* Total – Big & Bold */}
                                        <div className="text-right">
                                            <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Total
                                            </p>
                                            <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {formatNumber(otherEquipmentData.total)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-sm">
                                        {otherEquipmentData.items.length === 0 ? (
                                            <p className="text-xs text-gray-500">No equipment recorded</p>
                                        ) : (
                                            otherEquipmentData.items
                                                .slice(0, 7)
                                                .map(({item_desc, count, percent}) => (
                                                    <div key={item_desc} className="flex justify-between">
                                                        <span
                                                            className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                                            {item_desc}
                                                        </span>
                                                        <span
                                                            className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                            {formatNumber(count)}{' '}
                                                            <span className="text-xs text-gray-500">({percent}%)</span>
                                                        </span>
                                                    </div>
                                                ))
                                        )}
                                        {otherEquipmentData.items.length > 7 && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                +{otherEquipmentData.items.length - 7} more
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            </div>

                        </div>

                        {/* RIGHT COLUMN — Printer Types + Hardware Aging (Clean Spacing + Working Show More) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* INTERACTIVE PRINTER CARD */}
                            <Card className={`p-4 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Printer Types {printerFilterType && <span className="lowercase">— {printerFilterType} Models</span>}
                                    </h3>
                                    <select
                                        value={printerFilterType}
                                        onChange={(e) => {
                                            setPrinterFilterType(e.target.value || '');
                                            setShowAllPrinters(false); // Optional: collapse when changing filter
                                        }}
                                        className={`text-xs font-medium rounded-md border px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                                                : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
                                        }`}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '12px' }}
                                    >
                                        <option value="">All Types</option>
                                        {availablePrinterTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <p className={`text-base font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                    Total: {formatNumber(printerDisplayData.total)}
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
                                                    : { LaserJet: '#3b82f6', InkJet: '#8b5cf6', DeskJet: '#ec4899', 'Dot Matrix': '#f59e0b' }[label] || '#94a3b8';

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
                                                                    {formatNumber(count)}
                                                                    <span className="ml-1.5 text-gray-500">({percent}%)</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Expandable "Show More" Button */}
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
                                <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    Hardware Aging
                                </h3>
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
                                <div className="mt-4 space-y-2 text-xs">
                                    {hardwareAging.chartData.labels.map((label, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full flex-shrink-0"
                                                     style={{ backgroundColor: hardwareAging.chartData.datasets[0].backgroundColor[i] }} />
                                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                                    {label}
                                                </span>
                                            </div>
                                            <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                {hardwareAging.chartData.datasets[0].data[i]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            {/* PERIPHERALS CARD – TOTAL TOP-RIGHT + EXPANDABLE */}
                            <Card className={`p-5 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    {/* Title */}
                                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        Peripherals
                                    </h3>

                                    {/* Total – Big & Bold */}
                                    <div className="text-right">
                                        <p className={`text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Total
                                        </p>
                                        <p className={`text-2xl font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formatNumber(peripheralsData.total)}
                                        </p>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="space-y-1.5 text-sm">
                                    {peripheralsData.items.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-8">No peripherals recorded</p>
                                    ) : (
                                        <>
                                            {(showAllPeripherals ? peripheralsData.items : peripheralsData.items.slice(0, 7))
                                                .map(({ item_desc, count, percent }) => (
                                                    <div key={item_desc} className="flex justify-between">
                                                            <span className={`truncate max-w-[68%] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {item_desc}
                                                            </span>
                                                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                                {formatNumber(count)}{' '}
                                                            <span className="text-xs text-gray-500">({percent}%)</span>
                                                            </span>
                                                    </div>
                                                ))}

                                            {/* Expand / Collapse Button */}
                                            {peripheralsData.items.length > 7 && (
                                                <button
                                                    onClick={() => setShowAllPeripherals(prev => !prev)}
                                                    className={`w-full text-center text-xs font-semibold py-2 mt-3 border-t transition-colors ${
                                                        isDarkMode
                                                            ? 'text-blue-400 border-gray-700 hover:bg-gray-700/50'
                                                            : 'text-blue-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {showAllPeripherals
                                                        ? '↑ Show Less'
                                                        : `+ ${peripheralsData.items.length - 7} more`
                                                    }
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {selectedRegion && (
                        <p className="text-center text-sm mt-12 text-gray-500 dark:text-gray-400">
                            Selected: <span className="font-medium text-gray-900 dark:text-white">{selectedRegion.region_name}</span>
                        </p>
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

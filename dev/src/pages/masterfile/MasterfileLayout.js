import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { startSessionTimer } from '../../utils/session';
import {
    HiMenuAlt3,
    HiHome,
    HiDeviceMobile,
    HiClipboardList,
    HiBookOpen,
    HiUser,
    HiUserGroup,
    HiLogout,
    HiChevronDown,
    HiMoon,
    HiSun
} from 'react-icons/hi';

function MasterfileLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const dropdownRef = useRef(null);

    // Stable user object — prevents infinite re-renders
    const storedUser = sessionStorage.getItem('user');
    const user = useMemo(() =>
            storedUser ? JSON.parse(storedUser) : null,
        [storedUser]);

    // Redirect if not logged in
    useEffect(() => {
        if (!user?.user_name) {
            navigate('/masterfile/login', { replace: true });
        }
    }, [user, navigate]);

    // Dark Mode Load
    useEffect(() => {
        const saved = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldDark = saved === 'true' || (saved === null && prefersDark);
        setDarkMode(shouldDark);
        document.documentElement.classList.toggle('dark', shouldDark);
    }, []);

    // Dark Mode Save
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('darkMode', darkMode.toString());
    }, [darkMode]);

    // Responsive Sidebar
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            setSidebarOpen(!mobile);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Session Timer — no dependency on user (prevents loop)
    useEffect(() => {
        if (user?.user_name) {
            startSessionTimer(() => navigate('/masterfile/login'));
        }
    }, [navigate]);

    // Route guard for ROO (read-only viewer): block Dashboard & Users by direct URL
    useEffect(() => {
        const roleNow = (user?.user_type || 'FSE').toString().trim().toUpperCase();
        if (roleNow === 'ROO') {
            const allowed = ['/masterfile/inventory', '/masterfile/management', '/masterfile/directory', '/masterfile/profile'];
            if (!allowed.includes(location.pathname)) {
                navigate('/masterfile/inventory', { replace: true });
            }
        }
    }, [user, location.pathname, navigate]);

    // Early return if not logged in
    if (!user?.user_name) {
        return null;
    }

    const role = (user.user_type || 'FSE').toString().trim().toUpperCase();

    const menuItems = ['ADM', 'ADMIN', 'ADMINISTRATOR'].includes(role)
        ? [
            { icon: HiHome, label: "Dashboard", path: "/masterfile/home" },
            { icon: HiDeviceMobile, label: "Hardware Inventory", path: "/masterfile/inventory" },
            { icon: HiClipboardList, label: "Hardware Management", path: "/masterfile/management" },
            { icon: HiBookOpen, label: "Directory", path: "/masterfile/directory" },
            { icon: HiUser, label: "Users", path: "/masterfile/users" },
        ]
        : ['SPV', 'SUPERVISOR'].includes(role)
            ? [
                { icon: HiHome, label: "Dashboard", path: "/masterfile/home" },
                { icon: HiDeviceMobile, label: "Hardware Inventory", path: "/masterfile/inventory" },
                { icon: HiClipboardList, label: "Hardware Management", path: "/masterfile/management" },
                { icon: HiBookOpen, label: "Directory", path: "/masterfile/directory" },
                { icon: HiUserGroup, label: "Users", path: "/masterfile/users" },
            ]
            : role === 'ROO'
                ? [
                    // Read-only viewer: view/filter hardware & sites, no Dashboard or Users
                    { icon: HiDeviceMobile, label: "Hardware Inventory", path: "/masterfile/inventory" },
                    { icon: HiClipboardList, label: "Hardware Management", path: "/masterfile/management" },
                    { icon: HiBookOpen, label: "Directory", path: "/masterfile/directory" },
                ]
                : [
                    { icon: HiHome, label: "Dashboard", path: "/masterfile/home" },
                    { icon: HiDeviceMobile, label: "Hardware Inventory", path: "/masterfile/inventory" },
                    { icon: HiClipboardList, label: "Hardware Management", path: "/masterfile/management" },
                    { icon: HiBookOpen, label: "Directory", path: "/masterfile/directory" },
                ];

    const currentPath = location.pathname;

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/masterfile/login', { replace: true });
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'}`}>

            {/* Top Navbar */}
            <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm">
                <div className="px-4">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-1">
                                <HiMenuAlt3 className="w-6 h-6" />
                            </button>
                            <h1 className="text-base font-semibold text-indigo-700 dark:text-indigo-400">FSE Masterfile</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="relative w-14 h-7 bg-gray-300 dark:bg-indigo-600 rounded-full transition-colors duration-300 focus:outline-none"
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-0'}`}>
                                    {darkMode ? <HiMoon className="w-3 h-3 text-indigo-600 m-1" /> : <HiSun className="w-3 h-3 text-yellow-500 m-1" />}
                                </div>
                            </button>

                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 hover:opacity-80 rounded-lg px-2 py-1">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {user.fname?.[0]}{user.lname?.[0]}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-gray-800 dark:text-gray-200">{user.fname}</span>
                                    <HiChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-3 z-50">
                                        <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
                                                    {user.fname?.[0]}{user.lname?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{user.fname} {user.lname}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">@{user.user_name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{role}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    navigate('/masterfile/profile');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-left text-gray-700 dark:text-gray-300 transition-colors"
                                            >
                                                <HiUser className="w-4 h-4" /> Profile
                                            </button>
                                            <hr className="border-gray-200 dark:border-gray-700 my-1" />
                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-left transition-colors"
                                            >
                                                <HiLogout className="w-4 h-4" /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sidebar with Footer */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ top: '56px' }}>
                <nav className="h-full flex flex-col px-4 pt-4">
                    <div className="flex-1 overflow-y-auto pb-4">
                        {menuItems.map(item => (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition mb-1 block
                                    ${currentPath === item.path ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm' : ''}`}
                                onClick={() => isMobile && setSidebarOpen(false)}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 pb-8 px-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                © 2024 - {new Date().getFullYear()} <span className="font-medium text-indigo-600 dark:text-indigo-400">FSE Masterfile</span>
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Hardware Inventory System
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3 opacity-70">
                                v2.0 • Powered by CSG
                            </p>
                        </div>
                    </div>
                </nav>
            </aside>

            <main className={`pt-14 min-h-screen transition-all duration-300 ${sidebarOpen && !isMobile ? 'pl-64' : 'pl-0'}`}>
                <Outlet />
            </main>

            {isMobile && sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    );
}

export default MasterfileLayout;

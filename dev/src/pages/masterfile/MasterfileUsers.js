import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import { useApi } from '../../hooks/useApi';

// ─── helpers ────────────────────────────────────────────────────────────────

function getModalRoot() {
    let el = document.getElementById('modal-root');
    if (!el) {
        el = document.createElement('div');
        el.id = 'modal-root';
        document.body.appendChild(el);
    }
    return el;
}

function RoleBadge({ userType }) {
    const t = (userType || '').toUpperCase();
    if (['ADM', 'ADMIN', 'ADMINISTRATOR'].includes(t))
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">ADM</span>;
    if (['SPV', 'SUPERVISOR'].includes(t))
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">SPV</span>;
    if (t === 'ROO')
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">ROO</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">FSE</span>;
}

function SkeletonRow({ cols }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

// ─── Add User Modal ──────────────────────────────────────────────────────────

function AddUserModal({ onClose, onSave, spvCluster, regionOptions, isADM }) {
    const [form, setForm] = useState({
        fname: '', lname: '', user_name: '', user_pass: '', confirm_pass: '',
        user_type: isADM ? 'ADM' : 'FSE',
        cluster_name: isADM ? 'All Cluster' : '',
    });
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [errors, setErrors]   = useState({});
    const [saving, setSaving]   = useState(false);
    const [showPass, setShowPass] = useState(false);

    const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

    const validate = () => {
        const e = {};
        if (!form.fname.trim())    e.fname    = 'Required';
        if (!form.lname.trim())    e.lname    = 'Required';
        if (!form.user_name.trim()) e.user_name = 'Required';
        if (!form.user_pass)       e.user_pass = 'Required';
        else if (form.user_pass.length < 6) e.user_pass = 'Min 6 characters';
        if (form.user_pass !== form.confirm_pass) e.confirm_pass = 'Passwords do not match';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        await onSave({
            fname:           form.fname.trim(),
            lname:           form.lname.trim(),
            user_name:       form.user_name.trim(),
            user_pass:       form.user_pass,
            user_type:       form.user_type,
            cluster_name:    ['ADM', 'ROO'].includes(form.user_type) ? 'All Cluster' : (isADM ? form.cluster_name : spvCluster),
            region_assigned: ['ADM', 'ROO'].includes(form.user_type) ? '' : selectedRegions.map(r => r.value).join(','),
        });
        setSaving(false);
    };

    const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
    const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1';

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Add New User</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>First Name</label>
                            <input type="text" className={inputCls} value={form.fname}
                                onChange={e => set('fname', e.target.value)} placeholder="Juan" />
                            {errors.fname && <p className="text-xs text-red-500 mt-1">{errors.fname}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Last Name</label>
                            <input type="text" className={inputCls} value={form.lname}
                                onChange={e => set('lname', e.target.value)} placeholder="Dela Cruz" />
                            {errors.lname && <p className="text-xs text-red-500 mt-1">{errors.lname}</p>}
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Username</label>
                        <input type="text" className={inputCls} value={form.user_name}
                            onChange={e => set('user_name', e.target.value)} placeholder="juandelacruz" />
                        {errors.user_name && <p className="text-xs text-red-500 mt-1">{errors.user_name}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>Password</label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} className={inputCls + ' pr-14'}
                                value={form.user_pass} onChange={e => set('user_pass', e.target.value)} />
                            <button type="button" onClick={() => setShowPass(p => !p)}
                                className="absolute right-3 top-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                                {showPass ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.user_pass && <p className="text-xs text-red-500 mt-1">{errors.user_pass}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>Confirm Password</label>
                        <input type="password" className={inputCls} value={form.confirm_pass}
                            onChange={e => set('confirm_pass', e.target.value)} />
                        {errors.confirm_pass && <p className="text-xs text-red-500 mt-1">{errors.confirm_pass}</p>}
                    </div>

                    <div>
                        <label className={labelCls}>Role</label>
                        {isADM ? (
                            <select
                                className={inputCls}
                                value={form.user_type}
                                onChange={e => {
                                    const r = e.target.value;
                                    setForm(p => ({ ...p, user_type: r, cluster_name: ['ADM', 'ROO'].includes(r) ? 'All Cluster' : '' }));
                                    if (['ADM', 'ROO'].includes(r)) setSelectedRegions([]);
                                }}
                            >
                                <option value="ADM">ADM (Administrator)</option>
                                <option value="FSE">FSE (Field Service Engineer)</option>
                                <option value="ROO">ROO (Read-Only Viewer)</option>
                            </select>
                        ) : (
                            <input type="text" value="FSE" disabled
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                        )}
                    </div>

                    <div>
                        <label className={labelCls}>Cluster</label>
                        {isADM && form.user_type === 'FSE' ? (
                            <input type="text" className={inputCls} value={form.cluster_name}
                                onChange={e => set('cluster_name', e.target.value)}
                                placeholder="e.g. NCR Cluster" />
                        ) : (
                            <input type="text"
                                value={isADM ? 'All Cluster' : (spvCluster || '')}
                                disabled
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                        )}
                    </div>

                    {(!isADM || form.user_type === 'FSE') && (
                        <div>
                            <label className={labelCls}>Region Assigned</label>
                            <Select
                                isMulti
                                options={regionOptions}
                                value={selectedRegions}
                                onChange={setSelectedRegions}
                                placeholder="Select regions..."
                                classNamePrefix="react-select"
                                styles={{
                                    control: (b) => ({ ...b, minHeight: 38, fontSize: 14 }),
                                    menu:    (b) => ({ ...b, zIndex: 9999 }),
                                }}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                            {saving ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        getModalRoot()
    );
}

// ─── Reset Password Modal ────────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose, onSave }) {
    const [form, setForm]   = useState({ new_password: '', confirm_password: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.new_password) e.new_password = 'Required';
        else if (form.new_password.length < 6) e.new_password = 'Min 6 characters';
        if (form.new_password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500';

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Reset Password</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {user.fname} {user.lname} &bull; @{user.user_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} className={inputCls + ' pr-14'}
                                value={form.new_password}
                                onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))}
                                autoFocus />
                            <button type="button" onClick={() => setShowPass(p => !p)}
                                className="absolute right-3 top-2 text-xs text-amber-600 hover:text-amber-800 font-medium">
                                {showPass ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.new_password && <p className="text-xs text-red-500 mt-1">{errors.new_password}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                        <input type="password" className={inputCls}
                            value={form.confirm_password}
                            onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))} />
                        {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                            {saving ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        getModalRoot()
    );
}

// ─── Edit Region Modal ───────────────────────────────────────────────────────

function EditRegionModal({ user, regionOptions, onClose, onSave }) {
    const [selectedRegions, setSelectedRegions] = useState(
        () => (user.region_assigned || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(id => regionOptions.find(o => o.value === id) || { value: id, label: `Region ${id}` })
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(selectedRegions.map(r => r.value).join(','));
        setSaving(false);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Reassign Region</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {user.fname} {user.lname} &bull; @{user.user_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Region Assigned</label>
                        <Select
                            isMulti
                            options={regionOptions}
                            value={selectedRegions}
                            onChange={(v) => setSelectedRegions(v || [])}
                            placeholder="Select regions..."
                            classNamePrefix="react-select"
                            styles={{
                                control: (b) => ({ ...b, minHeight: 38, fontSize: 14 }),
                                menu:    (b) => ({ ...b, zIndex: 9999 }),
                            }}
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                            Clearing all regions removes this user's hardware access.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                            {saving ? 'Saving...' : 'Save Region'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        getModalRoot()
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function MasterfileUsers() {
    const { fetchData, postData } = useApi();

    const user   = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
    const role   = (user.user_type || '').toString().trim().toUpperCase();
    const isADM  = ['ADM', 'ADMIN', 'ADMINISTRATOR'].includes(role);
    const isSPV  = ['SPV', 'SUPERVISOR'].includes(role);

    const [users,   setUsers]   = useState([]);
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    const [toast,   setToast]   = useState(null);

    const [showAddModal,    setShowAddModal]    = useState(false);
    const [showResetModal,  setShowResetModal]  = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [selectedUser,    setSelectedUser]    = useState(null);

    // keep a stable ref to fetchData — avoids re-render loops since useApi
    // recreates fetchData on every render (it's not wrapped in useCallback)
    const fetchRef = useRef(fetchData);
    useEffect(() => { fetchRef.current = fetchData; }, [fetchData]);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // incrementing this is the only thing that triggers a re-fetch
    const [reloadKey, setReloadKey] = useState(0);
    const loadData = useCallback(() => setReloadKey(k => k + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const endpoint = isSPV && user.cluster_name
            ? `/api/user-tbl.json?cluster_name=${encodeURIComponent(user.cluster_name)}`
            : '/api/user-tbl.json';

        Promise.all([
            fetchRef.current(endpoint),
            fetchRef.current('/api/region-tbl.json'),
        ]).then(([usersRes, regionsRes]) => {
            if (!cancelled) {
                setUsers(usersRes?.users || []);
                setRegions(regionsRes?.regionTbl || []);
                setLoading(false);
            }
        }).catch(() => {
            if (!cancelled) setLoading(false);
        });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey]);

    const regionMap = useMemo(() => {
        const map = {};
        regions.forEach(r => { map[String(r.region_id)] = r.region_name; });
        return map;
    }, [regions]);

    const regionOptions = useMemo(() =>
        regions.map(r => ({ value: String(r.region_id), label: r.region_name })),
        [regions]
    );

    const formatRegions = (regionAssigned) => {
        if (!regionAssigned) return '—';
        return regionAssigned.split(',')
            .map(id => regionMap[id.trim()] || `Region ${id.trim()}`)
            .join(', ');
    };

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        const term = search.toLowerCase();
        return users.filter(u =>
            [u.fname, u.lname, u.user_name, u.user_type, u.cluster_name]
                .some(v => v?.toLowerCase().includes(term))
        );
    }, [users, search]);

    const handleAddUser = async (formData) => {
        const res = await postData('/api/user-tbl/add.json', formData);
        if (res?.success) {
            showToast('User created successfully');
            setShowAddModal(false);
            loadData();
        } else {
            const msg = res?.error || Object.values(res?.errors || {}).flat()[0] || 'Failed to create user';
            showToast(msg, 'error');
        }
    };

    const handleResetPassword = async (formData) => {
        const res = await postData('/api/user-tbl/reset-password.json', {
            user_id:      selectedUser.id,
            new_password: formData.new_password,
        });
        if (res?.success) {
            showToast('Password reset successfully');
            setShowResetModal(false);
            setSelectedUser(null);
        } else {
            showToast(res?.error || 'Failed to reset password', 'error');
        }
    };

    const handleUpdateRegion = async (regionAssigned) => {
        const res = await postData('/api/user-tbl/update-region.json', {
            user_id:         selectedUser.id,
            region_assigned: regionAssigned,
        });
        if (res?.success) {
            showToast('Region assignment updated');
            setShowRegionModal(false);
            setSelectedUser(null);
            loadData();
        } else {
            showToast(res?.error || 'Failed to update region', 'error');
        }
    };

    // Region reassignment applies to region-scoped (FSE) users only — ADM/SPV/ROO
    // are cluster- or org-wide and have no per-region assignment.
    const isRegionScoped = (u) => (u.user_type || '').toString().trim().toUpperCase() === 'FSE';

    const canManage = isADM || isSPV;
    const colCount  = canManage ? 6 : 5;

    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Users</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {isADM
                            ? 'All users — nationwide view'
                            : `Users in ${user.cluster_name || 'your'} cluster`}
                    </p>
                </div>
                {(isSPV || isADM) && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        + Add User
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, username, role, cluster..."
                    className="w-full md:w-80 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-600">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cluster</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Region</th>
                                {canManage && (
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={colCount} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                        {u.fname} {u.lname}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                                        @{u.user_name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <RoleBadge userType={u.user_type} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">
                                        {u.cluster_name || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">
                                        {['ADM','ADMIN','ADMINISTRATOR','SPV','SUPERVISOR'].includes((u.user_type||'').toUpperCase())
                                            ? '—'
                                            : formatRegions(u.region_assigned)}
                                    </td>
                                    {canManage && (
                                        <td className="px-4 py-3">
                                            {u.id !== user.id && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                                                        className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors"
                                                    >
                                                        Reset Password
                                                    </button>
                                                    {isADM && isRegionScoped(u) && (
                                                        <button
                                                            onClick={() => { setSelectedUser(u); setShowRegionModal(true); }}
                                                            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors"
                                                        >
                                                            Reassign Region
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && (
                    <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                        {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}{search ? ' found' : ' total'}
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
                    toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Modals */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddUser}
                    spvCluster={user.cluster_name}
                    regionOptions={regionOptions}
                    isADM={isADM}
                />
            )}
            {showResetModal && selectedUser && (
                <ResetPasswordModal
                    user={selectedUser}
                    onClose={() => { setShowResetModal(false); setSelectedUser(null); }}
                    onSave={handleResetPassword}
                />
            )}
            {showRegionModal && selectedUser && (
                <EditRegionModal
                    user={selectedUser}
                    regionOptions={regionOptions}
                    onClose={() => { setShowRegionModal(false); setSelectedUser(null); }}
                    onSave={handleUpdateRegion}
                />
            )}
        </div>
    );
}

export default MasterfileUsers;

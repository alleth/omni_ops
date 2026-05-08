import React, { useState, useMemo, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

function MasterfileProfile() {
    const { fetchData, postData, loading: apiLoading, error: apiError } = useApi();

    const storedUser = sessionStorage.getItem('user');
    const user = useMemo(
        () =>
            storedUser
                ? JSON.parse(storedUser)
                : {
                    fname: '',
                    lname: '',
                    user_name: '',
                    user_type: '',
                    region_assigned: '',
                    cluster_name: '',
                },
        [storedUser]
    );

    const [form, setForm] = useState({
        fname: user.fname || '',
        lname: user.lname || '',
        user_name: user.user_name || '',
        current_password: '',
        new_password: '',
        confirm_new_password: '',
    });

    /** ---------------- REGIONS ---------------- */
    const [regionMap, setRegionMap] = useState({});
    const [regionsLoading, setRegionsLoading] = useState(true);
    const [regionsError, setRegionsError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadRegions = async () => {
            setRegionsLoading(true);
            setRegionsError(null);

            try {
                const data = await fetchData('/api/region-tbl');

                let regions = [];
                if (data?.regionTbl && Array.isArray(data.regionTbl)) {
                    regions = data.regionTbl;
                } else if (Array.isArray(data)) {
                    regions = data;
                }

                const map = {};
                regions.forEach(r => {
                    const id = String(r.region_id);
                    const name = r.region_name;
                    if (id && name) map[id] = name;
                });

                if (mounted) setRegionMap(map);
            } catch (err) {
                console.error('[Region Fetch Error]', err);
                if (mounted) setRegionsError('Failed to load regions');
            } finally {
                if (mounted) setRegionsLoading(false);
            }
        };

        loadRegions();
        return () => {
            mounted = false;
        };
    }, []);

    /** ---------------- FORM ---------------- */
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Button enabled ONLY if there's at least one real change
    const hasChanges = useMemo(() => {
        const fnameDiff = form.fname.trim() !== (user.fname || '').trim();
        const lnameDiff = form.lname.trim() !== (user.lname || '').trim();
        const usernameDiff = form.user_name.trim() !== (user.user_name || '').trim();

        // Password fields only count as change if any has content
        const pwTouched = form.current_password.trim() !== '' ||
            form.new_password.trim() !== '' ||
            form.confirm_new_password.trim() !== '';

        return fnameDiff || lnameDiff || usernameDiff || pwTouched;
    }, [form, user]);

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const errs = {};
        if (!form.fname.trim()) errs.fname = 'Required';
        if (!form.lname.trim()) errs.lname = 'Required';
        if (!form.user_name.trim()) errs.user_name = 'Required';

        const pwTouched =
            form.current_password.trim() || form.new_password.trim() || form.confirm_new_password.trim();

        if (pwTouched) {
            if (!form.current_password.trim()) errs.current_password = 'Required';
            if (!form.new_password.trim()) errs.new_password = 'Required';
            else if (form.new_password.trim().length < 8) errs.new_password = '≥ 8 chars';
            if (form.new_password.trim() !== form.confirm_new_password.trim())
                errs.confirm_new_password = 'Passwords do not match';
            else if (form.new_password.trim() === form.current_password.trim())
                errs.new_password = 'New password cannot be the same as current';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000); // auto-hide after 4s
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setToast(null);

        if (!validate()) {
            showToast('error', 'Please fix the errors above');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                user_id: user.id,
                fname: form.fname.trim(),
                lname: form.lname.trim(),
                user_name: form.user_name.trim(),
            };

            // Only send password fields if they were touched
            if (form.current_password.trim() || form.new_password.trim()) {
                payload.current_password = form.current_password.trim();
                payload.new_password = form.new_password.trim();
            }

            const res = await fetch('http://omniops.local/api/user-tbl/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
                // credentials: 'include',
            });

            const result = await res.json();

            await new Promise(resolve => setTimeout(resolve, 400));

            if (result?.success) {
                showToast('success', result.message || 'Profile updated successfully.');

                const updatedUser = {
                    ...user,
                    fname: payload.fname,
                    lname: payload.lname,
                    user_name: payload.user_name,
                };

                sessionStorage.setItem('user', JSON.stringify(updatedUser));

                setForm(prev => ({
                    ...prev,
                    current_password: '',
                    new_password: '',
                    confirm_new_password: '',
                }));
            } else {
                showToast('error', result?.error || 'Update failed');
            }
        } catch (err) {
            console.error('Save error:', err);
            showToast('error', 'Failed to save profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Derived data
    const regionIds = (user.region_assigned || '')
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

    const displayedRegions = regionIds.map(
        id => regionMap[id] || `Unknown Region (${id})`
    );

    const userType = (user.user_type || '').toUpperCase();
    const isFSE = userType === 'FSE';
    const isSPV = ['SPV', 'SUPERVISOR'].includes(userType);

    const initials =
        ((form.fname?.[0] || '') + (form.lname?.[0] || '')).toUpperCase() || '?';

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-y-0 opacity-100
                        ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
                >
                    {toast.message}
                </div>
            )}

            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">

                {/* Side profile + main form */}
                <div className="flex flex-col lg:flex-row">

                    {/* Left side: Profile summary */}
                    <div className="lg:w-1/3 bg-gray-50 dark:bg-gray-900/50 p-8 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 flex flex-col items-center lg:items-start text-center lg:text-left">
                        <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-medium mb-4">
                            {initials}
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {form.fname} {form.lname}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            @{form.user_name}
                        </p>

                        <div className="w-full space-y-6 mt-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">User Type</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{userType || '—'}</p>
                            </div>

                            {isFSE && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Assigned Regions</p>
                                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {regionsLoading ? (
                                            <span className="italic text-gray-500">Loading…</span>
                                        ) : regionsError ? (
                                            <span className="text-red-600 dark:text-red-400">{regionsError}</span>
                                        ) : displayedRegions.length > 0 ? (
                                            <ul className="space-y-1">
                                                {displayedRegions.map((name, i) => (
                                                    <li key={i}>• {name}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="italic text-gray-500">None assigned</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isSPV && (
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Cluster Name</p>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {user.cluster_name || '—'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side: Edit form */}
                    <div className="lg:w-2/3 p-8 md:p-10">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                    Update Profile
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            First Name
                                        </label>
                                        <input
                                            name="fname"
                                            value={form.fname}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-colors
                                                ${errors.fname ? 'border-red-400 focus:border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'}
                                                dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/30`}
                                        />
                                        {errors.fname && <p className="mt-1.5 text-xs text-red-600">{errors.fname}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Last Name
                                        </label>
                                        <input
                                            name="lname"
                                            value={form.lname}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-colors
                                                ${errors.lname ? 'border-red-400 focus:border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'}
                                                dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/30`}
                                        />
                                        {errors.lname && <p className="mt-1.5 text-xs text-red-600">{errors.lname}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Username
                                        </label>
                                        <input
                                            name="user_name"
                                            value={form.user_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-colors
                                                ${errors.user_name ? 'border-red-400 focus:border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'}
                                                dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/30`}
                                        />
                                        {errors.user_name && <p className="mt-1.5 text-xs text-red-600">{errors.user_name}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-5">
                                    Change Password (optional)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Current Password</label>
                                        <input
                                            type="password"
                                            name="current_password"
                                            value={form.current_password}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-colors
                                                ${errors.current_password ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}
                                                dark:bg-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none`}
                                        />
                                        {errors.current_password && <p className="mt-1.5 text-xs text-red-600">{errors.current_password}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">New Password</label>
                                        <input
                                            type="password"
                                            name="new_password"
                                            value={form.new_password}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-colors
                                                ${errors.new_password ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}
                                                dark:bg-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none`}
                                        />
                                        {errors.new_password && <p className="mt-1.5 text-xs text-red-600">{errors.new_password}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirm_new_password"
                                            value={form.confirm_new_password}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-colors
                                                ${errors.confirm_new_password ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}
                                                dark:bg-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none`}
                                        />
                                        {errors.confirm_new_password && <p className="mt-1.5 text-xs text-red-600">{errors.confirm_new_password}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end gap-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !hasChanges}
                                    className={`
                                        px-8 py-2.5 text-sm font-medium rounded-lg transition-colors min-w-[140px]
                                        ${hasChanges && !isSubmitting
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'}
                                    `}
                                >
                                    {isSubmitting ? (
                                        <span className="inline-flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25"/>
                                                <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75"/>
                                            </svg>
                                            Saving...
                                        </span>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MasterfileProfile;

// src/utils/requestActions.js
//
// Shared by RequestDetailModal (single-request actions) and MasterfileDashboard
// (bulk actions) so approve/cancel/delete — and approve's side effects, namely
// flipping the underlying hardware to "Pullout" and, for RELOCATION requests,
// duplicating the hardware record at the destination site — live in exactly
// one place. Two independent copies of this logic is how they'd quietly drift
// apart between the single-request and bulk entry points.
//
// approveRequestCore() deliberately does NOT handle attachment replacement:
// that's a single-request, SPV-specific step (RequestDetailModal requires
// attaching a newly signed document before approving one request at a time)
// that doesn't translate to a bulk action — requiring N separate file uploads
// through a bulk-select UI isn't practical, so bulk approve intentionally
// skips it and approves with whatever attachment (if any) is already on file.

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

export async function updateHardwareStatusForRequest(postData, hwId, status = 'Pullout') {
    if (!hwId) return true;
    try {
        const result = await postData('/api/hw-tbl/update.json', {
            hw_id: hwId,
            hw_status: status,
            updated_at: nowStr(),
        });
        return result?.success || false;
    } catch (err) {
        console.error('Hardware update error:', err);
        return false;
    }
}

export async function duplicateHardwareForRelocation(fetchData, postData, request) {
    if (!request.hw_id || !request.destination_site) return false;
    try {
        const res = await fetchData(`/api/hw-tbl/view/${request.hw_id}.json`);
        const original = res?.hwTbl || res?.HwTbl || {};
        if (!original.hw_id) return false;

        const newHwData = {
            region_name: original.region_name || '',
            site_code: request.destination_site,
            hw_asset_num: original.hw_asset_num || '',
            hw_serial_num: original.hw_serial_num || '',
            item_desc: original.item_desc || '',
            hw_brand_name: original.hw_brand_name || '',
            hw_model: original.hw_model || '',
            hw_status: 'On Site',
            user_id: original.user_id || 1,
            hw_date_acq: original.hw_date_acq || new Date().toISOString().slice(0, 10),
            hw_acq_val: original.hw_acq_val || 0,
            hw_host_name: original.hw_host_name || `reloc-${Date.now()}`,
            hw_ip_add: original.hw_ip_add || '0.0.0.0',
            hw_mac_add: original.hw_mac_add || '00:00:00:00:00:00',
            hw_user_name: original.hw_user_name || 'System',
            hw_primary_role: original.hw_primary_role || 'User',
            hw_remarks: original.hw_remarks || `Relocated from ${original.site_code || 'previous site'}`,
            created_at: nowStr(),
            updated_at: nowStr(),
        };

        const result = await postData('/api/hw-tbl/add.json', newHwData);
        return result?.success || false;
    } catch (err) {
        console.error('Error duplicating hardware for relocation:', err);
        return false;
    }
}

/**
 * Approves one request: status -> APPROVED, stamps approver/timestamp, and
 * applies the PULL_OUT/RELOCATION hardware side effects. Returns
 * { success, error? , warning? } — `warning` means the request itself was
 * approved but a hardware side effect failed, which the caller should
 * surface distinctly from a hard failure (the approval did go through).
 */
export async function approveRequestCore({ fetchData, postData, request, approverId }) {
    const now = nowStr();
    const requestType = (request.request_type || '').toUpperCase();
    const isPullOut = requestType === 'PULL_OUT';
    const isRelocation = requestType === 'RELOCATION';

    const payload = {
        request_id: request.request_id,
        status: 'APPROVED',
        approved_by: approverId,
        approved_at: now,
        updated_at: now,
    };

    const result = await postData('/api/request-tbl/update.json', payload);
    if (!result?.success) {
        return { success: false, error: result?.message || `Failed to approve request #${request.request_id}` };
    }

    if (request.hw_id && (isPullOut || isRelocation)) {
        const hwOk = await updateHardwareStatusForRequest(postData, request.hw_id, 'Pullout');
        if (!hwOk) {
            return { success: true, warning: `Request #${request.request_id} approved, but updating its hardware status failed.` };
        }
        if (isRelocation) {
            const dupOk = await duplicateHardwareForRelocation(fetchData, postData, request);
            if (!dupOk) {
                return { success: true, warning: `Request #${request.request_id} approved, but creating the relocated hardware record failed.` };
            }
        }
    }

    return { success: true };
}

/**
 * Cancels one (typically PENDING) request — status -> CANCELED. No hardware
 * side effects: a cancel means the request never went anywhere, unlike a
 * reject (which can follow an approval) or a delete.
 */
export async function cancelRequestCore({ postData, request }) {
    const result = await postData('/api/request-tbl/update.json', {
        request_id: request.request_id,
        status: 'CANCELED',
        updated_at: nowStr(),
    });
    if (!result?.success) {
        return { success: false, error: result?.message || `Failed to cancel request #${request.request_id}` };
    }
    return { success: true };
}

/**
 * Permanently deletes one (typically REJECTED) request row. Mirrors
 * RequestDetailModal's existing handleDelete — a plain fetch rather than
 * useApi's postData, since this is the one action that's a real HTTP DELETE.
 */
export async function deleteRequestCore({ request }) {
    try {
        const res = await fetch(`/api/request-tbl/delete/${request.request_id}.json`, {
            method: 'DELETE',
            headers: { Accept: 'application/json' },
        });
        const result = await res.json();
        if (result?.message?.toLowerCase().includes('success') || result?.success) {
            return { success: true };
        }
        return { success: false, error: `Failed to delete request #${request.request_id}` };
    } catch (err) {
        console.error('Delete error:', err);
        return { success: false, error: `Network error deleting request #${request.request_id}` };
    }
}

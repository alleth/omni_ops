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
        // No updated_at: hw_tbl has no such column (request_tbl does, which is why
        // it's still sent on the request payloads below), so it never reached the
        // generated SQL.
        const result = await postData('/api/hw-tbl/update.json', {
            hw_id: hwId,
            hw_status: status,
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

        // Copy the whole record, then override only what relocating actually
        // changes. The previous version listed ~17 fields by hand, so a relocated
        // unit silently lost everything not on that list — memory, HDD capacity
        // and health, OS, .NET, antivirus (incl. hw_antivi_meta), core_buid, all
        // six facility flags, the ports counts, major/sub_major_type — and the
        // duplicate showed up in Hardware Management as an unconfigured unit.
        //
        // It also wrote hw_remarks, created_at and updated_at, none of which are
        // columns on hw_tbl, so those were dropped by the ORM; the "Relocated
        // from X" note never reached the database.
        const { hw_id: _omitHwId, ...carriedOver } = original;

        const newHwData = {
            ...carriedOver,
            site_code: request.destination_site,
            hw_status: 'On Site',
        };

        // Blank network identity is left blank. It used to be backfilled with
        // '0.0.0.0' / '00:00:00:00:00:00' / `reloc-<timestamp>`, which gave every
        // relocated unit the SAME fabricated MAC — and findNetworkDuplicate in
        // MasterfileHardwareManagement checks MACs org-wide, so those collided
        // with each other and blocked later edits.
        delete newHwData.created_at;
        delete newHwData.updated_at;

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
 * Cancels one (typically PENDING) request — status -> CANCELED, and reverts
 * the underlying hardware's hw_status back to 'On Site' (the add() endpoint
 * flips it to 'Pending' the moment a PULL_OUT/RELOCATION request is created —
 * see RequestTblController::add() — so canceling has to undo that, or the
 * hardware would stay stuck out of the On Site list with no request left to
 * explain why).
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

    const requestType = (request.request_type || '').toUpperCase();
    if (request.hw_id && (requestType === 'PULL_OUT' || requestType === 'RELOCATION')) {
        const hwOk = await updateHardwareStatusForRequest(postData, request.hw_id, 'On Site');
        if (!hwOk) {
            return { success: true, warning: `Request #${request.request_id} canceled, but restoring its hardware status failed.` };
        }
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

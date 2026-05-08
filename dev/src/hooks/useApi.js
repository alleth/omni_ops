// hooks/useApi.js
import { useState, useCallback } from 'react';

// ────────────────────────────────────────────────
// Decide base URL — but ONLY for non-proxied environments
// In dev, we prefer relative /api/... so proxy works
// In production (same domain), relative paths are fine
// ────────────────────────────────────────────────
const getApiBase = () => {
    const origin = window.location.origin;

    // In development (React dev server), return empty string → use /api/... relative
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return '';  // ← critical change: let proxy handle it
    }

    // Production: same domain → relative paths work fine
    return '';
};

const API_BASE = getApiBase();

/**
 * Enhanced useApi — reusable, clean, production-grade
 */
export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Single endpoint fetch
    const fetchData = async (endpoint) => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
            const res = await fetch(url, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error(err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Fetch multiple endpoints in parallel
    const fetchMany = useCallback(async (...endpoints) => {
        setLoading(true);
        setError(null);
        try {
            const responses = await Promise.all(
                endpoints.map(ep => {
                    const url = `${API_BASE}${ep.startsWith('/') ? ep : '/' + ep}`;
                    return fetch(url, {
                        headers: { Accept: 'application/json' },
                    });
                })
            );

            responses.forEach((res, i) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status} on ${endpoints[i]}`);
                }
            });

            const results = await Promise.all(responses.map(r => r.json()));
            return results;
        } catch (err) {
            console.error('fetchMany error:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // One-liner for Masterfile page
    const fetchMasterfileData = useCallback(() =>
            fetchMany(
                '/api/region-tbl.json',
                '/api/site-list-tbl.json',
                '/api/hw-tbl.json',
                '/api/item-description.json',
                '/api/request-tbl.json',
                '/api/item-brand.json',
                '/api/item-models.json'
            ),
        [fetchMany]);

    // POST helper (JSON)
    const postData = async (endpoint, data) => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`POST failed: ${res.status} - ${errText}`);
            }

            return await res.json();
        } catch (err) {
            console.error('postData error:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // POST with FormData — used by BulkRequestModal for file uploads
    const postFormData = async (endpoint, formDataObject) => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
            const res = await fetch(url, {
                method: 'POST',
                body: formDataObject,
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`POST failed: ${res.status} - ${errText}`);
            }

            return await res.json();
        } catch (err) {
            console.error('postFormData error:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        fetchData,
        fetchMany,
        fetchMasterfileData,
        postData,
        postFormData,
        loading,
        error,
    };
};

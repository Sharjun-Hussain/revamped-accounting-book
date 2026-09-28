import { getSession } from 'next-auth/react';
import { backendBaseUrl } from './api';

/**
 * Raw fetch helper for the Express backend.
 *
 * Unlike the axios instance in ./api (which unwraps the { status, data }
 * envelope), this returns the native Response untouched — for endpoints that
 * intentionally mirror the old Next.js shapes ({ success, message, error },
 * { status: 'success', data } from the Text.lk proxy, file downloads, ...).
 *
 * Pass paths exactly as before ('/api/settings/app', '/api/text-lk/config');
 * the '/api' prefix is rewritten to the backend base URL.
 */
export async function apiFetch(path, options = {}) {
    const url = path.startsWith('/api/')
        ? `${backendBaseUrl}${path.slice(4)}`
        : `${backendBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    let token = null;
    try {
        const session = await getSession();
        token = session?.backendToken || session?.accessToken || null;
    } catch {
        // No session available — proceed unauthenticated.
    }

    const headers = { ...(options.headers || {}) };
    // Drop the legacy internal placeholder; always use the real session token.
    if (headers.Authorization === 'Bearer internal') delete headers.Authorization;
    if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

    return fetch(url, { ...options, headers });
}

export default apiFetch;

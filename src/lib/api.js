import axios from 'axios';
import { getSession } from 'next-auth/react';

// Base URL of the Express + MySQL backend (see backend/README.md).
// Falls back to the local dev default. Trailing slashes are stripped.
const BACKEND_URL = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1'
).replace(/\/$/, '');

export const backendBaseUrl = BACKEND_URL;

const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach the backend JWT stored in the NextAuth session.
api.interceptors.request.use(
    async (config) => {
        try {
            const session = await getSession();
            const token = session?.backendToken || session?.accessToken;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch {
            // Session not ready (e.g. during SSR) — proceed without a token.
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor:
// 1. Unwrap the backend envelope { status: 'success', data, meta? } so callers
//    keep receiving raw payloads exactly like the old Next.js /api routes.
// 2. Surface a consistent error shape ({ message, error }).
api.interceptors.response.use(
    (response) => {
        const body = response.data;
        if (body && typeof body === 'object' && body.status === 'success' && 'data' in body) {
            response.data = body.data;
            if (body.meta !== undefined) response.meta = body.meta;
        }
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log('Unauthorized, redirecting...');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

/**
 * Standard fetcher for SWR that uses the configured AXIOS instance.
 * Automatically handles baseURL, headers, and interceptors.
 */
export const apiFetcher = (url) => api.get(url).then((res) => res.data);

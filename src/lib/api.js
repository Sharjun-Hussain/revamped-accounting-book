import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        // You can add logic here to get the token from local storage or a cookie
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle specific error codes here, e.g., 401 for unauthorized
        if (error.response && error.response.status === 401) {
            // Redirect to login or refresh token
            console.log('Unauthorized, redirecting...');
        }
        return Promise.reject(error);
    }
);

export default api;

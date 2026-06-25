import axios from 'axios';

// Render's `hostport` property returns "hostname:port" without a scheme.
// We ensure the URL always has https:// for production deployments.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const withScheme = rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`;
const baseApiUrl = withScheme.endsWith('/api') ? withScheme : `${withScheme}/api`;

const api = axios.create({
  baseURL: baseApiUrl,
});


// Request interceptor to attach JWT token
if (typeof window !== 'undefined') {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('amx_erp_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );
}

export default api;

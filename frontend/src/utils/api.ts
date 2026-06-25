import axios from 'axios';

const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`,
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

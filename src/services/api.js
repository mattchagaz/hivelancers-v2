import axios from 'axios';
import { emitAuthUnauthorized } from './authEvents';
import { tokenStorage } from './tokenStorage';

const baseURL = import.meta.env.VITE_API_URL || 'https://hivelancers-backend.fly.dev';

export const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  const publicPasswordEndpoint =
    config.url?.includes('/auth/forgot-password') ||
    config.url?.includes('/auth/reset-password');

  if (token && !publicPasswordEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isAuthEndpoint = original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register') ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/verify-otp');

    if (status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const legacyRefreshToken = tokenStorage.getRefresh();

    original._retry = true;
    try {
      refreshPromise = refreshPromise ||
        axios.post(
          `${baseURL}/auth/refresh`,
          legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {},
          { withCredentials: true }
        ).finally(() => {
          refreshPromise = null;
        });
      const { data } = await refreshPromise;
      tokenStorage.setTokens(data);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshErr) {
      tokenStorage.clear();
      emitAuthUnauthorized();
      return Promise.reject(refreshErr);
    }
  }
);

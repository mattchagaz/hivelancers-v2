import axios from 'axios';
import { emitAuthUnauthorized } from './authEvents';
import { tokenStorage } from './tokenStorage';

const baseURL = import.meta.env.VITE_API_URL || 'https://hivelancers-backend.fly.dev';

const getTokenSubject = (token) => {
  try {
    const payload = token?.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payload) return null;
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(atob(padded)).sub || null;
  } catch {
    return null;
  }
};

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

let refreshRequest = null;

const createRefreshRequest = () => {
  const legacyRefreshToken = tokenStorage.getRefresh();
  const generation = tokenStorage.getGeneration();
  const expectedUserId = tokenStorage.getExpectedUserId();
  const request = { generation, promise: null };

  request.promise = axios.post(
    `${baseURL}/auth/refresh`,
    legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {},
    { withCredentials: true }
  ).then(({ data }) => {
    if (tokenStorage.getGeneration() !== generation) {
      throw new Error('A sessão mudou enquanto a renovação estava em andamento.');
    }

    const refreshedUserId = getTokenSubject(data.accessToken);
    if (!refreshedUserId || (expectedUserId && expectedUserId !== refreshedUserId)) {
      throw new Error('A sessão desta aba não corresponde à conta autenticada no navegador.');
    }

    tokenStorage.setTokens(data);
    return data;
  }).finally(() => {
    if (refreshRequest === request) refreshRequest = null;
  });

  return request;
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isAuthEndpoint = original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/register') ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/logout') ||
      original?.url?.includes('/auth/verify-otp');

    if (status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retry = true;
    let request;
    try {
      if (!refreshRequest || refreshRequest.generation !== tokenStorage.getGeneration()) {
        refreshRequest = createRefreshRequest();
      }
      request = refreshRequest;
      const data = await request.promise;
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshErr) {
      if (request && tokenStorage.getGeneration() === request.generation) {
        tokenStorage.clear();
        emitAuthUnauthorized();
      }
      return Promise.reject(refreshErr);
    }
  }
);

import { api } from './api';
import { tokenStorage } from './tokenStorage';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

const persistAuthData = (data = {}) => {
  tokenStorage.setTokens(data);
  if (data.user) tokenStorage.setUser(data.user);
  return data;
};

const parseGoogleUser = (rawUser) => {
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    try {
      const base64 = rawUser.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
};

export const registerUser = async (payload) => {
  try {
    const { data } = await api.post('/auth/register', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Erro ao criar conta. Tente novamente.'));
  }
};

export const verifyOtp = async ({ email, code }) => {
  try {
    const { data } = await api.post('/auth/verify-otp', { email, code });
    tokenStorage.setTokens(data);
    if (data.user) tokenStorage.setUser(data.user);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Código inválido ou expirado.'));
  }
};

export const resendOtp = async (email) => {
  try {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível reenviar o código.'));
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStorage.setTokens(data);
    tokenStorage.setUser(data.user);
    return data;
  } catch (error) {
    const err = new Error(extractMessage(error, 'Credenciais inválidas.'));
    err.code = error?.response?.data?.error;
    throw err;
  }
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  tokenStorage.setUser(data.user);
  return data.user;
};

export const getGoogleLoginUrl = (redirectPath = '/login') => {
  const redirectTo = `${window.location.origin}${redirectPath}`;
  const configuredUrl = import.meta.env.VITE_GOOGLE_AUTH_URL;
  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl);
      url.searchParams.set('redirectTo', redirectTo);
      return url.toString();
    } catch {
      return configuredUrl;
    }
  }

  const url = new URL('/auth/google', apiBaseURL);
  url.searchParams.set('redirectTo', redirectTo);
  return url.toString();
};

export const completeGoogleLogin = async (search, redirectPath = '/login') => {
  const params = new URLSearchParams(search);
  const error = params.get('error') || params.get('error_description');
  if (error) {
    throw new Error(error);
  }

  const accessToken = params.get('accessToken') || params.get('access_token') || params.get('token');
  const refreshToken = params.get('refreshToken') || params.get('refresh_token');

  if (accessToken || refreshToken) {
    const data = {
      accessToken,
      refreshToken,
      user: parseGoogleUser(params.get('user')),
    };

    persistAuthData(data);
    if (!data.user) {
      data.user = await getMe();
    }

    return data;
  }

  const code = params.get('code');
  if (!code) return null;

  try {
    const response = await api.post('/auth/google/callback', {
      code,
      redirectTo: `${window.location.origin}${redirectPath}`,
    });
    const data = persistAuthData(response.data);
    if (!data.user) {
      data.user = await getMe();
    }

    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível entrar com Google.'));
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  } finally {
    tokenStorage.clear();
  }
};

export const forgotPassword = async (email) => {
  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível enviar o código.'));
  }
};

export const resetPassword = async ({ email, code, newPassword }) => {
  try {
    const { data } = await api.post('/auth/reset-password', { email, code, newPassword });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível redefinir a senha.'));
  }
};

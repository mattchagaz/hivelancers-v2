import { api } from './api';
import { tokenStorage } from './tokenStorage';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
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

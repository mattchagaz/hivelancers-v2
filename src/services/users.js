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

export const updateProfile = async (payload) => {
  try {
    const { data } = await api.patch('/users/me', payload);
    tokenStorage.setUser(data.user);
    return data.user;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível atualizar o perfil.'));
  }
};

export const updateUserType = async (userType) => {
  try {
    const { data } = await api.patch('/users/me/type', { userType });
    tokenStorage.setUser(data.user);
    return data.user;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível atualizar o tipo de conta.'));
  }
};

export const completeOnboarding = async () => {
  try {
    const { data } = await api.post('/users/me/complete-onboarding');
    tokenStorage.setUser(data.user);
    return data.user;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível concluir o onboarding.'));
  }
};

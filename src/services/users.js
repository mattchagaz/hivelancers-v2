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

export const updateMySettings = async (payload) => {
  try {
    const { data } = await api.patch('/users/me/settings', payload);
    tokenStorage.setUser(data.user);
    return data.user;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível salvar as configurações.'));
  }
};

export const exportMyData = async () => {
  try {
    const response = await api.get('/users/me/privacy-export', { responseType: 'blob' });
    const objectUrl = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `hivelancers-dados-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível exportar seus dados.'));
  }
};

export const deleteMyAccount = async ({ email, confirmation }) => {
  try {
    const { data } = await api.delete('/users/me', {
      data: { email, confirmation },
    });
    tokenStorage.clear();
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível excluir sua conta.'));
  }
};

export const getMyProfileCustomization = async () => {
  try {
    const { data } = await api.get('/users/me/profile-customization');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar a personalização do perfil.'));
  }
};

export const saveMyProfileCustomization = async (payload) => {
  try {
    const { data } = await api.put('/users/me/profile-customization', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível salvar a vitrine do perfil.'));
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

export const getMyAccountVerification = async () => {
  try {
    const { data } = await api.get('/users/me/account-verification');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar sua verificação.'));
  }
};

export const submitMyAccountVerification = async (payload) => {
  try {
    const { data } = await api.put('/users/me/account-verification', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível enviar sua verificação.'));
  }
};

const accessVerificationDocument = async (url, { download = false } = {}) => {
  const response = await api.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.target = download ? '_self' : '_blank';
  link.rel = 'noreferrer';
  if (download) link.download = 'documento-verificacao';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
};

export const uploadVerificationDocument = async (kind, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/users/me/account-verification/documents/${kind}`, formData);
    return data.document;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível enviar o documento.'));
  }
};

export const openMyVerificationDocument = async (kind, options) => {
  try {
    await accessVerificationDocument(`/users/me/account-verification/documents/${kind}`, options);
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível abrir o documento.'));
  }
};

export const openAdminVerificationDocument = async (userId, kind, options) => {
  try {
    await accessVerificationDocument(`/users/admin/${userId}/account-verification/documents/${kind}`, options);
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível abrir o documento.'));
  }
};

export const getPublicProfile = async (handle) => {
  try {
    const { data } = await api.get(`/users/${handle}`);
    return data.user;
  } catch (error) {
    throw new Error(extractMessage(error, 'Perfil não encontrado.'));
  }
};

export const getPublicProject = async (handle, projectId) => {
  try {
    const { data } = await api.get(`/users/${handle}/projects/${projectId}`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Projeto não encontrado.'));
  }
};

export const getMyFavorites = async () => {
  try {
    const { data } = await api.get('/users/me/favorites');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar seus favoritos.'));
  }
};

export const addFavoriteService = async (serviceId) => {
  try {
    const { data } = await api.post(`/users/me/favorites/services/${serviceId}`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível favoritar o serviço.'));
  }
};

export const removeFavoriteService = async (serviceId) => {
  try {
    const { data } = await api.delete(`/users/me/favorites/services/${serviceId}`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível remover o serviço dos favoritos.'));
  }
};

export const addFavoriteFreelancer = async (freelancerId) => {
  try {
    const { data } = await api.post(`/users/me/favorites/freelancers/${freelancerId}`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível favoritar o freelancer.'));
  }
};

export const removeFavoriteFreelancer = async (freelancerId) => {
  try {
    const { data } = await api.delete(`/users/me/favorites/freelancers/${freelancerId}`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível remover o freelancer dos favoritos.'));
  }
};

export const trackProfileLinkClick = async (handle, linkKey) => {
  try {
    const { data } = await api.post(`/users/${handle}/links/${linkKey}/click`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível registrar o clique no link.'));
  }
};

export const trackProjectExternalClick = async (handle, projectId) => {
  try {
    const { data } = await api.post(`/users/${handle}/projects/${projectId}/click`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível registrar o clique no projeto.'));
  }
};

export const listAdminUsers = async (params = {}) => {
  try {
    const { data } = await api.get('/users/admin', { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar usuários.'));
  }
};

export const updateAdminUser = async (id, payload) => {
  try {
    const { data } = await api.patch(`/users/admin/${id}`, payload);
    return data.user;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível atualizar o usuário.'));
  }
};

export const reviewAdminAccountVerification = async (id, payload) => {
  try {
    const { data } = await api.patch(`/users/admin/${id}/account-verification`, payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível revisar a verificação.'));
  }
};

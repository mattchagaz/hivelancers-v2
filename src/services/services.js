import { api } from './api';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

export const listCategories = async () => {
  try {
    const { data } = await api.get('/categories');
    return data.categories;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar categorias.'));
  }
};

export const listAdminCategories = async () => {
  try {
    const { data } = await api.get('/categories/admin');
    return data.categories;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar a taxonomia.'));
  }
};

export const createCategory = async (payload) => {
  try {
    const { data } = await api.post('/categories/admin', payload);
    return data.category;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível criar a categoria.'));
  }
};

export const updateCategory = async (id, payload) => {
  try {
    const { data } = await api.patch(`/categories/admin/${id}`, payload);
    return data.category;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível salvar a categoria.'));
  }
};

export const deleteCategory = async (id) => {
  try {
    await api.delete(`/categories/admin/${id}`);
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível excluir a categoria.'));
  }
};

export const listPublicServices = async (params = {}) => {
  try {
    const { data } = await api.get('/services', { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar serviços.'));
  }
};

export const getPublicService = async (id) => {
  try {
    const { data } = await api.get(`/services/${id}`);
    return data.service;
  } catch (error) {
    throw new Error(extractMessage(error, 'Serviço não encontrado.'));
  }
};

export const listMyServices = async () => {
  try {
    const { data } = await api.get('/services/mine');
    return data.items;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar seus serviços.'));
  }
};

export const getMyService = async (id) => {
  try {
    const { data } = await api.get(`/services/mine/${id}`);
    return data.service;
  } catch (error) {
    throw new Error(extractMessage(error, 'Serviço não encontrado.'));
  }
};

export const createService = async (payload) => {
  try {
    const { data } = await api.post('/services', payload);
    return data.service;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível publicar o serviço.'));
  }
};

export const updateService = async (id, payload) => {
  try {
    const { data } = await api.patch(`/services/${id}`, payload);
    return data.service;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível atualizar o serviço.'));
  }
};

export const archiveService = async (id) => {
  try {
    const { data } = await api.delete(`/services/${id}`);
    return data.service;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível arquivar o serviço.'));
  }
};

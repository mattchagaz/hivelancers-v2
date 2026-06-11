import { api } from './api';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

export const listAdminCoupons = async (params = {}) => {
  try {
    const { data } = await api.get('/admin/coupons', { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar cupons.'));
  }
};

export const createAdminCoupon = async (payload) => {
  try {
    const { data } = await api.post('/admin/coupons', payload);
    return data.coupon;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível criar o cupom.'));
  }
};

export const updateAdminCoupon = async (id, payload) => {
  try {
    const { data } = await api.patch(`/admin/coupons/${id}`, payload);
    return data.coupon;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível salvar o cupom.'));
  }
};

export const deleteAdminCoupon = async (id) => {
  try {
    await api.delete(`/admin/coupons/${id}`);
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível excluir o cupom.'));
  }
};

export const listRewardLevels = async (params = {}) => {
  try {
    const { data } = await api.get('/admin/reward-levels', { params });
    return data.levels;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar níveis.'));
  }
};

export const createRewardLevel = async (payload) => {
  try {
    const { data } = await api.post('/admin/reward-levels', payload);
    return data.level;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível criar o nível.'));
  }
};

export const updateRewardLevel = async (id, payload) => {
  try {
    const { data } = await api.patch(`/admin/reward-levels/${id}`, payload);
    return data.level;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível salvar o nível.'));
  }
};

export const deleteRewardLevel = async (id) => {
  try {
    await api.delete(`/admin/reward-levels/${id}`);
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível excluir o nível.'));
  }
};

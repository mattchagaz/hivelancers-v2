import { api } from './api';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

export const listOrders = async (params = {}) => {
  try {
    const { data } = await api.get('/orders', { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel carregar os pedidos.'));
  }
};

export const getOrder = async (id) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data.order;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel carregar o pedido.'));
  }
};

export const createOrder = async (payload) => {
  try {
    const { data } = await api.post('/orders', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel criar o pedido.'));
  }
};

export const acceptOrder = async (id, payload = {}) => {
  try {
    const { data } = await api.post(`/orders/${id}/accept`, payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel aceitar o pedido.'));
  }
};

export const rejectOrder = async (id, payload = {}) => {
  try {
    const { data } = await api.post(`/orders/${id}/reject`, payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel recusar o pedido.'));
  }
};

export const deliverOrder = async (id, payload) => {
  try {
    const { data } = await api.post(`/orders/${id}/deliver`, payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel registrar a entrega.'));
  }
};

export const requestOrderRevision = async (id, payload) => {
  try {
    const { data } = await api.post(`/orders/${id}/request-revision`, payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel pedir revisao.'));
  }
};

export const approveOrder = async (id, payload = {}) => {
  try {
    const { data } = await api.post(`/orders/${id}/approve`, payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel aprovar o pedido.'));
  }
};

export const reviewOrder = async (id, payload) => {
  try {
    const { data } = await api.post(`/orders/${id}/review`, payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Nao foi possivel enviar a avaliacao.'));
  }
};

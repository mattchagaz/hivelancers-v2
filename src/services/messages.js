import { api } from './api';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

export const listConversations = async () => {
  try {
    const { data } = await api.get('/conversations');
    return data.conversations;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar conversas.'));
  }
};

export const getConversation = async (id) => {
  try {
    const { data } = await api.get(`/conversations/${id}`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar a conversa.'));
  }
};

export const getMessages = async (conversationId, params = {}) => {
  try {
    const { data } = await api.get(`/conversations/${conversationId}/messages`, { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar mensagens.'));
  }
};

export const sendMessage = async (conversationId, payload) => {
  try {
    const { data } = await api.post(`/conversations/${conversationId}/messages`, payload);
    return data.message;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível enviar a mensagem.'));
  }
};

export const startConversation = async (recipientId, message) => {
  try {
    const { data } = await api.post('/conversations', { recipientId, message });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível iniciar a conversa.'));
  }
};

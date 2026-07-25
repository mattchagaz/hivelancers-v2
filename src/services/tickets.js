import { api } from './api';

export const SUPPORT_TICKET_STATUS_LABEL = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em análise',
  ANSWERED: 'Respondido',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

export const normalizeSupportTicketStatus = (status) => (
  status === 'WAITING_CUSTOMER' ? 'ANSWERED' : (status || 'OPEN')
);

export const SUPPORT_TICKET_PRIORITY_LABEL = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const SUPPORT_TICKET_CATEGORY_LABEL = {
  ACCOUNT: 'Conta e acesso',
  PAYMENTS: 'Pagamentos',
  ORDERS: 'Pedidos',
  MESSAGES: 'Mensagens',
  MARKETPLACE: 'Serviços e marketplace',
  SAFETY: 'Segurança',
  OTHER: 'Outro assunto',
};

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

const normalizeList = (data) => {
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (Array.isArray(data?.items)) return data;
  if (Array.isArray(data?.tickets)) {
    return { ...data, items: data.tickets, total: data.total ?? data.tickets.length };
  }
  return { items: [], total: 0 };
};

export const createSupportTicket = async (payload) => {
  try {
    const { data } = await api.post('/support/tickets', payload);
    return data.ticket || data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível abrir o ticket.'));
  }
};

export const listMySupportTickets = async (params = {}) => {
  try {
    const { data } = await api.get('/support/tickets', { params });
    return normalizeList(data);
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar seus tickets.'));
  }
};

export const getSupportTicket = async (id) => {
  try {
    const { data } = await api.get(`/support/tickets/${id}`);
    return data.ticket || data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar o ticket.'));
  }
};

export const listAdminSupportTickets = async (params = {}) => {
  try {
    const { data } = await api.get('/admin/support-tickets', { params });
    return normalizeList(data);
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar tickets de suporte.'));
  }
};

export const updateAdminSupportTicket = async (id, payload) => {
  try {
    const { data } = await api.patch(`/admin/support-tickets/${id}`, payload);
    return data.ticket || data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível atualizar o ticket.'));
  }
};

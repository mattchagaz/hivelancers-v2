import { api } from './api';

const LOCAL_TICKETS_KEY = 'hv_support_tickets';

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

const canUseLocalFallback = (error) => {
  const status = error?.response?.status;
  return !status || status === 404 || status === 501 || status === 503;
};

const readLocalTickets = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_TICKETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalTickets = (tickets) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_TICKETS_KEY, JSON.stringify(tickets));
  window.dispatchEvent(new CustomEvent('support:tickets:changed'));
};

const getUserName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
  user?.name ||
  user?.username ||
  user?.email ||
  'Usuário Hivelancers';

const getRequester = (user) => ({
  id: user?.id || user?._id || user?.email || 'local-user',
  name: getUserName(user),
  email: user?.email || '',
  userType: user?.userType || '',
});

const normalizeList = (data) => {
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (Array.isArray(data?.items)) return data;
  if (Array.isArray(data?.tickets)) {
    return {
      items: data.tickets,
      total: data.total ?? data.tickets.length,
      summary: data.summary,
    };
  }
  return { items: [], total: 0 };
};

const matchesSearch = (ticket, query) => {
  if (!query) return true;
  const haystack = [
    ticket.code,
    ticket.subject,
    ticket.description,
    ticket.publicReply,
    ticket.attachment?.name,
    ticket.requester?.name,
    ticket.requester?.email,
    SUPPORT_TICKET_CATEGORY_LABEL[ticket.category],
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
};

const filterTickets = (tickets, params = {}, user) => {
  const requester = user ? getRequester(user) : null;
  return tickets
    .filter((ticket) => {
      if (requester && ticket.requester?.id !== requester.id && ticket.requester?.email !== requester.email) {
        return false;
      }
      if (params.status && params.status !== 'all' && normalizeSupportTicketStatus(ticket.status) !== params.status) return false;
      if (params.priority && params.priority !== 'all' && ticket.priority !== params.priority) return false;
      if (params.category && params.category !== 'all' && ticket.category !== params.category) return false;
      return matchesSearch(ticket, params.q);
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
};

const createLocalTicket = (payload, user) => {
  const now = new Date().toISOString();
  const ticket = {
    id: `local_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    code: `SUP-${String(Date.now()).slice(-6)}`,
    subject: payload.subject,
    description: payload.description,
    category: payload.category || 'OTHER',
    priority: payload.priority || 'NORMAL',
    status: 'OPEN',
    relatedOrderId: payload.relatedOrderId || '',
    contactPreference: payload.contactPreference || 'EMAIL',
    attachment: payload.attachment || null,
    requester: getRequester(user),
    publicReply: '',
    adminNote: '',
    createdAt: now,
    updatedAt: now,
    source: 'local-fallback',
  };

  writeLocalTickets([ticket, ...readLocalTickets()]);
  return ticket;
};

export const createSupportTicket = async (payload, user) => {
  try {
    const { data } = await api.post('/support/tickets', payload);
    return data.ticket || data;
  } catch (error) {
    if (canUseLocalFallback(error)) return createLocalTicket(payload, user);
    throw new Error(extractMessage(error, 'Não foi possível abrir o ticket.'));
  }
};

export const listMySupportTickets = async (params = {}, user) => {
  try {
    const { data } = await api.get('/support/tickets', { params });
    return normalizeList(data);
  } catch (error) {
    if (canUseLocalFallback(error)) {
      const items = filterTickets(readLocalTickets(), params, user);
      return { items, total: items.length };
    }
    throw new Error(extractMessage(error, 'Não foi possível carregar seus tickets.'));
  }
};

export const getSupportTicket = async (id, user) => {
  try {
    const { data } = await api.get(`/support/tickets/${id}`);
    return data.ticket || data;
  } catch (error) {
    if (canUseLocalFallback(error)) {
      const requester = user ? getRequester(user) : null;
      const ticket = readLocalTickets().find((item) => item.id === id || item.code === id);
      const ownsTicket = !requester ||
        ticket?.requester?.id === requester.id ||
        ticket?.requester?.email === requester.email;
      if (ticket && ownsTicket) return ticket;
    }
    throw new Error(extractMessage(error, 'Não foi possível carregar o ticket.'));
  }
};

export const listAdminSupportTickets = async (params = {}) => {
  try {
    const { data } = await api.get('/admin/support-tickets', { params });
    return normalizeList(data);
  } catch (error) {
    if (canUseLocalFallback(error)) {
      const items = filterTickets(readLocalTickets(), params);
      return {
        items,
        total: items.length,
        summary: items.reduce((acc, ticket) => {
          const status = normalizeSupportTicketStatus(ticket.status);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
      };
    }
    throw new Error(extractMessage(error, 'Não foi possível carregar tickets de suporte.'));
  }
};

export const updateAdminSupportTicket = async (id, payload) => {
  try {
    const { data } = await api.patch(`/admin/support-tickets/${id}`, payload);
    return data.ticket || data;
  } catch (error) {
    if (canUseLocalFallback(error)) {
      const now = new Date().toISOString();
      const tickets = readLocalTickets();
      const updated = tickets.map((ticket) =>
        ticket.id === id
          ? { ...ticket, ...payload, updatedAt: now, resolvedAt: payload.status === 'RESOLVED' ? now : ticket.resolvedAt }
          : ticket
      );
      writeLocalTickets(updated);
      const ticket = updated.find((item) => item.id === id);
      if (ticket) return ticket;
    }
    throw new Error(extractMessage(error, 'Não foi possível atualizar o ticket.'));
  }
};

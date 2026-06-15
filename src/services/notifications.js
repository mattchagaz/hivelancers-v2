import { listConversations } from './messages';
import { listOrders } from './orders';
import { getMyAccountVerification } from './users';

const HISTORY_LIMIT = 220;

const toId = (value) => (value === undefined || value === null ? '' : String(value));

const getPersonName = (person) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.username || 'Usuário';

const getOtherParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find((participant) => toId(participant.id) !== toId(currentUserId)) ||
  conversation?.otherUser;

const safeDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

const sortNotifications = (items) =>
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export const getNotificationStorageKeys = (userId) => ({
  read: userId ? `hivelancers:notification-read:${userId}` : '',
  cleared: userId ? `hivelancers:notification-cleared:${userId}` : '',
  history: userId ? `hivelancers:notification-history:${userId}` : '',
});

export const readStoredNotificationIds = (key) => {
  if (!key || !canUseStorage()) return [];

  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const writeStoredNotificationIds = (key, ids, limit = 180) => {
  if (!key || !canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify([...new Set(ids)].slice(-limit)));
};

export const getStoredNotificationHistory = (userId) => {
  const { history } = getNotificationStorageKeys(userId);
  if (!history || !canUseStorage()) return [];

  try {
    const value = JSON.parse(localStorage.getItem(history) || '[]');
    return Array.isArray(value) ? sortNotifications(value) : [];
  } catch {
    return [];
  }
};

export const mergeNotificationHistory = (userId, notifications) => {
  if (!userId || !canUseStorage()) return sortNotifications([...notifications]);

  const { history } = getNotificationStorageKeys(userId);
  const stored = getStoredNotificationHistory(userId);
  const byId = new Map();

  [...stored, ...notifications].forEach((item) => {
    if (!item?.id) return;
    byId.set(item.id, {
      ...byId.get(item.id),
      ...item,
    });
  });

  const next = sortNotifications(Array.from(byId.values())).slice(0, HISTORY_LIMIT);
  localStorage.setItem(history, JSON.stringify(next));
  return next;
};

export const getOrderNotification = (order, userId) => {
  if (!order?.id) return null;

  const isSeller = toId(order.freelancerId) === toId(userId);
  const isBuyer = toId(order.clientId) === toId(userId);
  const other = isSeller ? order.client : order.freelancer;
  const serviceTitle = order.service?.title || order.planTitle || 'Pedido';
  const createdAt = safeDate(order.updatedAt || order.createdAt) || new Date().toISOString();
  const base = {
    id: `order:${order.id}:${order.status}:${createdAt}`,
    type: 'order',
    to: `/orders?id=${order.id}`,
    createdAt,
    actor: getPersonName(other),
  };

  if (order.status === 'PENDING') {
    return {
      ...base,
      tone: 'amber',
      title: isSeller ? 'Novo pedido aguardando resposta' : 'Pedido enviado ao freelancer',
      description: isSeller
        ? `${getPersonName(other)} contratou ${serviceTitle}.`
        : `${serviceTitle} aguarda confirmação do freelancer.`,
    };
  }

  if (order.status === 'IN_PROGRESS') {
    return {
      ...base,
      tone: 'blue',
      title: 'Pedido em execução',
      description: isBuyer
        ? `${serviceTitle} foi aceito e entrou em produção.`
        : `${serviceTitle} está na sua fila de execução.`,
    };
  }

  if (order.status === 'DELIVERED') {
    return {
      ...base,
      tone: 'purple',
      title: isBuyer ? 'Entrega aguardando revisão' : 'Entrega enviada ao cliente',
      description: isBuyer
        ? `Revise a entrega de ${serviceTitle}.`
        : `${serviceTitle} está aguardando aprovação.`,
    };
  }

  if (order.status === 'COMPLETED') {
    return {
      ...base,
      tone: 'green',
      title: 'Pedido concluído',
      description: `${serviceTitle} foi finalizado com aprovação formal.`,
    };
  }

  if (order.status === 'REJECTED' || order.status === 'CANCELED') {
    return {
      ...base,
      tone: 'red',
      title: order.status === 'REJECTED' ? 'Pedido recusado' : 'Pedido cancelado',
      description: `${serviceTitle} saiu do acompanhamento ativo.`,
    };
  }

  return null;
};

export const getConversationNotification = (conversation, userId) => {
  const unreadCount = Number(conversation?.unreadCount || 0);
  if (!conversation?.id || unreadCount <= 0) return null;

  const other = getOtherParticipant(conversation, userId);
  const lastMessage = conversation.lastMessage;
  const preview = lastMessage?.content || (lastMessage?.imageUrl ? 'Enviou uma imagem.' : 'Nova mensagem recebida.');
  const createdAt = safeDate(lastMessage?.createdAt || conversation.updatedAt) || new Date().toISOString();

  return {
    id: `conversation:${conversation.id}:${lastMessage?.id || createdAt}`,
    type: 'message',
    tone: 'blue',
    title: `${unreadCount} ${unreadCount === 1 ? 'mensagem nova' : 'mensagens novas'}`,
    description: `${getPersonName(other)}: ${preview}`,
    actor: getPersonName(other),
    createdAt,
    to: `/messages?chat=${conversation.id}`,
  };
};

export const getVerificationNotification = (verificationState) => {
  const status = verificationState?.status || verificationState?.verification?.status;
  const verification = verificationState?.verification;
  if (!verification || !['PENDING', 'VERIFIED', 'REJECTED'].includes(status)) return null;

  const eventDate =
    safeDate(status === 'PENDING' ? verification.submittedAt : verification.reviewedAt) ||
    safeDate(verification.updatedAt) ||
    safeDate(verification.submittedAt) ||
    new Date().toISOString();

  const base = {
    id: `verification:${status}:${eventDate}`,
    type: 'verification',
    to: '/verification',
    createdAt: eventDate,
    actor: 'Hivelancers',
  };

  if (status === 'PENDING') {
    return {
      ...base,
      tone: 'amber',
      title: 'Verificação em análise',
      description: 'Recebemos seus dados e documentos. Nossa equipe vai revisar tudo com cuidado.',
    };
  }

  if (status === 'VERIFIED') {
    return {
      ...base,
      tone: 'green',
      title: 'Conta verificada',
      description: 'Sua identidade foi aprovada. Recursos sensíveis e benefícios ficam mais protegidos.',
    };
  }

  return {
    ...base,
    tone: 'red',
    title: 'Verificação recusada',
    description: verification.reviewNote || 'Revise os documentos e envie novamente para análise.',
  };
};

export const loadNotificationFeed = async (user) => {
  if (!user?.id) return { live: [], history: [] };

  const [ordersResult, conversationsResult, verificationResult] = await Promise.allSettled([
    listOrders({ role: 'all' }),
    listConversations(),
    getMyAccountVerification(),
  ]);

  const orderItems = ordersResult.status === 'fulfilled' ? ordersResult.value?.items || [] : [];
  const conversationItems = conversationsResult.status === 'fulfilled' ? conversationsResult.value || [] : [];
  const verificationState = verificationResult.status === 'fulfilled' ? verificationResult.value : null;

  const live = sortNotifications([
    ...orderItems.map((order) => getOrderNotification(order, user.id)).filter(Boolean),
    ...conversationItems.map((conversation) => getConversationNotification(conversation, user.id)).filter(Boolean),
    getVerificationNotification(verificationState),
  ].filter(Boolean));

  return {
    live,
    history: mergeNotificationHistory(user.id, live),
  };
};

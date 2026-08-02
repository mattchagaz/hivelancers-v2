// Constantes e helpers puros do dashboard.
// Extraídos de Dashboard.jsx para reduzir o tamanho do componente — sem mudança de comportamento.

export const SERVICE_STATUS_LABEL = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

export const ORDER_STATUS_LABEL = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em execução',
  DELIVERED: 'Entregue',
  COMPLETED: 'Concluído',
  REJECTED: 'Recusado',
  CANCELED: 'Cancelado',
};

export const ORDER_STAGES = [
  { key: 'PENDING', label: 'Entrada' },
  { key: 'IN_PROGRESS', label: 'Execução' },
  { key: 'DELIVERED', label: 'Entrega' },
  { key: 'COMPLETED', label: 'Aprovação' },
];

export const ACTIVE_ORDER_STATUSES = ['PENDING', 'IN_PROGRESS', 'DELIVERED'];

export const formatPriceBRL = (cents = 0) =>
  (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatRelativeTime = (value) => {
  if (!value) return 'Sem atualização';
  const date = new Date(value);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export const getFullName = (person) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.username || 'Usuário';

export const getInitials = (person) =>
  getFullName(person)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();

export const getOrderTitle = (order) => order.service?.title || order.planTitle || 'Pedido sem título';

export const getOrderPerson = (order, mode) =>
  mode === 'seller' ? getFullName(order.client) : getFullName(order.freelancer);

export const getConversationPeer = (conversation, userId) => {
  if (conversation.otherUser) return conversation.otherUser;
  const participants = conversation.participants?.map((item) => item.user || item) || [];
  return participants.find((item) => item.id !== userId);
};

export const getStageState = (orderStatus, stageKey) => {
  if (orderStatus === 'REJECTED' || orderStatus === 'CANCELED') {
    return stageKey === 'PENDING' ? 'done' : 'idle';
  }

  const currentIndex = ORDER_STAGES.findIndex((stage) => stage.key === orderStatus);
  const stageIndex = ORDER_STAGES.findIndex((stage) => stage.key === stageKey);

  if (currentIndex === -1) return 'idle';
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  return 'idle';
};

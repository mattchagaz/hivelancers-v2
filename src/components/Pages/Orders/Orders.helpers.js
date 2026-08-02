// Helpers puros e constantes da página de pedidos.
// Extraídos de Orders.jsx para reduzir o tamanho do componente — sem mudança de comportamento.

export const ROLE_LABEL = {
  all: 'Todos',
  buyer: 'Como cliente',
  seller: 'Como freelancer',
};

export const STATUS_LABEL = {
  PENDING: 'Aguardando resposta',
  IN_PROGRESS: 'Em andamento',
  DELIVERED: 'Entregue',
  DISPUTED: 'Em disputa',
  COMPLETED: 'Concluído',
  REJECTED: 'Recusado',
  CANCELED: 'Cancelado',
};

export const EVENT_LABEL = {
  CREATED: 'Pedido criado',
  ACCEPTED: 'Pedido aceito',
  REJECTED: 'Pedido recusado',
  DELIVERED: 'Entrega enviada',
  REVISION_REQUESTED: 'Revisão solicitada',
  COMPLETED: 'Pedido aprovado',
  CANCELED: 'Pedido cancelado',
  DISPUTE_OPENED: 'Disputa aberta',
  DISPUTE_RESOLVED: 'Disputa resolvida',
};

export const DISPUTE_REASON_LABEL = {
  CANCELLATION_REQUESTED: 'Cancelamento solicitado',
  SCOPE_MISMATCH: 'Escopo diferente do combinado',
  MISSED_DEADLINE: 'Prazo não cumprido',
  DELIVERY_QUALITY: 'Qualidade da entrega',
  COMMUNICATION: 'Problemas de comunicação',
  FRAUD_OR_ABUSE: 'Fraude ou abuso',
  OTHER: 'Outro motivo',
};

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING', label: STATUS_LABEL.PENDING },
  { value: 'IN_PROGRESS', label: STATUS_LABEL.IN_PROGRESS },
  { value: 'DELIVERED', label: STATUS_LABEL.DELIVERED },
  { value: 'DISPUTED', label: STATUS_LABEL.DISPUTED },
  { value: 'COMPLETED', label: STATUS_LABEL.COMPLETED },
  { value: 'REJECTED', label: STATUS_LABEL.REJECTED },
  { value: 'CANCELED', label: STATUS_LABEL.CANCELED },
];

export const ORDER_STAGES = [
  { key: 'PENDING', label: 'Entrada' },
  { key: 'IN_PROGRESS', label: 'Execução' },
  { key: 'DELIVERED', label: 'Entrega' },
  { key: 'COMPLETED', label: 'Aprovação' },
];

export const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);

export const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  if (diffHours < 48) return 'Ontem';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

export const toRoleValue = (userType) => (userType === 'FREELANCER' ? 'seller' : 'buyer');

export const getOrderCounterparty = (order, userId) => {
  if (!order) return null;
  return order.clientId === userId ? order.freelancer : order.client;
};

export const getEventDescription = (event) => {
  if (!event) return '';
  return event.note || EVENT_LABEL[event.type] || event.type;
};

export const getName = (person) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.username || 'Usuário';

export const getInitials = (person) =>
  getName(person)
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

export const getStatusTone = (status) => {
  if (status === 'COMPLETED') return 'Green';
  if (status === 'DELIVERED') return 'Violet';
  if (status === 'IN_PROGRESS') return 'Blue';
  if (status === 'DISPUTED' || status === 'REJECTED' || status === 'CANCELED') return 'Red';
  return 'Amber';
};

export const getOrderStageState = (orderStatus, stageKey) => {
  if (orderStatus === 'REJECTED' || orderStatus === 'CANCELED' || orderStatus === 'DISPUTED') {
    return stageKey === 'PENDING' ? 'Done' : 'Idle';
  }

  if (orderStatus === 'COMPLETED') {
    return 'Done';
  }

  const currentIndex = ORDER_STAGES.findIndex((stage) => stage.key === orderStatus);
  const stageIndex = ORDER_STAGES.findIndex((stage) => stage.key === stageKey);

  if (currentIndex === -1) return 'Idle';
  if (stageIndex < currentIndex) return 'Done';
  if (stageIndex === currentIndex) return 'Current';
  return 'Idle';
};

export const getFlowProgress = (orderStatus) => {
  if (orderStatus === 'COMPLETED') return 100;
  if (orderStatus === 'DELIVERED') return 72;
  if (orderStatus === 'IN_PROGRESS') return 48;
  if (orderStatus === 'DISPUTED') return 48;
  if (orderStatus === 'PENDING') return 18;
  if (orderStatus === 'REJECTED' || orderStatus === 'CANCELED') return 12;
  return 0;
};

export const getCurrentStageLabel = (orderStatus) => {
  if (orderStatus === 'COMPLETED') return 'Aprovação concluída';
  if (orderStatus === 'DELIVERED') return 'Aguardando revisão';
  if (orderStatus === 'IN_PROGRESS') return 'Execução em andamento';
  if (orderStatus === 'PENDING') return 'Aguardando aceite';
  if (orderStatus === 'REJECTED') return 'Pedido recusado';
  if (orderStatus === 'CANCELED') return 'Pedido cancelado';
  if (orderStatus === 'DISPUTED') return 'Análise administrativa';
  return 'Fluxo do pedido';
};

export const getNextActionCopy = (order, userId) => {
  if (!order) return '';

  const seller = order.freelancerId === userId;
  const buyer = order.clientId === userId;

  if (order.status === 'PENDING') {
    return seller
      ? 'Você precisa aceitar ou recusar para iniciar a execução.'
      : 'O pedido foi criado e agora depende da confirmação do freelancer.';
  }

  if (order.status === 'IN_PROGRESS') {
    return seller
      ? 'Centralize a entrega final aqui assim que o material estiver pronto.'
      : 'O projeto está em produção. Use a conversa para alinhar ajustes de rota.';
  }

  if (order.status === 'DELIVERED') {
    return buyer
      ? 'Revise a entrega, aprove se estiver ok ou devolva para revisão.'
      : 'A entrega foi enviada. Agora o cliente revisa e responde.';
  }

  if (order.status === 'COMPLETED') {
    return 'Pedido finalizado com aprovação formal registrada.';
  }

  if (order.status === 'REJECTED') {
    return 'O pedido foi encerrado antes da etapa de execução.';
  }

  if (order.status === 'DISPUTED') {
    return 'As ações financeiras e operacionais estão pausadas até a decisão da equipe Hivelancers.';
  }

  return 'Este pedido saiu do fluxo principal.';
};

export const parseDeliveryAssets = (raw) =>
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, urlPart] = line.includes('|')
        ? line.split('|').map((piece) => piece.trim())
        : ['', line];

      return {
        url: urlPart,
        ...(labelPart ? { label: labelPart } : {}),
      };
    });

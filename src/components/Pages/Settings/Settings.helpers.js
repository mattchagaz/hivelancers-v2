import { formatPhoneBR } from '../../../utils/formatters';

// Constantes e helpers puros da página de configurações.
// Extraídos de Settings.jsx para reduzir o tamanho do componente — sem mudança de comportamento.

export const PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'username',
  'headline',
  'location',
  'locationCity',
  'locationState',
  'locationCountryCode',
  'locationLatitude',
  'locationLongitude',
  'bio',
  'website',
];
export const ACCOUNT_FIELDS = ['phone'];

export const THEME_LABEL = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
};

export const REGION_LABEL = {
  BR: 'Brasil',
};

export const APP_VERSION = '1.0.0';

export const IN_APP_NOTIFICATION_OPTIONS = [
  {
    field: 'orderUpdates',
    title: 'Pedidos e pagamentos',
    description: 'Contratações, prazos, entregas, disputas, reembolsos e repasses.',
  },
  {
    field: 'messages',
    title: 'Mensagens',
    description: 'Quando alguém envia uma mensagem nova no chat.',
  },
  {
    field: 'reviews',
    title: 'Avaliações e revisões',
    description: 'Notas recebidas e solicitações de ajuste em entregas.',
  },
  {
    field: 'supportUpdates',
    title: 'Suporte',
    description: 'Respostas e mudanças de status nos seus tickets.',
  },
  {
    field: 'securityUpdates',
    title: 'Segurança e verificação',
    description: 'Identidade, acesso à conta e alertas administrativos importantes.',
  },
];

export const PUSH_NOTIFICATION_OPTIONS = [
  {
    field: 'pushMessages',
    title: 'Mensagens e Chats',
    description: 'Não deixe o cliente esperando.',
  },
  {
    field: 'pushOrders',
    title: 'Pedidos e Entregas',
    description: 'Mudanças de etapa, prazos, entregas e disputas.',
  },
  {
    field: 'pushPayments',
    title: 'Pagamentos',
    description: 'Confirmações, reembolsos, repasses e falhas financeiras.',
  },
  {
    field: 'pushSupport',
    title: 'Suporte e segurança',
    description: 'Respostas de tickets, verificação e ações que exigem atenção.',
  },
];

export const profileFromUser = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  phone: formatPhoneBR(user?.phone || ''),
  username: user?.username || '',
  headline: user?.headline || '',
  bio: user?.bio || '',
  location: user?.location || '',
  locationCity: user?.locationCity || '',
  locationState: user?.locationState || '',
  locationCountryCode: user?.locationCountryCode || '',
  locationLatitude: user?.locationLatitude ?? null,
  locationLongitude: user?.locationLongitude ?? null,
  website: user?.website || '',
  avatarUrl: user?.avatarUrl || '',
});

export const formatDate = (value) => {
  if (!value) return 'Recentemente';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Recentemente';
  }
};

export const getInitials = (firstName, lastName, fallback = 'U') => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  if (!fullName) return fallback;
  return fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

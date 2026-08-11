import { normalizeSupportTicketStatus } from '../../../services/tickets';

// Helpers puros e constantes do painel administrativo.
// Extraídos de Admin.jsx para reduzir o tamanho do componente — sem mudança de comportamento.

export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export const formatCents = (value) => formatCurrency((Number(value) || 0) / 100);

export const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);

export const pluralize = (value, singular, plural = `${singular}s`) =>
  `${formatNumber(value)} ${Number(value) === 1 ? singular : plural}`;

export const listItems = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  const pools = [...keys, 'items', 'data', 'results'];
  for (const key of pools) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data?.data && typeof data.data === 'object') return listItems(data.data, keys);
  return [];
};

export const listTotal = (data, items = []) =>
  Number(
    data?.total ??
    data?.totalItems ??
    data?.totalCount ??
    data?.count ??
    data?.meta?.total ??
    data?.pagination?.total ??
    data?.data?.total ??
    data?.data?.totalItems ??
    data?.data?.totalCount ??
    items.length
  ) || 0;

export const summaryValue = (summary, key) => {
  const normalizedKey = String(key).toUpperCase();
  const entry = Object.entries(summary || {}).find(([itemKey]) => String(itemKey).toUpperCase() === normalizedKey);
  return Number(entry?.[1] || 0);
};

export const normalizeCode = (value) => String(value || '').toUpperCase();

export const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const emptyCategoryDraft = {
  name: '',
  slug: '',
  icon: 'box',
  position: 0,
  subcategories: [],
};

export const toCategoryDraft = (category) => ({
  name: category?.name || '',
  slug: category?.slug || '',
  icon: category?.iconKey || category?.icon || 'box',
  position: category?.position || 0,
  subcategories: Array.isArray(category?.subcategories)
    ? category.subcategories.map((item) => ({
      name: item.name || '',
      slug: item.slug || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
    }))
    : [],
});

export const parseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

export const USER_TYPE_LABEL = {
  FREELANCER: 'Freelancer',
  CLIENT: 'Cliente',
};

export const ACTIVITY_LABEL = {
  online: 'Online agora',
  active: 'Ativo',
  inactive: 'Inativo',
};

export const IDENTITY_STATUS_LABEL = {
  NOT_STARTED: 'Não iniciada',
  DRAFT: 'Rascunho',
  PENDING: 'Em análise',
  VERIFIED: 'Verificada',
  REJECTED: 'Recusada',
};

export const emptyUserDraft = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  username: '',
  headline: '',
  location: '',
  userType: '',
  isAdmin: false,
  emailVerified: false,
  onboarded: false,
};

export const SERVICE_STATUS_LABEL = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

export const COUPON_STATUS_LABEL = {
  active: 'Ativo',
  inactive: 'Inativo',
  scheduled: 'Agendado',
  expired: 'Expirado',
  limit_reached: 'Limite atingido',
};

export const DISCOUNT_TYPE_LABEL = {
  PERCENTAGE: 'Percentual',
  FIXED_AMOUNT: 'Valor fixo',
};

export const emptyServiceDraft = {
  title: '',
  description: '',
  status: 'DRAFT',
  categoryId: '',
  subcategorySlug: '',
  tags: '',
  coverUrl: '',
};

export const emptyCouponDraft = {
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '10',
  maxDiscountCents: '',
  minSubtotalCents: '',
  usageLimit: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

export const emptyLevelDraft = {
  audience: 'ALL',
  levelNumber: 1,
  name: '',
  slug: '',
  description: '',
  xpRequired: 0,
  badgeColor: '#3e73e6',
  benefits: '',
  position: 0,
  isActive: true,
};

export const toUserName = (user) =>
  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Usuário';

export const toRequesterName = (ticket) =>
  ticket?.requester?.name ||
  toUserName(ticket?.requester) ||
  ticket?.requester?.email ||
  'Usuário Hivelancers';

export const getTicketReference = (ticket) =>
  ticket?.relatedOrderId ||
  ticket?.order?.code ||
  ticket?.service?.title ||
  'Sem vínculo';

export const formatDate = (value) => {
  if (!value) return 'Nunca';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (item) => String(item).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatMoneyInput = (cents) => {
  const value = Number(cents);
  if (!value) return '';
  return (value / 100).toFixed(2);
};

export const parseMoneyInput = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const raw = String(value).trim();
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.round(number * 100));
};

export const toUserDraft = (user) => ({
  email: user?.email || '',
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  phone: user?.phone || '',
  username: user?.username || '',
  headline: user?.headline || '',
  location: user?.location || '',
  userType: user?.userType || '',
  isAdmin: Boolean(user?.isAdmin),
  emailVerified: Boolean(user?.emailVerifiedAt),
  onboarded: Boolean(user?.onboardedAt),
});

export const getIdentityStatus = (user) => user?.accountVerification?.status || (user?.identityVerifiedAt ? 'VERIFIED' : 'NOT_STARTED');

export const maskCpf = (cpf) => {
  if (!cpf) return 'CPF não informado';
  const digits = String(cpf).replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
};

export const toServiceDraft = (service) => ({
  title: service?.title || '',
  description: service?.description || '',
  status: service?.status || 'DRAFT',
  categoryId: service?.category?.id || '',
  subcategorySlug: service?.subcategorySlug || '',
  tags: Array.isArray(service?.tags) ? service.tags.join(', ') : '',
  coverUrl: service?.coverUrl || '',
});

export const toCouponDraft = (coupon) => ({
  code: coupon?.code || '',
  name: coupon?.name || '',
  description: coupon?.description || '',
  discountType: coupon?.discountType || 'PERCENTAGE',
  discountValue: coupon?.discountType === 'FIXED_AMOUNT'
    ? formatMoneyInput(coupon?.discountValue)
    : String(coupon?.discountValue || 10),
  maxDiscountCents: formatMoneyInput(coupon?.maxDiscountCents),
  minSubtotalCents: formatMoneyInput(coupon?.minSubtotalCents),
  usageLimit: coupon?.usageLimit ? String(coupon.usageLimit) : '',
  startsAt: formatDateTimeLocal(coupon?.startsAt),
  endsAt: formatDateTimeLocal(coupon?.endsAt),
  isActive: coupon?.isActive ?? true,
});

export const toLevelDraft = (level) => ({
  audience: level?.audience || 'ALL',
  levelNumber: level?.levelNumber || 1,
  name: level?.name || '',
  slug: level?.slug || '',
  description: level?.description || '',
  xpRequired: level?.xpRequired || 0,
  badgeColor: level?.badgeColor || '#3e73e6',
  benefits: Array.isArray(level?.benefits) ? level.benefits.join('\n') : '',
  position: level?.position || 0,
  isActive: level?.isActive ?? true,
});

export const getStatusTone = (status) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('ativo') || normalized.includes('liberado') || normalized.includes('concluído') || normalized.includes('capturado')) return 'success';
  if (normalized.includes('online') || normalized.includes('verificado') || normalized.includes('verificada') || normalized.includes('admin')) return 'success';
  if (normalized.includes('atenção') || normalized.includes('revisão') || normalized.includes('verificação') || normalized.includes('retido') || normalized.includes('análise') || normalized.includes('rascunho')) return 'warning';
  if (normalized.includes('alto') || normalized.includes('bloqueio') || normalized.includes('atrasado') || normalized.includes('crítico') || normalized.includes('inativo') || normalized.includes('recusada') || normalized.includes('cancelado') || normalized.includes('expirado') || normalized.includes('falhou')) return 'danger';
  return 'neutral';
};

export const getIdentityTone = (status) => {
  if (status === 'VERIFIED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING' || status === 'DRAFT') return 'warning';
  return 'neutral';
};

export const PAYMENT_STATUS_LABEL = {
  CHECKOUT_CREATED: 'Aguardando pagamento',
  PENDING: 'Em processamento',
  SUCCEEDED: 'Pago',
  FAILED: 'Falhou',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
  REFUNDED: 'Reembolsado',
};

export const RELEASE_STATUS_LABEL = {
  HELD: 'Retido',
  NOT_REQUIRED: 'Sem repasse',
  TRANSFERRED: 'Transferido',
  FAILED: 'Falhou',
};

export const DISPUTE_STATUS_LABEL = {
  OPEN: 'Em análise',
  RESOLVED_CLIENT: 'Reembolso ao cliente',
  RESOLVED_FREELANCER: 'Liberação ao freelancer',
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

export const TICKET_STATUS_TONE = {
  OPEN: 'warning',
  IN_PROGRESS: 'success',
  ANSWERED: 'success',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

export const TICKET_PRIORITY_TONE = {
  LOW: 'neutral',
  NORMAL: 'neutral',
  HIGH: 'warning',
  URGENT: 'danger',
};

export const emptyTicketDraft = {
  ticketId: '',
  status: 'OPEN',
  priority: 'NORMAL',
  publicReply: '',
  adminNote: '',
};

export const toTicketDraft = (ticket) => ({
  ticketId: ticket?.id || '',
  status: normalizeSupportTicketStatus(ticket?.status),
  priority: ticket?.priority || 'NORMAL',
  publicReply: ticket?.publicReply || '',
  adminNote: ticket?.adminNote || '',
});

export const emptyAdminOverview = {
  usersTotal: 0,
  clients: 0,
  freelancers: 0,
  activeUsers: 0,
  identityPending: 0,
  servicesTotal: 0,
  servicesPublished: 0,
  servicesDraft: 0,
  servicesArchived: 0,
  ticketsTotal: 0,
  ticketsOpen: 0,
  ticketsInProgress: 0,
  ticketsAnswered: 0,
  ticketsResolved: 0,
  ticketsUnanswered: 0,
  highPriorityUnanswered: 0,
};

export const isTicketUnanswered = (ticket) => {
  const status = normalizeSupportTicketStatus(ticket?.status);
  return !ticket?.publicReply && !['ANSWERED', 'RESOLVED', 'CLOSED'].includes(status);
};

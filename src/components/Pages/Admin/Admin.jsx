import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowTrendUp,
  FaArrowUpRightFromSquare,
  FaBan,
  FaBolt,
  FaCircleCheck,
  FaClock,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaFloppyDisk,
  FaGift,
  FaHeadset,
  FaDownload,
  FaInbox,
  FaLayerGroup,
  FaLifeRing,
  FaMagnifyingGlass,
  FaMedal,
  FaMoneyBillTransfer,
  FaPaperclip,
  FaPlus,
  FaShieldHalved,
  FaTags,
  FaTicket,
  FaTrash,
  FaTriangleExclamation,
  FaUserCheck,
  FaUsers,
  FaXmark,
} from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import { CategoryIcon } from '../../../utils/categoryIcons';
import {
  createCategory,
  deleteCategory,
  deleteAdminService,
  listAdminCategories,
  listAdminServices,
  updateAdminService,
  updateCategory,
} from '../../../services/services';
import {
  createAdminCoupon,
  createRewardLevel,
  deleteAdminCoupon,
  deleteRewardLevel,
  listAdminCoupons,
  listRewardLevels,
  updateAdminCoupon,
  updateRewardLevel,
} from '../../../services/admin';
import {
  listAdminUsers,
  reviewAdminAccountVerification,
  updateAdminUser,
} from '../../../services/users';
import {
  listAdminPayments,
  retryAdminPaymentTransfer,
} from '../../../services/payments';
import {
  listAdminSupportTickets,
  normalizeSupportTicketStatus,
  updateAdminSupportTicket,
  SUPPORT_TICKET_CATEGORY_LABEL,
  SUPPORT_TICKET_PRIORITY_LABEL,
  SUPPORT_TICKET_STATUS_LABEL,
} from '../../../services/tickets';
import styles from './Admin.module.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const formatCents = (value) => formatCurrency((Number(value) || 0) / 100);

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value) || 0);

const pluralize = (value, singular, plural = `${singular}s`) =>
  `${formatNumber(value)} ${Number(value) === 1 ? singular : plural}`;

const listItems = (data, keys = []) => {
  if (Array.isArray(data)) return data;
  const pools = [...keys, 'items', 'data', 'results'];
  for (const key of pools) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data?.data && typeof data.data === 'object') return listItems(data.data, keys);
  return [];
};

const listTotal = (data, items = []) =>
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

const summaryValue = (summary, key) => {
  const normalizedKey = String(key).toUpperCase();
  const entry = Object.entries(summary || {}).find(([itemKey]) => String(itemKey).toUpperCase() === normalizedKey);
  return Number(entry?.[1] || 0);
};

const normalizeCode = (value) => String(value || '').toUpperCase();

const tabs = [
  { id: 'overview', label: 'Visão geral', icon: FaArrowTrendUp },
  { id: 'services', label: 'Serviços', icon: FaLayerGroup },
  { id: 'promotions', label: 'Promoções', icon: FaGift },
  { id: 'levels', label: 'Níveis', icon: FaMedal },
  { id: 'taxonomy', label: 'Taxonomia', icon: FaTags },
  { id: 'users', label: 'Usuários', icon: FaUsers },
  { id: 'finance', label: 'Financeiro', icon: FaFileInvoiceDollar },
  { id: 'support', label: 'Suporte', icon: FaHeadset },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const emptyCategoryDraft = {
  name: '',
  slug: '',
  icon: 'box',
  position: 0,
  subcategories: [],
};

const toCategoryDraft = (category) => ({
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

const parseTags = (value) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const USER_TYPE_LABEL = {
  FREELANCER: 'Freelancer',
  CLIENT: 'Cliente',
};

const ACTIVITY_LABEL = {
  online: 'Online agora',
  active: 'Ativo',
  inactive: 'Inativo',
};

const IDENTITY_STATUS_LABEL = {
  NOT_STARTED: 'Não iniciada',
  DRAFT: 'Rascunho',
  PENDING: 'Em análise',
  VERIFIED: 'Verificada',
  REJECTED: 'Recusada',
};

const emptyUserDraft = {
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

const SERVICE_STATUS_LABEL = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const COUPON_STATUS_LABEL = {
  active: 'Ativo',
  inactive: 'Inativo',
  scheduled: 'Agendado',
  expired: 'Expirado',
  limit_reached: 'Limite atingido',
};

const DISCOUNT_TYPE_LABEL = {
  PERCENTAGE: 'Percentual',
  FIXED_AMOUNT: 'Valor fixo',
};

const emptyServiceDraft = {
  title: '',
  description: '',
  status: 'DRAFT',
  categoryId: '',
  subcategorySlug: '',
  tags: '',
  coverUrl: '',
};

const emptyCouponDraft = {
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

const emptyLevelDraft = {
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

const toUserName = (user) =>
  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Usuário';

const toRequesterName = (ticket) =>
  ticket?.requester?.name ||
  toUserName(ticket?.requester) ||
  ticket?.requester?.email ||
  'Usuário Hivelancers';

const getTicketReference = (ticket) =>
  ticket?.relatedOrderId ||
  ticket?.order?.code ||
  ticket?.service?.title ||
  'Sem vínculo';

const formatDate = (value) => {
  if (!value) return 'Nunca';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (item) => String(item).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatMoneyInput = (cents) => {
  const value = Number(cents);
  if (!value) return '';
  return (value / 100).toFixed(2);
};

const parseMoneyInput = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const raw = String(value).trim();
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.round(number * 100));
};

const toUserDraft = (user) => ({
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

const getIdentityStatus = (user) => user?.accountVerification?.status || (user?.identityVerifiedAt ? 'VERIFIED' : 'NOT_STARTED');

const isPdfUrl = (url = '') => /\.pdf(?:$|\?)/i.test(url);

const getDownloadUrl = (url = '') => {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (url.includes('/upload/fl_attachment/')) return url;
  return url.replace('/upload/', '/upload/fl_attachment/');
};

const maskCpf = (cpf) => {
  if (!cpf) return 'CPF não informado';
  const digits = String(cpf).replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
};

const toServiceDraft = (service) => ({
  title: service?.title || '',
  description: service?.description || '',
  status: service?.status || 'DRAFT',
  categoryId: service?.category?.id || '',
  subcategorySlug: service?.subcategorySlug || '',
  tags: Array.isArray(service?.tags) ? service.tags.join(', ') : '',
  coverUrl: service?.coverUrl || '',
});

const toCouponDraft = (coupon) => ({
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

const toLevelDraft = (level) => ({
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

const getStatusTone = (status) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('ativo') || normalized.includes('liberado') || normalized.includes('concluído') || normalized.includes('capturado')) return 'success';
  if (normalized.includes('online') || normalized.includes('verificado') || normalized.includes('verificada') || normalized.includes('admin')) return 'success';
  if (normalized.includes('atenção') || normalized.includes('revisão') || normalized.includes('verificação') || normalized.includes('retido') || normalized.includes('análise') || normalized.includes('rascunho')) return 'warning';
  if (normalized.includes('alto') || normalized.includes('bloqueio') || normalized.includes('atrasado') || normalized.includes('crítico') || normalized.includes('inativo') || normalized.includes('recusada')) return 'danger';
  return 'neutral';
};

const getIdentityTone = (status) => {
  if (status === 'VERIFIED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING' || status === 'DRAFT') return 'warning';
  return 'neutral';
};

const PAYMENT_STATUS_LABEL = {
  CHECKOUT_CREATED: 'Checkout criado',
  PENDING: 'Pendente',
  SUCCEEDED: 'Pago',
  FAILED: 'Falhou',
  CANCELED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const RELEASE_STATUS_LABEL = {
  HELD: 'Retido',
  NOT_REQUIRED: 'Sem repasse',
  TRANSFERRED: 'Transferido',
  FAILED: 'Falhou',
};

const TICKET_STATUS_TONE = {
  OPEN: 'warning',
  IN_PROGRESS: 'success',
  ANSWERED: 'success',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const TICKET_PRIORITY_TONE = {
  LOW: 'neutral',
  NORMAL: 'neutral',
  HIGH: 'warning',
  URGENT: 'danger',
};

const emptyTicketDraft = {
  ticketId: '',
  status: 'OPEN',
  priority: 'NORMAL',
  publicReply: '',
  adminNote: '',
};

const toTicketDraft = (ticket) => ({
  ticketId: ticket?.id || '',
  status: normalizeSupportTicketStatus(ticket?.status),
  priority: ticket?.priority || 'NORMAL',
  publicReply: ticket?.publicReply || '',
  adminNote: ticket?.adminNote || '',
});

const emptyAdminOverview = {
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

const isTicketUnanswered = (ticket) => {
  const status = normalizeSupportTicketStatus(ticket?.status);
  return !ticket?.publicReply && !['ANSWERED', 'RESOLVED', 'CLOSED'].includes(status);
};

function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categorySaving, setCategorySaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryDraft, setCategoryDraft] = useState(emptyCategoryDraft);
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [identityModalUserId, setIdentityModalUserId] = useState('');
  const [identityRejecting, setIdentityRejecting] = useState(false);
  const [identityReviewNote, setIdentityReviewNote] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userDraft, setUserDraft] = useState(emptyUserDraft);
  const [adminPayments, setAdminPayments] = useState([]);
  const [adminFinanceSummary, setAdminFinanceSummary] = useState(null);
  const [adminPaymentsTotal, setAdminPaymentsTotal] = useState(0);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [releaseStatusFilter, setReleaseStatusFilter] = useState('');
  const [retryingPaymentId, setRetryingPaymentId] = useState('');
  const [adminServices, setAdminServices] = useState([]);
  const [adminServicesTotal, setAdminServicesTotal] = useState(0);
  const [adminServicesSummary, setAdminServicesSummary] = useState({});
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceStatusFilter, setServiceStatusFilter] = useState('all');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceDraft, setServiceDraft] = useState(emptyServiceDraft);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponsSummary, setCouponsSummary] = useState({});
  const [couponsTotal, setCouponsTotal] = useState(0);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponStatusFilter, setCouponStatusFilter] = useState('all');
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [couponDraft, setCouponDraft] = useState(emptyCouponDraft);
  const [couponSaving, setCouponSaving] = useState(false);
  const [freelancerLevels, setFreelancerLevels] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [levelDraft, setLevelDraft] = useState(emptyLevelDraft);
  const [levelSaving, setLevelSaving] = useState(false);
  const [adminTickets, setAdminTickets] = useState([]);
  const [adminTicketsTotal, setAdminTicketsTotal] = useState(0);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [ticketDraft, setTicketDraft] = useState(emptyTicketDraft);
  const [ticketSaving, setTicketSaving] = useState(false);
  const [adminOverview, setAdminOverview] = useState(emptyAdminOverview);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await listAdminCategories();
      setCategories(data || []);
      setSelectedCategoryId((current) => current || data?.[0]?.id || '');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId === 'new') return;
    const category = categories.find((item) => item.id === selectedCategoryId);
    if (category) setCategoryDraft(toCategoryDraft(category));
  }, [categories, selectedCategoryId]);

  const loadAdminOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const [usersResult, servicesResult, ticketsResult] = await Promise.allSettled([
        listAdminUsers({ status: 'all', pageSize: 100 }),
        listAdminServices({ status: 'all', pageSize: 100 }),
        listAdminSupportTickets({ status: 'all', priority: 'all', pageSize: 100 }),
      ]);

      const usersData = usersResult.status === 'fulfilled' ? usersResult.value || {} : {};
      const servicesData = servicesResult.status === 'fulfilled' ? servicesResult.value || {} : {};
      const ticketsData = ticketsResult.status === 'fulfilled' ? ticketsResult.value || {} : {};
      const users = listItems(usersData, ['users']);
      const services = listItems(servicesData, ['services']);
      const tickets = listItems(ticketsData, ['tickets']);
      const userSummary = usersData.summary || usersData.counts || usersData.typeCounts || {};
      const identitySummary = usersData.identitySummary || usersData.identityCounts || usersData.verificationCounts || {};
      const serviceSummary = servicesData.summary || servicesData.counts || servicesData.statusCounts || {};

      setAdminOverview({
        usersTotal: listTotal(usersData, users),
        clients: summaryValue(userSummary, 'CLIENT') || users.filter((user) => normalizeCode(user.userType || user.role) === 'CLIENT').length,
        freelancers: summaryValue(userSummary, 'FREELANCER') || users.filter((user) => normalizeCode(user.userType || user.role) === 'FREELANCER').length,
        activeUsers: users.filter((user) => user.activityStatus !== 'inactive').length,
        identityPending: summaryValue(identitySummary, 'PENDING') || users.filter((user) => getIdentityStatus(user) === 'PENDING').length,
        servicesTotal: listTotal(servicesData, services),
        servicesPublished: summaryValue(serviceSummary, 'PUBLISHED') || services.filter((service) => normalizeCode(service.status) === 'PUBLISHED').length,
        servicesDraft: summaryValue(serviceSummary, 'DRAFT') || services.filter((service) => normalizeCode(service.status) === 'DRAFT').length,
        servicesArchived: summaryValue(serviceSummary, 'ARCHIVED') || services.filter((service) => normalizeCode(service.status) === 'ARCHIVED').length,
        ticketsTotal: listTotal(ticketsData, tickets),
        ticketsOpen: tickets.filter((ticket) => normalizeSupportTicketStatus(ticket.status) === 'OPEN').length,
        ticketsInProgress: tickets.filter((ticket) => normalizeSupportTicketStatus(ticket.status) === 'IN_PROGRESS').length,
        ticketsAnswered: tickets.filter((ticket) => (
          normalizeSupportTicketStatus(ticket.status) === 'ANSWERED' || Boolean(ticket.publicReply)
        )).length,
        ticketsResolved: tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(normalizeSupportTicketStatus(ticket.status))).length,
        ticketsUnanswered: tickets.filter(isTicketUnanswered).length,
        highPriorityUnanswered: tickets.filter((ticket) => (
          isTicketUnanswered(ticket) && ['HIGH', 'URGENT'].includes(ticket.priority)
        )).length,
      });

      if ([usersResult, servicesResult, ticketsResult].every((result) => result.status === 'rejected')) {
        toast.error('Não foi possível carregar os indicadores reais do admin.');
      }
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  useEffect(() => {
    const refresh = () => loadAdminOverview();
    window.addEventListener('support:tickets:changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('support:tickets:changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [loadAdminOverview]);

  useEffect(() => {
    if (activeTab !== 'users') return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setUsersLoading(true);
      try {
        const data = await listAdminUsers({
          q: search.trim() || undefined,
          status: userStatusFilter,
          userType: userTypeFilter || undefined,
          pageSize: 100,
        });
        if (cancelled) return;
        const items = listItems(data, ['users']);
        setAdminUsers(items);
        setUsersTotal(listTotal(data, items));
        setSelectedUserId((current) => current || items[0]?.id || '');
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, search, userStatusFilter, userTypeFilter]);

  useEffect(() => {
    const user = adminUsers.find((item) => item.id === selectedUserId);
    if (user) setUserDraft(toUserDraft(user));
  }, [adminUsers, selectedUserId]);

  useEffect(() => {
    const service = adminServices.find((item) => item.id === selectedServiceId);
    if (service) setServiceDraft(toServiceDraft(service));
  }, [adminServices, selectedServiceId]);

  useEffect(() => {
    if (selectedCouponId === 'new') return;
    const coupon = coupons.find((item) => item.id === selectedCouponId);
    if (coupon) setCouponDraft(toCouponDraft(coupon));
  }, [coupons, selectedCouponId]);

  useEffect(() => {
    if (selectedLevelId === 'new') return;
    const level = freelancerLevels.find((item) => item.id === selectedLevelId);
    if (level) setLevelDraft(toLevelDraft(level));
  }, [freelancerLevels, selectedLevelId]);

  const loadAdminPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const data = await listAdminPayments({
        q: search.trim() || undefined,
        status: paymentStatusFilter || undefined,
        releaseStatus: releaseStatusFilter || undefined,
        pageSize: 100,
      });
      setAdminPayments(data.items || []);
      setAdminFinanceSummary(data.summary || null);
      setAdminPaymentsTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentStatusFilter, releaseStatusFilter, search]);

  useEffect(() => {
    if (activeTab !== 'finance') return undefined;
    const timer = setTimeout(loadAdminPayments, 250);
    return () => clearTimeout(timer);
  }, [activeTab, loadAdminPayments]);

  const loadAdminServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const data = await listAdminServices({
        q: search.trim() || undefined,
        status: serviceStatusFilter,
        categoryId: serviceCategoryFilter || undefined,
        pageSize: 100,
      });
      const items = listItems(data, ['services']);
      setAdminServices(items);
      setAdminServicesTotal(listTotal(data, items));
      setAdminServicesSummary(data.summary || data.counts || data.statusCounts || {});
      setSelectedServiceId((current) => current || items[0]?.id || '');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setServicesLoading(false);
    }
  }, [search, serviceCategoryFilter, serviceStatusFilter]);

  useEffect(() => {
    if (activeTab !== 'services') return undefined;
    const timer = setTimeout(loadAdminServices, 250);
    return () => clearTimeout(timer);
  }, [activeTab, loadAdminServices]);

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const data = await listAdminCoupons({
        q: search.trim() || undefined,
        status: couponStatusFilter,
        pageSize: 100,
      });
      setCoupons(data.items || []);
      setCouponsTotal(data.total || 0);
      setCouponsSummary(data.summary || {});
      setSelectedCouponId((current) => current || data.items?.[0]?.id || '');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCouponsLoading(false);
    }
  }, [couponStatusFilter, search]);

  useEffect(() => {
    if (activeTab !== 'promotions') return undefined;
    const timer = setTimeout(loadCoupons, 250);
    return () => clearTimeout(timer);
  }, [activeTab, loadCoupons]);

  const loadFreelancerLevels = useCallback(async () => {
    setLevelsLoading(true);
    try {
      const levels = await listRewardLevels({ includeInactive: true });
      setFreelancerLevels(levels || []);
      setSelectedLevelId((current) => current || levels?.[0]?.id || '');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLevelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'levels') return undefined;
    loadFreelancerLevels();
  }, [activeTab, loadFreelancerLevels]);

  const loadAdminTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const data = await listAdminSupportTickets({
        q: search.trim() || undefined,
        status: ticketStatusFilter,
        priority: ticketPriorityFilter,
        pageSize: 100,
      });
      const items = listItems(data, ['tickets']);
      setAdminTickets(items);
      setAdminTicketsTotal(listTotal(data, items));
      setSelectedTicketId((current) =>
        current && items.some((ticket) => ticket.id === current)
          ? current
          : items[0]?.id || ''
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTicketsLoading(false);
    }
  }, [search, ticketPriorityFilter, ticketStatusFilter]);

  useEffect(() => {
    if (activeTab !== 'support') return undefined;
    const timer = setTimeout(loadAdminTickets, 250);
    return () => clearTimeout(timer);
  }, [activeTab, loadAdminTickets]);

  useEffect(() => {
    if (activeTab !== 'support') return undefined;
    const refresh = () => loadAdminTickets();
    window.addEventListener('support:tickets:changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('support:tickets:changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [activeTab, loadAdminTickets]);

  const selectedCategory = categories.find((item) => item.id === selectedCategoryId);
  const selectedUser = adminUsers.find((item) => item.id === selectedUserId);
  const identityModalUser = adminUsers.find((item) => item.id === identityModalUserId);
  const selectedService = adminServices.find((item) => item.id === selectedServiceId);
  const selectedCoupon = coupons.find((item) => item.id === selectedCouponId);
  const selectedLevel = freelancerLevels.find((item) => item.id === selectedLevelId);
  const selectedTicket = adminTickets.find((item) => item.id === selectedTicketId);
  const activeTicketDraft = selectedTicket && ticketDraft.ticketId === selectedTicket.id
    ? ticketDraft
    : toTicketDraft(selectedTicket);
  const selectedServiceCategory = categories.find((item) => item.id === serviceDraft.categoryId);
  const selectedServiceSubcategories = selectedServiceCategory?.subcategories || [];
  const identityModalDocuments = useMemo(() => {
    const verification = identityModalUser?.accountVerification;
    if (!verification) return [];

    return [
      ['Frente do documento', verification.documentFrontUrl],
      ['Verso do documento', verification.documentBackUrl],
      ['Comprovante de endereço', verification.proofOfAddressUrl],
    ].filter(([, url]) => Boolean(url));
  }, [identityModalUser?.accountVerification]);
  const identityModalStatus = getIdentityStatus(identityModalUser);
  const usersStats = useMemo(() => {
    const admins = adminUsers.filter((user) => user.isAdmin).length;
    const active = adminUsers.filter((user) => user.activityStatus !== 'inactive').length;
    const freelancers = adminUsers.filter((user) => user.userType === 'FREELANCER').length;
    const clients = adminUsers.filter((user) => user.userType === 'CLIENT').length;
    const identityVerified = adminUsers.filter((user) => getIdentityStatus(user) === 'VERIFIED').length;
    return { admins, active, freelancers, clients, identityVerified };
  }, [adminUsers]);
  const ticketStats = useMemo(() => {
    const open = adminTickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes(normalizeSupportTicketStatus(ticket.status))).length;
    const unanswered = adminTickets.filter(isTicketUnanswered).length;
    const answered = adminTickets.filter((ticket) => (
      normalizeSupportTicketStatus(ticket.status) === 'ANSWERED' || Boolean(ticket.publicReply)
    )).length;
    const resolved = adminTickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(normalizeSupportTicketStatus(ticket.status))).length;
    return { open, unanswered, answered, resolved };
  }, [adminTickets]);
  const dashboardStats = useMemo(() => [
    {
      label: 'Usuários cadastrados',
      value: formatNumber(adminOverview.usersTotal),
      detail: `${pluralize(adminOverview.clients, 'cliente')} · ${pluralize(adminOverview.freelancers, 'freelancer')}`,
      icon: <FaUsers />,
      tone: 'blue',
    },
    {
      label: 'Serviços cadastrados',
      value: formatNumber(adminOverview.servicesTotal),
      detail: `${pluralize(adminOverview.servicesPublished, 'publicado')} · ${pluralize(adminOverview.servicesDraft, 'rascunho')}`,
      icon: <FaLayerGroup />,
      tone: 'green',
    },
    {
      label: 'Tickets criados',
      value: formatNumber(adminOverview.ticketsTotal),
      detail: `${pluralize(adminOverview.ticketsAnswered, 'respondido')} · ${pluralize(adminOverview.ticketsResolved, 'resolvido')}`,
      icon: <FaTicket />,
      tone: 'purple',
    },
    {
      label: 'Tickets sem resposta',
      value: formatNumber(adminOverview.ticketsUnanswered),
      detail: `${formatNumber(adminOverview.highPriorityUnanswered)} de alta prioridade`,
      icon: <FaHeadset />,
      tone: adminOverview.ticketsUnanswered > 0 ? 'orange' : 'green',
    },
  ], [adminOverview]);
  const overviewSignals = useMemo(() => [
    { label: 'Clientes', value: formatNumber(adminOverview.clients), status: 'Base real', tone: 'neutral' },
    { label: 'Freelancers', value: formatNumber(adminOverview.freelancers), status: 'Base real', tone: 'neutral' },
    {
      label: 'Verificações pendentes',
      value: formatNumber(adminOverview.identityPending),
      status: adminOverview.identityPending > 0 ? 'Revisar' : 'Em dia',
      tone: adminOverview.identityPending > 0 ? 'warning' : 'success',
    },
    {
      label: 'Serviços em rascunho',
      value: formatNumber(adminOverview.servicesDraft),
      status: adminOverview.servicesDraft > 0 ? 'Acompanhar' : 'Em dia',
      tone: adminOverview.servicesDraft > 0 ? 'warning' : 'success',
    },
  ], [adminOverview]);
  const adminActionItems = useMemo(() => [
    {
      title: 'Tickets sem primeira resposta',
      owner: `${pluralize(adminOverview.ticketsUnanswered, 'chamado')} aguardando atendimento`,
      type: 'Suporte',
      priority: adminOverview.ticketsUnanswered > 0 ? 'Prioridade alta' : 'Em dia',
      tone: adminOverview.ticketsUnanswered > 0 ? 'warning' : 'success',
      icon: <FaHeadset />,
    },
    {
      title: 'Verificações de conta pendentes',
      owner: `${pluralize(adminOverview.identityPending, 'conta')} em análise`,
      type: 'Usuários',
      priority: adminOverview.identityPending > 0 ? 'Revisar' : 'Em dia',
      tone: adminOverview.identityPending > 0 ? 'warning' : 'success',
      icon: <FaUserCheck />,
    },
    {
      title: 'Serviços ainda em rascunho',
      owner: `${pluralize(adminOverview.servicesDraft, 'serviço')} sem publicação`,
      type: 'Marketplace',
      priority: adminOverview.servicesDraft > 0 ? 'Acompanhar' : 'Em dia',
      tone: adminOverview.servicesDraft > 0 ? 'neutral' : 'success',
      icon: <FaLayerGroup />,
    },
  ], [adminOverview]);
  const taxonomyStats = useMemo(() => {
    const subcategoryCount = categories.reduce(
      (total, category) => total + (Array.isArray(category.subcategories) ? category.subcategories.length : 0),
      0
    );
    const tagCount = categories.reduce(
      (total, category) =>
        total + (Array.isArray(category.subcategories)
          ? category.subcategories.reduce((sum, item) => sum + (Array.isArray(item.tags) ? item.tags.length : 0), 0)
          : 0),
      0
    );
    const serviceCount = categories.reduce((total, category) => total + (category.servicesCount || 0), 0);
    return { subcategoryCount, tagCount, serviceCount };
  }, [categories]);

  const financeSummary = adminFinanceSummary || {};
  const financeReleaseCounts = financeSummary.releaseCounts || {};
  const financePaymentCounts = financeSummary.counts || {};

  const updateDraft = (field, value) => {
    setCategoryDraft((current) => ({ ...current, [field]: value }));
  };

  const updateSubcategory = (index, field, value) => {
    setCategoryDraft((current) => ({
      ...current,
      subcategories: current.subcategories.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addSubcategory = () => {
    setCategoryDraft((current) => ({
      ...current,
      subcategories: [
        ...current.subcategories,
        { name: '', slug: '', tags: [] },
      ],
    }));
  };

  const removeSubcategory = (index) => {
    setCategoryDraft((current) => ({
      ...current,
      subcategories: current.subcategories.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const startNewCategory = () => {
    const nextPosition = Math.max(0, ...categories.map((item) => item.position || 0)) + 1;
    setSelectedCategoryId('new');
    setCategoryDraft({ ...emptyCategoryDraft, position: nextPosition });
    setActiveTab('taxonomy');
  };

  const saveCategory = async () => {
    if (!categoryDraft.name.trim()) {
      toast.error('Informe o nome da categoria.');
      return;
    }

    setCategorySaving(true);
    const payload = {
      ...categoryDraft,
      slug: categoryDraft.slug || slugify(categoryDraft.name),
      icon: categoryDraft.icon || null,
      position: Number(categoryDraft.position) || 0,
      subcategories: categoryDraft.subcategories
        .filter((item) => item.name.trim())
        .map((item) => ({
          name: item.name.trim(),
          slug: item.slug || slugify(item.name),
          tags: item.tags || [],
        })),
    };

    try {
      const saved = selectedCategoryId === 'new'
        ? await createCategory(payload)
        : await updateCategory(selectedCategoryId, payload);
      setCategories((current) =>
        selectedCategoryId === 'new'
          ? [...current, saved].sort((a, b) => (a.position || 0) - (b.position || 0))
          : current.map((item) => (item.id === saved.id ? saved : item)).sort((a, b) => (a.position || 0) - (b.position || 0))
      );
      setSelectedCategoryId(saved.id);
      toast.success(selectedCategoryId === 'new' ? 'Categoria criada.' : 'Categoria salva.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCategorySaving(false);
    }
  };

  const removeCategory = async () => {
    if (!selectedCategory || categorySaving) return;
    const confirmed = window.confirm(`Excluir a categoria "${selectedCategory.name}"? Só é possível excluir categorias sem serviços vinculados.`);
    if (!confirmed) return;

    setCategorySaving(true);
    try {
      await deleteCategory(selectedCategory.id);
      setCategories((current) => current.filter((item) => item.id !== selectedCategory.id));
      const nextCategory = categories.find((item) => item.id !== selectedCategory.id);
      setSelectedCategoryId(nextCategory?.id || '');
      setCategoryDraft(nextCategory ? toCategoryDraft(nextCategory) : emptyCategoryDraft);
      toast.success('Categoria excluída.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCategorySaving(false);
    }
  };

  const updateUserDraft = (field, value) => {
    setUserDraft((current) => ({ ...current, [field]: value }));
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    if (!userDraft.email.trim() || !userDraft.firstName.trim() || !userDraft.lastName.trim()) {
      toast.error('Nome, sobrenome e email são obrigatórios.');
      return;
    }

    setUserSaving(true);
    try {
      const saved = await updateAdminUser(selectedUser.id, {
        email: userDraft.email,
        firstName: userDraft.firstName,
        lastName: userDraft.lastName,
        phone: userDraft.phone,
        username: userDraft.username || null,
        headline: userDraft.headline || null,
        location: userDraft.location || null,
        userType: userDraft.userType || null,
        isAdmin: userDraft.isAdmin,
        emailVerified: userDraft.emailVerified,
        onboarded: userDraft.onboarded,
      });
      setAdminUsers((current) => current.map((user) => (user.id === saved.id ? saved : user)));
      setSelectedUserId(saved.id);
      loadAdminOverview();
      toast.success('Usuário atualizado.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  const toggleAdmin = async (user) => {
    if (!user || userSaving) return;
    setUserSaving(true);
    try {
      const saved = await updateAdminUser(user.id, { isAdmin: !user.isAdmin });
      setAdminUsers((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      if (selectedUserId === saved.id) setUserDraft(toUserDraft(saved));
      loadAdminOverview();
      toast.success(saved.isAdmin ? 'Usuário agora é admin.' : 'Admin removido do usuário.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  const openIdentityModal = (user) => {
    if (!user?.accountVerification) {
      toast.info('Este usuário ainda não enviou documentos para análise.');
      return;
    }

    setIdentityModalUserId(user.id);
    setIdentityRejecting(false);
    setIdentityReviewNote(user.accountVerification.reviewNote || '');
  };

  const closeIdentityModal = () => {
    if (verificationSaving) return;
    setIdentityModalUserId('');
    setIdentityRejecting(false);
    setIdentityReviewNote('');
  };

  const reviewIdentity = async (status) => {
    if (!identityModalUser || verificationSaving) return;
    const note = identityReviewNote.trim();

    if (status === 'REJECTED' && !note) {
      toast.error('Informe o motivo da reprovação para orientar o usuário.');
      return;
    }

    setVerificationSaving(true);
    try {
      const result = await reviewAdminAccountVerification(identityModalUser.id, {
        status,
        reviewNote: status === 'REJECTED' ? note : undefined,
      });
      setAdminUsers((current) => current.map((user) => (user.id === result.user.id ? result.user : user)));
      setSelectedUserId(result.user.id);
      setIdentityModalUserId(result.user.id);
      setIdentityRejecting(false);
      setIdentityReviewNote(result.user.accountVerification?.reviewNote || '');
      loadAdminOverview();
      toast.success(status === 'VERIFIED' ? 'Identidade aprovada.' : 'Identidade recusada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setVerificationSaving(false);
    }
  };

  const updateServiceDraft = (field, value) => {
    setServiceDraft((current) => ({ ...current, [field]: value }));
  };

  const saveAdminService = async () => {
    if (!selectedService) return;
    if (!serviceDraft.title.trim() || !serviceDraft.description.trim()) {
      toast.error('Título e descrição são obrigatórios.');
      return;
    }

    setServiceSaving(true);
    try {
      const saved = await updateAdminService(selectedService.id, {
        title: serviceDraft.title,
        description: serviceDraft.description,
        status: serviceDraft.status,
        categoryId: serviceDraft.categoryId,
        subcategorySlug: selectedServiceSubcategories.length ? serviceDraft.subcategorySlug : null,
        tags: parseTags(serviceDraft.tags),
        coverUrl: serviceDraft.coverUrl || null,
      });
      setAdminServices((current) => current.map((service) => (service.id === saved.id ? saved : service)));
      setSelectedServiceId(saved.id);
      loadAdminOverview();
      toast.success('Serviço atualizado.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setServiceSaving(false);
    }
  };

  const archiveAdminService = async (service) => {
    if (!service || serviceSaving) return;
    const confirmed = window.confirm(`Arquivar o serviço "${service.title}"? Ele sairá da busca pública.`);
    if (!confirmed) return;

    setServiceSaving(true);
    try {
      const result = await deleteAdminService(service.id);
      if (result.service) {
        setAdminServices((current) => current.map((item) => (item.id === result.service.id ? result.service : item)));
        setSelectedServiceId(result.service.id);
      }
      toast.success('Serviço arquivado.');
      await loadAdminServices();
      loadAdminOverview();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setServiceSaving(false);
    }
  };

  const permanentlyDeleteAdminService = async (service) => {
    if (!service || serviceSaving) return;
    const confirmed = window.confirm(`Excluir permanentemente "${service.title}"? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    setServiceSaving(true);
    try {
      await deleteAdminService(service.id, { permanent: true });
      setAdminServices((current) => current.filter((item) => item.id !== service.id));
      setSelectedServiceId('');
      setServiceDraft(emptyServiceDraft);
      toast.success('Serviço excluído permanentemente.');
      await loadAdminServices();
      loadAdminOverview();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setServiceSaving(false);
    }
  };

  const startNewCoupon = () => {
    setSelectedCouponId('new');
    setCouponDraft(emptyCouponDraft);
    setActiveTab('promotions');
  };

  const updateCouponDraft = (field, value) => {
    setCouponDraft((current) => ({ ...current, [field]: value }));
  };

  const couponPayload = () => ({
    code: couponDraft.code,
    name: couponDraft.name,
    description: couponDraft.description || null,
    discountType: couponDraft.discountType,
    discountValue: couponDraft.discountType === 'PERCENTAGE'
      ? Number(couponDraft.discountValue) || 0
      : parseMoneyInput(couponDraft.discountValue) || 0,
    maxDiscountCents: parseMoneyInput(couponDraft.maxDiscountCents),
    minSubtotalCents: parseMoneyInput(couponDraft.minSubtotalCents),
    usageLimit: couponDraft.usageLimit ? Number(couponDraft.usageLimit) : null,
    startsAt: couponDraft.startsAt || null,
    endsAt: couponDraft.endsAt || null,
    isActive: couponDraft.isActive,
  });

  const saveCoupon = async () => {
    if (!couponDraft.code.trim() || !couponDraft.name.trim()) {
      toast.error('Código e nome do cupom são obrigatórios.');
      return;
    }

    setCouponSaving(true);
    try {
      const saved = selectedCouponId === 'new'
        ? await createAdminCoupon(couponPayload())
        : await updateAdminCoupon(selectedCouponId, couponPayload());
      setCoupons((current) =>
        selectedCouponId === 'new'
          ? [saved, ...current]
          : current.map((coupon) => (coupon.id === saved.id ? saved : coupon))
      );
      setSelectedCouponId(saved.id);
      toast.success(selectedCouponId === 'new' ? 'Cupom criado.' : 'Cupom atualizado.');
      await loadCoupons();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCouponSaving(false);
    }
  };

  const removeCoupon = async () => {
    if (!selectedCoupon || couponSaving) return;
    const confirmed = window.confirm(`Excluir o cupom "${selectedCoupon.code}"?`);
    if (!confirmed) return;

    setCouponSaving(true);
    try {
      await deleteAdminCoupon(selectedCoupon.id);
      setCoupons((current) => current.filter((coupon) => coupon.id !== selectedCoupon.id));
      setSelectedCouponId('');
      setCouponDraft(emptyCouponDraft);
      toast.success('Cupom excluído.');
      await loadCoupons();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCouponSaving(false);
    }
  };

  const startNewLevel = () => {
    const nextPosition = Math.max(0, ...freelancerLevels.map((level) => level.position || 0)) + 1;
    const nextLevelNumber = Math.max(0, ...freelancerLevels.map((level) => level.levelNumber || 0)) + 1;
    setSelectedLevelId('new');
    setLevelDraft({ ...emptyLevelDraft, position: nextPosition, levelNumber: nextLevelNumber });
    setActiveTab('levels');
  };

  const updateLevelDraft = (field, value) => {
    setLevelDraft((current) => ({ ...current, [field]: value }));
  };

  const levelPayload = () => ({
    audience: levelDraft.audience,
    levelNumber: Number(levelDraft.levelNumber) || 1,
    name: levelDraft.name,
    slug: levelDraft.slug || undefined,
    description: levelDraft.description || null,
    xpRequired: Number(levelDraft.xpRequired) || 0,
    badgeColor: levelDraft.badgeColor || '#3e73e6',
    benefits: levelDraft.benefits.split('\n').map((benefit) => benefit.trim()).filter(Boolean),
    position: Number(levelDraft.position) || 0,
    isActive: levelDraft.isActive,
  });

  const saveLevel = async () => {
    if (!levelDraft.name.trim()) {
      toast.error('Informe o nome do nível.');
      return;
    }

    setLevelSaving(true);
    try {
      const saved = selectedLevelId === 'new'
        ? await createRewardLevel(levelPayload())
        : await updateRewardLevel(selectedLevelId, levelPayload());
      setFreelancerLevels((current) =>
        selectedLevelId === 'new'
          ? [...current, saved].sort((a, b) => (a.levelNumber || 0) - (b.levelNumber || 0))
          : current.map((level) => (level.id === saved.id ? saved : level)).sort((a, b) => (a.levelNumber || 0) - (b.levelNumber || 0))
      );
      setSelectedLevelId(saved.id);
      toast.success(selectedLevelId === 'new' ? 'Nível criado.' : 'Nível atualizado.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLevelSaving(false);
    }
  };

  const removeLevel = async () => {
    if (!selectedLevel || levelSaving) return;
    const confirmed = window.confirm(`Excluir o nível "${selectedLevel.name}"?`);
    if (!confirmed) return;

    setLevelSaving(true);
    try {
      await deleteRewardLevel(selectedLevel.id);
      setFreelancerLevels((current) => current.filter((level) => level.id !== selectedLevel.id));
      setSelectedLevelId('');
      setLevelDraft(emptyLevelDraft);
      toast.success('Nível excluído.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLevelSaving(false);
    }
  };

  const updateTicketDraft = (field, value) => {
    setTicketDraft((current) => {
      const base = selectedTicket && current.ticketId !== selectedTicket.id
        ? toTicketDraft(selectedTicket)
        : current;
      return { ...base, [field]: value };
    });
  };

  const saveTicket = async () => {
    if (!selectedTicket || ticketSaving) return;

    const publicReply = activeTicketDraft.publicReply.trim();
    if (activeTicketDraft.status === 'ANSWERED' && !publicReply) {
      toast.error('Escreva uma resposta antes de marcar o ticket como respondido.');
      return;
    }

    setTicketSaving(true);
    try {
      const nextStatus = publicReply && !['RESOLVED', 'CLOSED'].includes(activeTicketDraft.status)
        ? 'ANSWERED'
        : activeTicketDraft.status;
      const saved = await updateAdminSupportTicket(selectedTicket.id, {
        status: nextStatus,
        priority: activeTicketDraft.priority,
        publicReply,
        adminNote: activeTicketDraft.adminNote.trim(),
      });
      setAdminTickets((current) => current.map((ticket) => (ticket.id === saved.id ? saved : ticket)));
      setSelectedTicketId(saved.id);
      setTicketDraft(toTicketDraft(saved));
      loadAdminOverview();
      toast.success('Ticket atualizado.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTicketSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Admin</span>
          <h1>Central de operação Hivelancers</h1>
          <p>
            Acompanhe usuários, serviços e tickets de suporte com indicadores reais da plataforma.
          </p>
        </div>

        <div className={styles.commandCard}>
          <span>Fila de suporte</span>
          <strong>{formatNumber(adminOverview.ticketsUnanswered)}</strong>
          <p>Tickets sem resposta inicial · SLA de 24h úteis</p>
          <button type="button" onClick={() => setActiveTab('support')}>Abrir tickets</button>
        </div>
      </section>

      <div className={styles.statGrid}>
        {dashboardStats.map((item) => (
          <SpotlightCard key={item.label} className={`${styles.statCard} ${styles[item.tone]}`}>
            <div className={styles.statIcon}>{item.icon}</div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </SpotlightCard>
        ))}
      </div>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <span className={styles.sectionKicker}>Controle</span>
            <h2>Gestão administrativa</h2>
          </div>

          <div className={styles.searchWrap}>
            <FaMagnifyingGlass />
            <input
              type="text"
              placeholder="Buscar usuário, serviço, cupom ou ticket..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {Icon && <Icon className={styles.tabIcon} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span className={styles.sectionKicker}>Indicadores</span>
                  <h3>Base da plataforma</h3>
                </div>
                <button type="button" className={styles.ghostButton} onClick={loadAdminOverview} disabled={overviewLoading}>
                  {overviewLoading ? 'Atualizando...' : 'Atualizar'}
                </button>
              </div>

              <div className={styles.signalGrid}>
                {overviewSignals.map((signal) => (
                  <div key={signal.label} className={styles.signalCard}>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                    <em className={`${styles.badge} ${styles[signal.tone]}`}>{signal.status}</em>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span className={styles.sectionKicker}>Prioridades</span>
                  <h3>Fila de ação</h3>
                </div>
                <button type="button" className={styles.primaryButton} onClick={() => setActiveTab('support')}>
                  Ver suporte
                </button>
              </div>

              <div className={styles.actionList}>
                {adminActionItems.map((item) => (
                  <article key={item.title} className={styles.actionItem}>
                    <div className={styles.actionIcon}>{item.icon}</div>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.owner} · {item.type}</span>
                    </div>
                    <em className={`${styles.badge} ${styles[item.tone]}`}>{item.priority}</em>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'services' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Marketplace</span>
                <h3>Serviços publicados e rascunhos</h3>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.ghostButton} onClick={loadAdminServices} disabled={servicesLoading}>
                  {servicesLoading ? 'Atualizando...' : 'Atualizar'}
                </button>
                <button type="button" className={styles.primaryButton} onClick={saveAdminService} disabled={!selectedService || serviceSaving}>
                  <FaFloppyDisk /> {serviceSaving ? 'Salvando...' : 'Salvar serviço'}
                </button>
              </div>
            </div>

            <div className={styles.userStats}>
              <div className={styles.taxonomyStat}>
                <FaLayerGroup />
                <span>Total filtrado</span>
                <strong>{adminServicesTotal}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaCircleCheck />
                <span>Publicados</span>
                <strong>{summaryValue(adminServicesSummary, 'PUBLISHED')}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaClock />
                <span>Rascunhos</span>
                <strong>{summaryValue(adminServicesSummary, 'DRAFT')}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaBan />
                <span>Arquivados</span>
                <strong>{summaryValue(adminServicesSummary, 'ARCHIVED')}</strong>
              </div>
            </div>

            <div className={styles.userFilters}>
              <select value={serviceStatusFilter} onChange={(event) => setServiceStatusFilter(event.target.value)}>
                <option value="all">Todos os status</option>
                <option value="PUBLISHED">Publicados</option>
                <option value="DRAFT">Rascunhos</option>
                <option value="ARCHIVED">Arquivados</option>
              </select>
              <select value={serviceCategoryFilter} onChange={(event) => setServiceCategoryFilter(event.target.value)}>
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.userManagementGrid}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Serviço</th>
                      <th>Freelancer</th>
                      <th>Status</th>
                      <th>Sinais</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesLoading ? (
                      <tr>
                        <td colSpan="5">Carregando serviços...</td>
                      </tr>
                    ) : adminServices.length === 0 ? (
                      <tr>
                        <td colSpan="5">Nenhum serviço encontrado.</td>
                      </tr>
                    ) : (
                      adminServices.map((service) => (
                        <tr key={service.id} className={selectedServiceId === service.id ? styles.tableRowActive : ''}>
                          <td>
                            <strong>{service.title}</strong>
                            <span>{service.category?.name || 'Sem categoria'} · {service.subcategoryName || 'Sem subcategoria'}</span>
                            <span>ID: {service.id}</span>
                          </td>
                          <td>
                            <strong>{toUserName(service.owner)}</strong>
                            <span>@{service.owner?.username || 'sem username'}</span>
                          </td>
                          <td>
                            <em className={`${styles.badge} ${styles[getStatusTone(SERVICE_STATUS_LABEL[service.status] || service.status)]}`}>
                              {SERVICE_STATUS_LABEL[service.status] || service.status}
                            </em>
                            <span>Atualizado: {formatDate(service.updatedAt)}</span>
                          </td>
                          <td>
                            <strong>{formatCents(service.minPriceCents)} inicial</strong>
                            <span>{service.counts?.orders || 0} pedidos · {service.counts?.favorites || 0} favoritos</span>
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button type="button" onClick={() => setSelectedServiceId(service.id)}>Editar</button>
                              <button type="button" onClick={() => archiveAdminService(service)} disabled={serviceSaving || service.status === 'ARCHIVED'}>
                                Arquivar
                              </button>
                              <button
                                type="button"
                                onClick={() => permanentlyDeleteAdminService(service)}
                                disabled={serviceSaving || (service.counts?.orders || 0) > 0 || (service.counts?.payments || 0) > 0}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <aside className={styles.userEditor}>
                {selectedService ? (
                  <>
                    <div className={styles.userEditorHeader}>
                      <div className={styles.userAvatar}>
                        <CategoryIcon category={selectedService.category} />
                      </div>
                      <div>
                        <span className={styles.sectionKicker}>Editor de serviço</span>
                        <h4>{selectedService.title}</h4>
                        <p>{toUserName(selectedService.owner)} · {selectedService.category?.name}</p>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <label className={`${styles.formField} ${styles.formFieldFull}`}>
                        <span>Título</span>
                        <input value={serviceDraft.title} onChange={(event) => updateServiceDraft('title', event.target.value)} />
                      </label>
                      <label className={styles.formField}>
                        <span>Status</span>
                        <select value={serviceDraft.status} onChange={(event) => updateServiceDraft('status', event.target.value)}>
                          <option value="DRAFT">Rascunho</option>
                          <option value="PUBLISHED">Publicado</option>
                          <option value="ARCHIVED">Arquivado</option>
                        </select>
                      </label>
                      <label className={styles.formField}>
                        <span>Categoria</span>
                        <select
                          value={serviceDraft.categoryId}
                          onChange={(event) => {
                            updateServiceDraft('categoryId', event.target.value);
                            updateServiceDraft('subcategorySlug', '');
                          }}
                        >
                          <option value="">Selecione</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.formField}>
                        <span>Subcategoria</span>
                        <select value={serviceDraft.subcategorySlug} onChange={(event) => updateServiceDraft('subcategorySlug', event.target.value)}>
                          <option value="">Sem subcategoria</option>
                          {selectedServiceSubcategories.map((subcategory) => (
                            <option key={subcategory.slug} value={subcategory.slug}>{subcategory.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.formField}>
                        <span>URL da capa</span>
                        <input value={serviceDraft.coverUrl} onChange={(event) => updateServiceDraft('coverUrl', event.target.value)} />
                      </label>
                      <label className={`${styles.formField} ${styles.formFieldFull}`}>
                        <span>Tags</span>
                        <input value={serviceDraft.tags} onChange={(event) => updateServiceDraft('tags', event.target.value)} placeholder="landing pages, react, sites" />
                      </label>
                      <label className={`${styles.formField} ${styles.formFieldFull}`}>
                        <span>Descrição</span>
                        <textarea rows={6} value={serviceDraft.description} onChange={(event) => updateServiceDraft('description', event.target.value)} />
                      </label>
                    </div>

                    <button type="button" className={styles.primaryButton} onClick={saveAdminService} disabled={serviceSaving}>
                      <FaFloppyDisk /> {serviceSaving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </>
                ) : (
                  <div className={styles.taxonomyEmpty}>
                    Selecione um serviço para editar status, categoria, tags e informações principais.
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}

        {activeTab === 'promotions' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Crescimento</span>
                <h3>Cupons e promoções</h3>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.ghostButton} onClick={loadCoupons} disabled={couponsLoading}>
                  {couponsLoading ? 'Atualizando...' : 'Atualizar'}
                </button>
                <button type="button" className={styles.primaryButton} onClick={startNewCoupon}>
                  <FaPlus /> Novo cupom
                </button>
              </div>
            </div>

            <div className={styles.userStats}>
              <div className={styles.taxonomyStat}>
                <FaGift />
                <span>Total filtrado</span>
                <strong>{couponsTotal}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaCircleCheck />
                <span>Ativos</span>
                <strong>{couponsSummary.active || 0}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaClock />
                <span>Agendados</span>
                <strong>{couponsSummary.scheduled || 0}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaBan />
                <span>Expirados/inativos</span>
                <strong>{(couponsSummary.expired || 0) + (couponsSummary.inactive || 0)}</strong>
              </div>
            </div>

            <div className={styles.userFilters}>
              <select value={couponStatusFilter} onChange={(event) => setCouponStatusFilter(event.target.value)}>
                <option value="all">Todos os cupons</option>
                <option value="active">Ativos</option>
                <option value="scheduled">Agendados</option>
                <option value="expired">Expirados</option>
                <option value="inactive">Inativos</option>
                <option value="limit_reached">Limite atingido</option>
              </select>
            </div>

            <div className={styles.userManagementGrid}>
              <div className={styles.couponGrid}>
                {couponsLoading ? (
                  <div className={styles.taxonomyEmpty}>Carregando cupons...</div>
                ) : coupons.length === 0 ? (
                  <div className={styles.taxonomyEmpty}>Nenhum cupom encontrado.</div>
                ) : (
                  coupons.map((coupon) => (
                    <button
                      key={coupon.id}
                      type="button"
                      className={`${styles.promoCard} ${selectedCouponId === coupon.id ? styles.promoCardActive : ''}`}
                      onClick={() => setSelectedCouponId(coupon.id)}
                    >
                      <span className={styles.promoCode}>{coupon.code}</span>
                      <strong>{coupon.name}</strong>
                      <small>
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountValue}% de desconto`
                          : `${formatCents(coupon.discountValue)} de desconto`}
                      </small>
                      <em className={`${styles.badge} ${styles[getStatusTone(COUPON_STATUS_LABEL[coupon.operationalStatus] || coupon.operationalStatus)]}`}>
                        {COUPON_STATUS_LABEL[coupon.operationalStatus] || coupon.operationalStatus}
                      </em>
                    </button>
                  ))
                )}
              </div>

              <aside className={styles.userEditor}>
                <div className={styles.userEditorHeader}>
                  <div className={styles.userAvatar}><FaGift /></div>
                  <div>
                    <span className={styles.sectionKicker}>{selectedCouponId === 'new' ? 'Novo cupom' : 'Editor'}</span>
                    <h4>{couponDraft.code || 'Cupom promocional'}</h4>
                    <p>Controle campanha, janela, limite e desconto.</p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>Código</span>
                    <input value={couponDraft.code} onChange={(event) => updateCouponDraft('code', event.target.value.toUpperCase())} placeholder="BEMVINDO10" />
                  </label>
                  <label className={styles.formField}>
                    <span>Tipo</span>
                    <select value={couponDraft.discountType} onChange={(event) => updateCouponDraft('discountType', event.target.value)}>
                      <option value="PERCENTAGE">Percentual</option>
                      <option value="FIXED_AMOUNT">Valor fixo</option>
                    </select>
                  </label>
                  <label className={`${styles.formField} ${styles.formFieldFull}`}>
                    <span>Nome da campanha</span>
                    <input value={couponDraft.name} onChange={(event) => updateCouponDraft('name', event.target.value)} placeholder="Boas-vindas" />
                  </label>
                  <label className={styles.formField}>
                    <span>{couponDraft.discountType === 'PERCENTAGE' ? 'Desconto (%)' : 'Desconto (R$)'}</span>
                    <input value={couponDraft.discountValue} onChange={(event) => updateCouponDraft('discountValue', event.target.value)} />
                  </label>
                  <label className={styles.formField}>
                    <span>Desconto máximo (R$)</span>
                    <input value={couponDraft.maxDiscountCents} onChange={(event) => updateCouponDraft('maxDiscountCents', event.target.value)} />
                  </label>
                  <label className={styles.formField}>
                    <span>Pedido mínimo (R$)</span>
                    <input value={couponDraft.minSubtotalCents} onChange={(event) => updateCouponDraft('minSubtotalCents', event.target.value)} />
                  </label>
                  <label className={styles.formField}>
                    <span>Limite de usos</span>
                    <input type="number" min="1" value={couponDraft.usageLimit} onChange={(event) => updateCouponDraft('usageLimit', event.target.value)} />
                  </label>
                  <label className={styles.formField}>
                    <span>Início</span>
                    <input type="datetime-local" value={couponDraft.startsAt} onChange={(event) => updateCouponDraft('startsAt', event.target.value)} />
                  </label>
                  <label className={styles.formField}>
                    <span>Fim</span>
                    <input type="datetime-local" value={couponDraft.endsAt} onChange={(event) => updateCouponDraft('endsAt', event.target.value)} />
                  </label>
                  <label className={`${styles.formField} ${styles.formFieldFull}`}>
                    <span>Descrição interna</span>
                    <textarea rows={3} value={couponDraft.description} onChange={(event) => updateCouponDraft('description', event.target.value)} />
                  </label>
                </div>

                <div className={styles.userSwitches}>
                  <label>
                    <input type="checkbox" checked={couponDraft.isActive} onChange={(event) => updateCouponDraft('isActive', event.target.checked)} />
                    <span>Cupom ativo</span>
                  </label>
                </div>

                <div className={styles.editorActions}>
                  {selectedCoupon && (
                    <button type="button" className={styles.dangerButton} onClick={removeCoupon} disabled={couponSaving}>
                      <FaTrash /> Excluir
                    </button>
                  )}
                  <button type="button" className={styles.primaryButton} onClick={saveCoupon} disabled={couponSaving}>
                    <FaFloppyDisk /> {couponSaving ? 'Salvando...' : 'Salvar cupom'}
                  </button>
                </div>
              </aside>
            </div>
          </section>
        )}

        {activeTab === 'levels' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Confiança</span>
                <h3>Sistema geral de níveis e XP</h3>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.ghostButton} onClick={loadFreelancerLevels} disabled={levelsLoading}>
                  {levelsLoading ? 'Atualizando...' : 'Atualizar'}
                </button>
                <button type="button" className={styles.primaryButton} onClick={startNewLevel}>
                  <FaPlus /> Novo nível
                </button>
              </div>
            </div>

            <div className={styles.levelLayout}>
              <div className={styles.levelList}>
                {levelsLoading ? (
                  <div className={styles.taxonomyEmpty}>Carregando níveis...</div>
                ) : freelancerLevels.length === 0 ? (
                  <div className={styles.taxonomyEmpty}>Nenhum nível configurado.</div>
                ) : (
                  freelancerLevels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      className={`${styles.levelCard} ${selectedLevelId === level.id ? styles.levelCardActive : ''}`}
                      onClick={() => setSelectedLevelId(level.id)}
                    >
                      <span className={styles.levelSwatch} style={{ background: level.badgeColor }} />
                      <span>
                        <strong>Nível {level.levelNumber} · {level.name}</strong>
                        <small>
                          {level.audience === 'ALL' ? 'Todos' : level.audience === 'FREELANCER' ? 'Freelancers' : 'Clientes'} · {level.xpRequired} XP para liberar
                        </small>
                      </span>
                      <em className={`${styles.badge} ${styles[level.isActive ? 'success' : 'neutral']}`}>
                        {level.isActive ? 'Ativo' : 'Inativo'}
                      </em>
                    </button>
                  ))
                )}
              </div>

              <aside className={styles.userEditor}>
                <div className={styles.userEditorHeader}>
                  <div className={styles.userAvatar}><FaMedal /></div>
                  <div>
                    <span className={styles.sectionKicker}>{selectedLevelId === 'new' ? 'Novo nível' : 'Editor'}</span>
                    <h4>{levelDraft.name || 'Nível da plataforma'}</h4>
                    <p>Configure XP, audiência e recompensas exibidas ao usuário.</p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>Audiência</span>
                    <select value={levelDraft.audience} onChange={(event) => updateLevelDraft('audience', event.target.value)}>
                      <option value="ALL">Todos</option>
                      <option value="FREELANCER">Freelancers</option>
                      <option value="CLIENT">Clientes</option>
                    </select>
                  </label>
                  <label className={styles.formField}>
                    <span>Número do nível</span>
                    <input type="number" min="1" value={levelDraft.levelNumber} onChange={(event) => updateLevelDraft('levelNumber', event.target.value)} />
                  </label>
                  <label className={styles.formField}>
                    <span>Nome</span>
                    <input value={levelDraft.name} onChange={(event) => updateLevelDraft('name', event.target.value)} placeholder="Nível 5" />
                  </label>
                  <label className={styles.formField}>
                    <span>Slug</span>
                    <input value={levelDraft.slug} onChange={(event) => updateLevelDraft('slug', slugify(event.target.value))} placeholder="nivel-5" />
                  </label>
                  <label className={styles.formField}>
                    <span>XP necessário</span>
                    <input type="number" min="0" value={levelDraft.xpRequired} onChange={(event) => updateLevelDraft('xpRequired', event.target.value)} />
                  </label>
                  <label className={styles.formField}>
                    <span>Ordem</span>
                    <input type="number" min="0" value={levelDraft.position} onChange={(event) => updateLevelDraft('position', event.target.value)} />
                  </label>
                  <label className={styles.formField}>
                    <span>Cor do selo</span>
                    <input type="color" value={levelDraft.badgeColor} onChange={(event) => updateLevelDraft('badgeColor', event.target.value)} />
                  </label>
                  <label className={`${styles.formField} ${styles.formFieldFull}`}>
                    <span>Descrição</span>
                    <textarea rows={3} value={levelDraft.description} onChange={(event) => updateLevelDraft('description', event.target.value)} />
                  </label>
                  <label className={`${styles.formField} ${styles.formFieldFull}`}>
                    <span>Recompensas/benefícios, um por linha</span>
                    <textarea rows={4} value={levelDraft.benefits} onChange={(event) => updateLevelDraft('benefits', event.target.value)} />
                  </label>
                </div>

                <div className={styles.userSwitches}>
                  <label>
                    <input type="checkbox" checked={levelDraft.isActive} onChange={(event) => updateLevelDraft('isActive', event.target.checked)} />
                    <span>Nível ativo</span>
                  </label>
                </div>

                <div className={styles.editorActions}>
                  {selectedLevel && (
                    <button type="button" className={styles.dangerButton} onClick={removeLevel} disabled={levelSaving}>
                      <FaTrash /> Excluir
                    </button>
                  )}
                  <button type="button" className={styles.primaryButton} onClick={saveLevel} disabled={levelSaving}>
                    <FaFloppyDisk /> {levelSaving ? 'Salvando...' : 'Salvar nível'}
                  </button>
                </div>
              </aside>
            </div>
          </section>
        )}

        {activeTab === 'taxonomy' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Marketplace</span>
                <h3>Categorias, subcategorias e tags</h3>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.ghostButton} onClick={loadCategories} disabled={categoriesLoading}>
                  Atualizar
                </button>
                <button type="button" className={styles.primaryButton} onClick={startNewCategory}>
                  <FaPlus /> Nova categoria
                </button>
              </div>
            </div>

            <div className={styles.taxonomyStats}>
              <div className={styles.taxonomyStat}>
                <FaLayerGroup />
                <span>Categorias</span>
                <strong>{categories.length}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaTags />
                <span>Subcategorias</span>
                <strong>{taxonomyStats.subcategoryCount}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaBolt />
                <span>Tags mapeadas</span>
                <strong>{taxonomyStats.tagCount}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaUsers />
                <span>Serviços vinculados</span>
                <strong>{taxonomyStats.serviceCount}</strong>
              </div>
            </div>

            <div className={styles.taxonomyLayout}>
              <aside className={styles.categoryRail}>
                {categoriesLoading ? (
                  <div className={styles.taxonomyEmpty}>Carregando taxonomia...</div>
                ) : categories.length === 0 ? (
                  <div className={styles.taxonomyEmpty}>Nenhuma categoria cadastrada.</div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`${styles.categoryRailItem} ${selectedCategoryId === category.id ? styles.categoryRailActive : ''}`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <span className={styles.categoryRailIcon}>
                        <CategoryIcon category={category} />
                      </span>
                      <span>
                        <strong>{category.name}</strong>
                        <small>
                          {(category.subcategories || []).length} subcategorias · {category.servicesCount || 0} serviços
                        </small>
                      </span>
                    </button>
                  ))
                )}
              </aside>

              <div className={styles.taxonomyEditor}>
                <div className={styles.editorHeader}>
                  <div>
                    <span className={styles.sectionKicker}>
                      {selectedCategoryId === 'new' ? 'Nova categoria' : 'Editor'}
                    </span>
                    <h4>{categoryDraft.name || 'Defina a categoria'}</h4>
                    <p>Use slugs estáveis: eles aparecem em filtros, links e buscas do marketplace.</p>
                  </div>
                  <div className={styles.editorActions}>
                    {selectedCategory && (
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={removeCategory}
                        disabled={categorySaving || (selectedCategory.servicesCount || 0) > 0}
                        title={(selectedCategory.servicesCount || 0) > 0 ? 'Categorias com serviços não podem ser excluídas' : 'Excluir categoria'}
                      >
                        <FaTrash /> Excluir
                      </button>
                    )}
                    <button type="button" className={styles.primaryButton} onClick={saveCategory} disabled={categorySaving}>
                      <FaFloppyDisk /> {categorySaving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>Nome</span>
                    <input
                      type="text"
                      value={categoryDraft.name}
                      onChange={(event) => updateDraft('name', event.target.value)}
                      placeholder="Ex: Desenvolvimento"
                    />
                  </label>
                  <label className={styles.formField}>
                    <span>Slug</span>
                    <input
                      type="text"
                      value={categoryDraft.slug}
                      onChange={(event) => updateDraft('slug', slugify(event.target.value))}
                      placeholder="desenvolvimento"
                    />
                  </label>
                  <label className={styles.formField}>
                    <span>Ícone</span>
                    <input
                      type="text"
                      value={categoryDraft.icon}
                      onChange={(event) => updateDraft('icon', event.target.value)}
                      placeholder="code, palette, robot..."
                    />
                  </label>
                  <label className={styles.formField}>
                    <span>Ordem</span>
                    <input
                      type="number"
                      value={categoryDraft.position}
                      onChange={(event) => updateDraft('position', event.target.value)}
                      min="0"
                    />
                  </label>
                </div>

                <div className={styles.subcategoryHeader}>
                  <div>
                    <h4>Subcategorias</h4>
                    <p>Tags são separadas por vírgula e aparecem como sugestões ao criar serviços.</p>
                  </div>
                  <button type="button" className={styles.ghostButton} onClick={addSubcategory}>
                    <FaPlus /> Adicionar subcategoria
                  </button>
                </div>

                <div className={styles.subcategoryEditorList}>
                  {categoryDraft.subcategories.length === 0 ? (
                    <div className={styles.taxonomyEmpty}>
                      Adicione subcategorias para orientar melhor a criação de serviços.
                    </div>
                  ) : (
                    categoryDraft.subcategories.map((item, index) => (
                      <article key={`${item.slug}-${index}`} className={styles.subcategoryEditor}>
                        <div className={styles.subcategoryEditorTop}>
                          <strong>Subcategoria {index + 1}</strong>
                          <button type="button" onClick={() => removeSubcategory(index)}>
                            <FaTrash /> Remover
                          </button>
                        </div>
                        <div className={styles.formGrid}>
                          <label className={styles.formField}>
                            <span>Nome</span>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(event) => updateSubcategory(index, 'name', event.target.value)}
                              placeholder="Ex: Web"
                            />
                          </label>
                          <label className={styles.formField}>
                            <span>Slug</span>
                            <input
                              type="text"
                              value={item.slug}
                              onChange={(event) => updateSubcategory(index, 'slug', slugify(event.target.value))}
                              placeholder="web"
                            />
                          </label>
                        </div>
                        <label className={`${styles.formField} ${styles.formFieldFull}`}>
                          <span>Tags</span>
                          <textarea
                            rows={2}
                            value={(item.tags || []).join(', ')}
                            onChange={(event) => updateSubcategory(index, 'tags', parseTags(event.target.value))}
                            placeholder="sites, landing pages, react, next.js"
                          />
                        </label>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Usuários</span>
                <h3>Contas reais da plataforma</h3>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.ghostButton} onClick={() => setUserStatusFilter('active')}>
                  Ver ativos
                </button>
                <button type="button" className={styles.primaryButton} onClick={saveUser} disabled={!selectedUser || userSaving}>
                  <FaFloppyDisk /> {userSaving ? 'Salvando...' : 'Salvar usuário'}
                </button>
              </div>
            </div>

            <div className={styles.userStats}>
              <div className={styles.taxonomyStat}>
                <FaUsers />
                <span>Total filtrado</span>
                <strong>{usersTotal}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaCircleCheck />
                <span>Ativos</span>
                <strong>{usersStats.active}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaUserCheck />
                <span>Identidade verificada</span>
                <strong>{usersStats.identityVerified}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaBolt />
                <span>Freelancers / Clientes</span>
                <strong>{usersStats.freelancers}/{usersStats.clients}</strong>
              </div>
            </div>

            <div className={styles.userFilters}>
              <select value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}>
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="verified">Email verificado</option>
                <option value="unverified">Email pendente</option>
                <option value="identity_verified">Identidade verificada</option>
                <option value="identity_pending">Identidade em análise</option>
                <option value="identity_rejected">Identidade recusada</option>
                <option value="admin">Admins</option>
              </select>
              <select value={userTypeFilter} onChange={(event) => setUserTypeFilter(event.target.value)}>
                <option value="">Todos os tipos</option>
                <option value="FREELANCER">Freelancers</option>
                <option value="CLIENT">Clientes</option>
              </select>
            </div>

            <div className={styles.userManagementGrid}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Tipo</th>
                      <th>Atividade</th>
                      <th>Identidade</th>
                      <th>Uso</th>
                      <th>Admin</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading ? (
                      <tr>
                        <td colSpan="7">Carregando usuários...</td>
                      </tr>
                    ) : adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7">Nenhum usuário encontrado.</td>
                      </tr>
                    ) : (
                      adminUsers.map((user) => (
                        <tr
                          key={user.id}
                          className={selectedUserId === user.id ? styles.tableRowActive : ''}
                        >
                          <td>
                            <strong>{toUserName(user)}</strong>
                            <span>{user.email} · @{user.username || 'sem username'}</span>
                            <span>ID: {user.id}</span>
                          </td>
                          <td>
                            <em className={`${styles.badge} ${styles[user.userType ? 'neutral' : 'warning']}`}>
                              {USER_TYPE_LABEL[user.userType] || 'Sem tipo'}
                            </em>
                          </td>
                          <td>
                            <em className={`${styles.badge} ${styles[getStatusTone(ACTIVITY_LABEL[user.activityStatus] || 'Inativo')]}`}>
                              {ACTIVITY_LABEL[user.activityStatus] || 'Inativo'}
                            </em>
                            <span>Último acesso: {formatDate(user.lastSeenAt)}</span>
                          </td>
                          <td>
                            <em className={`${styles.badge} ${styles[getIdentityTone(getIdentityStatus(user))]}`}>
                              {IDENTITY_STATUS_LABEL[getIdentityStatus(user)] || 'Não iniciada'}
                            </em>
                            <span>{user.identityVerifiedAt ? `Aprovada em ${formatDate(user.identityVerifiedAt)}` : 'Sem aprovação'}</span>
                          </td>
                          <td>
                            <strong>{user.counts?.services || 0} serviços</strong>
                            <span>{user.counts?.orders || 0} pedidos · {user.counts?.messages || 0} msgs</span>
                          </td>
                          <td>
                            <label className={styles.adminToggle}>
                              <input
                                type="checkbox"
                                checked={Boolean(user.isAdmin)}
                                onChange={() => toggleAdmin(user)}
                                disabled={userSaving}
                              />
                              <span>{user.isAdmin ? 'Admin' : 'Usuário'}</span>
                            </label>
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <button type="button" onClick={() => setSelectedUserId(user.id)}>Editar</button>
                              <button type="button" onClick={() => openIdentityModal(user)} disabled={!user.accountVerification}>
                                Verificação
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <aside className={styles.userEditor}>
                {selectedUser ? (
                  <>
                    <div className={styles.userEditorHeader}>
                      <div className={styles.userAvatar}>
                        {toUserName(selectedUser).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className={styles.sectionKicker}>Editor</span>
                        <h4>{toUserName(selectedUser)}</h4>
                        <p>{selectedUser.email}</p>
                        <p>ID: {selectedUser.id}</p>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <label className={styles.formField}>
                        <span>Nome</span>
                        <input value={userDraft.firstName} onChange={(event) => updateUserDraft('firstName', event.target.value)} />
                      </label>
                      <label className={styles.formField}>
                        <span>Sobrenome</span>
                        <input value={userDraft.lastName} onChange={(event) => updateUserDraft('lastName', event.target.value)} />
                      </label>
                      <label className={`${styles.formField} ${styles.formFieldFull}`}>
                        <span>Email</span>
                        <input value={userDraft.email} onChange={(event) => updateUserDraft('email', event.target.value)} />
                      </label>
                      <label className={styles.formField}>
                        <span>Telefone</span>
                        <input value={userDraft.phone} onChange={(event) => updateUserDraft('phone', event.target.value)} />
                      </label>
                      <label className={styles.formField}>
                        <span>Username</span>
                        <input value={userDraft.username} onChange={(event) => updateUserDraft('username', event.target.value.toLowerCase())} />
                      </label>
                      <label className={`${styles.formField} ${styles.formFieldFull}`}>
                        <span>Headline</span>
                        <input value={userDraft.headline} onChange={(event) => updateUserDraft('headline', event.target.value)} />
                      </label>
                      <label className={styles.formField}>
                        <span>Localização</span>
                        <input value={userDraft.location} onChange={(event) => updateUserDraft('location', event.target.value)} />
                      </label>
                      <label className={styles.formField}>
                        <span>Tipo de conta</span>
                        <select value={userDraft.userType} onChange={(event) => updateUserDraft('userType', event.target.value)}>
                          <option value="">Sem tipo</option>
                          <option value="FREELANCER">Freelancer</option>
                          <option value="CLIENT">Cliente</option>
                        </select>
                      </label>
                    </div>

                    <div className={styles.userSwitches}>
                      <label>
                        <input
                          type="checkbox"
                          checked={userDraft.isAdmin}
                          onChange={(event) => updateUserDraft('isAdmin', event.target.checked)}
                        />
                        <span>Administrador</span>
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={userDraft.emailVerified}
                          onChange={(event) => updateUserDraft('emailVerified', event.target.checked)}
                        />
                        <span>Email verificado</span>
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={userDraft.onboarded}
                          onChange={(event) => updateUserDraft('onboarded', event.target.checked)}
                        />
                        <span>Onboarding concluído</span>
                      </label>
                    </div>

                    <button type="button" className={styles.primaryButton} onClick={saveUser} disabled={userSaving}>
                      <FaFloppyDisk /> {userSaving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </>
                ) : (
                  <div className={styles.taxonomyEmpty}>
                    Selecione um usuário para editar permissões, perfil e estado da conta.
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}

        {activeTab === 'finance' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Financeiro</span>
                <h3>Pagamentos, repasses e falhas operacionais</h3>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.ghostButton} onClick={loadAdminPayments} disabled={paymentsLoading}>
                  {paymentsLoading ? 'Atualizando...' : 'Atualizar'}
                </button>
              </div>
            </div>

            <div className={styles.financeGrid}>
              <div className={styles.financeCard}>
                <FaMoneyBillTransfer />
                <span>Retido para repasse</span>
                <strong>{formatCents(financeSummary.heldCents)}</strong>
                <p>{financeReleaseCounts.HELD || 0} pagamentos em hold</p>
              </div>
              <div className={styles.financeCard}>
                <FaCreditCard />
                <span>GMV confirmado</span>
                <strong>{formatCents(financeSummary.succeededCents)}</strong>
                <p>{financePaymentCounts.SUCCEEDED || 0} pagamentos pagos</p>
              </div>
              <div className={styles.financeCard}>
                <FaFileInvoiceDollar />
                <span>Comissão capturada</span>
                <strong>{formatCents(financeSummary.platformFeeCents)}</strong>
                <p>Take rate aplicado nos pedidos</p>
              </div>
              <div className={styles.financeCard}>
                <FaCreditCard />
                <span>Taxa Stripe estimada</span>
                <strong>{formatCents(financeSummary.estimatedStripeFeeCents)}</strong>
                <p>Estimativa por Pix/cartão</p>
              </div>
              <div className={styles.financeCard}>
                <FaArrowTrendUp />
                <span>Líquido da plataforma</span>
                <strong>{formatCents(financeSummary.platformNetCents)}</strong>
                <p>Comissão menos taxa Stripe estimada</p>
              </div>
              <div className={styles.financeCard}>
                <FaTriangleExclamation />
                <span>Falhas de repasse</span>
                <strong>{formatCents(financeSummary.failedTransferCents)}</strong>
                <p>{financeReleaseCounts.FAILED || 0} itens para revisar</p>
              </div>
            </div>

            <div className={styles.financeFilters}>
              <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
                <option value="">Todos os pagamentos</option>
                {Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select value={releaseStatusFilter} onChange={(event) => setReleaseStatusFilter(event.target.value)}>
                <option value="">Todos os repasses</option>
                {Object.entries(RELEASE_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <span>{adminPaymentsTotal} registros encontrados</span>
            </div>

            <div className={styles.ledger}>
              {paymentsLoading ? (
                <div className={styles.taxonomyEmpty}>Carregando pagamentos...</div>
              ) : adminPayments.length ? (
                adminPayments.map((payment) => (
                <article key={payment.id} className={styles.ledgerRow}>
                  <div>
                    <span>#{payment.id.slice(-8).toUpperCase()}</span>
                    <strong>{payment.service?.title || 'Pagamento Hivelancers'}</strong>
                    <p>
                      {toUserName(payment.client)} contratou {toUserName(payment.freelancer)}
                    </p>
                  </div>
                  <strong>{formatCents(payment.amountCents)}</strong>
                  <div className={styles.ledgerEconomics}>
                    <span>Plataforma</span>
                    <strong>{formatCents(payment.economics?.platformNetCents)}</strong>
                    <p>Stripe: {formatCents(payment.economics?.estimatedStripeFeeCents)}</p>
                  </div>
                  <em className={`${styles.badge} ${getStatusTone(PAYMENT_STATUS_LABEL[payment.status] || payment.status)}`}>
                    {PAYMENT_STATUS_LABEL[payment.status] || payment.status}
                  </em>
                  <em className={`${styles.badge} ${getStatusTone(RELEASE_STATUS_LABEL[payment.releaseStatus] || payment.releaseStatus)}`}>
                    {RELEASE_STATUS_LABEL[payment.releaseStatus] || payment.releaseStatus}
                  </em>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    disabled={
                      retryingPaymentId === payment.id ||
                      payment.status !== 'SUCCEEDED' ||
                      payment.releaseStatus === 'TRANSFERRED' ||
                      payment.releaseStatus === 'NOT_REQUIRED'
                    }
                    onClick={async () => {
                      setRetryingPaymentId(payment.id);
                      try {
                        await retryAdminPaymentTransfer(payment.id);
                        toast.success('Repasse reprocessado.');
                        await loadAdminPayments();
                      } catch (err) {
                        toast.error(err.message);
                      } finally {
                        setRetryingPaymentId('');
                      }
                    }}
                  >
                    {retryingPaymentId === payment.id ? 'Reprocessando...' : 'Reprocessar'}
                  </button>
                </article>
                ))
              ) : (
                <div className={styles.taxonomyEmpty}>Nenhum pagamento encontrado neste filtro.</div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'support' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Suporte</span>
                <h3>Tickets enviados por clientes e freelancers</h3>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.ghostButton} onClick={loadAdminTickets} disabled={ticketsLoading}>
                  {ticketsLoading ? 'Atualizando...' : 'Atualizar'}
                </button>
                <button type="button" className={styles.primaryButton} onClick={saveTicket} disabled={!selectedTicket || ticketSaving}>
                  <FaFloppyDisk /> {ticketSaving ? 'Salvando...' : 'Salvar ticket'}
                </button>
              </div>
            </div>

            <div className={styles.userStats}>
              <div className={styles.taxonomyStat}>
                <FaTicket />
                <span>Total filtrado</span>
                <strong>{adminTicketsTotal}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaHeadset />
                <span>Em atendimento</span>
                <strong>{ticketStats.open}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaTriangleExclamation />
                <span>Sem resposta</span>
                <strong>{ticketStats.unanswered}</strong>
              </div>
              <div className={styles.taxonomyStat}>
                <FaCircleCheck />
                <span>Respondidos</span>
                <strong>{ticketStats.answered}</strong>
              </div>
            </div>

            <div className={styles.userFilters}>
              <select value={ticketStatusFilter} onChange={(event) => setTicketStatusFilter(event.target.value)}>
                <option value="all">Todos os status</option>
                {Object.entries(SUPPORT_TICKET_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select value={ticketPriorityFilter} onChange={(event) => setTicketPriorityFilter(event.target.value)}>
                <option value="all">Todas as prioridades</option>
                {Object.entries(SUPPORT_TICKET_PRIORITY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className={styles.supportDesk}>
              <div className={styles.supportQueue}>
                {ticketsLoading ? (
                  <div className={styles.taxonomyEmpty}>Carregando tickets...</div>
                ) : adminTickets.length === 0 ? (
                  <div className={styles.taxonomyEmpty}>Nenhum ticket encontrado neste filtro.</div>
                ) : (
                  adminTickets.map((ticket) => {
                    const normalizedStatus = normalizeSupportTicketStatus(ticket.status);
                    return (
                      <button
                        type="button"
                        key={ticket.id}
                        className={`${styles.supportTicketCard} ${selectedTicketId === ticket.id ? styles.supportTicketCardActive : ''}`}
                        onClick={() => {
                          setSelectedTicketId(ticket.id);
                          setTicketDraft(toTicketDraft(ticket));
                        }}
                      >
                        <span className={styles.supportTicketCode}>{ticket.code || ticket.id}</span>
                        <strong>{ticket.subject}</strong>
                        <p>{ticket.description}</p>
                        <div className={styles.supportTicketBadges}>
                          <em className={`${styles.badge} ${styles[TICKET_STATUS_TONE[normalizedStatus] || 'neutral']}`}>
                            {SUPPORT_TICKET_STATUS_LABEL[normalizedStatus] || normalizedStatus}
                          </em>
                          <em className={`${styles.badge} ${styles[TICKET_PRIORITY_TONE[ticket.priority] || 'neutral']}`}>
                            {SUPPORT_TICKET_PRIORITY_LABEL[ticket.priority] || ticket.priority}
                          </em>
                          {ticket.attachment?.url && (
                            <em className={`${styles.badge} ${styles.neutral}`}>
                              <FaPaperclip /> Anexo
                            </em>
                          )}
                          {ticket.publicReply && (
                            <em className={`${styles.badge} ${styles.success}`}>
                              <FaCircleCheck /> Respondido
                            </em>
                          )}
                        </div>
                        <div className={styles.supportTicketMeta}>
                          <span>{toRequesterName(ticket)}</span>
                          <span>{SUPPORT_TICKET_CATEGORY_LABEL[ticket.category] || ticket.category || 'Suporte'}</span>
                          <span>{formatDate(ticket.updatedAt || ticket.createdAt)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <aside className={styles.supportInspector}>
                {selectedTicket ? (
                  <>
                    <div className={styles.supportInspectorHeader}>
                      <div className={styles.userAvatar}><FaLifeRing /></div>
                      <div>
                        <span className={styles.sectionKicker}>Atendimento</span>
                        <h4>{selectedTicket.subject}</h4>
                        <p>{toRequesterName(selectedTicket)} · {selectedTicket.requester?.email || 'sem email'}</p>
                        <strong>{selectedTicket.code || selectedTicket.id}</strong>
                      </div>
                    </div>

                    <div className={styles.ticketDetailBlock}>
                      <span>Descrição enviada</span>
                      <p>{selectedTicket.description}</p>
                    </div>

                    {selectedTicket.attachment?.url && (
                      <div className={styles.ticketAttachmentBlock}>
                        <div>
                          <span>Evidência anexada</span>
                          <strong>{selectedTicket.attachment.name || 'Imagem enviada pelo usuário'}</strong>
                        </div>
                        <img src={selectedTicket.attachment.url} alt="Evidência anexada ao ticket" />
                        <a href={selectedTicket.attachment.url} target="_blank" rel="noreferrer">
                          <FaArrowUpRightFromSquare /> Abrir imagem
                        </a>
                      </div>
                    )}

                    <div className={styles.supportMetaGrid}>
                      <div>
                        <span>Categoria</span>
                        <strong>{SUPPORT_TICKET_CATEGORY_LABEL[selectedTicket.category] || selectedTicket.category || 'Suporte'}</strong>
                      </div>
                      <div>
                        <span>Referência</span>
                        <strong>{getTicketReference(selectedTicket)}</strong>
                      </div>
                      <div>
                        <span>Criado em</span>
                        <strong>{formatDate(selectedTicket.createdAt)}</strong>
                      </div>
                      <div>
                        <span>Contato</span>
                        <strong>{selectedTicket.contactPreference || 'EMAIL'}</strong>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <label className={styles.formField}>
                        <span>Status</span>
                        <select value={activeTicketDraft.status} onChange={(event) => updateTicketDraft('status', event.target.value)}>
                          {Object.entries(SUPPORT_TICKET_STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.formField}>
                        <span>Prioridade</span>
                        <select value={activeTicketDraft.priority} onChange={(event) => updateTicketDraft('priority', event.target.value)}>
                          {Object.entries(SUPPORT_TICKET_PRIORITY_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <label className={`${styles.formField} ${styles.formFieldFull}`}>
                        <span>Resposta ao usuário</span>
                        <textarea
                          rows={5}
                          value={activeTicketDraft.publicReply}
                          onChange={(event) => updateTicketDraft('publicReply', event.target.value)}
                          placeholder="Escreva a resposta que será exibida para o usuário no acompanhamento do ticket."
                        />
                      </label>
                      <label className={`${styles.formField} ${styles.formFieldFull}`}>
                        <span>Nota interna</span>
                        <textarea
                          rows={5}
                          value={activeTicketDraft.adminNote}
                          onChange={(event) => updateTicketDraft('adminNote', event.target.value)}
                          placeholder="Observação operacional apenas para o time admin."
                        />
                      </label>
                    </div>

                    <button type="button" className={styles.primaryButton} onClick={saveTicket} disabled={ticketSaving}>
                      <FaFloppyDisk /> {ticketSaving ? 'Salvando...' : 'Salvar atendimento'}
                    </button>
                  </>
                ) : (
                  <div className={styles.taxonomyEmpty}>
                    <FaInbox /> Selecione um ticket para revisar detalhes, prioridade e status.
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}

      </section>

      <section className={styles.bottomGrid}>
        <SpotlightCard className={styles.securityCard}>
          <FaShieldHalved />
          <div>
            <span>Verificação</span>
            <strong>{formatNumber(adminOverview.identityPending)} pendentes</strong>
            <p>Contas aguardando revisão documental dentro do fluxo admin.</p>
          </div>
        </SpotlightCard>

        <SpotlightCard className={styles.securityCard}>
          <FaBolt />
          <div>
            <span>Atendimento</span>
            <strong>{pluralize(adminOverview.ticketsUnanswered, 'ticket')} sem resposta</strong>
            <p>Primeira resposta esperada em até 24h úteis após abertura.</p>
          </div>
        </SpotlightCard>

        <SpotlightCard className={styles.securityCard}>
          <FaBan />
          <div>
            <span>Marketplace</span>
            <strong>{pluralize(adminOverview.servicesDraft, 'serviço')} em rascunho</strong>
            <p>Serviços cadastrados que ainda não aparecem como publicados.</p>
          </div>
        </SpotlightCard>
      </section>

      {identityModalUser && (
        <div className={styles.reviewModalOverlay} onClick={closeIdentityModal}>
          <section className={styles.reviewModal} role="dialog" aria-modal="true" aria-labelledby="identity-review-title" onClick={(event) => event.stopPropagation()}>
            <header className={styles.reviewModalHeader}>
              <div>
                <span className={styles.sectionKicker}>Revisão de identidade</span>
                <h3 id="identity-review-title">{toUserName(identityModalUser)}</h3>
                <p>{identityModalUser.email} · ID: {identityModalUser.id}</p>
              </div>
              <button type="button" onClick={closeIdentityModal} aria-label="Fechar revisão" disabled={verificationSaving}>
                <FaXmark />
              </button>
            </header>

            <div className={styles.reviewModalStatus}>
              <em className={`${styles.badge} ${styles[getIdentityTone(identityModalStatus)]}`}>
                {IDENTITY_STATUS_LABEL[identityModalStatus] || 'Não iniciada'}
              </em>
              <span>
                {identityModalUser.identityVerifiedAt
                  ? `Aprovada em ${formatDate(identityModalUser.identityVerifiedAt)}`
                  : identityModalUser.accountVerification?.submittedAt
                    ? `Enviada em ${formatDate(identityModalUser.accountVerification.submittedAt)}`
                    : 'Sem envio para análise'}
              </span>
            </div>

            {identityModalUser.accountVerification ? (
              <>
                <div className={styles.identityGrid}>
                  <div>
                    <span>Nome legal</span>
                    <strong>{identityModalUser.accountVerification.legalName}</strong>
                  </div>
                  <div>
                    <span>CPF vinculado</span>
                    <strong>{maskCpf(identityModalUser.accountVerification.cpf)}</strong>
                  </div>
                  <div>
                    <span>Documento enviado</span>
                    <strong>{identityModalUser.accountVerification.documentType} · {maskCpf(identityModalUser.accountVerification.documentNumber)}</strong>
                  </div>
                  <div>
                    <span>Telefone</span>
                    <strong>{identityModalUser.accountVerification.phone || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span>Cidade/UF</span>
                    <strong>
                      {[identityModalUser.accountVerification.addressCity, identityModalUser.accountVerification.addressState].filter(Boolean).join(' · ') || 'Não informado'}
                    </strong>
                  </div>
                  <div>
                    <span>Endereço</span>
                    <strong>{identityModalUser.accountVerification.addressLine || 'Não informado'}</strong>
                  </div>
                </div>

                <div className={styles.identityLinks}>
                  {identityModalDocuments.length > 0 ? identityModalDocuments.map(([label, url]) => (
                    <div key={label} className={styles.identityDocument}>
                      <div>
                        <strong>{label}</strong>
                        <span>{isPdfUrl(url) ? 'PDF anexado' : 'Imagem anexada'}</span>
                      </div>
                      <div>
                        <a href={url} target="_blank" rel="noreferrer">
                          <FaArrowUpRightFromSquare /> Abrir
                        </a>
                        <a href={getDownloadUrl(url)} target="_blank" rel="noreferrer" download>
                          <FaDownload /> Baixar
                        </a>
                      </div>
                    </div>
                  )) : (
                    <div className={styles.taxonomyEmpty}>Nenhum documento anexado.</div>
                  )}
                </div>

                {identityModalStatus === 'VERIFIED' && (
                  <div className={`${styles.identityDecision} ${styles.identityDecisionSuccess}`}>
                    <FaCircleCheck />
                    <div>
                      <strong>Usuário verificado com sucesso</strong>
                      <span>Esta conta já passou pela análise de identidade.</span>
                    </div>
                  </div>
                )}

                {identityModalStatus === 'REJECTED' && (
                  <div className={`${styles.identityDecision} ${styles.identityDecisionDanger}`}>
                    <FaBan />
                    <div>
                      <strong>Verificação recusada</strong>
                      <span>{identityModalUser.accountVerification.reviewNote || 'O usuário precisa corrigir os dados ou reenviar documentos.'}</span>
                    </div>
                  </div>
                )}

                {identityRejecting && identityModalStatus === 'PENDING' && (
                  <label className={styles.reviewReason}>
                    <span>Motivo da reprovação</span>
                    <textarea
                      value={identityReviewNote}
                      onChange={(event) => setIdentityReviewNote(event.target.value)}
                      placeholder="Ex: CPF não bate com o documento, imagem ilegível, comprovante de endereço ausente..."
                      rows={5}
                    />
                    <small>Esse texto será salvo no usuário para orientar o próximo envio.</small>
                  </label>
                )}

                <footer className={styles.reviewModalActions}>
                  <button type="button" className={styles.ghostButton} onClick={closeIdentityModal} disabled={verificationSaving}>
                    Fechar
                  </button>

                  {identityModalStatus === 'PENDING' && !identityRejecting && (
                    <>
                      <button type="button" className={styles.dangerButton} onClick={() => setIdentityRejecting(true)} disabled={verificationSaving}>
                        <FaBan /> Reprovar
                      </button>
                      <button type="button" className={styles.primaryButton} onClick={() => reviewIdentity('VERIFIED')} disabled={verificationSaving}>
                        <FaCircleCheck /> {verificationSaving ? 'Aprovando...' : 'Aprovar identidade'}
                      </button>
                    </>
                  )}

                  {identityModalStatus === 'PENDING' && identityRejecting && (
                    <>
                      <button type="button" className={styles.ghostButton} onClick={() => setIdentityRejecting(false)} disabled={verificationSaving}>
                        Cancelar reprovação
                      </button>
                      <button type="button" className={styles.dangerButton} onClick={() => reviewIdentity('REJECTED')} disabled={verificationSaving}>
                        <FaBan /> {verificationSaving ? 'Reprovando...' : 'Confirmar reprovação'}
                      </button>
                    </>
                  )}
                </footer>
              </>
            ) : (
              <div className={styles.taxonomyEmpty}>Este usuário ainda não enviou CPF e documentos.</div>
            )}
          </section>
        </div>
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Admin;

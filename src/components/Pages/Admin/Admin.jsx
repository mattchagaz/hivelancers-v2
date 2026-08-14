import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaArrowTrendUp,
  FaArrowUpRightFromSquare,
  FaBan,
  FaBolt,
  FaCircleCheck,
  FaFileInvoiceDollar,
  FaGift,
  FaHeadset,
  FaHeartPulse,
  FaPix,
  FaDownload,
  FaLayerGroup,
  FaMagnifyingGlass,
  FaMedal,
  FaShieldHalved,
  FaTags,
  FaTicket,
  FaTriangleExclamation,
  FaUserCheck,
  FaUsers,
  FaXmark,
} from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import { useAuth } from '../../../contexts/authContextStore';
import { formatPersonName } from '../../../utils/formatters';
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
  listAdminAuditLogs,
  listAdminCoupons,
  listRewardLevels,
  updateAdminCoupon,
  updateRewardLevel,
} from '../../../services/admin';
import {
  listAdminDisputes,
  resolveAdminDispute,
} from '../../../services/orders';
import {
  listAdminUsers,
  openAdminVerificationDocument,
  reviewAdminAccountVerification,
  updateAdminUser,
} from '../../../services/users';
import {
  listAdminPayments,
} from '../../../services/payments';
import {
  listAdminSupportTickets,
  normalizeSupportTicketStatus,
  updateAdminSupportTicket,
} from '../../../services/tickets';
import styles from './Admin.module.css';

import {
  formatNumber,
  pluralize,
  listItems,
  listTotal,
  summaryValue,
  normalizeCode,
  slugify,
  emptyCategoryDraft,
  toCategoryDraft,
  parseTags,
  IDENTITY_STATUS_LABEL,
  emptyUserDraft,
  emptyServiceDraft,
  emptyCouponDraft,
  emptyLevelDraft,
  toUserName,
  formatDate,
  parseMoneyInput,
  toUserDraft,
  getIdentityStatus,
  maskCpf,
  toServiceDraft,
  toCouponDraft,
  toLevelDraft,
  getIdentityTone,
  emptyTicketDraft,
  toTicketDraft,
  emptyAdminOverview,
  isTicketUnanswered,
} from './Admin.helpers';
import { useIsMobileViewport } from '../../../hooks/useIsMobileViewport';
import { AdminContext } from './AdminContext';
import OverviewTab from './tabs/OverviewTab';
import ServicesTab from './tabs/ServicesTab';
import PromotionsTab from './tabs/PromotionsTab';
import LevelsTab from './tabs/LevelsTab';
import TaxonomyTab from './tabs/TaxonomyTab';
import UsersTab from './tabs/UsersTab';
import FinanceTab from './tabs/FinanceTab';
import DisputesTab from './tabs/DisputesTab';
import SupportTab from './tabs/SupportTab';
import AuditTab from './tabs/AuditTab';
import SystemHealthTab from './tabs/SystemHealthTab';
import PixSimulatorTab from './tabs/PixSimulatorTab';

const tabs = [
  { id: 'overview', label: 'Visão geral', icon: FaArrowTrendUp },
  { id: 'services', label: 'Serviços', icon: FaLayerGroup },
  { id: 'promotions', label: 'Promoções', icon: FaGift },
  { id: 'levels', label: 'Níveis', icon: FaMedal },
  { id: 'taxonomy', label: 'Taxonomia', icon: FaTags },
  { id: 'users', label: 'Usuários', icon: FaUsers },
  { id: 'finance', label: 'Financeiro', icon: FaFileInvoiceDollar },
  { id: 'pix-simulator', label: 'Simular Pix', icon: FaPix },
  { id: 'disputes', label: 'Disputas', icon: FaTriangleExclamation },
  { id: 'support', label: 'Suporte', icon: FaHeadset },
  { id: 'health', label: 'Saúde do sistema', icon: FaHeartPulse },
  { id: 'audit', label: 'Auditoria', icon: FaShieldHalved },
];

const ADMIN_PAGE_SIZE = 10;

function Admin() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobileViewport();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabs.some((tab) => tab.id === requestedTab) ? requestedTab : 'overview'
  );
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categorySaving, setCategorySaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryDraft, setCategoryDraft] = useState(emptyCategoryDraft);
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSaving, setUserSaving] = useState(false);
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [identityModalUserId, setIdentityModalUserId] = useState('');
  const [identityRejecting, setIdentityRejecting] = useState(false);
  const [identityReviewNote, setIdentityReviewNote] = useState('');
  const [userAccountState, setUserAccountState] = useState('active');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userDraft, setUserDraft] = useState(emptyUserDraft);
  const [adminPayments, setAdminPayments] = useState([]);
  const [adminFinanceSummary, setAdminFinanceSummary] = useState(null);
  const [adminPaymentsTotal, setAdminPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [releaseStatusFilter, setReleaseStatusFilter] = useState('');
  const [retryingPaymentId, setRetryingPaymentId] = useState('');
  const [approvingPaymentId, setApprovingPaymentId] = useState('');
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
  const [adminDisputes, setAdminDisputes] = useState([]);
  const [adminDisputesTotal, setAdminDisputesTotal] = useState(0);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputeStatusFilter, setDisputeStatusFilter] = useState('OPEN');
  const [selectedDisputeId, setSelectedDisputeId] = useState('');
  const [disputeOutcome, setDisputeOutcome] = useState('REFUND_CLIENT');
  const [disputeResolutionNote, setDisputeResolutionNote] = useState('');
  const [disputeSaving, setDisputeSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsTotal, setAuditLogsTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');
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
        listAdminUsers({ accountState: 'active', status: 'all', pageSize: 100 }),
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
    setUsersPage(1);
  }, [search, userAccountState, userStatusFilter, userTypeFilter]);

  useEffect(() => {
    if (activeTab !== 'users') return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setUsersLoading(true);
      try {
        const data = await listAdminUsers({
          q: search.trim() || undefined,
          accountState: userAccountState,
          status: userStatusFilter,
          userType: userTypeFilter || undefined,
          page: usersPage,
          pageSize: ADMIN_PAGE_SIZE,
        });
        if (cancelled) return;
        const items = listItems(data, ['users']);
        const total = listTotal(data, items);
        setAdminUsers(items);
        setUsersTotal(total);
        const totalPages = data.totalPages || Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
        setUsersTotalPages(totalPages);
        if (usersPage > totalPages) setUsersPage(totalPages);
        setSelectedUserId((current) => {
          if (userAccountState === 'deleted') return '';
          return items.some((item) => item.id === current) ? current : items[0]?.id || '';
        });
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
  }, [activeTab, search, userAccountState, userStatusFilter, userTypeFilter, usersPage]);

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
        page: paymentsPage,
        pageSize: ADMIN_PAGE_SIZE,
      });
      setAdminPayments(data.items || []);
      setAdminFinanceSummary(data.summary || null);
      setAdminPaymentsTotal(data.total || 0);
      const totalPages = data.totalPages || Math.max(1, Math.ceil((data.total || 0) / ADMIN_PAGE_SIZE));
      setPaymentsTotalPages(totalPages);
      if (paymentsPage > totalPages) setPaymentsPage(totalPages);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentStatusFilter, paymentsPage, releaseStatusFilter, search]);

  useEffect(() => {
    setPaymentsPage(1);
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
      setSelectedCouponId((current) => {
        if (current === 'new') return current;
        if (current && data.items?.some((coupon) => coupon.id === current)) return current;
        return data.items?.[0]?.id || 'new';
      });
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

  const loadDisputes = useCallback(async () => {
    setDisputesLoading(true);
    try {
      const data = await listAdminDisputes({
        ...(disputeStatusFilter ? { status: disputeStatusFilter } : {}),
        pageSize: 50,
      });
      const items = data.items || [];
      setAdminDisputes(items);
      setAdminDisputesTotal(data.total || 0);
      setSelectedDisputeId((current) =>
        current && items.some((dispute) => dispute.id === current)
          ? current
          : items[0]?.id || ''
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDisputesLoading(false);
    }
  }, [disputeStatusFilter]);

  useEffect(() => {
    if (activeTab !== 'disputes') return undefined;
    loadDisputes();
    return undefined;
  }, [activeTab, loadDisputes]);

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const data = await listAdminAuditLogs({
        ...(auditActionFilter.trim() ? { action: auditActionFilter.trim() } : {}),
        page: auditPage,
        pageSize: ADMIN_PAGE_SIZE,
      });
      setAuditLogs(data.items || []);
      setAuditLogsTotal(data.total || 0);
      const totalPages = data.totalPages || Math.max(1, Math.ceil((data.total || 0) / ADMIN_PAGE_SIZE));
      setAuditTotalPages(totalPages);
      if (auditPage > totalPages) setAuditPage(totalPages);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAuditLoading(false);
    }
  }, [auditActionFilter, auditPage]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditActionFilter]);

  useEffect(() => {
    if (activeTab !== 'audit') return undefined;
    const timer = setTimeout(loadAuditLogs, 250);
    return () => clearTimeout(timer);
  }, [activeTab, loadAuditLogs]);

  const selectedCategory = categories.find((item) => item.id === selectedCategoryId);
  const selectedUser = adminUsers.find((item) => item.id === selectedUserId);
  const identityModalUser = adminUsers.find((item) => item.id === identityModalUserId);
  const selectedService = adminServices.find((item) => item.id === selectedServiceId);
  const selectedCoupon = coupons.find((item) => item.id === selectedCouponId);
  const selectedLevel = freelancerLevels.find((item) => item.id === selectedLevelId);
  const selectedTicket = adminTickets.find((item) => item.id === selectedTicketId);
  const selectedDispute = adminDisputes.find((item) => item.id === selectedDisputeId);
  const activeTicketDraft = selectedTicket && ticketDraft.ticketId === selectedTicket.id
    ? ticketDraft
    : toTicketDraft(selectedTicket);
  const selectedServiceCategory = categories.find((item) => item.id === serviceDraft.categoryId);
  const selectedServiceSubcategories = selectedServiceCategory?.subcategories || [];
  const identityModalDocuments = useMemo(() => {
    const verification = identityModalUser?.accountVerification;
    if (!verification) return [];

    return [
      ['Frente do documento', 'FRONT', verification.documentFrontUrl],
      ['Verso do documento', 'BACK', verification.documentBackUrl],
      ['Comprovante de endereço', 'PROOF_OF_ADDRESS', verification.proofOfAddressUrl],
    ].filter(([, , url]) => Boolean(url));
  }, [identityModalUser?.accountVerification]);

  const accessIdentityDocument = async (kind, download = false) => {
    if (!identityModalUser?.id) return;
    try {
      await openAdminVerificationDocument(identityModalUser.id, kind, { download });
    } catch (error) {
      toast.error(error.message);
    }
  };
  const identityModalStatus = getIdentityStatus(identityModalUser);
  const usersStats = useMemo(() => {
    const admins = adminUsers.filter((user) => user.isAdmin).length;
    const active = adminUsers.filter((user) => user.activityStatus !== 'inactive').length;
    const freelancers = adminUsers.filter((user) => user.userType === 'FREELANCER').length;
    const clients = adminUsers.filter((user) => user.userType === 'CLIENT').length;
    const identityVerified = adminUsers.filter((user) => getIdentityStatus(user) === 'VERIFIED').length;
    return { admins, active, freelancers, clients, identityVerified };
  }, [adminUsers]);
  const deletedUsersStats = useMemo(() => {
    const orders = adminUsers.reduce((total, user) => total + (user.counts?.orders || 0), 0);
    const messages = adminUsers.reduce((total, user) => total + (user.counts?.messages || 0), 0);
    const withHistory = adminUsers.filter((user) => (
      (user.counts?.orders || 0) > 0
      || (user.counts?.messages || 0) > 0
      || (user.counts?.services || 0) > 0
    )).length;
    return { orders, messages, withHistory };
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
    const nextValue = field === 'firstName' || field === 'lastName'
      ? formatPersonName(value)
      : value;
    setUserDraft((current) => ({ ...current, [field]: nextValue }));
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
      const isCreating = selectedCouponId === 'new' || !selectedCoupon;
      const saved = isCreating
        ? await createAdminCoupon(couponPayload())
        : await updateAdminCoupon(selectedCouponId, couponPayload());
      setCoupons((current) =>
        isCreating
          ? [saved, ...current]
          : current.map((coupon) => (coupon.id === saved.id ? saved : coupon))
      );
      setSelectedCouponId(saved.id);
      toast.success(isCreating ? 'Cupom criado.' : 'Cupom atualizado.');
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

  const saveDisputeResolution = async () => {
    if (!selectedDispute || selectedDispute.status !== 'OPEN' || disputeSaving) return;
    if (disputeResolutionNote.trim().length < 10) {
      toast.error('Registre a fundamentação da decisão com pelo menos 10 caracteres.');
      return;
    }

    setDisputeSaving(true);
    try {
      await resolveAdminDispute(selectedDispute.id, {
        outcome: disputeOutcome,
        note: disputeResolutionNote.trim(),
      });
      setDisputeResolutionNote('');
      toast.success(
        disputeOutcome === 'REFUND_CLIENT'
          ? 'Disputa resolvida com reembolso ao cliente.'
          : 'Disputa resolvida com liberação ao freelancer.'
      );
      await loadDisputes();
      await loadAuditLogs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDisputeSaving(false);
    }
  };

  const adminContextValue = {
    // overview
    loadAdminOverview,
    overviewLoading,
    overviewSignals,
    adminActionItems,
    setActiveTab,
    // services
    loadAdminServices,
    servicesLoading,
    saveAdminService,
    selectedService,
    serviceSaving,
    adminServicesTotal,
    adminServicesSummary,
    serviceStatusFilter,
    setServiceStatusFilter,
    serviceCategoryFilter,
    setServiceCategoryFilter,
    categories,
    adminServices,
    selectedServiceId,
    setSelectedServiceId,
    archiveAdminService,
    permanentlyDeleteAdminService,
    serviceDraft,
    updateServiceDraft,
    selectedServiceSubcategories,
    // promotions
    loadCoupons,
    couponsLoading,
    startNewCoupon,
    couponsTotal,
    couponsSummary,
    couponStatusFilter,
    setCouponStatusFilter,
    coupons,
    selectedCouponId,
    setSelectedCouponId,
    couponDraft,
    updateCouponDraft,
    selectedCoupon,
    removeCoupon,
    couponSaving,
    saveCoupon,
    // levels
    loadFreelancerLevels,
    levelsLoading,
    startNewLevel,
    freelancerLevels,
    selectedLevelId,
    setSelectedLevelId,
    levelDraft,
    updateLevelDraft,
    selectedLevel,
    removeLevel,
    levelSaving,
    saveLevel,
    // taxonomy
    loadCategories,
    categoriesLoading,
    startNewCategory,
    taxonomyStats,
    selectedCategoryId,
    setSelectedCategoryId,
    categoryDraft,
    updateDraft,
    selectedCategory,
    removeCategory,
    categorySaving,
    saveCategory,
    addSubcategory,
    removeSubcategory,
    updateSubcategory,
    // users
    userAccountState,
    setUserAccountState,
    setUserStatusFilter,
    setUserTypeFilter,
    setSelectedUserId,
    saveUser,
    selectedUser,
    userSaving,
    usersTotal,
    usersPage,
    setUsersPage,
    usersTotalPages,
    deletedUsersStats,
    usersStats,
    userStatusFilter,
    userTypeFilter,
    usersLoading,
    adminUsers,
    selectedUserId,
    toggleAdmin,
    openIdentityModal,
    userDraft,
    updateUserDraft,
    currentUser,
    // finance
    loadAdminPayments,
    paymentsLoading,
    financeSummary,
    financeReleaseCounts,
    financePaymentCounts,
    paymentStatusFilter,
    setPaymentStatusFilter,
    releaseStatusFilter,
    setReleaseStatusFilter,
    adminPaymentsTotal,
    adminPayments,
    paymentsPage,
    setPaymentsPage,
    paymentsTotalPages,
    retryingPaymentId,
    setRetryingPaymentId,
    approvingPaymentId,
    setApprovingPaymentId,
    // disputes
    loadDisputes,
    disputesLoading,
    saveDisputeResolution,
    selectedDispute,
    disputeSaving,
    disputeStatusFilter,
    setDisputeStatusFilter,
    adminDisputesTotal,
    adminDisputes,
    selectedDisputeId,
    setSelectedDisputeId,
    setDisputeResolutionNote,
    disputeOutcome,
    setDisputeOutcome,
    disputeResolutionNote,
    // support
    loadAdminTickets,
    ticketsLoading,
    saveTicket,
    selectedTicket,
    ticketSaving,
    adminTicketsTotal,
    ticketStats,
    ticketStatusFilter,
    setTicketStatusFilter,
    ticketPriorityFilter,
    setTicketPriorityFilter,
    adminTickets,
    selectedTicketId,
    setSelectedTicketId,
    setTicketDraft,
    activeTicketDraft,
    updateTicketDraft,
    // audit
    loadAuditLogs,
    auditLoading,
    auditActionFilter,
    setAuditActionFilter,
    auditLogsTotal,
    auditLogs,
    auditPage,
    setAuditPage,
    auditTotalPages,
  };

  // No mobile, o hero/statGrid/bottomGrid só aparecem na aba "Visão geral"
  // (nas outras abas o mockup vai direto de tabs pra busca + conteúdo); no
  // desktop eles continuam sempre visíveis, como já era.
  const MOBILE_HIDDEN_SEARCH_TABS = ['overview', 'services'];
  const showHeroBlocks = !isMobile || activeTab === 'overview';
  const showSearch = !isMobile || !MOBILE_HIDDEN_SEARCH_TABS.includes(activeTab);

  const tabsNav = (
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
  );

  const searchBox = (
    <div className={styles.searchWrap}>
      <FaMagnifyingGlass />
      <input
        type="text"
        placeholder="Buscar usuário, serviço, cupom ou ticket..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </div>
  );

  const tabContent = (
    <>
      {activeTab === 'overview' && <OverviewTab />}

      {activeTab === 'services' && <ServicesTab />}

      {activeTab === 'promotions' && <PromotionsTab />}

      {activeTab === 'levels' && <LevelsTab />}

      {activeTab === 'taxonomy' && <TaxonomyTab />}

      {activeTab === 'users' && <UsersTab />}

      {activeTab === 'finance' && <FinanceTab />}

      {activeTab === 'pix-simulator' && <PixSimulatorTab />}

      {activeTab === 'disputes' && <DisputesTab />}

      {activeTab === 'support' && <SupportTab />}

      {activeTab === 'health' && <SystemHealthTab />}

      {activeTab === 'audit' && <AuditTab />}
    </>
  );

  const heroSection = (
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
  );

  const statGridSection = (
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
  );

  return (
    <AdminContext.Provider value={adminContextValue}>
    <div className={styles.page}>
      {isMobile && (
        <div className={styles.mobileAdminHeader}>
          <button type="button" className={styles.mobileBackBtn} onClick={() => navigate(-1)} aria-label="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className={styles.mobileAdminTitle}>
            <span className={styles.mobileAdminEyebrow}>Admin</span>
            <h1>Painel administrativo</h1>
          </div>
          <Link to="/settings" className={styles.mobileAdminAvatar} aria-label="Configurações">
            {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" /> : null}
          </Link>
        </div>
      )}

      {isMobile && tabsNav}

      {showHeroBlocks && heroSection}

      {showHeroBlocks && statGridSection}

      {isMobile ? (
        <>
          {showSearch && searchBox}
          {tabContent}
        </>
      ) : (
      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <span className={styles.sectionKicker}>Controle</span>
            <h2>Gestão administrativa</h2>
          </div>

          {searchBox}
        </div>

        {tabsNav}

        {tabContent}

      </section>
      )}

      {showHeroBlocks && (
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
      )}

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
                  {identityModalDocuments.length > 0 ? identityModalDocuments.map(([label, kind]) => (
                    <div key={label} className={styles.identityDocument}>
                      <div>
                        <strong>{label}</strong>
                        <span>Arquivo privado</span>
                      </div>
                      <div>
                        <button type="button" onClick={() => accessIdentityDocument(kind)}>
                          <FaArrowUpRightFromSquare /> Abrir
                        </button>
                        <button type="button" onClick={() => accessIdentityDocument(kind, true)}>
                          <FaDownload /> Baixar
                        </button>
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
    </AdminContext.Provider>
  );
}

export default Admin;

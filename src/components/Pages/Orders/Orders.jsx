import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaBriefcase,
  FaCircleCheck,
  FaClock,
  FaLayerGroup,
} from 'react-icons/fa6';
import { useAuth } from '../../../contexts/authContextStore';
import {
  getOrder,
  listOrders,
  reviewOrder,
} from '../../../services/orders';
import { connectSocket, getSocket } from '../../../services/socket';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './Orders.module.css';
import {
  ROLE_LABEL,
  STATUS_LABEL,
  EVENT_LABEL,
  DISPUTE_REASON_LABEL,
  STATUS_OPTIONS,
  ORDER_STAGES,
  formatPrice,
  toRoleValue,
  getOrderCounterparty,
  getStatusTone,
  getFlowProgress,
  getCurrentStageLabel,
} from './Orders.helpers';
import { OrdersContext } from './OrdersContext';
import OrderList from './sections/OrderList';
import OrderDetail from './sections/OrderDetail';

function Orders() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOrderId = searchParams.get('id');
  const setSearchParamsRef = useRef(setSearchParams);

  const defaultRole = useMemo(() => toRoleValue(user?.userType), [user?.userType]);

  const [role, setRole] = useState(defaultRole);
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryAssets, setDeliveryAssets] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('CANCELLATION_REQUESTED');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const selectedOrderRequestRef = useRef(0);

  useEffect(() => {
    setSearchParamsRef.current = setSearchParams;
  }, [setSearchParams]);

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  const loadOrders = useCallback(async (
    nextRole,
    nextStatus,
    preserveSelection = true,
    currentSelectedOrderId = null
  ) => {
    setLoadingList(true);
    try {
      const result = await listOrders({
        role: nextRole,
        ...(nextStatus ? { status: nextStatus } : {}),
      });

      const items = result.items || [];
      setOrders(items);

      const nextSelectedId = preserveSelection ? currentSelectedOrderId : null;
      const fallbackId = nextSelectedId || items[0]?.id || null;

      if (!fallbackId) {
        setSelectedOrder(null);
        if (currentSelectedOrderId) setSearchParamsRef.current({}, { replace: true });
      } else if (fallbackId !== currentSelectedOrderId) {
        setSearchParamsRef.current({ id: fallbackId }, { replace: true });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadSelectedOrder = useCallback(async (orderId) => {
    const requestId = ++selectedOrderRequestRef.current;

    if (!orderId) {
      setSelectedOrder(null);
      setLoadingOrder(false);
      return;
    }

    setLoadingOrder(true);
    setSelectedOrder((current) => (current?.id === orderId ? current : null));
    try {
      const order = await getOrder(orderId);
      if (requestId === selectedOrderRequestRef.current) {
        setSelectedOrder(order);
      }
    } catch (err) {
      if (requestId === selectedOrderRequestRef.current) {
        toast.error(err.message);
        setSelectedOrder(null);
      }
    } finally {
      if (requestId === selectedOrderRequestRef.current) {
        setLoadingOrder(false);
      }
    }
  }, []);

  useEffect(() => {
    loadOrders(defaultRole, '', false);
  }, [defaultRole, loadOrders]);

  useEffect(() => {
    loadSelectedOrder(selectedOrderId);
  }, [selectedOrderId, loadSelectedOrder]);

  useEffect(() => {
    const socket = connectSocket();

    const handleOrderEvent = (payload) => {
      const nextOrder = payload?.order;
      if (!nextOrder?.id) return;

      setOrders((prev) => {
        const includeByRole =
          role === 'all' ||
          (role === 'buyer' && nextOrder.clientId === user?.id) ||
          (role === 'seller' && nextOrder.freelancerId === user?.id);

        if (!includeByRole) return prev;
        if (status && nextOrder.status !== status) {
          return prev.filter((item) => item.id !== nextOrder.id);
        }

        const index = prev.findIndex((item) => item.id === nextOrder.id);
        if (index === -1) return [nextOrder, ...prev];

        const next = [...prev];
        next[index] = nextOrder;
        return [next[index], ...next.filter((item) => item.id !== nextOrder.id)];
      });

      if (nextOrder.id === selectedOrderId) {
        setSelectedOrder(nextOrder);
      }
    };

    socket.on('order:new', handleOrderEvent);
    socket.on('order:updated', handleOrderEvent);

    return () => {
      const current = getSocket();
      current.off('order:new', handleOrderEvent);
      current.off('order:updated', handleOrderEvent);
    };
  }, [role, selectedOrderId, status, user?.id]);

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    loadOrders(nextRole, status, false);
  };

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;
    setStatus(nextStatus);
    loadOrders(role, nextStatus, false);
  };

  const handleOpenOrder = (orderId) => {
    setSearchParams({ id: orderId });
  };

  const updateFromAction = (result, successMessage) => {
    setSelectedOrder(result.order);
    setOrders((prev) => {
      const index = prev.findIndex((item) => item.id === result.order.id);
      if (index === -1) return [result.order, ...prev];
      const next = [...prev];
      next[index] = result.order;
      return next;
    });
    toast.success(successMessage);
  };

  const runAction = async (key, fn, successMessage) => {
    if (!selectedOrder) return;

    setActionLoading(key);
    try {
      const result = await fn();
      updateFromAction(result, successMessage);
      setActionNote('');
      setDeliveryNote('');
      setDeliveryAssets('');
      setRevisionNote('');
      setCancelReason('');
      setDisputeReason('CANCELLATION_REQUESTED');
      setDisputeDescription('');
      setReviewComment('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const isSeller = selectedOrder?.freelancerId === user?.id;
  const isBuyer = selectedOrder?.clientId === user?.id;
  const counterparty = getOrderCounterparty(selectedOrder, user?.id);
  const selectedTone = getStatusTone(selectedOrder?.status);
  const selectedProgress = getFlowProgress(selectedOrder?.status);
  const selectedStageLabel = getCurrentStageLabel(selectedOrder?.status);
  const isNewSellerPending = isSeller && selectedOrder?.status === 'PENDING';

  const submitReview = async () => {
    if (!selectedOrder || actionLoading === 'review') return;

    setActionLoading('review');
    try {
      const result = await reviewOrder(selectedOrder.id, {
        rating: reviewRating,
        ...(reviewComment.trim() ? { comment: reviewComment.trim() } : {}),
      });
      if (result.order) {
        setSelectedOrder(result.order);
        setOrders((current) => current.map((order) => (order.id === result.order.id ? result.order : order)));
      }
      setReviewComment('');
      toast.success('Avaliação enviada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const metrics = useMemo(() => {
    const pending = orders.filter((order) => order.status === 'PENDING').length;
    const active = orders.filter((order) => order.status === 'IN_PROGRESS').length;
    const delivered = orders.filter((order) => order.status === 'DELIVERED').length;
    const completed = orders.filter((order) => order.status === 'COMPLETED').length;
    const completedValue = orders
      .filter((order) => order.status === 'COMPLETED')
      .reduce((sum, order) => sum + Number(order.priceCents || 0), 0);

    return { pending, active, delivered, completed, completedValue };
  }, [orders]);

  const statCards = [
    {
      label: 'Total filtrado',
      value: loadingList ? '...' : orders.length,
      detail: ROLE_LABEL[role],
      icon: <FaLayerGroup />,
      tone: 'blue',
    },
    {
      label: 'Aguardando resposta',
      value: loadingList ? '...' : metrics.pending,
      detail: role === 'seller' ? 'Aceitar ou recusar' : 'Confirmação do freelancer',
      icon: <FaClock />,
      tone: 'orange',
    },
    {
      label: 'Em andamento',
      value: loadingList ? '...' : metrics.active + metrics.delivered,
      detail: 'Execução ou revisão',
      icon: <FaBriefcase />,
      tone: 'purple',
    },
    {
      label: 'Concluídos',
      value: loadingList ? '...' : metrics.completed,
      detail: formatPrice(metrics.completedValue),
      icon: <FaCircleCheck />,
      tone: 'green',
    },
  ];

  const ordersContextValue = {
    // lista
    orders,
    metrics,
    loadingList,
    selectedOrderId,
    user,
    handleOpenOrder,
    // detalhe
    loadingOrder,
    selectedOrder,
    selectedTone,
    isNewSellerPending,
    selectedStageLabel,
    selectedProgress,
    actionNote,
    setActionNote,
    actionLoading,
    runAction,
    counterparty,
    isSeller,
    isBuyer,
    cancelReason,
    setCancelReason,
    disputeReason,
    setDisputeReason,
    disputeDescription,
    setDisputeDescription,
    deliveryNote,
    setDeliveryNote,
    deliveryAssets,
    setDeliveryAssets,
    revisionNote,
    setRevisionNote,
    reviewRating,
    setReviewRating,
    reviewComment,
    setReviewComment,
    submitReview,
  };

  return (
    <OrdersContext.Provider value={ordersContextValue}>
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.eyebrow}>Central de pedidos</div>
          <h1 className={styles.title}>Um fluxo claro para iniciar, conduzir e fechar cada projeto.</h1>
          <p className={styles.subtitle}>
            Aqui você centraliza o combinado comercial, o andamento da execução, as entregas formais e os próximos passos sem depender apenas do chat.
          </p>

          <div className={styles.heroActions}>
            <div className={styles.roleTabs}>
              {Object.entries(ROLE_LABEL).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.roleTab} ${role === value ? styles.roleTabActive : ''}`}
                  onClick={() => handleRoleChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <select className={styles.select} value={status} onChange={handleStatusChange}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.heroSide}>
          <div className={styles.heroSideCard}>
            <span className={styles.heroSideLabel}>Fila operacional</span>
            <h2>{loadingList ? '...' : metrics.pending + metrics.delivered}</h2>
            <p>
              {role === 'seller'
                ? 'Pedidos que dependem de aceite, entrega ou acompanhamento próximo.'
                : role === 'buyer'
                ? 'Entregas e conversas que precisam da sua revisão para o projeto avançar.'
                : 'Pedidos dos dois lados da plataforma que precisam de acompanhamento.'}
            </p>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => loadOrders(role, status, true, selectedOrderId)}
              disabled={loadingList}
            >
              {loadingList ? 'Atualizando...' : 'Atualizar pedidos'}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.statGrid}>
        {statCards.map((item) => (
          <SpotlightCard key={item.label} className={`${styles.statCard} ${styles[item.tone]}`}>
            <div className={styles.statIcon}>{item.icon}</div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </SpotlightCard>
        ))}
      </section>

      <div className={styles.layout}>
        <OrderList />

        <OrderDetail />
      </div>
    </div>
    </OrdersContext.Provider>
  );
}

export default Orders;

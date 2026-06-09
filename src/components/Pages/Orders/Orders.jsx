import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaBriefcase,
  FaCircleCheck,
  FaClock,
  FaInbox,
  FaLayerGroup,
} from 'react-icons/fa6';
import { useAuth } from '../../../contexts/AuthContext';
import {
  acceptOrder,
  approveOrder,
  deliverOrder,
  getOrder,
  listOrders,
  rejectOrder,
  reviewOrder,
  requestOrderRevision,
} from '../../../services/orders';
import { connectSocket, getSocket } from '../../../services/socket';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './Orders.module.css';

const ROLE_LABEL = {
  all: 'Todos',
  buyer: 'Como cliente',
  seller: 'Como freelancer',
};

const STATUS_LABEL = {
  PENDING: 'Aguardando resposta',
  IN_PROGRESS: 'Em andamento',
  DELIVERED: 'Entregue',
  COMPLETED: 'Concluído',
  REJECTED: 'Recusado',
  CANCELED: 'Cancelado',
};

const EVENT_LABEL = {
  CREATED: 'Pedido criado',
  ACCEPTED: 'Pedido aceito',
  REJECTED: 'Pedido recusado',
  DELIVERED: 'Entrega enviada',
  REVISION_REQUESTED: 'Revisão solicitada',
  COMPLETED: 'Pedido aprovado',
  CANCELED: 'Pedido cancelado',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING', label: STATUS_LABEL.PENDING },
  { value: 'IN_PROGRESS', label: STATUS_LABEL.IN_PROGRESS },
  { value: 'DELIVERED', label: STATUS_LABEL.DELIVERED },
  { value: 'COMPLETED', label: STATUS_LABEL.COMPLETED },
  { value: 'REJECTED', label: STATUS_LABEL.REJECTED },
];

const ORDER_STAGES = [
  { key: 'PENDING', label: 'Entrada' },
  { key: 'IN_PROGRESS', label: 'Execução' },
  { key: 'DELIVERED', label: 'Entrega' },
  { key: 'COMPLETED', label: 'Aprovação' },
];

const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeDate = (value) => {
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

const toRoleValue = (userType) => (userType === 'FREELANCER' ? 'seller' : 'buyer');

const getOrderCounterparty = (order, userId) => {
  if (!order) return null;
  return order.clientId === userId ? order.freelancer : order.client;
};

const getEventDescription = (event) => {
  if (!event) return '';
  return event.note || EVENT_LABEL[event.type] || event.type;
};

const getName = (person) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.username || 'Usuário';

const getInitials = (person) =>
  getName(person)
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

const getStatusTone = (status) => {
  if (status === 'COMPLETED') return 'Green';
  if (status === 'DELIVERED') return 'Violet';
  if (status === 'IN_PROGRESS') return 'Blue';
  if (status === 'REJECTED' || status === 'CANCELED') return 'Red';
  return 'Amber';
};

const getOrderStageState = (orderStatus, stageKey) => {
  if (orderStatus === 'REJECTED' || orderStatus === 'CANCELED') {
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

const getFlowProgress = (orderStatus) => {
  if (orderStatus === 'COMPLETED') return 100;
  if (orderStatus === 'DELIVERED') return 72;
  if (orderStatus === 'IN_PROGRESS') return 48;
  if (orderStatus === 'PENDING') return 18;
  if (orderStatus === 'REJECTED' || orderStatus === 'CANCELED') return 12;
  return 0;
};

const getCurrentStageLabel = (orderStatus) => {
  if (orderStatus === 'COMPLETED') return 'Aprovação concluída';
  if (orderStatus === 'DELIVERED') return 'Aguardando revisão';
  if (orderStatus === 'IN_PROGRESS') return 'Execução em andamento';
  if (orderStatus === 'PENDING') return 'Aguardando aceite';
  if (orderStatus === 'REJECTED') return 'Pedido recusado';
  if (orderStatus === 'CANCELED') return 'Pedido cancelado';
  return 'Fluxo do pedido';
};

const getNextActionCopy = (order, userId) => {
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

  return 'Este pedido saiu do fluxo principal.';
};

const parseDeliveryAssets = (raw) =>
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

function Orders() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOrderId = searchParams.get('id');

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
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  const loadOrders = async (nextRole = role, nextStatus = status, preserveSelection = true) => {
    setLoadingList(true);
    try {
      const result = await listOrders({
        role: nextRole,
        ...(nextStatus ? { status: nextStatus } : {}),
      });

      const items = result.items || [];
      setOrders(items);

      const nextSelectedId = preserveSelection ? selectedOrderId : null;
      const fallbackId = nextSelectedId || items[0]?.id || null;

      if (!fallbackId) {
        setSelectedOrder(null);
        if (selectedOrderId) setSearchParams({}, { replace: true });
      } else if (fallbackId !== selectedOrderId) {
        setSearchParams({ id: fallbackId }, { replace: true });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const loadSelectedOrder = async (orderId) => {
    if (!orderId) {
      setSelectedOrder(null);
      return;
    }

    setLoadingOrder(true);
    try {
      const order = await getOrder(orderId);
      setSelectedOrder(order);
    } catch (err) {
      toast.error(err.message);
      setSelectedOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    loadOrders(defaultRole, '', false);
  }, [defaultRole]);

  useEffect(() => {
    if (!selectedOrderId) return;
    loadSelectedOrder(selectedOrderId);
  }, [selectedOrderId]);

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
      label: 'Fluxo ativo',
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

  return (
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
              onClick={() => loadOrders(role, status, true)}
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
        <section className={styles.listPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionKicker}>Controle</span>
              <h2>Fila de pedidos</h2>
              <p className={styles.panelText}>
                {orders.length} {orders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
              </p>
            </div>
          </div>

          <div className={styles.listSummary}>
            <div className={styles.summaryCard}>
              <span>Resposta imediata</span>
              <strong>{metrics.pending}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Operação ativa</span>
              <strong>{metrics.active + metrics.delivered}</strong>
            </div>
          </div>

          <div className={styles.orderList}>
            {loadingList && orders.length === 0 ? (
              <div className={styles.emptyState}>Carregando pedidos...</div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FaInbox /></div>
                <strong>Nenhum pedido encontrado</strong>
                <p>Altere o papel ou o status para procurar em outro recorte.</p>
              </div>
            ) : (
              orders.map((order) => {
                const otherUser = getOrderCounterparty(order, user?.id);
                const active = order.id === selectedOrderId;
                const tone = getStatusTone(order.status);

                return (
                  <button
                    key={order.id}
                    type="button"
                    className={`${styles.orderCard} ${active ? styles.orderCardActive : ''}`}
                    onClick={() => handleOpenOrder(order.id)}
                  >
                    <div className={styles.orderCardTop}>
                      <div className={styles.orderIdentity}>
                        <div className={`${styles.orderAvatar} ${styles[`avatar${tone}`]}`}>
                          {getInitials(otherUser)}
                        </div>
                        <div>
                          <strong className={styles.orderTitle}>{order.service?.title || order.planTitle}</strong>
                          <p className={styles.orderMeta}>
                            {getName(otherUser)} · {order.planTitle}
                          </p>
                        </div>
                      </div>
                      <span className={styles.orderPrice}>{formatPrice(order.priceCents)}</span>
                    </div>

                    <div className={styles.orderCardFooter}>
                      <span className={`${styles.statusBadge} ${styles[`status${order.status}`]}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                      <span className={styles.orderMeta}>
                        Atualizado {formatRelativeDate(order.updatedAt)}
                      </span>
                    </div>

                    <div className={styles.orderMiniProgress} aria-hidden="true">
                      <span style={{ width: `${getFlowProgress(order.status)}%` }} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className={styles.detailPanel}>
          {!selectedOrderId ? (
            <div className={styles.emptyStateLarge}>
              <div className={styles.emptyIcon}><FaInbox /></div>
              <strong>Selecione um pedido</strong>
              <p>Escolha um item da fila para ver briefing, entrega, histórico e ações disponíveis.</p>
            </div>
          ) : loadingOrder ? (
            <div className={styles.emptyStateLarge}>Carregando pedido...</div>
          ) : !selectedOrder ? (
            <div className={styles.emptyStateLarge}>
              <div className={styles.emptyIcon}><FaInbox /></div>
              <strong>Pedido indisponível</strong>
              <p>Não foi possível carregar este pedido agora. Atualize a fila e tente novamente.</p>
            </div>
          ) : (
            <>
              <div className={`${styles.detailHero} ${styles[`detailHero${selectedTone}`]}`}>
                <div className={styles.detailHeroMain}>
                  <div className={styles.detailEyebrow}>
                    <span className={`${styles.statusBadge} ${styles[`status${selectedOrder.status}`]}`}>
                      {STATUS_LABEL[selectedOrder.status] || selectedOrder.status}
                    </span>
                    <span className={styles.detailId}>#{selectedOrder.id.slice(-8).toUpperCase()}</span>
                  </div>

                  <h2>{selectedOrder.service?.title || selectedOrder.planTitle}</h2>
                  <p className={styles.detailLead}>
                    Plano {selectedOrder.planTitle} · {formatPrice(selectedOrder.priceCents)} ·{' '}
                    {selectedOrder.deliveryDays} {selectedOrder.deliveryDays === 1 ? 'dia' : 'dias'} para entrega
                  </p>

                  <div className={styles.flowMeter}>
                    <div className={styles.flowMeterHeader}>
                      <span>{selectedStageLabel}</span>
                      <strong>{selectedProgress}%</strong>
                    </div>
                    <div className={styles.flowRail}>
                      <span style={{ width: `${selectedProgress}%` }} />
                    </div>
                  </div>

                  <div className={styles.progressTrack}>
                    {ORDER_STAGES.map((stage) => {
                      const state = getOrderStageState(selectedOrder.status, stage.key);

                      return (
                        <div key={stage.key} className={styles.progressStep}>
                          <div className={`${styles.progressDot} ${styles[`progress${state}`]}`} />
                          <span className={`${styles.progressLabel} ${styles[`progressLabel${state}`]}`}>
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.detailHeroSide}>
                  <div className={styles.personCard}>
                    <div className={`${styles.personAvatar} ${styles[`avatar${selectedTone}`]}`}>
                      {getInitials(counterparty)}
                    </div>
                    <div>
                      <span className={styles.personLabel}>
                        {isSeller ? 'Cliente deste pedido' : 'Freelancer deste pedido'}
                      </span>
                      <strong>{getName(counterparty)}</strong>
                      <p>{counterparty?.username ? `@${counterparty.username}` : 'Perfil ainda sem username'}</p>
                    </div>
                  </div>

                  <div className={styles.nextActionCard}>
                    <span>Próximo passo</span>
                    <p className={styles.nextActionCopy}>
                      {getNextActionCopy(selectedOrder, user?.id)}
                    </p>
                  </div>

                  {selectedOrder.conversationId && (
                    <Link to={`/messages?chat=${selectedOrder.conversationId}`} className={styles.primaryLink}>
                      Abrir conversa
                    </Link>
                  )}
                </div>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailMain}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                      <span className={styles.infoLabel}>Cliente</span>
                      <strong>{getName(selectedOrder.client)}</strong>
                    </div>
                    <div className={styles.infoCard}>
                      <span className={styles.infoLabel}>Freelancer</span>
                      <strong>{getName(selectedOrder.freelancer)}</strong>
                    </div>
                    <div className={styles.infoCard}>
                      <span className={styles.infoLabel}>Revisões</span>
                      <strong>{selectedOrder.revisionsUsed} / {selectedOrder.revisionsAllowed}</strong>
                    </div>
                    <div className={styles.infoCard}>
                      <span className={styles.infoLabel}>Atualizado em</span>
                      <strong>{formatDateTime(selectedOrder.updatedAt)}</strong>
                    </div>
                  </div>

                  <div className={styles.detailContentGrid}>
                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <span className={styles.sectionKicker}>Escopo</span>
                          <h3>Briefing e requisitos</h3>
                          <p className={styles.sectionText}>
                            Combinado inicial do pedido, salvo para consulta rápida durante a execução.
                          </p>
                        </div>
                      </div>
                      <p className={styles.longText}>
                        {selectedOrder.requirements || 'Nenhum requisito adicional informado.'}
                      </p>
                    </div>

                    <div className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <div>
                          <span className={styles.sectionKicker}>Entrega</span>
                          <h3>Entrega atual</h3>
                          <p className={styles.sectionText}>
                            Material enviado pelo freelancer e links registrados na entrega formal.
                          </p>
                        </div>
                      </div>
                      <p className={styles.longText}>
                        {selectedOrder.deliveryNote || 'Nenhuma entrega registrada ainda.'}
                      </p>
                      {selectedOrder.deliveryAssets?.length > 0 && (
                        <div className={styles.assetGrid}>
                          {selectedOrder.deliveryAssets.map((asset) => (
                            <a
                              key={asset.id}
                              href={asset.url}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.assetCard}
                            >
                              <span className={styles.assetLabel}>{asset.label || 'Arquivo entregue'}</span>
                              <strong className={styles.assetUrl}>{asset.url}</strong>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <div>
                        <span className={styles.sectionKicker}>Histórico</span>
                        <h3>Histórico do pedido</h3>
                        <p className={styles.sectionText}>
                          Cada mudança relevante no fluxo fica registrada com ator, contexto e horário.
                        </p>
                      </div>
                    </div>
                    <div className={styles.timeline}>
                      {(selectedOrder.events || []).map((event) => (
                        <div key={event.id} className={styles.timelineItem}>
                          <div className={styles.timelineDot} />
                          <div className={styles.timelineBody}>
                            <strong>{EVENT_LABEL[event.type] || event.type}</strong>
                            <p>{getEventDescription(event)}</p>
                            <span>
                              {event.actor?.firstName ? `${event.actor.firstName} ${event.actor.lastName || ''} · ` : ''}
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className={styles.detailSide}>
                  <div className={styles.sideCard}>
                    <span className={styles.sideCardLabel}>Resumo operacional</span>
                    <div className={styles.sideMetric}>
                      <span>Valor do pedido</span>
                      <strong>{formatPrice(selectedOrder.priceCents)}</strong>
                    </div>
                    <div className={styles.sideMetric}>
                      <span>Prazo prometido</span>
                      <strong>{selectedOrder.deliveryDays} {selectedOrder.deliveryDays === 1 ? 'dia' : 'dias'}</strong>
                    </div>
                    <div className={styles.sideMetric}>
                      <span>Ultima atualizacao</span>
                      <strong>{formatRelativeDate(selectedOrder.updatedAt)}</strong>
                    </div>
                  </div>

                  {isSeller && selectedOrder.status === 'PENDING' && (
                    <div className={styles.sideCard}>
                      <span className={styles.sideCardLabel}>Responder ao pedido</span>
                      <textarea
                        className={styles.textarea}
                        rows={5}
                        value={actionNote}
                        onChange={(event) => setActionNote(event.target.value)}
                        placeholder="Escreva uma nota opcional para aceitar ou recusar."
                      />
                      <div className={styles.actionStack}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={actionLoading === 'accept'}
                          onClick={() =>
                            runAction(
                              'accept',
                              () => acceptOrder(selectedOrder.id, actionNote.trim() ? { note: actionNote.trim() } : {}),
                              'Pedido aceito.'
                            )
                          }
                        >
                          {actionLoading === 'accept' ? 'Aceitando...' : 'Aceitar pedido'}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={actionLoading === 'reject'}
                          onClick={() =>
                            runAction(
                              'reject',
                              () => rejectOrder(selectedOrder.id, actionNote.trim() ? { note: actionNote.trim() } : {}),
                              'Pedido recusado.'
                            )
                          }
                        >
                          {actionLoading === 'reject' ? 'Recusando...' : 'Recusar pedido'}
                        </button>
                      </div>
                    </div>
                  )}

                  {isSeller && selectedOrder.status === 'IN_PROGRESS' && (
                    <div className={styles.sideCard}>
                      <span className={styles.sideCardLabel}>Registrar entrega</span>
                      <textarea
                        className={styles.textarea}
                        rows={4}
                        value={deliveryNote}
                        onChange={(event) => setDeliveryNote(event.target.value)}
                        placeholder="Descreva o que está sendo entregue."
                      />
                      <textarea
                        className={styles.textarea}
                        rows={5}
                        value={deliveryAssets}
                        onChange={(event) => setDeliveryAssets(event.target.value)}
                        placeholder={'Uma URL por linha ou "Label | https://arquivo.com"'}
                      />
                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={actionLoading === 'deliver'}
                        onClick={() =>
                          runAction(
                            'deliver',
                            () =>
                              deliverOrder(selectedOrder.id, {
                                ...(deliveryNote.trim() ? { note: deliveryNote.trim() } : {}),
                                assets: parseDeliveryAssets(deliveryAssets),
                              }),
                            'Entrega registrada.'
                          )
                        }
                      >
                        {actionLoading === 'deliver' ? 'Enviando entrega...' : 'Enviar entrega'}
                      </button>
                    </div>
                  )}

                  {isBuyer && selectedOrder.status === 'DELIVERED' && (
                    <div className={styles.sideCard}>
                      <span className={styles.sideCardLabel}>Responder a entrega</span>
                      <textarea
                        className={styles.textarea}
                        rows={5}
                        value={revisionNote}
                        onChange={(event) => setRevisionNote(event.target.value)}
                        placeholder="Escreva uma observação para aprovar ou solicitar revisão."
                      />
                      <div className={styles.actionStack}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={actionLoading === 'approve'}
                          onClick={() =>
                            runAction(
                              'approve',
                              () => approveOrder(selectedOrder.id, revisionNote.trim() ? { note: revisionNote.trim() } : {}),
                              'Pedido aprovado.'
                            )
                          }
                        >
                          {actionLoading === 'approve' ? 'Aprovando...' : 'Aprovar entrega'}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={actionLoading === 'revision'}
                          onClick={() => {
                            if (!revisionNote.trim()) {
                              toast.error('Explique o que precisa ser ajustado.');
                              return;
                            }

                            runAction(
                              'revision',
                              () => requestOrderRevision(selectedOrder.id, { note: revisionNote.trim() }),
                              'Revisão solicitada.'
                            );
                          }}
                        >
                          {actionLoading === 'revision' ? 'Solicitando...' : 'Pedir revisão'}
                        </button>
                      </div>
                    </div>
                  )}

                  {counterparty?.username && (
                    <div className={styles.sideCard}>
                      <span className={styles.sideCardLabel}>Perfil relacionado</span>
                      <Link to={`/profile/${counterparty.username}`} className={styles.profileLink}>
                        Ver perfil de @{counterparty.username}
                      </Link>
                    </div>
                  )}

                  {isBuyer && selectedOrder.status === 'COMPLETED' && (
                    <div className={styles.sideCard}>
                      <span className={styles.sideCardLabel}>Avaliação</span>
                      {selectedOrder.review ? (
                        <div className={styles.reviewResult}>
                          <strong>{'★'.repeat(selectedOrder.review.rating)}{'☆'.repeat(5 - selectedOrder.review.rating)}</strong>
                          <p>{selectedOrder.review.comment || 'Pedido avaliado sem comentário.'}</p>
                          <span>{formatDateTime(selectedOrder.review.createdAt)}</span>
                        </div>
                      ) : (
                        <>
                          <div className={styles.ratingPicker}>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                type="button"
                                className={value <= reviewRating ? styles.starActive : styles.starButton}
                                onClick={() => setReviewRating(value)}
                                aria-label={`${value} estrelas`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea
                            className={styles.textarea}
                            rows={4}
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            placeholder="Conte como foi trabalhar com este freelancer."
                          />
                          <button
                            type="button"
                            className={styles.primaryButton}
                            disabled={actionLoading === 'review'}
                            onClick={submitReview}
                          >
                            {actionLoading === 'review' ? 'Enviando...' : 'Enviar avaliação'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Orders;

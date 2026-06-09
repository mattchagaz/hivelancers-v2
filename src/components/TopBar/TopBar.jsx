import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { listConversations } from '../../services/messages';
import { listOrders } from '../../services/orders';
import { connectSocket, getSocket } from '../../services/socket';
import { getPublicProfilePath } from '../../utils/profileEnhancements';
import styles from './TopBar.module.css';

const toId = (value) => (value === undefined || value === null ? '' : String(value));

const getPersonName = (person) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.username || 'Usuário';

const getOtherParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find((participant) => toId(participant.id) !== toId(currentUserId)) ||
  conversation?.otherUser;

const formatRelativeTime = (value) => {
  if (!value) return 'Agora';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  if (hours < 48) return 'Ontem';
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const gain = context.createGain();
    const firstTone = context.createOscillator();
    const secondTone = context.createOscillator();
    const now = context.currentTime;

    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    firstTone.type = 'sine';
    firstTone.frequency.setValueAtTime(740, now);
    firstTone.connect(gain);
    firstTone.start(now);
    firstTone.stop(now + 0.16);

    secondTone.type = 'sine';
    secondTone.frequency.setValueAtTime(980, now + 0.14);
    secondTone.connect(gain);
    secondTone.start(now + 0.14);
    secondTone.stop(now + 0.34);

    setTimeout(() => context.close().catch(() => {}), 520);
  } catch {
    // Browsers can block audio before user interaction. The visual badge still updates.
  }
};

const getOrderNotification = (order, userId) => {
  if (!order?.id) return null;

  const isSeller = toId(order.freelancerId) === toId(userId);
  const isBuyer = toId(order.clientId) === toId(userId);
  const other = isSeller ? order.client : order.freelancer;
  const serviceTitle = order.service?.title || order.planTitle || 'Pedido';
  const base = {
    id: `order:${order.id}:${order.status}:${order.updatedAt || order.createdAt}`,
    type: 'order',
    to: `/orders?id=${order.id}`,
    createdAt: order.updatedAt || order.createdAt,
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
      description: `${serviceTitle} saiu do fluxo ativo.`,
    };
  }

  return null;
};

const getConversationNotification = (conversation, userId) => {
  const unreadCount = Number(conversation?.unreadCount || 0);
  if (!conversation?.id || unreadCount <= 0) return null;

  const other = getOtherParticipant(conversation, userId);
  const lastMessage = conversation.lastMessage;
  const preview = lastMessage?.content || (lastMessage?.imageUrl ? 'Enviou uma imagem.' : 'Nova mensagem recebida.');

  return {
    id: `conversation:${conversation.id}:${lastMessage?.id || conversation.updatedAt}`,
    type: 'message',
    tone: 'blue',
    title: `${unreadCount} ${unreadCount === 1 ? 'mensagem nova' : 'mensagens novas'}`,
    description: `${getPersonName(other)}: ${preview}`,
    actor: getPersonName(other),
    createdAt: lastMessage?.createdAt || conversation.updatedAt,
    to: `/messages?chat=${conversation.id}`,
  };
};

function TopBar({ userName = '', userRole = 'freelancer', avatarUrl = '', onMenuToggle }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [clearedNotificationIds, setClearedNotificationIds] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notificationStorageKey = user?.id ? `hivelancers:notification-read:${user.id}` : '';
  const notificationClearStorageKey = user?.id ? `hivelancers:notification-cleared:${user.id}` : '';

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!notificationStorageKey) {
      setReadNotificationIds([]);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem(notificationStorageKey) || '[]');
      setReadNotificationIds(Array.isArray(stored) ? stored : []);
    } catch {
      setReadNotificationIds([]);
    }
  }, [notificationStorageKey]);

  useEffect(() => {
    if (!notificationClearStorageKey) {
      setClearedNotificationIds([]);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem(notificationClearStorageKey) || '[]');
      setClearedNotificationIds(Array.isArray(stored) ? stored : []);
    } catch {
      setClearedNotificationIds([]);
    }
  }, [notificationClearStorageKey]);

  const persistReadIds = useCallback((nextIds) => {
    setReadNotificationIds(nextIds);
    if (!notificationStorageKey) return;
    localStorage.setItem(notificationStorageKey, JSON.stringify(nextIds.slice(-120)));
  }, [notificationStorageKey]);

  const persistClearedIds = useCallback((nextIds) => {
    setClearedNotificationIds(nextIds);
    if (!notificationClearStorageKey) return;
    localStorage.setItem(notificationClearStorageKey, JSON.stringify(nextIds.slice(-160)));
  }, [notificationClearStorageKey]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setNotificationsLoading(true);
    try {
      const [ordersResult, conversationsResult] = await Promise.allSettled([
        listOrders({ role: 'all' }),
        listConversations(),
      ]);

      const orderItems = ordersResult.status === 'fulfilled' ? ordersResult.value?.items || [] : [];
      const conversationItems = conversationsResult.status === 'fulfilled' ? conversationsResult.value || [] : [];

      const next = [
        ...orderItems.map((order) => getOrderNotification(order, user.id)).filter(Boolean),
        ...conversationItems.map((conversation) => getConversationNotification(conversation, user.id)).filter(Boolean),
      ]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 14);

      setNotifications(next);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = connectSocket();
    const refresh = () => loadNotifications();
    const handleNewOrder = (payload) => {
      const order = payload?.order;
      const isSeller = toId(order?.freelancerId) === toId(user.id);

      if (isSeller && order?.status === 'PENDING') {
        playNotificationSound();
        toast.success('Novo pedido recebido.', {
          description: `${getPersonName(order.client)} contratou ${order.service?.title || order.planTitle || 'um serviço'}.`,
        });
      }

      loadNotifications();
    };

    const refreshEvents = ['order:updated', 'order:event', 'message:new', 'conversation:message', 'conversation:new'];

    socket.on('order:new', handleNewOrder);
    refreshEvents.forEach((event) => socket.on(event, refresh));

    return () => {
      const current = getSocket();
      current.off('order:new', handleNewOrder);
      refreshEvents.forEach((event) => current.off(event, refresh));
    };
  }, [loadNotifications, user?.id]);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !clearedNotificationIds.includes(item.id)),
    [clearedNotificationIds, notifications]
  );

  const unreadNotifications = useMemo(
    () => visibleNotifications.filter((item) => !readNotificationIds.includes(item.id)),
    [readNotificationIds, visibleNotifications]
  );

  const markNotificationRead = (id) => {
    if (!id || readNotificationIds.includes(id)) return;
    persistReadIds([...readNotificationIds, id]);
  };

  const markAllNotificationsRead = () => {
    persistReadIds([...new Set([...readNotificationIds, ...visibleNotifications.map((item) => item.id)])]);
  };

  const clearNotifications = () => {
    if (visibleNotifications.length === 0) return;
    const visibleIds = visibleNotifications.map((item) => item.id);
    persistReadIds([...new Set([...readNotificationIds, ...visibleIds])]);
    persistClearedIds([...new Set([...clearedNotificationIds, ...visibleIds])]);
    toast.success('Notificações limpas.');
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/explore?q=${encodeURIComponent(query)}`);
    setSearchFocused(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const displayName = userName || 'Usuário';
  const initials = displayName.split(' ').map((n) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  const firstName = displayName.split(' ')[0];
  const profilePath = getPublicProfilePath(user);
  const roleLabel = userRole === 'admin' ? 'Administrador' : userRole === 'freelancer' ? 'Freelancer' : 'Cliente';
  const panelLabel = userRole === 'admin' ? 'Painel Administrativo' : userRole === 'freelancer' ? 'Painel do Freelancer' : 'Painel do Cliente';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sessão encerrada.');
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className={styles.bar}>
      <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className={styles.greeting}>
        <h1 className={styles.greetText}>
          {getGreeting()}, <span className={styles.greetName}>{firstName}</span>
        </h1>
        <p className={styles.greetSub}>{panelLabel}</p>
      </div>

      <form className={`${styles.search} ${searchFocused ? styles.searchActive : ''}`} onSubmit={handleSearchSubmit}>
        <svg className={styles.searchIco} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar serviços..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className={styles.kbd}>/</kbd>
      </form>

      <div className={styles.right}>
        <div className={styles.notifWrap} ref={notificationRef}>
          <button
            className={`${styles.iconBtn} ${notificationsOpen ? styles.iconBtnActive : ''}`}
            title="Notificações"
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {unreadNotifications.length > 0 && (
              <span className={styles.notifCount}>
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className={styles.notifMenu}>
              <div className={styles.notifHeader}>
                <div>
                  <span>Central</span>
                  <strong>Notificações</strong>
                </div>
                {visibleNotifications.length > 0 && (
                  <div className={styles.notifActions}>
                    <button type="button" onClick={markAllNotificationsRead}>
                      Marcar lidas
                    </button>
                    <button type="button" onClick={clearNotifications}>
                      Limpar
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.notifList}>
                {notificationsLoading && visibleNotifications.length === 0 ? (
                  <div className={styles.notifEmpty}>Carregando notificações...</div>
                ) : visibleNotifications.length === 0 ? (
                  <div className={styles.notifEmpty}>
                    <strong>Nada novo por aqui</strong>
                    <span>Pedidos, entregas e mensagens aparecerão neste painel.</span>
                  </div>
                ) : (
                  visibleNotifications.map((item) => {
                    const unread = !readNotificationIds.includes(item.id);

                    return (
                      <Link
                        key={item.id}
                        to={item.to}
                        className={`${styles.notifItem} ${unread ? styles.notifUnread : ''}`}
                        onClick={() => {
                          markNotificationRead(item.id);
                          setNotificationsOpen(false);
                        }}
                      >
                        <span className={`${styles.notifTone} ${styles[`notifTone${item.tone}`]}`} />
                        <span className={styles.notifCopy}>
                          <strong>{item.title}</strong>
                          <span>{item.description}</span>
                          <small>{formatRelativeTime(item.createdAt)}</small>
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.sep} />

        <div className={styles.userMenuWrap} ref={menuRef}>
          <button className={styles.userBtn} onClick={() => setMenuOpen((v) => !v)}>
            <div className={styles.avatar}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                />
              ) : (
                initials || 'U'
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userRole}>{roleLabel}</span>
            </div>
            <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {menuOpen && (
            <div className={styles.userMenu}>
              <Link to={profilePath} className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 10-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Meu perfil
              </Link>
              <Link to="/profile/customize" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                Personalizar perfil
              </Link>
              <Link to="/settings" className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Configurações
              </Link>
              <button className={styles.menuItemDanger} onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;

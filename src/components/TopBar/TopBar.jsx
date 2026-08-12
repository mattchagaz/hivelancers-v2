import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/authContextStore';
import { useSettings } from '../../contexts/SettingsContext';
import {
  archiveNotifications,
  getNotificationStorageKeys,
  loadNotificationFeed,
  markAllNotificationsRead as persistAllNotificationsRead,
  markNotificationRead as persistNotificationRead,
  readStoredNotificationIds,
  shouldAlertForNotification,
  writeStoredNotificationIds,
} from '../../services/notifications';
import { connectSocket, getSocket } from '../../services/socket';
import { getPublicProfilePath } from '../../utils/profileEnhancements';
import styles from './TopBar.module.css';

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

const inAppPreferenceFor = (type) => ({
  message: 'messages',
  review: 'reviews',
  support: 'supportUpdates',
  verification: 'securityUpdates',
  admin: 'securityUpdates',
  payment: 'orderUpdates',
  order: 'orderUpdates',
}[type] || 'securityUpdates');

const browserPreferenceFor = (type) => ({
  message: 'pushMessages',
  order: 'pushOrders',
  review: 'pushOrders',
  payment: 'pushPayments',
  support: 'pushSupport',
  verification: 'pushSupport',
  admin: 'pushSupport',
}[type] || 'pushSupport');

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
  const knownNotificationIdsRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const notificationSettings = settings.notifications;

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setNotificationsLoading(true);
    try {
      const { live, history } = await loadNotificationFeed(user);
      const knownIds = knownNotificationIdsRef.current;
      const currentIds = new Set(history.map((item) => item.id));

      if (knownIds) {
        const incoming = live.filter((item) => !knownIds.has(item.id) && !item.readAt);
        const newest = incoming[0];

        if (newest) {
          knownNotificationIdsRef.current = currentIds;
          const shouldAlert = shouldAlertForNotification(newest);

          if (shouldAlert && notificationSettings[inAppPreferenceFor(newest.type)]) {
            playNotificationSound();
            toast(newest.title, { description: newest.description });
          }

          if (
            shouldAlert &&
            notificationSettings[browserPreferenceFor(newest.type)] &&
            'Notification' in window &&
            window.Notification.permission === 'granted'
          ) {
            const browserNotification = new window.Notification(newest.title, {
              body: newest.description,
              tag: newest.id,
            });
            browserNotification.onclick = () => {
              window.focus();
              navigate(newest.to || '/notifications');
              browserNotification.close();
            };
          }
        }
      }

      knownNotificationIdsRef.current = currentIds;
      const storageKeys = getNotificationStorageKeys(user.id);
      const storedReadIds = readStoredNotificationIds(storageKeys.read);
      const storedClearedIds = readStoredNotificationIds(storageKeys.cleared);
      const nextReadIds = [...new Set([
        ...storedReadIds,
        ...history.filter((item) => item.readAt).map((item) => item.id),
      ])];
      const nextClearedIds = [...new Set([
        ...storedClearedIds,
        ...history.filter((item) => item.archivedAt).map((item) => item.id),
      ])];

      setNotifications(live.slice(0, 14));
      setReadNotificationIds(nextReadIds);
      setClearedNotificationIds(nextClearedIds);
      writeStoredNotificationIds(storageKeys.read, nextReadIds);
      writeStoredNotificationIds(storageKeys.cleared, nextClearedIds);
    } finally {
      setNotificationsLoading(false);
    }
  }, [navigate, notificationSettings, user]);

  useEffect(() => {
    knownNotificationIdsRef.current = null;
    loadNotifications();
  }, [loadNotifications, user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = connectSocket();
    const refresh = () => loadNotifications();

    const refreshEvents = [
      'order:new',
      'order:updated',
      'order:event',
      'message:new',
      'conversation:message',
      'conversation:new',
      'notifications:refresh',
    ];

    refreshEvents.forEach((event) => socket.on(event, refresh));

    return () => {
      const current = getSocket();
      refreshEvents.forEach((event) => current.off(event, refresh));
    };
  }, [loadNotifications, user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const refresh = () => loadNotifications();
    window.addEventListener('focus', refresh);
    window.addEventListener('hivelancers:notifications:refresh', refresh);

    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('hivelancers:notifications:refresh', refresh);
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

  const markNotificationRead = async (id) => {
    if (!id || readNotificationIds.includes(id)) return;
    const nextReadIds = [...new Set([...readNotificationIds, id])];
    setReadNotificationIds(nextReadIds);
    writeStoredNotificationIds(getNotificationStorageKeys(user?.id).read, nextReadIds);
    try {
      await persistNotificationRead(id);
    } catch {
      loadNotifications();
    }
  };

  const markAllNotificationsRead = async () => {
    const nextReadIds = [...new Set([...readNotificationIds, ...visibleNotifications.map((item) => item.id)])];
    setReadNotificationIds(nextReadIds);
    writeStoredNotificationIds(getNotificationStorageKeys(user?.id).read, nextReadIds);
    try {
      await persistAllNotificationsRead();
    } catch {
      loadNotifications();
    }
  };

  const clearNotifications = async () => {
    if (visibleNotifications.length === 0) return;
    const visibleIds = visibleNotifications.map((item) => item.id);
    const previousReadIds = readNotificationIds;
    const previousClearedIds = clearedNotificationIds;
    const nextReadIds = [...new Set([...previousReadIds, ...visibleIds])];
    const nextClearedIds = [...new Set([...previousClearedIds, ...visibleIds])];
    const storageKeys = getNotificationStorageKeys(user?.id);

    setReadNotificationIds(nextReadIds);
    setClearedNotificationIds(nextClearedIds);
    writeStoredNotificationIds(storageKeys.read, nextReadIds);
    writeStoredNotificationIds(storageKeys.cleared, nextClearedIds);
    try {
      // O dropdown exibe apenas as notificações mais recentes. Sem os IDs,
      // o backend arquiva toda a caixa ativa para que itens antigos não
      // ocupem o lugar do lote que acabou de ser limpo.
      await archiveNotifications();
      toast.success('Notificações limpas.');
    } catch (error) {
      setReadNotificationIds(previousReadIds);
      setClearedNotificationIds(previousClearedIds);
      writeStoredNotificationIds(storageKeys.read, previousReadIds);
      writeStoredNotificationIds(storageKeys.cleared, previousClearedIds);
      toast.error(error.message || 'Não foi possível limpar as notificações.');
      loadNotifications();
    }
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

              <div className={styles.notifFooter}>
                <Link to="/notifications" onClick={() => setNotificationsOpen(false)}>
                  Ver histórico completo
                </Link>
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

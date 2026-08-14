import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaCalendarDays,
  FaCircleCheck,
  FaClock,
  FaCreditCard,
  FaFilter,
  FaHeadset,
  FaInbox,
  FaMagnifyingGlass,
  FaMessage,
  FaReceipt,
  FaRotateRight,
  FaShieldHalved,
  FaStar,
  FaUserShield,
} from 'react-icons/fa6';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/authContextStore';
import {
  loadNotificationFeed,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../services/notifications';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './Notifications.module.css';

const TYPE_COPY = {
  all: { label: 'Todos os tipos', icon: <FaBell /> },
  order: { label: 'Pedidos', icon: <FaReceipt /> },
  payment: { label: 'Pagamentos', icon: <FaCreditCard /> },
  message: { label: 'Mensagens', icon: <FaMessage /> },
  review: { label: 'Avaliações', icon: <FaStar /> },
  verification: { label: 'Verificação', icon: <FaShieldHalved /> },
  support: { label: 'Suporte', icon: <FaHeadset /> },
  admin: { label: 'Administração', icon: <FaUserShield /> },
};

const STATUS_COPY = {
  all: 'Todos',
  unread: 'Não lidas',
  read: 'Lidas',
  archived: 'Arquivadas',
};

const formatDateTime = (value) => {
  if (!value) return 'Agora';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRelativeTime = (value) => {
  if (!value) return 'Agora';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
};

const isInsideDateRange = (value, startDate, endDate) => {
  if (!value) return true;
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return true;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`).getTime();
    if (date < start) return false;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59`).getTime();
    if (date > end) return false;
  }

  return true;
};

function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [clearedIds, setClearedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { history } = await loadNotificationFeed(user);
      setNotifications(history);
      setReadIds(history.filter((item) => item.readAt).map((item) => item.id));
      setClearedIds(history.filter((item) => item.archivedAt).map((item) => item.id));
    } catch (error) {
      toast.error(error.message || 'Não foi possível carregar notificações.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const filteredNotifications = useMemo(() => {
    const query = filters.search.trim().toLocaleLowerCase('pt-BR');

    return notifications.filter((notification) => {
      const unread = !readIds.includes(notification.id);
      const archived = clearedIds.includes(notification.id);
      const searchable = `${notification.title || ''} ${notification.description || ''} ${notification.actor || ''}`.toLocaleLowerCase('pt-BR');

      if (filters.type !== 'all' && notification.type !== filters.type) return false;
      if (filters.status === 'unread' && !unread) return false;
      if (filters.status === 'read' && unread) return false;
      if (filters.status === 'archived' && !archived) return false;
      if (query && !searchable.includes(query)) return false;
      return isInsideDateRange(notification.createdAt, filters.startDate, filters.endDate);
    });
  }, [clearedIds, filters, notifications, readIds]);

  const stats = useMemo(() => {
    const unread = notifications.filter((item) => !readIds.includes(item.id)).length;
    const verification = notifications.filter((item) => item.type === 'verification').length;
    const archived = notifications.filter((item) => clearedIds.includes(item.id)).length;

    return {
      total: notifications.length,
      unread,
      verification,
      archived,
      last: notifications[0]?.createdAt,
    };
  }, [clearedIds, notifications, readIds]);

  const markAllRead = async () => {
    const next = [...new Set([...readIds, ...notifications.map((item) => item.id)])];
    setReadIds(next);
    try {
      await markAllNotificationsRead();
      toast.success('Notificações marcadas como lidas.');
    } catch (error) {
      toast.error(error.message || 'Não foi possível atualizar as notificações.');
      loadNotifications();
    }
  };

  const markRead = async (id) => {
    if (!id || readIds.includes(id)) return;
    const next = [...new Set([...readIds, id])];
    setReadIds(next);
    try {
      await markNotificationRead(id);
    } catch {
      loadNotifications();
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', type: 'all', status: 'all', startDate: '', endDate: '' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.mobileHeader}>
        <button type="button" className={styles.mobileBackBtn} onClick={() => navigate(-1)} aria-label="Voltar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1>Notificações</h1>
      </div>

      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Notificações</span>
          <h1>Histórico completo da sua conta</h1>
          <p>Pedidos, pagamentos, mensagens, suporte e segurança ficam organizados em uma linha do tempo única.</p>
        </div>

        <div className={styles.heroPanel}>
          <span>Último evento</span>
          <strong>{stats.last ? getRelativeTime(stats.last) : 'Sem eventos'}</strong>
          <button type="button" onClick={loadNotifications} disabled={loading}>
            <FaRotateRight /> Atualizar
          </button>
        </div>
      </section>

      <section className={styles.metricGrid}>
        <SpotlightCard className={styles.metricCard}>
          <FaBell />
          <span>Total</span>
          <strong>{stats.total}</strong>
          <p>Eventos guardados no histórico</p>
        </SpotlightCard>
        <SpotlightCard className={styles.metricCard}>
          <FaInbox />
          <span>Não lidas</span>
          <strong>{stats.unread}</strong>
          <p>Itens que ainda precisam de atenção</p>
        </SpotlightCard>
        <SpotlightCard className={styles.metricCard}>
          <FaShieldHalved />
          <span>Verificação</span>
          <strong>{stats.verification}</strong>
          <p>Atualizações sobre identidade</p>
        </SpotlightCard>
        <SpotlightCard className={styles.metricCard}>
          <FaCircleCheck />
          <span>Arquivadas</span>
          <strong>{stats.archived}</strong>
          <p>Notificações limpas no topo</p>
        </SpotlightCard>
      </section>

      <section className={styles.filtersPanel}>
        <div className={styles.searchBox}>
          <FaMagnifyingGlass />
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Buscar por título, pessoa ou detalhe..."
          />
        </div>

        <label className={styles.filterField}>
          <span><FaFilter /> Tipo</span>
          <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}>
            {Object.entries(TYPE_COPY).map(([value, copy]) => (
              <option key={value} value={value}>{copy.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span>Status</span>
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
            {Object.entries(STATUS_COPY).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span><FaCalendarDays /> De</span>
          <input type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} />
        </label>

        <label className={styles.filterField}>
          <span>Até</span>
          <input type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} />
        </label>

        <div className={styles.filterActions}>
          <button type="button" onClick={clearFilters}>Limpar filtros</button>
          <button type="button" onClick={markAllRead} disabled={notifications.length === 0}>Marcar lidas</button>
        </div>
      </section>

      <section className={styles.timelinePanel}>
        <div className={styles.timelineHeader}>
          <div>
            <span className={styles.eyebrow}>Linha do tempo</span>
            <h2>{filteredNotifications.length} notificações</h2>
          </div>
          {loading && <span className={styles.loadingPill}>Atualizando</span>}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div><FaInbox /></div>
            <strong>Nenhuma notificação encontrada</strong>
            <p>Altere os filtros ou atualize a página para buscar eventos recentes.</p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {filteredNotifications.map((notification) => {
              const unread = !readIds.includes(notification.id);
              const archived = clearedIds.includes(notification.id);
              const typeCopy = TYPE_COPY[notification.type] || TYPE_COPY.all;

              return (
                <Link
                  key={notification.id}
                  to={notification.to || '#'}
                  className={`${styles.notificationItem} ${unread ? styles.unread : ''}`}
                  onClick={() => markRead(notification.id)}
                >
                  <span className={`${styles.itemTone} ${styles[`tone${notification.tone}`]}`}>
                    {typeCopy.icon}
                  </span>
                  <span className={styles.itemContent}>
                    <span className={styles.itemMeta}>
                      <strong>{typeCopy.label}</strong>
                      <small className={styles.metaAbsolute}>{formatDateTime(notification.createdAt)}</small>
                      <small className={styles.metaRelative}>{getRelativeTime(notification.createdAt)}</small>
                    </span>
                    <span className={styles.itemTitle}>{notification.title}</span>
                    <span className={styles.itemDescription}>{notification.description}</span>
                  </span>
                  <span className={styles.itemBadges}>
                    {unread && <em className={styles.unreadBadge}>Nova</em>}
                    {archived && <em className={styles.archivedBadge}>Arquivada</em>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Notifications;

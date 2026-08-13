import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { listConversations } from '../../../services/messages';
import { listOrders } from '../../../services/orders';
import { connectSocket, getSocket } from '../../../services/socket';
import styles from './BottomTabBar.module.css';

const ACTIVE_ORDER_STATUSES = new Set(['PENDING', 'IN_PROGRESS', 'DELIVERED']);

const icons = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 001 1H9a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2.5a1 1 0 001-1v-9" />
    </svg>
  ),
  explore: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  orders: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  messages: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  plus: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

function TabLink({ path, icon, label, badge }) {
  return (
    <NavLink
      to={path}
      end={path === '/dashboard'}
      className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.tabIcon}>
        {icons[icon]}
        {badge ? <span className={styles.badgeDot} /> : null}
      </span>
      <span className={styles.tabLabel}>{label}</span>
    </NavLink>
  );
}

function BottomTabBar({ userRole = 'freelancer', immersive = false }) {
  const isFreelancer = userRole === 'freelancer';
  const [badges, setBadges] = useState({ orders: 0, messages: 0 });

  const orderRole = isFreelancer ? 'seller' : 'buyer';

  const loadBadges = useCallback(async () => {
    const [ordersResult, conversationsResult] = await Promise.allSettled([
      listOrders({ role: orderRole, pageSize: 50 }),
      listConversations(),
    ]);

    const orderItems = ordersResult.status === 'fulfilled' ? ordersResult.value?.items || [] : [];
    const conversations = conversationsResult.status === 'fulfilled' ? conversationsResult.value || [] : [];

    setBadges({
      orders: orderItems.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status)).length,
      messages: conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0),
    });
  }, [orderRole]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadBadges(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBadges]);

  useEffect(() => {
    const socket = connectSocket();
    const refresh = () => loadBadges();
    const events = ['order:new', 'order:updated', 'order:event', 'message:new', 'conversation:message', 'conversation:new'];

    events.forEach((event) => socket.on(event, refresh));

    return () => {
      const current = getSocket();
      events.forEach((event) => current.off(event, refresh));
    };
  }, [loadBadges]);

  const centerAction = isFreelancer
    ? { label: 'Criar serviço', to: '/services/new' }
    : { label: 'Publicar projeto', to: '/projects/new' };

  return (
    <nav className={`${styles.tabBar} ${immersive ? styles.tabBarImmersive : ''}`} aria-label="Navegação principal">
      <TabLink path="/dashboard" icon="home" label="Dashboard" />
      <TabLink path="/explore" icon="explore" label="Explorar" />

      <Link to={centerAction.to} className={styles.centerBtn} aria-label={centerAction.label}>
        {icons.plus}
      </Link>

      <TabLink path="/orders" icon="orders" label="Pedidos" badge={badges.orders} />
      <TabLink path="/messages" icon="messages" label="Conversas" badge={badges.messages} />
    </nav>
  );
}

export default BottomTabBar;

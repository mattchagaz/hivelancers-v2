import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { listConversations } from '../../../services/messages';
import { listOrders } from '../../../services/orders';
import { connectSocket, getSocket } from '../../../services/socket';
import styles from './Sidebar.module.css';
import Logo from '/Logo.svg';

const ACTIVE_ORDER_STATUSES = new Set(['PENDING', 'IN_PROGRESS', 'DELIVERED']);

function Sidebar({ userRole = 'freelancer', isAdmin = false, collapsed, mobileOpen, onToggle, onMobileClose }) {
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

  const attentionBadge = badges.orders + badges.messages;

  const mainNav = useMemo(() => {
    const ordersBadge = badges.orders || undefined;
    const messagesBadge = badges.messages || undefined;

    const roleNav = isFreelancer
      ? [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { label: 'Meus Serviços', path: '/services', icon: 'services' },
        { label: 'Pedidos', path: '/orders', icon: 'orders', badge: ordersBadge },
        { label: 'Mensagens', path: '/messages', icon: 'messages', badge: messagesBadge },
        { label: 'Favoritos', path: '/favorites', icon: 'heart' },
        { label: 'Financeiro', path: '/finances', icon: 'finances' },
        { label: 'Recompensas', path: '/rewards', icon: 'rewards' },
      ]
      : [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Explorar', path: '/explore', icon: 'explore' },
      { label: 'Meus Pedidos', path: '/orders', icon: 'cart', badge: ordersBadge },
      { label: 'Mensagens', path: '/messages', icon: 'messages', badge: messagesBadge },
      { label: 'Favoritos', path: '/favorites', icon: 'heart' },
      { label: 'Recompensas', path: '/rewards', icon: 'rewards' },
    ];

    return isAdmin
      ? [{ label: 'Admin', path: '/admin', icon: 'admin', badge: attentionBadge || undefined }, ...roleNav]
      : roleNav;
  }, [attentionBadge, badges.messages, badges.orders, isAdmin, isFreelancer]);

  const icons = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
    admin: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.6-2.9 8.7-7 10-4.1-1.3-7-5.4-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    services: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    orders: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    messages: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    finances: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    rewards: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
    explore: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    cart: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      </svg>
    ),
    heart: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  };

  const sidebarClass = `${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`;

  return (
    <>
      {mobileOpen && <div className={styles.overlay} onClick={onMobileClose} />}

      <aside className={sidebarClass}>
        {/* Logo */}
        <div className={styles.logoArea}>
          <div className={styles.logoMark}>
            <img src={Logo} alt="Hivelancers" width={23} height={29} />
            </div>
          <div className={`${styles.logoTextWrap} ${collapsed ? styles.hidden : ''}`}>
            <span className={styles.logoText}>Hivelancers</span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          <span className={`${styles.navLabel} ${collapsed ? styles.hidden : ''}`}>Menu principal</span>
          {mainNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              title={collapsed ? item.label : undefined}
              onClick={onMobileClose}
            >
              <span className={styles.navIcon}>{icons[item.icon]}</span>
              <span className={`${styles.navText} ${collapsed ? styles.hidden : ''}`}>
                {item.label}
              </span>
              {item.badge && !collapsed && (
                <span className={styles.badge}>{item.badge}</span>
              )}
              {item.badge && collapsed && <span className={styles.badgeDot} />}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className={styles.bottom}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={collapsed ? 'Configurações' : undefined}
            onClick={onMobileClose}
          >
            <span className={styles.navIcon}>{icons.settings}</span>
            <span className={`${styles.navText} ${collapsed ? styles.hidden : ''}`}>
              Configurações
            </span>
          </NavLink>

          <button className={styles.collapseBtn} onClick={onToggle}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
            >
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
            <span className={`${styles.navText} ${collapsed ? styles.hidden : ''}`}>Recolher</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

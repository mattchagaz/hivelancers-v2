import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import BottomTabBar from './BottomTabBar/BottomTabBar';
import { useAuth } from '../../contexts/authContextStore';
import { isAdminUser, toRoleSlug } from '../../utils/authFlow';
import styles from './AppLayout.module.css';

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('hivelancers:sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Tela de detalhe de serviço e o checkout usam um layout imersivo no
  // mobile (sem TopBar/tab bar) — mas não as rotas /services/new nem
  // /services/:id/edit.
  const serviceDetailMatch = location.pathname.match(/^\/services\/([^/]+)$/);
  const isServiceDetailImmersive = Boolean(serviceDetailMatch) && serviceDetailMatch[1] !== 'new';
  const isCheckoutImmersive = /^\/checkout\/[^/]+$/.test(location.pathname);

  // Página de mensagens: no mobile, a lista de conversas esconde só a
  // TopBar (mantém a tab bar para navegação); ao abrir uma conversa
  // (?chat=) o chat vira tela cheia, escondendo TopBar e tab bar.
  const isMessagesRoute = location.pathname === '/messages';
  const hasActiveChat = new URLSearchParams(location.search).has('chat');
  const isMessagesChatImmersive = isMessagesRoute && hasActiveChat;
  const isMessagesListImmersive = isMessagesRoute && !hasActiveChat;

  // Configurações: tanto o menu principal quanto uma seção aberta (?tab=)
  // escondem só a TopBar — a tab bar continua visível pra facilitar sair
  // das configurações a qualquer momento.
  const isSettingsRoute = location.pathname === '/settings';

  // Admin: mesma ideia — o painel tem seu próprio cabeçalho mobile, só a
  // TopBar some, a tab bar continua visível em todas as abas.
  const isAdminRoute = location.pathname === '/admin';

  const isImmersivePage = isServiceDetailImmersive || isCheckoutImmersive || isMessagesChatImmersive;
  const isTopBarImmersive = isImmersivePage || isMessagesListImmersive || isSettingsRoute || isAdminRoute;

  const isAdmin = isAdminUser(user);
  const userRole = toRoleSlug(user?.userType) || 'freelancer';
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  useEffect(() => {
    try {
      window.localStorage.setItem('hivelancers:sidebar-collapsed', String(sidebarCollapsed));
    } catch {
      // A navegação continua funcionando mesmo com armazenamento bloqueado.
    }
  }, [sidebarCollapsed]);

  return (
    <div className={styles.layout}>
      <Sidebar
        userRole={userRole}
        isAdmin={isAdmin}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={toggleSidebar}
        onMobileClose={closeMobileSidebar}
      />

      <div className={`${styles.mainArea} ${sidebarCollapsed ? styles.collapsed : ''} ${isImmersivePage ? styles.immersive : ''}`}>
        <TopBar
          userName={userName}
          userRole={isAdmin ? 'admin' : userRole}
          avatarUrl={user?.avatarUrl}
          onMenuToggle={toggleSidebar}
          immersive={isTopBarImmersive}
        />
        <main className={styles.content}>
          <Outlet />
        </main>
        <footer className={styles.legalFooter}>
          <span>© 2026 Hivelancers</span>
          <nav aria-label="Links jurídicos">
            <Link to="/terms">Termos</Link>
            <Link to="/privacy">Privacidade</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/lgpd">Direitos LGPD</Link>
          </nav>
        </footer>
      </div>

      <BottomTabBar userRole={userRole} immersive={isImmersivePage} />

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default AppLayout;

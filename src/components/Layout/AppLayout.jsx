import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import BottomTabBar from './BottomTabBar/BottomTabBar';
import { useAuth } from '../../contexts/authContextStore';
import { isAdminUser, toRoleSlug } from '../../utils/authFlow';
import { ADMIN_MODAL_VISIBILITY_EVENT } from '../../hooks/useAdminModalSignal';
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
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Escuta o sinal disparado pelos modais do admin (AdminModal + revisão de
  // identidade) pra esconder a tab bar enquanto um deles estiver aberto —
  // senão ela fica sobreposta ao modal em tela cheia no mobile.
  useEffect(() => {
    const handleVisibility = (event) => setIsAdminModalOpen(Boolean(event.detail?.open));
    window.addEventListener(ADMIN_MODAL_VISIBILITY_EVENT, handleVisibility);
    return () => window.removeEventListener(ADMIN_MODAL_VISIBILITY_EVENT, handleVisibility);
  }, []);

  useEffect(() => {
    setIsAdminModalOpen(false);
  }, [location.pathname]);

  // Tela de detalhe de serviço e o checkout usam um layout imersivo no
  // mobile (sem TopBar/tab bar) — mas não as rotas /services/new nem
  // /services/:id/edit.
  const serviceDetailMatch = location.pathname.match(/^\/services\/([^/]+)$/);
  const isServiceDetailImmersive = Boolean(serviceDetailMatch) && serviceDetailMatch[1] !== 'new';
  const isCheckoutImmersive = /^\/checkout\/[^/]+$/.test(location.pathname);

  // Perfil público (não a rota de edição /profile/customize) usa o mesmo
  // layout imersivo no mobile.
  const profileMatch = location.pathname.match(/^\/profile\/([^/]+)$/);
  const isProfileImmersive = Boolean(profileMatch) && profileMatch[1] !== 'customize';

  // Publicar projeto vira uma folha em tela cheia com botão de fechar, mas
  // só esconde a TopBar — a tab bar continua visível pra navegação.
  const isCreateProjectRoute = location.pathname === '/projects/new';

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
  // TopBar some, a tab bar continua visível nas abas; mas com um modal
  // aberto (editor de serviço/cupom/nível/ticket/usuário, ou revisão de
  // identidade) a tab bar também some, já que fica atrás do modal mesmo.
  const isAdminRoute = location.pathname === '/admin';
  const isAdminModalImmersive = isAdminRoute && isAdminModalOpen;

  const isImmersivePage = isServiceDetailImmersive || isCheckoutImmersive || isMessagesChatImmersive || isAdminModalImmersive || isProfileImmersive;
  const isTopBarImmersive = isImmersivePage || isMessagesListImmersive || isSettingsRoute || isAdminRoute || isCreateProjectRoute;

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

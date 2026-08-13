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

  // Tela de detalhe de serviço usa um layout imersivo no mobile (sem
  // TopBar/tab bar) — mas não as rotas /services/new nem /services/:id/edit.
  const serviceDetailMatch = location.pathname.match(/^\/services\/([^/]+)$/);
  const isImmersivePage = Boolean(serviceDetailMatch) && serviceDetailMatch[1] !== 'new';

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
          immersive={isImmersivePage}
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

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import { useAuth } from '../../contexts/AuthContext';
import { toRoleSlug } from '../../utils/authFlow';
import styles from './AppLayout.module.css';

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

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

  return (
    <div className={styles.layout}>
      <Sidebar
        userRole={userRole}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={toggleSidebar}
        onMobileClose={closeMobileSidebar}
      />

      <div className={`${styles.mainArea} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <TopBar
          userName={userName}
          userRole={userRole}
          avatarUrl={user?.avatarUrl}
          onMenuToggle={toggleSidebar}
        />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default AppLayout;

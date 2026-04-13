import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import { getStoredUserRole } from '../../utils/userRole';
import styles from './AppLayout.module.css';

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const userRole = getStoredUserRole();
  const userName = 'João Silva';

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
          onMenuToggle={toggleSidebar}
        />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

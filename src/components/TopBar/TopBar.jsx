import { useState } from 'react';
import styles from './TopBar.module.css';

function TopBar({ userName = 'João', userRole = 'freelancer', onMenuToggle }) {
  const [searchFocused, setSearchFocused] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

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
          {getGreeting()}, <span className={styles.greetName}>{userName.split(' ')[0]}</span>
        </h1>
        <p className={styles.greetSub}>
          {userRole === 'freelancer' ? 'Painel do Freelancer' : 'Painel do Cliente'}
        </p>
      </div>

      <div className={`${styles.search} ${searchFocused ? styles.searchActive : ''}`}>
        <svg className={styles.searchIco} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd className={styles.kbd}>/</kbd>
      </div>

      <div className={styles.right}>
        <button className={styles.iconBtn} title="Notificações">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className={styles.notifDot} />
        </button>

        <div className={styles.sep} />

        <button className={styles.userBtn}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>
              {userRole === 'freelancer' ? 'Freelancer' : 'Cliente'}
            </span>
          </div>
          <svg className={styles.chevron} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default TopBar;
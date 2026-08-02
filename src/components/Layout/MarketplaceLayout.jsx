import { Link, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from './AppLayout';
import Logo from '/Logo3.svg';
import styles from './MarketplaceLayout.module.css';

function MarketplaceLayout() {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (user) {
    return <AppLayout />;
  }

  const returnTo = `${location.pathname}${location.search}`;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/explore" className={styles.brand} aria-label="Hivelancers">
            <span className={styles.brandMark}>
              <img src={Logo} alt="" width={20} height={20} />
            </span>
            <span className={styles.brandLabel}>Hivelancers</span>
          </Link>

          <nav className={styles.nav} aria-label="Navegação do marketplace">
            <Link to="/explore">Explorar serviços</Link>
            <Link to="/projects">Encontrar projetos</Link>
          </nav>

          <div className={styles.actions}>
            <Link to="/login" state={{ from: returnTo }} className={styles.login}>
              Entrar
            </Link>
            <Link to="/signup" className={styles.signup}>
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div>
          <strong>Hivelancers</strong>
          <span>Talentos e projetos com relações mais claras.</span>
        </div>
        <nav aria-label="Links jurídicos">
          <Link to="/terms">Termos</Link>
          <Link to="/privacy">Privacidade</Link>
          <Link to="/cookies">Cookies</Link>
          <Link to="/lgpd">Direitos LGPD</Link>
        </nav>
      </footer>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default MarketplaceLayout;

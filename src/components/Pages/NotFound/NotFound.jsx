import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/authContextStore';
import styles from './NotFound.module.css';

function NotFound() {
  const { isAuthenticated } = useAuth();
  const homeTo = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Página não encontrada</h1>
        <p className={styles.message}>
          O link pode estar quebrado ou a página pode ter sido movida ou removida.
        </p>
        <div className={styles.actions}>
          <Link to={homeTo} className={`${styles.button} ${styles.primary}`}>
            {isAuthenticated ? 'Ir para o Dashboard' : 'Ir para o Login'}
          </Link>
          <Link to="/explore" className={`${styles.button} ${styles.secondary}`}>
            Explorar serviços
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

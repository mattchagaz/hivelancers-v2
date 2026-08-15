import { Link } from 'react-router-dom';
import { FaArrowRight, FaCompass, FaHouse } from 'react-icons/fa6';
import { useAuth } from '../../../contexts/authContextStore';
import BrandLogo from '../../UI/BrandLogo/BrandLogo';
import styles from './NotFound.module.css';

function NotFound() {
  const { isAuthenticated } = useAuth();
  const homeTo = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className={styles.wrap}>
      <div className={styles.glowPrimary} />
      <div className={styles.glowSecondary} />

      <header className={styles.header}>
        <Link to={homeTo} className={styles.brand}>
          <span className={styles.brandLogo}><BrandLogo /></span>
          <span>Hivelancers</span>
        </Link>
      </header>

      <main className={styles.card}>
        <div className={styles.visual} aria-hidden="true">
          <span className={styles.orbitOne} />
          <span className={styles.orbitTwo} />
          <span className={styles.visualLogo}><BrandLogo label="" /></span>
          <strong className={styles.code}>404</strong>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>Parece que esta página saiu do mapa.</h1>
          <p className={styles.message}>
            O endereço pode estar incorreto, ou o conteúdo foi movido. Você pode retornar ao seu ponto de partida ou continuar explorando oportunidades.
          </p>
          <div className={styles.actions}>
            <Link to={homeTo} className={`${styles.button} ${styles.primary}`}>
              <FaHouse />
              {isAuthenticated ? 'Voltar ao painel' : 'Ir para o login'}
              <FaArrowRight className={styles.buttonArrow} />
            </Link>
            <Link to="/explore" className={`${styles.button} ${styles.secondary}`}>
              <FaCompass /> Explorar serviços
            </Link>
          </div>
        </div>
      </main>

      <p className={styles.footer}>
        Ainda perdido? A <Link to="/support" className={styles.footerLink}>Central de Ajuda</Link> pode orientar seu próximo passo.
      </p>
    </div>
  );
}

export default NotFound;

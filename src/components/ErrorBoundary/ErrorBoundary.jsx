import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

/**
 * Captura erros de render em qualquer parte da árvore e mostra um fallback
 * amigável em vez de deixar a SPA inteira em tela branca.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Ponto de integração para um serviço de monitoramento (Sentry, etc.).
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className={styles.wrap} role="alert">
        <div className={styles.card}>
          <div className={styles.icon} aria-hidden="true">⚠️</div>
          <h1 className={styles.title}>Algo deu errado</h1>
          <p className={styles.message}>
            Encontramos um problema inesperado ao carregar esta página. Você pode
            tentar recarregar ou voltar ao início.
          </p>
          <div className={styles.actions}>
            <button type="button" className={`${styles.button} ${styles.primary}`} onClick={this.handleReload}>
              Recarregar página
            </button>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={this.handleGoHome}>
              Ir para o início
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className={styles.details}>
              <summary>Detalhes do erro (dev)</summary>
              <pre>{this.state.error.stack || String(this.state.error)}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

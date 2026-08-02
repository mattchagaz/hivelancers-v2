import styles from '../Admin.module.css';
import { useAdmin } from '../AdminContext';

export default function OverviewTab() {
  const {
    loadAdminOverview,
    overviewLoading,
    overviewSignals,
    adminActionItems,
    setActiveTab,
  } = useAdmin();

  return (
    <div className={styles.overviewGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <span className={styles.sectionKicker}>Indicadores</span>
            <h3>Base da plataforma</h3>
          </div>
          <button type="button" className={styles.ghostButton} onClick={loadAdminOverview} disabled={overviewLoading}>
            {overviewLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className={styles.signalGrid}>
          {overviewSignals.map((signal) => (
            <div key={signal.label} className={styles.signalCard}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
              <em className={`${styles.badge} ${styles[signal.tone]}`}>{signal.status}</em>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <span className={styles.sectionKicker}>Prioridades</span>
            <h3>Fila de ação</h3>
          </div>
          <button type="button" className={styles.primaryButton} onClick={() => setActiveTab('support')}>
            Ver suporte
          </button>
        </div>

        <div className={styles.actionList}>
          {adminActionItems.map((item) => (
            <article key={item.title} className={styles.actionItem}>
              <div className={styles.actionIcon}>{item.icon}</div>
              <div>
                <strong>{item.title}</strong>
                <span>{item.owner} · {item.type}</span>
              </div>
              <em className={`${styles.badge} ${styles[item.tone]}`}>{item.priority}</em>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

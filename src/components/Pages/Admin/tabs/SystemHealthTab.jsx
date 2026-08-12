import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowsRotate,
  FaCircleCheck,
  FaClock,
  FaCloudArrowUp,
  FaDatabase,
  FaEnvelope,
  FaGaugeHigh,
  FaGoogle,
  FaHeartPulse,
  FaLink,
  FaServer,
  FaShieldHalved,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import { getAdminSystemHealth } from '../../../../services/admin';
import adminStyles from '../Admin.module.css';
import styles from './SystemHealthTab.module.css';

const STATUS_COPY = {
  healthy: { label: 'Tudo operacional', description: 'Todos os serviços monitorados estão respondendo normalmente.' },
  degraded: { label: 'Atenção necessária', description: 'A plataforma está disponível, mas há integrações que precisam de atenção.' },
  critical: { label: 'Incidente detectado', description: 'Um serviço essencial está indisponível e pode afetar usuários.' },
};

const SERVICE_STATUS_COPY = {
  operational: 'Operacional',
  degraded: 'Degradado',
  unavailable: 'Indisponível',
};

const SERVICE_ICONS = {
  api: FaServer,
  database: FaDatabase,
  stripe: FaShieldHalved,
  'stripe-webhooks': FaLink,
  email: FaEnvelope,
  cloudinary: FaCloudArrowUp,
  'google-oauth': FaGoogle,
};

const METRIC_DEFINITIONS = [
  { key: 'pendingCheckouts', label: 'Checkouts aguardando', description: 'Criados ou pendentes de confirmação', tone: 'neutral' },
  { key: 'failedPayments24h', label: 'Falhas em 24 horas', description: 'Pagamentos que precisam de atenção', tone: 'danger' },
  { key: 'heldTransfers', label: 'Repasses retidos', description: 'Pagamentos recebidos ainda em custódia', tone: 'warning' },
  { key: 'openDisputes', label: 'Disputas abertas', description: 'Casos aguardando mediação', tone: 'warning' },
  { key: 'unansweredTickets', label: 'Tickets sem resposta', description: 'Solicitações abertas pela comunidade', tone: 'warning' },
  { key: 'pendingVerifications', label: 'Verificações pendentes', description: 'Identidades aguardando revisão', tone: 'neutral' },
];

const formatUptime = (seconds = 0) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
};

const formatCheckedAt = (value) => {
  if (!value) return 'Ainda não verificado';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
};

export default function SystemHealthTab() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHealth = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setHealth(await getAdminSystemHealth());
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível verificar a saúde do sistema.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    const interval = window.setInterval(() => loadHealth({ silent: true }), 60_000);
    return () => window.clearInterval(interval);
  }, [loadHealth]);

  const statusCopy = STATUS_COPY[health?.status] || STATUS_COPY.degraded;
  const metrics = useMemo(() => METRIC_DEFINITIONS.map((metric) => ({
    ...metric,
    value: health?.metrics?.[metric.key],
  })), [health]);

  if (loading && !health) {
    return (
      <section className={`${adminStyles.panel} ${styles.healthPanel}`} aria-live="polite">
        <div className={styles.loadingState}>
          <span className={styles.loadingIcon}><FaHeartPulse /></span>
          <strong>Verificando a infraestrutura...</strong>
          <p>Consultando serviços essenciais e indicadores operacionais.</p>
        </div>
      </section>
    );
  }

  if (error && !health) {
    return (
      <section className={`${adminStyles.panel} ${styles.healthPanel}`}>
        <div className={styles.errorState}>
          <span><FaTriangleExclamation /></span>
          <strong>Não foi possível concluir o diagnóstico</strong>
          <p>{error}</p>
          <button type="button" className={adminStyles.primaryButton} onClick={() => loadHealth()}>
            <FaArrowsRotate /> Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`${adminStyles.panel} ${styles.healthPanel}`} aria-live="polite">
      <div className={adminStyles.panelHead}>
        <div>
          <span className={adminStyles.sectionKicker}>Operação</span>
          <h3>Saúde da plataforma</h3>
          <p className={adminStyles.panelDescription}>
            Diagnóstico em tempo real dos serviços essenciais e das filas que exigem acompanhamento.
          </p>
        </div>
        <button
          type="button"
          className={adminStyles.ghostButton}
          onClick={() => loadHealth({ silent: true })}
          disabled={refreshing}
        >
          <FaArrowsRotate className={refreshing ? styles.spinning : ''} />
          {refreshing ? 'Verificando...' : 'Atualizar agora'}
        </button>
      </div>

      {error && (
        <div className={styles.staleWarning}>
          <FaTriangleExclamation />
          <span>{error} Exibindo o último diagnóstico disponível.</span>
        </div>
      )}

      <div className={`${styles.statusHero} ${styles[health.status]}`}>
        <div className={styles.statusIdentity}>
          <span className={styles.pulseIcon}><FaHeartPulse /></span>
          <div>
            <span className={styles.statusLabel}>{statusCopy.label}</span>
            <h4>{statusCopy.description}</h4>
          </div>
        </div>
        <div className={styles.statusMetadata}>
          <div><FaClock /><span>Última verificação</span><strong>{formatCheckedAt(health.checkedAt)}</strong></div>
          <div><FaGaugeHigh /><span>Tempo ativo</span><strong>{formatUptime(health.uptimeSeconds)}</strong></div>
          <div><FaServer /><span>Ambiente</span><strong>{health.environment}</strong></div>
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard} data-tone="operational">
          <span><FaCircleCheck /> Operacionais</span>
          <strong>{health.summary.operational}</strong>
          <p>de {health.summary.total} serviços monitorados</p>
        </article>
        <article className={styles.summaryCard} data-tone="degraded">
          <span><FaTriangleExclamation /> Degradados</span>
          <strong>{health.summary.degraded}</strong>
          <p>funcionando com alguma limitação</p>
        </article>
        <article className={styles.summaryCard} data-tone="unavailable">
          <span><FaServer /> Indisponíveis</span>
          <strong>{health.summary.unavailable}</strong>
          <p>serviços que exigem ação imediata</p>
        </article>
      </div>

      <div className={styles.sectionHeading}>
        <div>
          <span>Infraestrutura</span>
          <h4>Serviços monitorados</h4>
        </div>
        <p>Checks externos possuem limite de tempo para não bloquear o painel.</p>
      </div>

      <div className={styles.serviceGrid}>
        {health.services.map((service) => {
          const Icon = SERVICE_ICONS[service.id] || FaServer;
          return (
            <article key={service.id} className={styles.serviceCard} data-status={service.status}>
              <div className={styles.serviceTop}>
                <span className={styles.serviceIcon}><Icon /></span>
                <span className={styles.serviceBadge}>
                  <i /> {SERVICE_STATUS_COPY[service.status] || service.status}
                </span>
              </div>
              <h5>{service.name}</h5>
              <p>{service.description}</p>
              <div className={styles.serviceMessage}>{service.message}</div>
              <div className={styles.detailList}>
                {service.details?.map((detail) => (
                  <span key={`${service.id}-${detail.label}`}>
                    <small>{detail.label}</small>
                    <strong>{detail.value}</strong>
                  </span>
                ))}
                {service.latencyMs !== null && (
                  <span><small>Latência</small><strong>{service.latencyMs} ms</strong></span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.sectionHeading}>
        <div>
          <span>Operação</span>
          <h4>Filas e pontos de atenção</h4>
        </div>
        <p>Os números são consultados no momento de cada diagnóstico.</p>
      </div>

      <div className={styles.metricsGrid}>
        {metrics.map((metric) => {
          const hasAttention = typeof metric.value === 'number' && metric.value > 0 && metric.tone !== 'neutral';
          return (
            <article key={metric.key} className={styles.metricCard} data-tone={hasAttention ? metric.tone : 'neutral'}>
              <span>{metric.label}</span>
              <strong>{metric.value ?? '—'}</strong>
              <p>{metric.value === null ? 'Métrica temporariamente indisponível' : metric.description}</p>
            </article>
          );
        })}
      </div>

      <footer className={styles.securityNote}>
        <FaShieldHalved />
        <div>
          <strong>Diagnóstico seguro e somente leitura</strong>
          <p>Nenhuma chave, token ou credencial é enviada ao navegador. A atualização automática ocorre a cada 60 segundos.</p>
        </div>
      </footer>
    </section>
  );
}

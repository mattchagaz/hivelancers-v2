import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaEye,
  FaMagnifyingGlass,
  FaPenToSquare,
  FaPlus,
  FaRotateRight,
} from 'react-icons/fa6';
import { SERVICE_GRADIENTS } from '../../../data/services';
import { listMyServices } from '../../../services/services';
import { CategoryIcon } from '../../../utils/categoryIcons';
import EmptyState from '../../UI/EmptyState/EmptyState';
import styles from './MyServices.module.css';

const STATUS_LABEL = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'DRAFT', label: 'Rascunhos' },
  { value: 'ARCHIVED', label: 'Arquivados' },
];

const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);

const formatDate = (value) => {
  if (!value) return 'Sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const normalize = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getMinPlan = (plans = []) => {
  if (!Array.isArray(plans) || plans.length === 0) return null;
  return plans.reduce((best, plan) => {
    if (!best) return plan;
    return Number(plan.priceCents || 0) < Number(best.priceCents || 0) ? plan : best;
  }, null);
};

function StatCard({ label, value, detail, tone }) {
  return (
    <div className={`${styles.statCard} ${tone ? styles[tone] : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function MyServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const loadServices = useCallback(async ({ silent = false } = {}) => {
    try {
      const items = await listMyServices();
      setServices(Array.isArray(items) ? items : []);
      if (silent) toast.success('Serviços atualizados.');
    } catch (error) {
      toast.error(error.message || 'Não foi possível carregar seus serviços.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadServices();
  }, [loadServices]);

  const stats = useMemo(() => {
    const total = services.length;
    const published = services.filter((service) => service.status === 'PUBLISHED').length;
    const drafts = services.filter((service) => service.status === 'DRAFT').length;
    const archived = services.filter((service) => service.status === 'ARCHIVED').length;

    return { total, published, drafts, archived };
  }, [services]);

  const visibleServices = useMemo(() => {
    const term = normalize(search);

    return services
      .filter((service) => status === 'all' || service.status === status)
      .filter((service) => {
        if (!term) return true;

        const haystack = [
          service.title,
          service.description,
          service.category?.name,
          service.subcategoryName,
          STATUS_LABEL[service.status],
        ].map(normalize).join(' ');

        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [search, services, status]);

  const hasFilters = search.trim() || status !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Portfólio comercial</span>
          <h1>Meus serviços</h1>
          <p>Gerencie publicações, rascunhos, preços e edições dos serviços que aparecem para clientes.</p>
          <div className={styles.heroActions}>
            <Link to="/services/new" className={`${styles.heroAction} ${styles.primary}`}>
              <FaPlus /> Novo serviço
            </Link>
            <button
              type="button"
              className={`${styles.heroAction} ${styles.secondary}`}
              onClick={() => loadServices({ silent: true })}
              disabled={loading}
            >
              <FaRotateRight /> Atualizar
            </button>
          </div>
        </div>
        <div className={styles.commandPanel}>
          <span>Status geral</span>
          <strong>{stats.published}</strong>
          <p>{stats.published === 1 ? 'serviço publicado' : 'serviços publicados'}</p>
        </div>
      </section>

      <section className={styles.statGrid} aria-label="Resumo dos serviços">
        <StatCard label="Total" value={stats.total} detail="Todos os serviços criados" />
        <StatCard label="Publicados" value={stats.published} detail="Visíveis no marketplace" tone="green" />
        <StatCard label="Rascunhos" value={stats.drafts} detail="Ainda em edição" tone="orange" />
        <StatCard label="Arquivados" value={stats.archived} detail="Fora da vitrine" tone="muted" />
      </section>

      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FaMagnifyingGlass />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título, descrição ou categoria..."
          />
          {search ? (
            <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca">
              x
            </button>
          ) : null}
        </div>

        <div className={styles.statusFilters} aria-label="Filtrar por status">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={status === item.value ? styles.statusFilterActive : ''}
              onClick={() => setStatus(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={styles.skeletonCard} />
          ))}
        </div>
      ) : visibleServices.length === 0 ? (
        <EmptyState
          icon={<FaMagnifyingGlass />}
          eyebrow={hasFilters ? 'Sem resultado' : 'Sem serviços'}
          title={hasFilters ? 'Nenhum serviço encontrado' : 'Você ainda não criou serviços'}
          description={hasFilters
            ? 'Ajuste a busca ou o status para ver outros serviços.'
            : 'Crie seu primeiro serviço para publicar preços, prazos e planos para clientes.'}
          actionLabel={hasFilters ? 'Limpar filtros' : 'Criar serviço'}
          actionTo={hasFilters ? undefined : '/services/new'}
          actionOnClick={hasFilters ? clearFilters : undefined}
          secondaryActionLabel={hasFilters ? 'Criar serviço' : undefined}
          secondaryActionTo={hasFilters ? '/services/new' : undefined}
        />
      ) : (
        <section className={styles.serviceGrid} aria-label="Lista de serviços">
          {visibleServices.map((service, index) => {
            const plan = getMinPlan(service.plans);
            const statusLabel = STATUS_LABEL[service.status] || service.status || 'Status';
            const canView = service.status === 'PUBLISHED';

            return (
              <article key={service.id} className={styles.serviceCard}>
                <div
                  className={styles.serviceVisual}
                  style={{
                    background: service.coverUrl
                      ? `url(${service.coverUrl}) center/cover`
                      : SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length],
                  }}
                >
                  <span className={styles.categoryBadge}>
                    <CategoryIcon category={service.category} />
                    {service.subcategoryName || service.category?.name || 'Serviço'}
                  </span>
                  <span className={`${styles.statusBadge} ${styles[`status_${service.status}`] || ''}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className={styles.serviceBody}>
                  <div className={styles.serviceTitleRow}>
                    <h2>{service.title}</h2>
                    <span>{service.plans?.length || 0} plano(s)</span>
                  </div>

                  {service.description ? <p>{service.description}</p> : null}

                  <div className={styles.metaGrid}>
                    <div>
                      <span>A partir de</span>
                      <strong>{formatPrice(plan?.priceCents)}</strong>
                    </div>
                    <div>
                      <span>Prazo</span>
                      <strong>{plan?.deliveryDays ? `${plan.deliveryDays} dia(s)` : 'A definir'}</strong>
                    </div>
                    <div>
                      <span>Atualizado</span>
                      <strong>{formatDate(service.updatedAt || service.createdAt)}</strong>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <Link to={`/services/${service.id}/edit`} className={styles.editAction}>
                      <FaPenToSquare /> Editar
                    </Link>
                    {canView ? (
                      <Link to={`/services/${service.id}`} className={styles.viewAction}>
                        <FaEye /> Ver
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default MyServices;

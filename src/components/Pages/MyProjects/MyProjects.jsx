import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBriefcase,
  FaCircleCheck,
  FaClock,
  FaInbox,
  FaLayerGroup,
  FaPlus,
} from 'react-icons/fa6';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { listMyProjects } from '../../../services/projects';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './MyProjects.module.css';

const statusLabels = {
  DRAFT: 'Rascunho',
  OPEN: 'Recebendo propostas',
  IN_PROGRESS: 'Profissional selecionado',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

const formatMoney = (cents = 0) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

function MyProjects() {
  const { user } = useAuth();
  const [status, setStatus] = useState('all');
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMyProjects({ status: 'all', pageSize: 50 })
      .then((data) => {
        if (!cancelled) setAllItems(data.items || []);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const items = useMemo(
    () => status === 'all' ? allItems : allItems.filter((project) => project.status === status),
    [allItems, status]
  );

  const metrics = useMemo(() => ({
    total: allItems.length,
    open: allItems.filter((project) => project.status === 'OPEN').length,
    proposals: allItems.reduce((sum, project) => sum + Number(project.proposalCount || 0), 0),
    selected: allItems.filter((project) => project.status === 'IN_PROGRESS').length,
    completed: allItems.filter((project) => project.status === 'COMPLETED').length,
  }), [allItems]);

  if (user?.userType !== 'CLIENT') {
    return (
      <div className={styles.empty}>
        <FaBriefcase />
        <h1>Área destinada a clientes</h1>
        <p>Freelancers podem encontrar oportunidades na vitrine pública.</p>
        <Link to="/projects">Encontrar projetos</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.eyebrow}>Central de projetos</span>
          <h1>Do briefing à escolha do profissional.</h1>
          <p>
            Organize oportunidades, acompanhe propostas e conduza cada contratação com clareza.
          </p>

          <nav className={styles.tabs} aria-label="Filtrar projetos por status">
            {[
              ['all', 'Todos'],
              ['DRAFT', 'Rascunhos'],
              ['OPEN', 'Abertos'],
              ['IN_PROGRESS', 'Em alinhamento'],
              ['COMPLETED', 'Concluídos'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={status === value ? styles.active : ''}
                onClick={() => setStatus(value)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className={styles.heroSide}>
          <span>Oportunidades ativas</span>
          <strong>{loading ? '...' : metrics.open}</strong>
          <p>
            {metrics.proposals
              ? `${metrics.proposals} ${metrics.proposals === 1 ? 'proposta recebida' : 'propostas recebidas'} no total.`
              : 'Publique um briefing para começar a receber propostas.'}
          </p>
          <Link to="/projects/new"><FaPlus /> Publicar projeto</Link>
        </div>
      </section>

      <section className={styles.statGrid}>
        <SpotlightCard className={styles.statCard}>
          <FaLayerGroup />
          <span>Total</span>
          <strong>{loading ? '...' : metrics.total}</strong>
          <p>Projetos criados por você</p>
        </SpotlightCard>
        <SpotlightCard className={styles.statCard}>
          <FaInbox />
          <span>Propostas</span>
          <strong>{loading ? '...' : metrics.proposals}</strong>
          <p>Respostas dos profissionais</p>
        </SpotlightCard>
        <SpotlightCard className={styles.statCard}>
          <FaClock />
          <span>Em alinhamento</span>
          <strong>{loading ? '...' : metrics.selected}</strong>
          <p>Profissionais selecionados</p>
        </SpotlightCard>
        <SpotlightCard className={styles.statCard}>
          <FaCircleCheck />
          <span>Concluídos</span>
          <strong>{loading ? '...' : metrics.completed}</strong>
          <p>Projetos finalizados</p>
        </SpotlightCard>
      </section>

      <div className={styles.listHeader}>
        <div>
          <span>Visão atual</span>
          <h2>{status === 'all' ? 'Todos os projetos' : statusLabels[status]}</h2>
        </div>
        <Link to="/projects">Ver oportunidades públicas <FaArrowRight /></Link>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando projetos…</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <FaBriefcase />
          <h2>Nenhum projeto nesta etapa</h2>
          <p>Publique um briefing para começar a receber propostas.</p>
          <Link to="/projects/new">Publicar primeiro projeto</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.cardTop}>
                  <span className={`${styles.status} ${styles[project.status.toLowerCase()]}`}>
                    {statusLabels[project.status]}
                  </span>
                  <small>{new Date(project.createdAt).toLocaleDateString('pt-BR')}</small>
                </div>
                <h2>{project.title}</h2>
                <p>{project.description}</p>
              </div>
              <div className={styles.metrics}>
                <div><small>Orçamento</small><strong>{formatMoney(project.budgetMaxCents)}</strong></div>
                <div><small>Propostas</small><strong>{project.proposalCount}</strong></div>
                <FaArrowRight />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProjects;

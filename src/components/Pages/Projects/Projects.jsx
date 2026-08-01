import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaArrowRight, FaBriefcase, FaCalendarDays, FaMagnifyingGlass } from 'react-icons/fa6';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { listCategories } from '../../../services/services';
import { listPublicProjects } from '../../../services/projects';
import { CategoryIcon } from '../../../utils/categoryIcons';
import styles from './Projects.module.css';

const formatMoney = (cents = 0) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const formatBudget = (project) =>
  project.budgetType === 'FIXED' || project.budgetMinCents === project.budgetMaxCents
    ? formatMoney(project.budgetMinCents)
    : `${formatMoney(project.budgetMinCents)} – ${formatMoney(project.budgetMaxCents)}`;

const formatDeadline = (value) => {
  if (!value) return 'Prazo a combinar';
  return `Até ${new Date(value).toLocaleDateString('pt-BR')}`;
};

function Projects() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listPublicProjects({
      q: q || undefined,
      category: category || undefined,
      sort,
      page,
      pageSize: 12,
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, page, q, sort]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.slug === category || item.id === category),
    [categories, category]
  );

  const updateFilters = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, String(value));
      else next.delete(key);
    });
    if (!Object.prototype.hasOwnProperty.call(changes, 'page')) next.delete('page');
    setSearchParams(next);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateFilters({ q: search.trim() });
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Projetos abertos</span>
          <h1>Encontre trabalhos que combinam com a sua especialidade.</h1>
          <p>
            Veja escopo, orçamento e prazo antes de enviar uma proposta personalizada.
          </p>
          <div className={styles.heroActions}>
            {user?.userType === 'CLIENT' ? (
              <>
                <Link to="/projects/new" className={styles.primaryAction}>Publicar projeto</Link>
                <Link to="/projects/mine" className={styles.secondaryAction}>Meus projetos</Link>
              </>
            ) : user ? (
              <a href="#project-list" className={styles.primaryAction}>Ver oportunidades</a>
            ) : (
              <>
                <Link to="/signup" className={styles.primaryAction}>Criar conta grátis</Link>
                <Link to="/login" state={{ from: '/projects' }} className={styles.secondaryAction}>Entrar</Link>
              </>
            )}
          </div>
        </div>
        <div className={styles.heroMetric}>
          <FaBriefcase />
          <strong>{loading ? '…' : total}</strong>
          <span>{total === 1 ? 'projeto recebendo propostas' : 'projetos recebendo propostas'}</span>
        </div>
      </section>

      <section className={styles.filters}>
        <form onSubmit={submitSearch} className={styles.search}>
          <FaMagnifyingGlass />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busque por título, descrição ou habilidade"
          />
          <button type="submit">Buscar</button>
        </form>

        <select value={category} onChange={(event) => updateFilters({ category: event.target.value })}>
          <option value="">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>{item.name}</option>
          ))}
        </select>

        <select value={sort} onChange={(event) => updateFilters({ sort: event.target.value })}>
          <option value="newest">Mais recentes</option>
          <option value="budget_desc">Maior orçamento</option>
          <option value="budget_asc">Menor orçamento</option>
          <option value="deadline">Prazo mais próximo</option>
        </select>
      </section>

      <div className={styles.resultsHead} id="project-list">
        <div>
          <span>{loading ? 'Carregando oportunidades…' : `${total} oportunidades encontradas`}</span>
          {selectedCategory && <strong> em {selectedCategory.name}</strong>}
        </div>
        {(q || category) && (
          <button type="button" onClick={() => setSearchParams(new URLSearchParams())}>
            Limpar filtros
          </button>
        )}
      </div>

      {!loading && items.length === 0 ? (
        <section className={styles.empty}>
          <FaMagnifyingGlass />
          <h2>Nenhum projeto encontrado</h2>
          <p>Tente outro termo ou acompanhe novas oportunidades em breve.</p>
        </section>
      ) : (
        <div className={styles.grid}>
          {items.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.category}>
                  <CategoryIcon category={project.category} />
                  {project.category?.name || 'Projeto multidisciplinar'}
                </span>
                <span className={styles.openBadge}>Aberto</span>
              </div>

              <h2>{project.title}</h2>
              <p>{project.description}</p>

              {project.skills?.length > 0 && (
                <div className={styles.skills}>
                  {project.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}
                  {project.skills.length > 4 && <span>+{project.skills.length - 4}</span>}
                </div>
              )}

              <div className={styles.cardMeta}>
                <div>
                  <small>Orçamento</small>
                  <strong>{formatBudget(project)}</strong>
                </div>
                <div>
                  <small><FaCalendarDays /> Prazo</small>
                  <strong>{formatDeadline(project.deadline)}</strong>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span>
                  {project.proposalCount} {project.proposalCount === 1 ? 'proposta' : 'propostas'}
                </span>
                <strong>Ver projeto <FaArrowRight /></strong>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => updateFilters({ page: page - 1 })}
          >
            Anterior
          </button>
          <span>Página {page} de {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => updateFilters({ page: page + 1 })}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

export default Projects;

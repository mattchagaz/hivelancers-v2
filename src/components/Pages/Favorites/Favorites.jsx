import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { FaBriefcase, FaHeart, FaUserFriends } from 'react-icons/fa';
import { CategoryIcon } from '../../../utils/categoryIcons';
import EmptyState from '../../UI/EmptyState/EmptyState';
import {
  getMyFavorites,
  removeFavoriteFreelancer,
  removeFavoriteService,
} from '../../../services/users';
import { getFeaturedProject } from '../../../utils/profileEnhancements';
import styles from './Favorites.module.css';

const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);

function Favorites() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [freelancers, setFreelancers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    getMyFavorites()
      .then((data) => {
        if (cancelled) return;
        setServices(data.services || []);
        setFreelancers(data.freelancers || []);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalSaved = services.length + freelancers.length;
  const favoriteFreelancerCards = useMemo(
    () =>
      freelancers.map((freelancer) => ({
        ...freelancer,
        featuredProject: getFeaturedProject(freelancer),
      })),
    [freelancers]
  );

  const handleRemoveService = async (serviceId) => {
    setServices((prev) => prev.filter((item) => item.id !== serviceId));
    try {
      await removeFavoriteService(serviceId);
      toast.success('Serviço removido dos favoritos.');
    } catch (err) {
      toast.error(err.message);
      const data = await getMyFavorites();
      setServices(data.services || []);
      setFreelancers(data.freelancers || []);
    }
  };

  const handleRemoveFreelancer = async (freelancerId) => {
    setFreelancers((prev) => prev.filter((item) => item.id !== freelancerId));
    try {
      await removeFavoriteFreelancer(freelancerId);
      toast.success('Freelancer removido dos favoritos.');
    } catch (err) {
      toast.error(err.message);
      const data = await getMyFavorites();
      setServices(data.services || []);
      setFreelancers(data.freelancers || []);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Favoritos</span>
          <h1 className={styles.title}>Sua shortlist de talentos e serviços</h1>
          <p className={styles.subtitle}>
            Salve referências para comparar depois, retomar conversas e montar uma seleção melhor.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <span>Total salvo</span>
            <strong>{totalSaved}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Serviços</span>
            <strong>{services.length}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Freelancers</span>
            <strong>{freelancers.length}</strong>
          </div>
        </div>
      </section>

      {loading ? (
        <EmptyState
          compact
          icon={<FaHeart />}
          eyebrow="Shortlist"
          title="Carregando favoritos..."
          description="Estamos buscando seus serviços e talentos salvos."
        />
      ) : totalSaved === 0 ? (
        <EmptyState
          icon={<FaHeart />}
          eyebrow="Nada salvo"
          title="Monte sua primeira shortlist"
          description="Salve serviços e freelancers promissores para comparar opções, retomar conversas e decidir com mais confiança."
          actionLabel="Explorar serviços"
          actionTo="/explore"
        />
      ) : (
        <div className={styles.sections}>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Serviços salvos</h2>
              <span>{services.length}</span>
            </div>
            {services.length === 0 ? (
              <EmptyState
                compact
                icon={<FaBriefcase />}
                title="Nenhum serviço salvo"
                description="Quando um serviço fizer sentido para um projeto futuro, salve aqui para comparar depois."
                actionLabel="Encontrar serviços"
                actionTo="/explore"
              />
            ) : (
              <div className={styles.serviceGrid}>
                {services.map((service) => (
                  <article key={service.id} className={styles.serviceCard}>
                    <Link to={`/services/${service.id}`} className={styles.serviceMedia}>
                      {service.coverUrl ? (
                        <img src={service.coverUrl} alt="" className={styles.serviceImage} />
                      ) : (
                        <div className={styles.serviceFallback}>
                          <CategoryIcon category={service.category} />
                        </div>
                      )}
                    </Link>
                    <div className={styles.serviceBody}>
                      <span className={styles.serviceCategory}>
                        <CategoryIcon category={service.category} /> {service.category?.name}
                      </span>
                      <Link to={`/services/${service.id}`} className={styles.serviceTitle}>
                        {service.title}
                      </Link>
                      <p>{service.description}</p>
                      <div className={styles.serviceMeta}>
                        <span>{formatPrice(service.plans?.[0]?.priceCents || service.minPriceCents || 0)}</span>
                        <span>{`${service.owner?.firstName || ''} ${service.owner?.lastName || ''}`.trim() || 'Freelancer'}</span>
                      </div>
                      <div className={styles.cardActions}>
                        <Link to={`/services/${service.id}`} className={styles.primaryAction}>
                          Ver serviço
                        </Link>
                        <button type="button" className={styles.secondaryAction} onClick={() => handleRemoveService(service.id)}>
                          Remover
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Freelancers salvos</h2>
              <span>{favoriteFreelancerCards.length}</span>
            </div>
            {favoriteFreelancerCards.length === 0 ? (
              <EmptyState
                compact
                icon={<FaUserFriends />}
                title="Nenhum freelancer salvo"
                description="Perfis salvos aparecem aqui com portfólio, habilidades e acesso rápido ao perfil."
                actionLabel="Explorar talentos"
                actionTo="/explore"
              />
            ) : (
              <div className={styles.freelancerGrid}>
                {favoriteFreelancerCards.map((freelancer) => (
                  <article key={freelancer.id} className={styles.freelancerCard}>
                    <Link to={`/profile/${freelancer.username || freelancer.id}`} className={styles.freelancerTop}>
                      <div className={styles.avatar}>
                        {freelancer.avatarUrl ? (
                          <img src={freelancer.avatarUrl} alt="" className={styles.avatarImg} />
                        ) : (
                          `${freelancer.firstName?.[0] || ''}${freelancer.lastName?.[0] || ''}`.trim() || 'F'
                        )}
                      </div>
                      <div className={styles.freelancerIdentity}>
                        <strong>{`${freelancer.firstName || ''} ${freelancer.lastName || ''}`.trim() || 'Freelancer'}</strong>
                        {freelancer.username ? <span>@{freelancer.username}</span> : null}
                        <p>{freelancer.headline || 'Perfil salvo para acompanhar depois.'}</p>
                      </div>
                    </Link>

                    {freelancer.featuredProject ? (
                      <Link to={`/profile/${freelancer.username || freelancer.id}/projects/${freelancer.featuredProject.id}`} className={styles.projectPreview}>
                        {freelancer.featuredProject.coverImageUrl ? (
                          <img src={freelancer.featuredProject.coverImageUrl} alt="" className={styles.projectPreviewImage} />
                        ) : (
                          <div className={styles.projectPreviewFallback}>Projeto</div>
                        )}
                        <div>
                          <span className={styles.projectPreviewLabel}>Projeto em destaque</span>
                          <strong>{freelancer.featuredProject.title || 'Projeto sem titulo'}</strong>
                        </div>
                      </Link>
                    ) : null}

                    {freelancer.skills?.length > 0 ? (
                      <div className={styles.skillRow}>
                        {freelancer.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className={styles.skillChip}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className={styles.cardActions}>
                      <Link to={`/profile/${freelancer.username || freelancer.id}`} className={styles.primaryAction}>
                        Ver perfil
                      </Link>
                      <button type="button" className={styles.secondaryAction} onClick={() => handleRemoveFreelancer(freelancer.id)}>
                        Remover
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Favorites;

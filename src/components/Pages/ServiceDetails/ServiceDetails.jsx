import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { getPublicService, getMyService } from '../../../services/services';
import { startConversation } from '../../../services/messages';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './ServiceDetails.module.css';

const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);

const TIER_LABEL = {
  BASIC: 'Básico',
  STANDARD: 'Padrão',
  PREMIUM: 'Premium',
};

const STATUS_LABEL = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

function ServiceDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [contactingOwner, setContactingOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    const fetchService = async () => {
      try {
        const data = await getPublicService(id);
        if (!cancelled) setService(data);
      } catch {
        try {
          const data = await getMyService(id);
          if (!cancelled) setService(data);
        } catch {
          if (!cancelled) setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchService();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (service?.plans?.length) {
      setSelectedPlanId(service.plans[0].id);
    }
  }, [service]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const images = service?.images || [];
    const handleKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight' && images.length > 1) {
        setActiveImageIdx((i) => (i + 1) % images.length);
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        setActiveImageIdx((i) => (i - 1 + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, service]);

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <h1 className={styles.emptyTitle}>Carregando...</h1>
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h1 className={styles.emptyTitle}>Serviço não encontrado</h1>
        <p className={styles.emptyText}>
          O link pode estar desatualizado ou este serviço ainda não foi publicado.
        </p>
        <Link to="/explore" className={styles.emptyButton}>
          Voltar para explorar serviços
        </Link>
      </div>
    );
  }

  const selectedPlan =
    service.plans.find((p) => p.id === selectedPlanId) || service.plans[0];
  const sellerName = `${service.owner?.firstName || ''} ${service.owner?.lastName || ''}`.trim() || 'Vendedor';
  const sellerInitial = (sellerName[0] || '?').toUpperCase();
  const isOwner = user?.id === service.ownerId;

  const handleOrder = () => {
    if (isOwner) {
      toast.info('Este é o seu próprio serviço.');
      return;
    }
    navigate(`/checkout/${service.id}?plan=${selectedPlan.id}`);
  };

  const handleContact = async () => {
    if (contactingOwner) return;
    setContactingOwner(true);
    try {
      const data = await startConversation(service.ownerId, `Olá! Tenho interesse no serviço "${service.title}".`);
      const chatId = data.conversation?.id || data.id;
      navigate(`/messages?chat=${chatId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setContactingOwner(false);
    }
  };

  const handleFavorite = () => {
    setIsFavorite((prev) => !prev);
    toast.success(!isFavorite ? 'Serviço salvo nos favoritos.' : 'Serviço removido dos favoritos.');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link do serviço copiado.');
  };

  const planFeatures = (plan) =>
    (plan.description || '')
      .split('\n')
      .map((line) => line.replace(/^•\s*/, '').trim())
      .filter(Boolean);

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link to="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link to="/explore">Serviços</Link>
        <span>/</span>
        <span>{service.category?.name}</span>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badges}>
            <span className={styles.badgePrimary}>
              {service.category?.icon} {service.category?.name}
            </span>
            {service.status !== 'PUBLISHED' && (
              <span className={styles.badgeSoft}>{STATUS_LABEL[service.status]}</span>
            )}
          </div>

          <h1 className={styles.title}>{service.title}</h1>
          <p className={styles.summary}>{service.description}</p>

          <div className={styles.metaRow}>
            <span>{service.plans.length} {service.plans.length === 1 ? 'pacote' : 'pacotes'}</span>
            <span className={styles.metaDivider} />
            <span>A partir de {formatPrice(service.plans[0]?.priceCents)}</span>
          </div>
        </div>

        <aside className={styles.heroSeller}>
          <div className={styles.sellerHeader}>
            <div className={styles.sellerAvatar}>{sellerInitial}</div>
            <div>
              <h2 className={styles.sellerName}>{sellerName}</h2>
              {service.owner?.headline && (
                <p className={styles.sellerHeadline}>{service.owner.headline}</p>
              )}
            </div>
          </div>
          {service.owner?.username && (
            <div className={styles.sellerMeta}>
              <span>@{service.owner.username}</span>
            </div>
          )}
        </aside>
      </section>

      <div className={styles.mainGrid}>
        <div className={styles.content}>
          {service.images?.length > 0 && (
            <section className={styles.card}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Portfólio</h2>
                </div>
              </div>
              <div
                className={styles.galleryStage}
                style={{
                  background: `url(${service.images[activeImageIdx]?.url}) center/cover`,
                  minHeight: 360,
                  cursor: 'zoom-in',
                }}
                onClick={() => setLightboxOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setLightboxOpen(true); }}
              />
              {service.images.length > 1 && (
                <div className={styles.galleryThumbs}>
                  {service.images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      className={`${styles.galleryThumb} ${i === activeImageIdx ? styles.galleryThumbActive : ''}`}
                      onClick={() => setActiveImageIdx(i)}
                      style={{ background: `url(${img.url}) center/cover` }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Pacotes disponíveis</h2>
                <p className={styles.sectionText}>
                  Compare escopo, prazo e entrega para escolher o plano ideal.
                </p>
              </div>
            </div>

            <div className={styles.packageGrid}>
              {service.plans.map((plan) => {
                const features = planFeatures(plan);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    className={`${styles.packageCard} ${plan.id === selectedPlanId ? styles.packageCardActive : ''}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className={styles.packageTop}>
                      <div>
                        <div className={styles.packageNameRow}>
                          <h3>{plan.title}</h3>
                          <span className={styles.packageBadge}>{TIER_LABEL[plan.tier]}</span>
                        </div>
                      </div>
                      <strong>{formatPrice(plan.priceCents)}</strong>
                    </div>

                    <div className={styles.packageMeta}>
                      <span>{plan.deliveryDays} {plan.deliveryDays === 1 ? 'dia' : 'dias'}</span>
                      <span>{plan.revisions} revisões</span>
                    </div>

                    {features.length > 0 && (
                      <div className={styles.packageFeatures}>
                        {features.map((item) => (
                          <div key={item} className={styles.packageFeature}>
                            <span className={styles.packageFeatureDot} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Sobre este serviço</h2>
              </div>
            </div>
            <div className={styles.overview}>
              {service.description.split('\n').filter(Boolean).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={`${styles.card} ${styles.checkoutCard}`}>
            <div className={styles.checkoutTop}>
              <div>
                <span className={styles.checkoutLabel}>Pacote selecionado</span>
                <h2>{selectedPlan.title}</h2>
              </div>
              <strong>{formatPrice(selectedPlan.priceCents)}</strong>
            </div>

            <div className={styles.checkoutMeta}>
              <div className={styles.checkoutMetaItem}>
                <span>Entrega</span>
                <strong>{selectedPlan.deliveryDays} {selectedPlan.deliveryDays === 1 ? 'dia' : 'dias'}</strong>
              </div>
              <div className={styles.checkoutMetaItem}>
                <span>Revisões</span>
                <strong>{selectedPlan.revisions}</strong>
              </div>
            </div>

            {planFeatures(selectedPlan).length > 0 && (
              <div className={styles.checkoutFeatures}>
                {planFeatures(selectedPlan).map((item) => (
                  <div key={item} className={styles.checkoutFeature}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {isOwner ? (
              <Link to={`/services/${service.id}/edit`} className={styles.primaryButton}>
                Editar serviço
              </Link>
            ) : (
              <>
                <button type="button" className={styles.primaryButton} onClick={handleOrder}>
                  Contratar agora
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleContact} disabled={contactingOwner}>
                  {contactingOwner ? 'Iniciando conversa...' : `Falar com ${sellerName}`}
                </button>
              </>
            )}

            <div className={styles.inlineActions}>
              <button type="button" className={styles.inlineButton} onClick={handleFavorite}>
                {isFavorite ? 'Remover favorito' : 'Salvar'}
              </button>
              <button type="button" className={styles.inlineButton} onClick={handleShare}>
                Compartilhar
              </button>
            </div>
          </div>
        </aside>
      </div>

      {lightboxOpen && service.images?.length > 0 && (
        <div
          className={styles.lightbox}
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Fechar"
          >
            ×
          </button>

          {service.images.length > 1 && (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIdx((i) => (i - 1 + service.images.length) % service.images.length);
              }}
              aria-label="Anterior"
            >
              ‹
            </button>
          )}

          <img
            src={service.images[activeImageIdx]?.url}
            alt=""
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />

          {service.images.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx((i) => (i + 1) % service.images.length);
                }}
                aria-label="Próxima"
              >
                ›
              </button>
              <div className={styles.lightboxCounter}>
                {activeImageIdx + 1} / {service.images.length}
              </div>
            </>
          )}
        </div>
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default ServiceDetails;

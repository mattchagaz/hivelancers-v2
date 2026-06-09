import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { getPublicService, getMyService } from '../../../services/services';
import { startConversation } from '../../../services/messages';
import { addFavoriteService, getMyFavorites, removeFavoriteService } from '../../../services/users';
import { useAuth } from '../../../contexts/AuthContext';
import { CategoryIcon } from '../../../utils/categoryIcons';
import { recordRecentActivity } from '../../../utils/clientRecentActivity';
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
    getMyFavorites()
      .then((data) => {
        if (service?.id) {
          setIsFavorite((data.serviceIds || []).includes(service.id));
        }
      })
      .catch(() => {});
  }, [service?.id]);

  useEffect(() => {
    if (!service?.id || !user?.id || user?.userType !== 'CLIENT') return;
    recordRecentActivity(user.id, {
      type: 'service',
      id: service.id,
      title: service.title,
      subtitle: service.owner
        ? `${service.owner.firstName || ''} ${service.owner.lastName || ''}`.trim()
        : service.category?.name,
      href: `/services/${service.id}`,
    });
  }, [service?.id, service?.title, service?.owner, service?.category?.name, user?.id, user?.userType]);

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
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <h1 className={styles.emptyTitle}>Carregando serviço...</h1>
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className={styles.emptyTitle}>Serviço não encontrado</h1>
        <p className={styles.emptyText}>
          O link pode estar desatualizado ou este serviço ainda não foi publicado.
        </p>
        <Link to="/explore" className={styles.primaryButton} style={{ width: 'auto', padding: '0 24px' }}>
          Voltar para explorar serviços
        </Link>
      </div>
    );
  }

  const selectedPlan = service.plans.find((p) => p.id === selectedPlanId) || service.plans[0];
  const sellerName = `${service.owner?.firstName || ''} ${service.owner?.lastName || ''}`.trim() || 'Profissional';
  const sellerInitial = (sellerName[0] || '?').toUpperCase();
  const sellerAvatarUrl = service.owner?.avatarUrl;
  const isOwner = user?.id === service.ownerId;
  const tags = Array.isArray(service.tags) ? service.tags : [];
  const subcategoryName = service.subcategoryName || '';
  const minPriceCents = Math.min(...service.plans.map((plan) => plan.priceCents || 0));
  const minDeliveryDays = Math.min(...service.plans.map((plan) => plan.deliveryDays || 0));
  const maxRevisions = Math.max(...service.plans.map((plan) => plan.revisions || 0));
  const reviews = service.reviews || [];
  const averageRating = service.reviewSummary?.averageRating;
  const reviewCount = service.reviewSummary?.count || reviews.length;

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

  const handleFavorite = async () => {
    if (isOwner) {
      toast.info('Você não pode favoritar o próprio serviço.');
      return;
    }

    const nextValue = !isFavorite;
    setIsFavorite(nextValue);
    try {
      if (nextValue) {
        await addFavoriteService(service.id);
        toast.success('Serviço salvo nos favoritos.');
      } else {
        await removeFavoriteService(service.id);
        toast.success('Serviço removido dos favoritos.');
      }
    } catch (err) {
      setIsFavorite(!nextValue);
      toast.error(err.message);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link do serviço copiado para a área de transferência.');
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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <Link to="/explore">Serviços</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <span>{service.category?.name}</span>
        {subcategoryName && (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            <span className={styles.currentCrumb}>{subcategoryName}</span>
          </>
        )}
      </div>

      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badges}>
            <span className={styles.badgePrimary}>
              <CategoryIcon category={service.category} /> {service.category?.name}
            </span>
            {subcategoryName && <span className={styles.badgeSoft}>{subcategoryName}</span>}
            {service.status !== 'PUBLISHED' && <span className={styles.badgeWarning}>{STATUS_LABEL[service.status]}</span>}
          </div>

          <h1 className={styles.title}>{service.title}</h1>
          <p className={styles.summary}>{service.description}</p>

          <div className={styles.metaRow}>
            <div className={styles.ratingPill}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <strong>{averageRating ? averageRating.toFixed(1) : 'Novo'}</strong>
              <span>({reviewCount})</span>
            </div>
            <span className={styles.metaDivider} />
            <span>A partir de <strong>{formatPrice(minPriceCents)}</strong></span>
            {minDeliveryDays > 0 && (
              <>
                <span className={styles.metaDivider} />
                <span>Entrega em até <strong>{minDeliveryDays} {minDeliveryDays === 1 ? 'dia' : 'dias'}</strong></span>
              </>
            )}
          </div>

          {tags.length > 0 && (
            <div className={styles.tagList}>
              {tags.slice(0, 10).map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
              {tags.length > 10 && <span className={styles.tag}>+{tags.length - 10}</span>}
            </div>
          )}
        </div>

        <aside className={styles.heroSeller}>
          <div className={styles.sellerHeader}>
            <div className={styles.sellerAvatar}>
              {sellerAvatarUrl ? (
                <img src={sellerAvatarUrl} alt={sellerName} />
              ) : (
                sellerInitial
              )}
            </div>
            <div className={styles.sellerInfo}>
              <h2 className={styles.sellerName}>{sellerName}</h2>
              {service.owner?.headline && <p className={styles.sellerHeadline}>{service.owner.headline}</p>}
            </div>
          </div>
          
          <div className={styles.sellerStats}>
            <div className={styles.sellerStat}>
              <span>Especialidade</span>
              <strong>{subcategoryName || service.category?.name || 'Geral'}</strong>
            </div>
            <div className={styles.sellerStat}>
              <span>Planos Ofertados</span>
              <strong>{service.plans.length}</strong>
            </div>
          </div>
        </aside>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.content}>
          
          {/* Galeria de Imagens */}
          {service.images?.length > 0 && (
            <section className={styles.card}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Portfólio</h2>
              </div>
              <div
                className={styles.galleryStage}
                style={{ backgroundImage: `url(${service.images[activeImageIdx]?.url})` }}
                onClick={() => setLightboxOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setLightboxOpen(true); }}
              >
                <div className={styles.galleryOverlay}>
                  <span className={styles.expandIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                  </span>
                </div>
              </div>
              {service.images.length > 1 && (
                <div className={styles.galleryThumbs}>
                  {service.images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      className={`${styles.galleryThumb} ${i === activeImageIdx ? styles.galleryThumbActive : ''}`}
                      onClick={() => setActiveImageIdx(i)}
                      style={{ backgroundImage: `url(${img.url})` }}
                      aria-label={`Ver imagem ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Sobre o Serviço */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Sobre este serviço</h2>
            </div>
            <div className={styles.overview}>
              {service.description.split('\n').filter(Boolean).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* Comparação de Pacotes */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Escolha seu pacote</h2>
              <p className={styles.sectionText}>Compare escopo, prazo e entrega para escolher o plano ideal.</p>
            </div>

            <div className={styles.packageGrid}>
              {service.plans.map((plan) => {
                const features = planFeatures(plan);
                const isActive = plan.id === selectedPlanId;
                return (
                  <div
                    key={plan.id}
                    className={`${styles.packageCard} ${isActive ? styles.packageCardActive : ''}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.packageTop}>
                      <span className={styles.packageBadge}>{TIER_LABEL[plan.tier]}</span>
                      <h3>{plan.title}</h3>
                      <strong>{formatPrice(plan.priceCents)}</strong>
                    </div>

                    <div className={styles.packageMeta}>
                      <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {plan.deliveryDays} {plan.deliveryDays === 1 ? 'dia' : 'dias'}</span>
                      <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg> {plan.revisions} revisões</span>
                    </div>

                    {features.length > 0 && (
                      <div className={styles.packageFeatures}>
                        {features.map((item) => (
                          <div key={item} className={styles.packageFeature}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Avaliações */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Avaliações de Clientes</h2>
              <p className={styles.sectionText}>Feedbacks de clientes após pedidos concluídos dentro da plataforma.</p>
            </div>

            {reviewCount > 0 ? (
              <>
                <div className={styles.reviewSummary}>
                  <div className={styles.reviewScore}>
                    <strong>{averageRating?.toFixed ? averageRating.toFixed(1) : averageRating}</strong>
                    <div className={styles.starsLarge}>
                      {'★'.repeat(Math.round(averageRating || 0))}{'☆'.repeat(5 - Math.round(averageRating || 0))}
                    </div>
                    <span>Com base em {reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'}</span>
                  </div>
                  <div className={styles.reviewBars}>
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter((review) => review.rating === rating).length;
                      const percent = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
                      return (
                        <div key={rating} className={styles.reviewBarRow}>
                          <span>{rating} ★</span>
                          <div className={styles.reviewBarTrack}>
                            <div className={styles.reviewBarFill} style={{ width: `${percent}%` }} />
                          </div>
                          <strong>{count}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.reviewList}>
                  {reviews.slice(0, 6).map((review) => {
                    const clientName = `${review.client?.firstName || ''} ${review.client?.lastName || ''}`.trim() || review.client?.username || 'Cliente';
                    return (
                      <article key={review.id} className={styles.reviewCard}>
                        <div className={styles.reviewHead}>
                          <div className={styles.reviewAuthor}>
                            <div className={styles.reviewAvatar}>{clientName.slice(0, 2).toUpperCase()}</div>
                            <div>
                              <h3>{clientName}</h3>
                              <div className={styles.reviewMeta}>
                                <span className={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                <span className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className={styles.reviewText}>{review.comment || 'Cliente avaliou este pedido sem comentário.'}</p>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className={styles.emptyReviews}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <h3>Ainda sem avaliações</h3>
                <p>As avaliações aparecerão aqui depois que clientes concluírem os primeiros pedidos deste serviço.</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Sticky */}
        <aside className={styles.sidebar}>
          <div className={`${styles.card} ${styles.checkoutCard}`}>
            <div className={styles.checkoutTop}>
              <span className={styles.checkoutLabel}>Pacote Selecionado</span>
              <h2>{selectedPlan.title}</h2>
              <strong className={styles.checkoutPrice}>{formatPrice(selectedPlan.priceCents)}</strong>
            </div>

            <div className={styles.checkoutMeta}>
              <div className={styles.checkoutMetaItem}>
                <span className={styles.metaIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
                <div>
                  <span>Prazo de Entrega</span>
                  <strong>{selectedPlan.deliveryDays} {selectedPlan.deliveryDays === 1 ? 'dia' : 'dias'}</strong>
                </div>
              </div>
              <div className={styles.checkoutMetaItem}>
                <span className={styles.metaIcon}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg></span>
                <div>
                  <span>Revisões Inclusas</span>
                  <strong>{selectedPlan.revisions}</strong>
                </div>
              </div>
            </div>

            {planFeatures(selectedPlan).length > 0 && (
              <div className={styles.checkoutFeatures}>
                <h4>O que está incluso:</h4>
                <ul>
                  {planFeatures(selectedPlan).map((item) => (
                    <li key={item}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.actionButtons}>
              {isOwner ? (
                <Link to={`/services/${service.id}/edit`} className={styles.primaryButton}>
                  Editar meu Serviço
                </Link>
              ) : (
                <>
                  <button type="button" className={styles.primaryButton} onClick={handleOrder}>
                    Continuar para Pagamento
                  </button>
                  <button type="button" className={styles.secondaryButton} onClick={handleContact} disabled={contactingOwner}>
                    {contactingOwner ? 'Iniciando conversa...' : `Falar com ${sellerName}`}
                  </button>
                </>
              )}
            </div>

            <div className={styles.inlineActions}>
              <button type="button" className={`${styles.inlineButton} ${isFavorite ? styles.isFavorite : ''}`} onClick={handleFavorite}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                {isFavorite ? 'Salvo' : 'Salvar'}
              </button>
              <button type="button" className={styles.inlineButton} onClick={handleShare}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                Compartilhar
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && service.images?.length > 0 && (
        <div className={styles.lightbox} onClick={() => setLightboxOpen(false)} role="dialog" aria-modal="true">
          <button type="button" className={styles.lightboxClose} onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }} aria-label="Fechar">×</button>

          {service.images.length > 1 && (
            <button type="button" className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={(e) => { e.stopPropagation(); setActiveImageIdx((i) => (i - 1 + service.images.length) % service.images.length); }} aria-label="Anterior">‹</button>
          )}

          <img src={service.images[activeImageIdx]?.url} alt="Imagem do portfólio ampliada" className={styles.lightboxImg} onClick={(e) => e.stopPropagation()} />

          {service.images.length > 1 && (
            <>
              <button type="button" className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={(e) => { e.stopPropagation(); setActiveImageIdx((i) => (i + 1) % service.images.length); }} aria-label="Próxima">›</button>
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
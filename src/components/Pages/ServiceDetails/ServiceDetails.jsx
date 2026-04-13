import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import {
  CATEGORIES,
  SERVICE_GRADIENTS,
  getRelatedServices,
  getServiceById,
} from '../../../data/services';
import styles from './ServiceDetails.module.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);

const averageReviewLabel = {
  5: 'Excelente',
  4: 'Muito bom',
  3: 'Bom',
  2: 'Regular',
  1: 'Baixo',
};

function ServiceDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const service = getServiceById(id);
  const relatedServices = useMemo(
    () => (service ? getRelatedServices(service, 3) : []),
    [service]
  );
  const categoryLabel =
    CATEGORIES.find((item) => item.id === service?.category)?.label || 'Serviços';

  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!service) return;

    const defaultPackage =
      service.packages.find((item) => item.popular)?.id || service.packages[0]?.id || '';

    setSelectedPackageId(defaultPackage);
    setActiveGalleryIndex(0);
    setExpandedFaq(0);
  }, [service]);

  if (!service) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h1 className={styles.emptyTitle}>Servico nao encontrado</h1>
        <p className={styles.emptyText}>
          O link pode estar desatualizado ou este servico ainda nao foi publicado.
        </p>
        <Link to="/services" className={styles.emptyButton}>
          Voltar para explorar servicos
        </Link>
      </div>
    );
  }

  const selectedPackage =
    service.packages.find((item) => item.id === selectedPackageId) || service.packages[0];
  const activeGallery =
    service.gallery[activeGalleryIndex] || service.gallery[0];

  const summaryStats = [
    { label: 'Prazo inicial', value: `${service.delivery} ${service.delivery === 1 ? 'dia' : 'dias'}` },
    { label: 'Revisoes inclusas', value: `${selectedPackage.revisions}` },
    { label: 'Pedidos na fila', value: `${service.queue}` },
    { label: 'Nivel do vendedor', value: service.seller.level },
  ];

  const trustItems = [
    'Pagamento protegido ate a aprovacao',
    'Mensagens e arquivos centralizados no pedido',
    'Revisoes previstas no pacote escolhido',
  ];

  const handleFavorite = () => {
    setIsFavorite((prev) => !prev);
    toast.success(
      !isFavorite ? 'Servico salvo nos favoritos.' : 'Servico removido dos favoritos.'
    );
  };

  const handleContact = () => {
    toast.success(`Uma conversa com ${service.seller.name} sera iniciada em breve.`);
  };

  const handleOrder = () => {
    navigate(`/checkout/${service.id}?package=${selectedPackage.id}`);
  };

  const handleShare = () => {
    toast.success('Link do servico copiado para compartilhamento.');
  };

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link to="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link to="/services">Servicos</Link>
        <span>/</span>
        <span>{categoryLabel}</span>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badges}>
            <span className={styles.badgePrimary}>{categoryLabel}</span>
            {service.featured && <span className={styles.badgeSoft}>Destaque</span>}
            {service.bestseller && <span className={styles.badgeSoft}>Mais pedido</span>}
          </div>

          <h1 className={styles.title}>{service.title}</h1>
          <p className={styles.summary}>{service.summary}</p>

          <div className={styles.metaRow}>
            <div className={styles.ratingPill}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <strong>{service.rating.toFixed(1)}</strong>
              <span>({service.reviews} avaliacoes)</span>
            </div>
            <span className={styles.metaDivider} />
            <span>{service.seller.responseTime}</span>
            <span className={styles.metaDivider} />
            <span>Membro desde {service.seller.memberSince}</span>
          </div>

          <div className={styles.tagList}>
            {service.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>

          <div className={styles.heroStats}>
            {summaryStats.map((item) => (
              <div key={item.label} className={styles.heroStat}>
                <span className={styles.heroStatLabel}>{item.label}</span>
                <strong className={styles.heroStatValue}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.heroSeller}>
          <div className={styles.sellerHeader}>
            <div className={styles.sellerAvatar}>{service.seller.avatar}</div>
            <div>
              <h2 className={styles.sellerName}>{service.seller.name}</h2>
              <p className={styles.sellerHeadline}>{service.seller.headline}</p>
            </div>
          </div>

          <div className={styles.sellerMeta}>
            <span>{service.seller.city}</span>
            <span>{service.seller.lastDelivery}</span>
          </div>

          <div className={styles.sellerStats}>
            {service.seller.stats.map((item) => (
              <div key={item.label} className={styles.sellerStat}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <div className={styles.mainGrid}>
        <div className={styles.content}>
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Portfolio e apresentacao</h2>
                <p className={styles.sectionText}>
                  Uma visao do estilo de entrega, linguagem visual e nivel de acabamento deste servico.
                </p>
              </div>
            </div>

            <div
              className={styles.galleryStage}
              style={{ background: activeGallery.background }}
            >
              <div className={styles.galleryOverlay} />
              <span className={styles.galleryLabel}>{activeGallery.label}</span>
              <div className={styles.galleryText}>
                <h3>{activeGallery.title}</h3>
                <p>{activeGallery.subtitle}</p>
              </div>
            </div>

            <div className={styles.galleryThumbs}>
              {service.gallery.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  className={`${styles.galleryThumb} ${index === activeGalleryIndex ? styles.galleryThumbActive : ''}`}
                  onClick={() => setActiveGalleryIndex(index)}
                  style={{ background: item.background }}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Sobre este servico</h2>
                <p className={styles.sectionText}>
                  O que esta sendo entregue, como o trabalho acontece e onde este servico gera mais valor.
                </p>
              </div>
            </div>

            <div className={styles.overview}>
              {service.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoPanel}>
                <h3>Destaques</h3>
                <div className={styles.bulletList}>
                  {service.highlights.map((item) => (
                    <div key={item} className={styles.bulletItem}>
                      <span className={styles.bulletIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.infoPanel}>
                <h3>O que voce recebe</h3>
                <div className={styles.bulletList}>
                  {service.deliverables.map((item) => (
                    <div key={item} className={styles.bulletItem}>
                      <span className={styles.bulletDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Pacotes disponiveis</h2>
                <p className={styles.sectionText}>
                  Compare escopo, prazo e profundidade de entrega para escolher o plano ideal.
                </p>
              </div>
            </div>

            <div className={styles.packageGrid}>
              {service.packages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  className={`${styles.packageCard} ${pkg.id === selectedPackageId ? styles.packageCardActive : ''}`}
                  onClick={() => setSelectedPackageId(pkg.id)}
                >
                  <div className={styles.packageTop}>
                    <div>
                      <div className={styles.packageNameRow}>
                        <h3>{pkg.name}</h3>
                        {pkg.popular && <span className={styles.packageBadge}>Mais escolhido</span>}
                      </div>
                      <p>{pkg.description}</p>
                    </div>
                    <strong>{formatPrice(pkg.price)}</strong>
                  </div>

                  <div className={styles.packageMeta}>
                    <span>{pkg.delivery} {pkg.delivery === 1 ? 'dia' : 'dias'}</span>
                    <span>{pkg.revisions} revisoes</span>
                  </div>

                  <div className={styles.packageFeatures}>
                    {pkg.features.map((item) => (
                      <div key={item} className={styles.packageFeature}>
                        <span className={styles.packageFeatureDot} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Como o projeto acontece</h2>
                <p className={styles.sectionText}>
                  Uma visao simples do fluxo de trabalho para alinhar expectativa, tempo e pontos de contato.
                </p>
              </div>
            </div>

            <div className={styles.timeline}>
              {service.process.map((step, index) => (
                <div key={step.title} className={styles.timelineItem}>
                  <div className={styles.timelineIndex}>{index + 1}</div>
                  <div className={styles.timelineBody}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Sobre {service.seller.name}</h2>
                <p className={styles.sectionText}>
                  Contexto profissional, especialidades e o que diferencia a entrega deste vendedor.
                </p>
              </div>
            </div>

            <div className={styles.sellerPanel}>
              <div className={styles.sellerCardHeader}>
                <div className={styles.sellerAvatarLarge}>{service.seller.avatar}</div>
                <div>
                  <h3>{service.seller.name}</h3>
                  <p>{service.seller.headline}</p>
                </div>
              </div>

              <p className={styles.sellerBio}>{service.seller.bio}</p>

              <div className={styles.skillList}>
                {service.seller.skills.map((skill) => (
                  <span key={skill} className={styles.skillChip}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Perguntas frequentes</h2>
                <p className={styles.sectionText}>
                  Respostas para as principais duvidas antes de iniciar o pedido.
                </p>
              </div>
            </div>

            <div className={styles.faqList}>
              {service.faq.map((item, index) => (
                <div
                  key={item.question}
                  className={`${styles.faqItem} ${expandedFaq === index ? styles.faqItemOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.faqQuestion}
                    onClick={() => setExpandedFaq(expandedFaq === index ? -1 : index)}
                  >
                    <span>{item.question}</span>
                    <span className={styles.faqIcon}>{expandedFaq === index ? '−' : '+'}</span>
                  </button>
                  <div className={styles.faqAnswer}>
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Avaliacoes</h2>
                <p className={styles.sectionText}>
                  Feedback recente de clientes e distribuicao geral das notas.
                </p>
              </div>
            </div>

            <div className={styles.reviewSummary}>
              <div className={styles.reviewScore}>
                <strong>{service.rating.toFixed(1)}</strong>
                <span>{averageReviewLabel[Math.round(service.rating)]}</span>
                <small>{service.reviews} avaliacoes verificadas</small>
              </div>

              <div className={styles.reviewBars}>
                {service.reviewBreakdown.map((item) => (
                  <div key={item.stars} className={styles.reviewBarRow}>
                    <span>{item.stars} estrelas</span>
                    <div className={styles.reviewBarTrack}>
                      <div
                        className={styles.reviewBarFill}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <strong>{item.percent}%</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.reviewList}>
              {service.reviewsList.map((review) => (
                <div key={`${review.author}-${review.date}`} className={styles.reviewCard}>
                  <div className={styles.reviewHead}>
                    <div className={styles.reviewAuthor}>
                      <div className={styles.reviewAvatar}>{review.avatar}</div>
                      <div>
                        <h3>{review.author}</h3>
                        <span>{review.plan}</span>
                      </div>
                    </div>
                    <div className={styles.reviewMeta}>
                      <div className={styles.reviewStars}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <svg
                            key={index}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={index < review.rating ? '#f59e0b' : '#e5e7eb'}
                            stroke="none"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <span>{review.date}</span>
                    </div>
                  </div>
                  <p>{review.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Servicos relacionados</h2>
                <p className={styles.sectionText}>
                  Outras opcoes na mesma categoria para comparar estilo, escopo e faixa de investimento.
                </p>
              </div>
            </div>

            <div className={styles.relatedGrid}>
              {relatedServices.map((item, index) => (
                <Link key={item.id} to={`/services/${item.id}`} className={styles.relatedCard}>
                  <div
                    className={styles.relatedPreview}
                    style={{ background: SERVICE_GRADIENTS[(item.id + index) % SERVICE_GRADIENTS.length] }}
                  />
                  <div className={styles.relatedBody}>
                    <span className={styles.relatedSeller}>{item.seller.name}</span>
                    <h3>{item.title}</h3>
                    <div className={styles.relatedMeta}>
                      <span>{item.rating.toFixed(1)}</span>
                      <span>{item.delivery} dias</span>
                    </div>
                    <strong>{formatPrice(item.price)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={`${styles.card} ${styles.checkoutCard}`}>
            <div className={styles.checkoutTop}>
              <div>
                <span className={styles.checkoutLabel}>Pacote selecionado</span>
                <h2>{selectedPackage.name}</h2>
              </div>
              <strong>{formatPrice(selectedPackage.price)}</strong>
            </div>

            <p className={styles.checkoutText}>{selectedPackage.description}</p>

            <div className={styles.checkoutMeta}>
              <div className={styles.checkoutMetaItem}>
                <span>Entrega</span>
                <strong>{selectedPackage.delivery} {selectedPackage.delivery === 1 ? 'dia' : 'dias'}</strong>
              </div>
              <div className={styles.checkoutMetaItem}>
                <span>Revisoes</span>
                <strong>{selectedPackage.revisions}</strong>
              </div>
            </div>

            <div className={styles.checkoutFeatures}>
              {selectedPackage.features.map((item) => (
                <div key={item} className={styles.checkoutFeature}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button type="button" className={styles.primaryButton} onClick={handleOrder}>
              Contratar agora
            </button>

            <button type="button" className={styles.secondaryButton} onClick={handleContact}>
              Falar com {service.seller.name}
            </button>

            <div className={styles.inlineActions}>
              <button type="button" className={styles.inlineButton} onClick={handleFavorite}>
                {isFavorite ? 'Remover favorito' : 'Salvar'}
              </button>
              <button type="button" className={styles.inlineButton} onClick={handleShare}>
                Compartilhar
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.sidebarTitle}>Compra com mais seguranca</h2>
            <div className={styles.trustList}>
              {trustItems.map((item) => (
                <div key={item} className={styles.trustItem}>
                  <span className={styles.trustIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.sidebarTitle}>Resumo rapido</h2>
            <div className={styles.quickFacts}>
              <div className={styles.quickFact}>
                <span>A partir de</span>
                <strong>{formatPrice(service.price)}</strong>
              </div>
              <div className={styles.quickFact}>
                <span>Nivel do vendedor</span>
                <strong>{service.seller.level}</strong>
              </div>
              <div className={styles.quickFact}>
                <span>Resposta media</span>
                <strong>{service.seller.responseTime}</strong>
              </div>
              <div className={styles.quickFact}>
                <span>Categoria</span>
                <strong>{categoryLabel}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default ServiceDetails;

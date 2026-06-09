import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaHeart, FaArrowUpRightFromSquare, FaXmark, FaRegHeart } from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import {
  addFavoriteFreelancer,
  getMyFavorites,
  getPublicProfile,
  removeFavoriteFreelancer,
  trackProfileLinkClick,
  trackProjectExternalClick,
} from '../../../services/users';
import { startConversation } from '../../../services/messages';
import { CategoryIcon } from '../../../utils/categoryIcons';
import { getProfileLinkMeta } from '../../../utils/profileLinks';
import {
  getProfileCompletion,
  getFeaturedProject,
  getProfileLinks,
  mergeProfileEnhancements,
} from '../../../utils/profileEnhancements';
import styles from './UserProfile.module.css';
import { recordRecentActivity } from '../../../utils/clientRecentActivity';

const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);

const MEMBER_SINCE_FMT = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

const formatMemberSince = (iso) => {
  if (!iso) return '';
  const txt = MEMBER_SINCE_FMT.format(new Date(iso));
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};

const formatLastSeen = (iso) => {
  if (!iso) return { label: 'Offline', online: false };
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 3) return { label: 'Online agora', online: true };
  if (min < 60) return { label: `Visto há ${min} min`, online: false };
  const hours = Math.floor(min / 60);
  if (hours < 24) return { label: `Visto há ${hours}h`, online: false };
  const days = Math.floor(hours / 24);
  if (days < 30) return { label: `Visto há ${days}d`, online: false };
  return { label: 'Offline há tempos', online: false };
};

function UserProfile() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [isFavoriteFreelancer, setIsFavoriteFreelancer] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getPublicProfile(handle)
      .then((data) => {
        if (cancelled) return;
        setProfile(mergeProfileEnhancements(data, data));
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [handle, user?.id]);

  const completion = useMemo(() => getProfileCompletion(profile), [profile]);
  const links = useMemo(() => getProfileLinks(profile), [profile]);
  const projects = profile?.portfolioProjects || [];
  const featuredProject = getFeaturedProject(profile);

  const openProjectGallery = (project, imageIndex = 0) => {
    const images = (project?.images?.length ? project.images : [])
      .map((image) => image?.url)
      .filter(Boolean);
    const fallbackCover = project?.coverImageUrl || project?.imageUrl;
    const gallery = images.length > 0 ? images : fallbackCover ? [fallbackCover] : [];
    if (gallery.length === 0) return;
    setLightboxImages(gallery);
    setLightboxIndex(Math.min(imageIndex, gallery.length - 1));
  };

  const closeLightbox = () => {
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const showPrevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const showNextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  useEffect(() => {
    if (lightboxImages.length === 0) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft' && lightboxImages.length > 1) showPrevImage();
      if (event.key === 'ArrowRight' && lightboxImages.length > 1) showNextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImages.length]);

  useEffect(() => {
    if (!profile?.id || (user && profile.id === user.id)) return;
    getMyFavorites()
      .then((data) => {
        setIsFavoriteFreelancer((data.freelancerIds || []).includes(profile.id));
      })
      .catch(() => {});
  }, [profile?.id, user?.id]);

  useEffect(() => {
    if (!profile?.id || !user?.id || user.userType !== 'CLIENT' || profile.id === user.id) return;
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Freelancer';
    recordRecentActivity(user.id, {
      type: 'profile',
      id: profile.id,
      title: fullName,
      subtitle: profile.headline || (profile.username ? `@${profile.username}` : 'Perfil público'),
      href: `/profile/${handle}`,
    });
  }, [profile?.id, profile?.firstName, profile?.lastName, profile?.headline, profile?.username, handle, user?.id, user?.userType]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <h1 className={styles.emptyTitle}>Carregando perfil...</h1>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="23" y2="12"></line><line x1="23" y1="8" x2="19" y2="12"></line></svg>
        </div>
        <h1 className={styles.emptyTitle}>Perfil não encontrado</h1>
        <p className={styles.emptyText}>
          O usuário pode ter removido a conta ou o link está desatualizado.
        </p>
        <Link to="/explore" className={styles.primaryAction} style={{ width: 'fit-content' }}>
          Voltar para explorar serviços
        </Link>
      </div>
    );
  }

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Usuário';
  const initials = fullName.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const presence = formatLastSeen(profile.lastSeenAt);
  const memberSince = formatMemberSince(profile.createdAt);
  const services = profile.services || [];
  const skills = profile.skills || [];
  const isOwner = Boolean(user && profile.id === user.id);
  const roleLabel = profile.userType === 'CLIENT' ? 'Cliente' : 'Especialista';

  const handleStartChat = async () => {
    if (!profile?.id || startingChat) return;
    setStartingChat(true);
    try {
      const data = await startConversation(profile.id, 'Olá! Dei uma olhada no seu perfil e queria conversar.');
      navigate(`/messages?chat=${data.conversation?.id || data.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingChat(false);
    }
  };

  const handleProposalRequest = async () => {
    if (!profile?.id || startingChat) return;
    setStartingChat(true);
    try {
      const targetName = featuredProject?.title || `o perfil de ${fullName}`;
      const data = await startConversation(
        profile.id,
        `Olá! Vi ${targetName} e gostaria de solicitar uma proposta para um novo projeto.`
      );
      navigate(`/messages?chat=${data.conversation?.id || data.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingChat(false);
    }
  };

  const handleTrackedProfileLink = (link) => {
    trackProfileLinkClick(handle, link.key).catch(() => {});
  };

  const handleTrackedProjectClick = async (projectItem) => {
    if (!projectItem?.projectUrl) return;
    try {
      const data = await trackProjectExternalClick(handle, projectItem.id);
      window.open(data.href || projectItem.projectUrl, '_blank', 'noopener,noreferrer');
      setProfile((current) => {
        if (!current) return current;
        const nextLinkClicks = data.analytics?.externalClicks;
        const nextProjects = (current.portfolioProjects || []).map((item) =>
          item.id === projectItem.id
            ? { ...item, analytics: { ...item.analytics, externalClicks: nextLinkClicks ?? item.analytics?.externalClicks ?? 0 } }
            : item
        );
        return mergeProfileEnhancements(
          { ...current, portfolioProjects: nextProjects },
          { ...current, portfolioProjects: nextProjects }
        );
      });
    } catch {
      window.open(projectItem.projectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFavoriteFreelancer = async () => {
    if (!profile?.id || isOwner) return;
    const nextValue = !isFavoriteFreelancer;
    setIsFavoriteFreelancer(nextValue);
    try {
      if (nextValue) {
        await addFavoriteFreelancer(profile.id);
        toast.success('Freelancer salvo nos favoritos.');
      } else {
        await removeFavoriteFreelancer(profile.id);
        toast.success('Freelancer removido dos favoritos.');
      }
    } catch (err) {
      setIsFavoriteFreelancer(!nextValue);
      toast.error(err.message);
    }
  };

  return (
    <div className={styles.page}>
      
      {/* Banner / Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroTop}>
            <div className={styles.avatar}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={fullName} className={styles.avatarImg} />
              ) : (
                <span>{initials || 'U'}</span>
              )}
              <span className={`${styles.presenceDot} ${presence.online ? styles.presenceOn : ''}`} title={presence.label} />
            </div>

            <div className={styles.identity}>
              <div className={styles.badgeRow}>
                <span className={styles.roleBadge}>{roleLabel}</span>
                <span className={`${styles.presenceLabel} ${presence.online ? styles.presenceLabelOn : ''}`}>
                  {presence.label}
                </span>
              </div>

              <div className={styles.nameRow}>
                <h1 className={styles.name}>{fullName}</h1>
                {profile.username && <span className={styles.handle}>@{profile.username}</span>}
              </div>

              <p className={styles.headline}>
                {profile.headline || 'Perfil em construção. Em breve com mais contexto, links e projetos.'}
              </p>

              <div className={styles.metaRow}>
                {profile.location && (
                  <span className={styles.metaItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {profile.location}
                  </span>
                )}
                {memberSince && (
                  <span className={styles.metaItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Membro desde {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            {isOwner ? (
              <>
                <Link to="/profile/customize" className={styles.primaryAction}>
                  Personalizar meu Perfil
                </Link>
                <Link to="/settings" className={styles.secondaryAction}>
                  Configurações da Conta
                </Link>
              </>
            ) : (
              <>
                <button className={styles.primaryAction} onClick={handleProposalRequest} disabled={startingChat}>
                  {startingChat ? 'Iniciando...' : 'Solicitar Orçamento'}
                </button>
                <button className={styles.secondaryAction} onClick={handleStartChat} disabled={startingChat}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  Mensagem
                </button>
                <button className={`${styles.iconAction} ${isFavoriteFreelancer ? styles.isFavorite : ''}`} onClick={handleFavoriteFreelancer} title={isFavoriteFreelancer ? 'Remover favorito' : 'Favoritar'}>
                  {isFavoriteFreelancer ? <FaHeart /> : <FaRegHeart />}
                </button>
              </>
            )}
          </div>

          {links.length > 0 && (
            <div className={styles.linkRow}>
              {links.map((link) => {
                const meta = getProfileLinkMeta(link.key);
                const Icon = meta.icon;
                return (
                  <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.linkChip} onClick={() => handleTrackedProfileLink(link)}>
                    <Icon /> {meta.shortLabel || link.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <aside className={styles.heroSide}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Serviços</span>
            <strong className={styles.metricValue}>{services.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Projetos</span>
            <strong className={styles.metricValue}>{projects.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Habilidades</span>
            <strong className={styles.metricValue}>{skills.length}</strong>
          </div>
          {isOwner && (
            <div className={`${styles.metricCard} ${styles.metricAccent}`}>
              <span className={styles.metricLabel}>Força do perfil</span>
              <strong className={styles.metricValue}>{completion.percent}%</strong>
              <div className={styles.progressMini}>
                <div className={styles.progressMiniFill} style={{ width: `${completion.percent}%` }}></div>
              </div>
            </div>
          )}
        </aside>
      </header>

      {/* Main Content Area */}
      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          
          {/* Sobre / Bio */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Sobre</h2>
            </div>
            {profile.bio ? (
              <p className={styles.bio}>{profile.bio}</p>
            ) : (
              <div className={styles.emptyContent}>
                {isOwner
                  ? 'Adicione uma bio para contar sua experiência, foco e forma de trabalhar.'
                  : 'Este usuário ainda não adicionou uma descrição pessoal.'}
              </div>
            )}
          </section>

          {/* Portfólio de Projetos */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Projetos em Destaque</h2>
              {isOwner && <Link to="/profile/customize" className={styles.inlineAction}>Editar Projetos</Link>}
            </div>

            {projects.length === 0 ? (
              <div className={styles.emptyBox}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <strong>Nenhum projeto em destaque.</strong>
                <p>{isOwner ? 'Suba capas e links dos seus melhores trabalhos na personalização.' : 'Este perfil ainda não publicou projetos no portfólio.'}</p>
              </div>
            ) : (
              <div className={styles.projectGrid}>
                {projects.map((project) => (
                  <article key={project.id} className={styles.projectCard}>
                    <div className={styles.projectMedia} role="button" tabIndex={0} onClick={() => navigate(`/profile/${handle}/projects/${project.id}`)}>
                      {project.coverImageUrl || project.imageUrl ? (
                        <img src={project.coverImageUrl || project.imageUrl} alt="" className={styles.projectImage} />
                      ) : (
                        <div className={styles.projectFallback}>Case de Estudo</div>
                      )}
                    </div>
                    <div className={styles.projectBody}>
                      <div className={styles.projectTitleRow}>
                        <Link to={`/profile/${handle}/projects/${project.id}`} className={styles.projectTitleLink}>
                          {project.title || 'Projeto sem título'}
                        </Link>
                        {project.analytics?.views > 0 && (
                          <span className={styles.projectStat}>{project.analytics.views} views</span>
                        )}
                      </div>
                      
                      {project.description && <p className={styles.projectDesc}>{project.description}</p>}
                      
                      {project.tags?.length > 0 && (
                        <div className={styles.projectTags}>
                          {project.tags.map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}
                        </div>
                      )}

                      <div className={styles.projectActions}>
                        <Link to={`/profile/${handle}/projects/${project.id}`} className={styles.projectLink}>Abrir Case</Link>
                        {project.projectUrl && (
                          <button type="button" className={styles.projectLinkOutline} onClick={() => handleTrackedProjectClick(project)}>
                            Ver Externo <FaArrowUpRightFromSquare />
                          </button>
                        )}
                      </div>

                      {project.images?.length > 1 && (
                        <div className={styles.projectGalleryStrip}>
                          {project.images.slice(0, 4).map((image, index) => (
                            <button key={image.id || `${project.id}_image_${index}`} type="button" className={styles.projectGalleryThumb} onClick={() => openProjectGallery(project, index)}>
                              <img src={image.url} alt="" className={styles.projectGalleryThumbImg} />
                            </button>
                          ))}
                          {project.images.length > 4 && (
                            <button type="button" className={`${styles.projectGalleryThumb} ${styles.projectGalleryMore}`} onClick={() => openProjectGallery(project, 4)}>
                              +{project.images.length - 4}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Serviços do Usuário */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Serviços Ofertados ({services.length})</h2>
            </div>

            {services.length === 0 ? (
              <div className={styles.emptyContent}>Este usuário ainda não publicou serviços para contratação.</div>
            ) : (
              <div className={styles.grid}>
                {services.map((svc) => {
                  const cover = svc.images?.[0]?.url || svc.coverUrl;
                  const minPrice = svc.minPriceCents ?? svc.plans?.[0]?.priceCents ?? 0;
                  return (
                    <Link key={svc.id} to={`/services/${svc.id}`} className={styles.serviceCard}>
                      <div className={styles.serviceCover} style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
                        {!cover && (
                          <span className={styles.coverFallback}>
                            <CategoryIcon category={svc.category} />
                          </span>
                        )}
                      </div>
                      <div className={styles.serviceBody}>
                        <span className={styles.serviceCategory}>
                          <CategoryIcon category={svc.category} /> {svc.category?.name}
                        </span>
                        <h3 className={styles.serviceTitle}>{svc.title}</h3>
                        <div className={styles.serviceFooter}>
                          <span className={styles.serviceFrom}>A partir de</span>
                          <strong className={styles.servicePrice}>{formatPrice(minPrice)}</strong>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Lateral */}
        <aside className={styles.aside}>
          
          {/* Projeto Destacado Maior */}
          {featuredProject && (
            <section className={`${styles.card} ${styles.featuredCard}`}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Projeto Principal</h2>
              </div>
              <div className={styles.featuredProjectCard}>
                {featuredProject.coverImageUrl || featuredProject.imageUrl ? (
                  <Link to={`/profile/${handle}/projects/${featuredProject.id}`} className={styles.featuredProjectMedia}>
                    <img src={featuredProject.coverImageUrl || featuredProject.imageUrl} alt="" className={styles.featuredProjectImage} />
                  </Link>
                ) : (
                  <div className={styles.featuredProjectFallback}>Case Principal</div>
                )}
                <div className={styles.featuredProjectBody}>
                  <strong>{featuredProject.title || 'Sem título'}</strong>
                  <p>{featuredProject.description || 'Projeto selecionado como principal vitrine do perfil.'}</p>
                  
                  <div className={styles.projectActions}>
                    <Link to={`/profile/${handle}/projects/${featuredProject.id}`} className={styles.projectLink}>Detalhes do Case</Link>
                    {featuredProject.projectUrl && (
                      <button type="button" className={styles.projectLinkOutline} onClick={() => handleTrackedProjectClick(featuredProject)}>
                        Ver Site <FaArrowUpRightFromSquare />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Presença Online</h2>
            </div>
            {links.length === 0 ? (
              <div className={styles.emptyContent}>
                {isOwner ? 'Adicione suas redes e links para passar mais confiança.' : 'Nenhum link adicionado.'}
              </div>
            ) : (
              <div className={styles.profileLinkList}>
                {links.map((link) => {
                  const meta = getProfileLinkMeta(link.key);
                  const Icon = meta.icon;
                  return (
                    <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.profileLinkItem} onClick={() => handleTrackedProfileLink(link)}>
                      <span className={styles.profileLinkLabel}><Icon /> {meta.label || link.label}</span>
                      <FaArrowUpRightFromSquare className={styles.externalIcon} />
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Habilidades</h2>
            </div>
            {skills.length === 0 ? (
              <div className={styles.emptyContent}>
                {isOwner ? 'Adicione skills (tags) para mostrar suas ferramentas.' : 'Este perfil não listou habilidades.'}
              </div>
            ) : (
              <div className={styles.skillList}>
                {skills.map((skill) => <span key={skill} className={styles.skillChip}>{skill}</span>)}
              </div>
            )}
          </section>

          {isOwner && (
            <section className={styles.card}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Checklist do Perfil</h2>
              </div>
              <div className={styles.completionList}>
                {completion.items.map((item) => (
                  <div key={item.id} className={styles.completionItem}>
                    <div className={`${styles.completionDot} ${item.done ? styles.completionDotDone : ''}`}>
                      {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <div className={styles.completionText}>
                      <strong>{item.label}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <Toaster position="top-center" richColors />

      {/* Lightbox / Galeria */}
      {lightboxImages.length > 0 && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div className={styles.lightboxDialog} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.lightboxClose} onClick={closeLightbox}><FaXmark /></button>
            {lightboxImages.length > 1 && <button type="button" className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={showPrevImage}><FaArrowLeft /></button>}
            
            <img src={lightboxImages[lightboxIndex]} alt="Imagem ampliada" className={styles.lightboxImage} />
            
            {lightboxImages.length > 1 && <button type="button" className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={showNextImage}><FaArrowRight /></button>}
            {lightboxImages.length > 1 && <div className={styles.lightboxCounter}>{lightboxIndex + 1} / {lightboxImages.length}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
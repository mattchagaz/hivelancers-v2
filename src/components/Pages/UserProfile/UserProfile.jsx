import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaHeart, FaArrowUpRightFromSquare, FaXmark } from 'react-icons/fa6';
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
  if (min < 60) return { label: `Visto ha ${min} min`, online: false };
  const hours = Math.floor(min / 60);
  if (hours < 24) return { label: `Visto ha ${hours}h`, online: false };
  const days = Math.floor(hours / 24);
  if (days < 30) return { label: `Visto ha ${days}d`, online: false };
  return { label: 'Offline ha tempos', online: false };
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
      subtitle: profile.headline || (profile.username ? `@${profile.username}` : 'Perfil publico'),
      href: `/profile/${handle}`,
    });
  }, [profile?.id, profile?.firstName, profile?.lastName, profile?.headline, profile?.username, handle, user?.id, user?.userType]);

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <h1 className={styles.emptyTitle}>Carregando perfil...</h1>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className={styles.emptyState}>
        <h1 className={styles.emptyTitle}>Perfil nao encontrado</h1>
        <p className={styles.emptyText}>
          O usuario pode ter removido a conta ou o link esta desatualizado.
        </p>
        <Link to="/explore" className={styles.emptyButton}>
          Voltar para explorar servicos
        </Link>
      </div>
    );
  }

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Usuario';
  const initials = fullName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const presence = formatLastSeen(profile.lastSeenAt);
  const memberSince = formatMemberSince(profile.createdAt);
  const services = profile.services || [];
  const skills = profile.skills || [];
  const isOwner = Boolean(user && profile.id === user.id);
  const roleLabel = profile.userType === 'CLIENT' ? 'Cliente' : 'Freelancer';

  const handleStartChat = async () => {
    if (!profile?.id || startingChat) return;
    setStartingChat(true);
    try {
      const data = await startConversation(profile.id, 'Ola! Dei uma olhada no seu perfil e queria conversar.');
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
        `Ola! Vi ${targetName} e gostaria de solicitar uma proposta para um novo projeto.`
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
            ? {
                ...item,
                analytics: {
                  ...item.analytics,
                  externalClicks: nextLinkClicks ?? item.analytics?.externalClicks ?? 0,
                },
              }
            : item
        );
        return mergeProfileEnhancements(
          {
            ...current,
            portfolioProjects: nextProjects,
          },
          {
            ...current,
            portfolioProjects: nextProjects,
          }
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
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroTop}>
            <div className={styles.avatar}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className={styles.avatarImg} />
              ) : (
                <span>{initials || 'U'}</span>
              )}
              <span className={`${styles.presenceDot} ${presence.online ? styles.presenceOn : ''}`} />
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
                {profile.username ? <span className={styles.handle}>@{profile.username}</span> : null}
              </div>

              <p className={styles.headline}>
                {profile.headline || 'Perfil em construcao. Em breve com mais contexto, links e projetos.'}
              </p>

              <div className={styles.metaRow}>
                {profile.location ? <span className={styles.metaItem}>{profile.location}</span> : null}
                {profile.location && memberSince ? <span className={styles.metaDivider} /> : null}
                {memberSince ? <span className={styles.metaItem}>Membro desde {memberSince}</span> : null}
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            {isOwner ? (
              <>
                <Link to="/profile/customize" className={styles.primaryAction}>
                  Personalizar perfil
                </Link>
                <Link to="/settings" className={styles.secondaryAction}>
                  Configuracoes
                </Link>
              </>
            ) : (
              <>
                <button
                  className={styles.primaryAction}
                  onClick={handleProposalRequest}
                  disabled={startingChat}
                >
                  {startingChat ? 'Iniciando...' : 'Solicitar proposta'}
                </button>
                <button
                  className={styles.secondaryAction}
                  onClick={handleFavoriteFreelancer}
                  type="button"
                >
                  <FaHeart />
                  {isFavoriteFreelancer ? 'Remover favorito' : 'Favoritar freelancer'}
                </button>
                <button
                  className={styles.secondaryAction}
                  onClick={handleStartChat}
                  disabled={startingChat}
                >
                  Enviar mensagem
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
                  <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkChip}
                    onClick={() => handleTrackedProfileLink(link)}
                  >
                    <Icon />
                    {meta.shortLabel || link.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <aside className={styles.heroSide}>
          <div className={styles.metricCard}>
            <span>Servicos publicados</span>
            <strong>{services.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span>Projetos publicados</span>
            <strong>{projects.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span>Habilidades visiveis</span>
            <strong>{skills.length}</strong>
          </div>
          {isOwner ? (
            <div className={`${styles.metricCard} ${styles.metricAccent}`}>
              <span>Forca do perfil</span>
              <strong>{completion.percent}%</strong>
              <p>{completion.isReadyForMission ? 'Pronto para a missao de 80%.' : 'Complete mais itens para destravar a missao.'}</p>
            </div>
          ) : null}
        </aside>
      </section>

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Sobre</h2>
            </div>
            {profile.bio ? (
              <p className={styles.bio}>{profile.bio}</p>
            ) : (
              <p className={styles.emptyServices}>
                {isOwner
                  ? 'Adicione uma bio para contar experiencia, foco e forma de trabalhar.'
                  : 'Este usuario ainda nao adicionou uma descricao pessoal.'}
              </p>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Projetos em destaque</h2>
              {isOwner ? <Link to="/profile/customize" className={styles.inlineAction}>Editar projetos</Link> : null}
            </div>

            {projects.length === 0 ? (
              <div className={styles.emptyBox}>
                <strong>Nenhum projeto destacado ainda.</strong>
                <p>
                  {isOwner
                    ? 'Use a tela de personalizacao para subir capas, links e descrever alguns cases.'
                    : 'Este perfil ainda nao publicou projetos de portfolio em destaque.'}
                </p>
              </div>
            ) : (
              <div className={styles.projectGrid}>
                {projects.map((project) => (
                  <article key={project.id} className={styles.projectCard}>
                    <div
                      className={styles.projectMedia}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/profile/${handle}/projects/${project.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/profile/${handle}/projects/${project.id}`);
                        }
                      }}
                    >
                      {project.coverImageUrl || project.imageUrl ? (
                        <img src={project.coverImageUrl || project.imageUrl} alt="" className={styles.projectImage} />
                      ) : (
                        <div className={styles.projectFallback}>Projeto</div>
                      )}
                    </div>
                    <div className={styles.projectBody}>
                      <div className={styles.projectTitleRow}>
                        <Link to={`/profile/${handle}/projects/${project.id}`} className={styles.projectTitleLink}>
                          {project.title || 'Projeto sem titulo'}
                        </Link>
                        {project.analytics?.views ? (
                          <span className={styles.projectStat}>{project.analytics.views} views</span>
                        ) : null}
                      </div>
                      {project.description ? <p>{project.description}</p> : null}
                      {project.tags?.length > 0 ? (
                        <div className={styles.projectTags}>
                          {project.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className={styles.projectActions}>
                        <Link to={`/profile/${handle}/projects/${project.id}`} className={styles.projectLink}>
                          Abrir case
                        </Link>
                      {project.projectUrl ? (
                        <button
                          type="button"
                          className={styles.projectLink}
                          onClick={() => handleTrackedProjectClick(project)}
                        >
                          Ver projeto
                          <FaArrowUpRightFromSquare />
                        </button>
                      ) : null}
                      </div>
                      {project.images?.length > 1 ? (
                        <div className={styles.projectGalleryStrip}>
                          {project.images.slice(0, 4).map((image, index) => (
                            <button
                              key={image.id || `${project.id}_image_${index}`}
                              type="button"
                              className={styles.projectGalleryThumb}
                              onClick={() => openProjectGallery(project, index)}
                            >
                              <img src={image.url} alt="" className={styles.projectGalleryThumbImg} />
                            </button>
                          ))}
                          {project.images.length > 4 ? (
                            <button
                              type="button"
                              className={`${styles.projectGalleryThumb} ${styles.projectGalleryMore}`}
                              onClick={() => openProjectGallery(project, 4)}
                            >
                              +{project.images.length - 4}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Servicos ({services.length})</h2>
            </div>

            {services.length === 0 ? (
              <p className={styles.emptyServices}>Este usuario ainda nao publicou servicos.</p>
            ) : (
              <div className={styles.grid}>
                {services.map((svc) => {
                  const cover = svc.images?.[0]?.url || svc.coverUrl;
                  const minPrice = svc.minPriceCents ?? svc.plans?.[0]?.priceCents ?? 0;
                  return (
                    <Link key={svc.id} to={`/services/${svc.id}`} className={styles.serviceCard}>
                      <div
                        className={styles.serviceCover}
                        style={cover ? { backgroundImage: `url(${cover})` } : undefined}
                      >
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

        <aside className={styles.aside}>
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Links visiveis</h2>
            </div>
            {links.length === 0 ? (
              <p className={styles.emptyServices}>
                {isOwner ? 'Adicione links para deixar seu perfil mais confiavel.' : 'Este perfil ainda nao publicou links externos.'}
              </p>
            ) : (
              <div className={styles.profileLinkList}>
                {links.map((link) => {
                  const meta = getProfileLinkMeta(link.key);
                  const Icon = meta.icon;
                  return (
                    <a
                      key={link.key}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.profileLinkItem}
                      onClick={() => handleTrackedProfileLink(link)}
                    >
                      <span className={styles.profileLinkLabel}>
                        <Icon />
                        {meta.label || link.label}
                      </span>
                      <FaArrowUpRightFromSquare />
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          {featuredProject ? (
            <section className={styles.card}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Projeto em destaque</h2>
              </div>
              <div className={styles.featuredProjectCard}>
                {featuredProject.coverImageUrl || featuredProject.imageUrl ? (
                  <Link
                    to={`/profile/${handle}/projects/${featuredProject.id}`}
                    className={styles.featuredProjectMedia}
                  >
                    <img src={featuredProject.coverImageUrl || featuredProject.imageUrl} alt="" className={styles.featuredProjectImage} />
                  </Link>
                ) : (
                  <div className={styles.featuredProjectFallback}>Projeto</div>
                )}
                <div className={styles.featuredProjectBody}>
                  <strong>{featuredProject.title || 'Projeto sem titulo'}</strong>
                  <p>{featuredProject.description || 'Esse projeto aparece em destaque para reforcar seu perfil publico.'}</p>
                  <div className={styles.projectActions}>
                    <Link to={`/profile/${handle}/projects/${featuredProject.id}`} className={styles.projectLink}>
                      Abrir case
                    </Link>
                    {featuredProject.projectUrl ? (
                      <button
                        type="button"
                        className={styles.projectLink}
                        onClick={() => handleTrackedProjectClick(featuredProject)}
                      >
                        Ver projeto
                        <FaArrowUpRightFromSquare />
                      </button>
                    ) : null}
                  </div>
                  {featuredProject.images?.length > 1 ? (
                    <div className={styles.featuredGalleryStrip}>
                      {featuredProject.images.slice(0, 3).map((image, index) => (
                        <button
                          key={image.id || `${featuredProject.id}_image_${index}`}
                          type="button"
                          className={styles.featuredGalleryThumb}
                          onClick={() => openProjectGallery(featuredProject, index)}
                        >
                          <img src={image.url} alt="" className={styles.featuredGalleryThumbImg} />
                        </button>
                      ))}
                      {featuredProject.images.length > 3 ? (
                        <button
                          type="button"
                          className={`${styles.featuredGalleryThumb} ${styles.projectGalleryMore}`}
                          onClick={() => openProjectGallery(featuredProject, 3)}
                        >
                          +{featuredProject.images.length - 3}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Habilidades</h2>
            </div>
            {skills.length === 0 ? (
              <p className={styles.emptyServices}>
                {isOwner ? 'Adicione skills para deixar seu posicionamento mais claro.' : 'Este perfil ainda nao listou habilidades.'}
              </p>
            ) : (
              <div className={styles.skillList}>
                {skills.map((skill) => (
                  <span key={skill} className={styles.skillChip}>
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </section>

          {isOwner ? (
            <section className={styles.card}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Checklist de completude</h2>
              </div>
              <div className={styles.completionList}>
                {completion.items.map((item) => (
                  <div key={item.id} className={styles.completionItem}>
                    <span className={`${styles.completionDot} ${item.done ? styles.completionDotDone : ''}`} />
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.weight}% do perfil</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <Toaster position="top-center" richColors />

      {lightboxImages.length > 0 ? (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div className={styles.lightboxDialog} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.lightboxClose} onClick={closeLightbox}>
              <FaXmark />
            </button>
            {lightboxImages.length > 1 ? (
              <button type="button" className={`${styles.lightboxNav} ${styles.lightboxPrev}`} onClick={showPrevImage}>
                <FaArrowLeft />
              </button>
            ) : null}
            <img src={lightboxImages[lightboxIndex]} alt="" className={styles.lightboxImage} />
            {lightboxImages.length > 1 ? (
              <button type="button" className={`${styles.lightboxNav} ${styles.lightboxNext}`} onClick={showNextImage}>
                <FaArrowRight />
              </button>
            ) : null}
            {lightboxImages.length > 1 ? (
              <div className={styles.lightboxCounter}>
                {lightboxIndex + 1} / {lightboxImages.length}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default UserProfile;

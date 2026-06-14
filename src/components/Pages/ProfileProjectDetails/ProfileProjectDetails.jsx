import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaArrowUpRightFromSquare, FaChartLine, FaEye, FaXmark } from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { startConversation } from '../../../services/messages';
import { getPublicProject, trackProjectExternalClick } from '../../../services/users';
import { getFeaturedProject, getProfileLinks, mergeProfileEnhancements } from '../../../utils/profileEnhancements';
import { getProfileLinkMeta } from '../../../utils/profileLinks';
import { recordRecentActivity } from '../../../utils/clientRecentActivity';
import styles from './ProfileProjectDetails.module.css';

function ProfileProjectDetails() {
  const { handle, projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [project, setProject] = useState(null);
  const [moreProjects, setMoreProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [openingProject, setOpeningProject] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getPublicProject(handle, projectId)
      .then((data) => {
        if (cancelled) return;
        setProfile(mergeProfileEnhancements(data.profile, data.profile));
        setProject(data.project);
        setMoreProjects(data.moreProjects || []);
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
  }, [handle, projectId]);

  const links = useMemo(() => getProfileLinks(profile), [profile]);
  const featuredProject = useMemo(() => getFeaturedProject(profile), [profile]);
  const isOwner = Boolean(user && profile?.id === user.id);

  const gallery = useMemo(() => {
    const images = (project?.images || []).map((image) => image?.url).filter(Boolean);
    const cover = project?.coverImageUrl || project?.imageUrl;
    if (images.length > 0) return images;
    return cover ? [cover] : [];
  }, [project]);

  const openLightbox = (index = 0) => {
    if (gallery.length === 0) return;
    setLightboxImages(gallery);
    setLightboxIndex(Math.min(index, gallery.length - 1));
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
    if (!project?.id || !profile?.id || !user?.id || user.userType !== 'CLIENT' || profile.id === user.id) return;
    recordRecentActivity(user.id, {
      type: 'project',
      id: project.id,
      title: project.title || 'Projeto em destaque',
      subtitle: profile.username ? `@${profile.username}` : `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      href: `/profile/${handle}/projects/${project.id}`,
    });
  }, [project?.id, project?.title, profile?.id, profile?.username, profile?.firstName, profile?.lastName, handle, user?.id, user?.userType]);

  const handleRequestProposal = async () => {
    if (!profile?.id || startingChat) return;
    setStartingChat(true);
    try {
      const targetName = project?.title || 'seu projeto';
      const data = await startConversation(
        profile.id,
        `Ola! Vi o projeto "${targetName}" no seu perfil e gostaria de solicitar uma proposta.`
      );
      navigate(`/messages?chat=${data.conversation?.id || data.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingChat(false);
    }
  };

  const handleOpenProjectUrl = async () => {
    if (!project?.projectUrl || openingProject) return;
    setOpeningProject(true);
    try {
      const data = await trackProjectExternalClick(handle, project.id);
      window.open(data.href || project.projectUrl, '_blank', 'noopener,noreferrer');
      setProject((current) =>
        current
          ? {
              ...current,
              analytics: {
                ...current.analytics,
                externalClicks: data.analytics?.externalClicks ?? current.analytics?.externalClicks,
              },
            }
          : current
      );
    } catch (err) {
      toast.error(err.message);
      window.open(project.projectUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setOpeningProject(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <h1>Carregando projeto...</h1>
      </div>
    );
  }

  if (notFound || !profile || !project) {
    return (
      <div className={styles.emptyState}>
        <h1>Projeto nao encontrado</h1>
        <p>Esse case pode ter sido removido ou o link ficou desatualizado.</p>
        <Link to={`/profile/${handle}`} className={styles.primaryAction}>
          Voltar para o perfil
        </Link>
      </div>
    );
  }

  const ownerName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Freelancer';
  const ownerHandle = profile.username ? `@${profile.username}` : null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Link to={`/profile/${handle}`} className={styles.backLink}>
            <FaArrowLeft />
            Voltar para o perfil
          </Link>
          <div className={styles.heroEyebrow}>Case em destaque</div>
          <h1 className={styles.title}>{project.title || 'Projeto sem titulo'}</h1>
          <p className={styles.description}>
            {project.description || 'Projeto salvo no portfólio público do freelancer.'}
          </p>

          {project.tags?.length > 0 ? (
            <div className={styles.tagRow}>
              {project.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className={styles.actionRow}>
            {!isOwner ? (
              <button type="button" className={styles.primaryAction} onClick={handleRequestProposal} disabled={startingChat}>
                {startingChat ? 'Abrindo conversa...' : 'Solicitar proposta'}
              </button>
            ) : (
              <Link to="/profile/customize" className={styles.primaryAction}>
                Editar projeto
              </Link>
            )}

            {project.projectUrl ? (
              <button type="button" className={styles.secondaryAction} onClick={handleOpenProjectUrl} disabled={openingProject}>
                {openingProject ? 'Abrindo...' : 'Ver projeto ao vivo'}
                <FaArrowUpRightFromSquare />
              </button>
            ) : null}
          </div>
        </div>

        <aside className={styles.heroStats}>
          <div className={styles.statCard}>
            <span>Galeria</span>
            <strong>{gallery.length}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Posição no portfólio</span>
            <strong>#{(project.position ?? 0) + 1}</strong>
          </div>
          {isOwner ? (
            <>
              <div className={styles.statCard}>
                <span>Views do projeto</span>
                <strong>{project.analytics?.views || 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Cliques externos</span>
                <strong>{project.analytics?.externalClicks || 0}</strong>
              </div>
            </>
          ) : null}
        </aside>
      </section>

      <div className={styles.layout}>
        <section className={styles.mainCard}>
          <button type="button" className={styles.coverButton} onClick={() => openLightbox(0)}>
            {gallery[0] ? (
              <img src={gallery[0]} alt="" className={styles.coverImage} />
            ) : (
              <div className={styles.coverFallback}>Projeto</div>
            )}
          </button>

          {gallery.length > 1 ? (
            <div className={styles.thumbGrid}>
              {gallery.map((image, index) => (
                <button key={`${image}_${index}`} type="button" className={styles.thumbButton} onClick={() => openLightbox(index)}>
                  <img src={image} alt="" className={styles.thumbImage} />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <aside className={styles.sideColumn}>
          <section className={styles.sideCard}>
            <div className={styles.ownerHead}>
              <div className={styles.ownerAvatar}>
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className={styles.ownerAvatarImg} /> : ownerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>{ownerName}</strong>
                {ownerHandle ? <span>{ownerHandle}</span> : null}
              </div>
            </div>
            <p className={styles.ownerHeadline}>
              {profile.headline || 'Freelancer com portfólio público ativo na plataforma.'}
            </p>
            <div className={styles.ownerLinks}>
              {links.slice(0, 4).map((link) => {
                const meta = getProfileLinkMeta(link.key);
                const Icon = meta.icon;
                return (
                  <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.ownerLink}>
                    <Icon />
                    {meta.shortLabel || link.label}
                  </a>
                );
              })}
            </div>
          </section>

          {isOwner ? (
            <section className={styles.sideCard}>
              <div className={styles.sideTitleRow}>
                <h2>Analytics basicos</h2>
                <FaChartLine />
              </div>
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsItem}>
                  <span>Perfil</span>
                  <strong>{profile.analytics?.profileViews || 0}</strong>
                </div>
                <div className={styles.analyticsItem}>
                  <span>Links</span>
                  <strong>{profile.analytics?.linkClicks || 0}</strong>
                </div>
                <div className={styles.analyticsItem}>
                  <span>Projetos</span>
                  <strong>{profile.analytics?.projectViews || 0}</strong>
                </div>
                <div className={styles.analyticsItem}>
                  <span>Cliques</span>
                  <strong>{profile.analytics?.projectExternalClicks || 0}</strong>
                </div>
              </div>
            </section>
          ) : null}

          {featuredProject && featuredProject.id !== project.id ? (
            <section className={styles.sideCard}>
              <div className={styles.sideTitleRow}>
                <h2>Outro destaque</h2>
                <FaEye />
              </div>
              <Link to={`/profile/${handle}/projects/${featuredProject.id}`} className={styles.relatedCard}>
                {featuredProject.coverImageUrl ? (
                  <img src={featuredProject.coverImageUrl} alt="" className={styles.relatedImage} />
                ) : (
                  <div className={styles.relatedFallback}>Projeto</div>
                )}
                <div>
                  <strong>{featuredProject.title || 'Projeto sem titulo'}</strong>
                  <p>{featuredProject.description || 'Abrir esse case para ver a galeria completa.'}</p>
                </div>
              </Link>
            </section>
          ) : null}
        </aside>
      </div>

      {moreProjects.length > 0 ? (
        <section className={styles.moreSection}>
          <div className={styles.sectionHead}>
            <h2>Mais projetos desse perfil</h2>
            <Link to={`/profile/${handle}`} className={styles.inlineLink}>
              Ver perfil completo
            </Link>
          </div>
          <div className={styles.relatedGrid}>
            {moreProjects.map((item) => (
              <Link key={item.id} to={`/profile/${handle}/projects/${item.id}`} className={styles.relatedProject}>
                {item.coverImageUrl || item.imageUrl ? (
                  <img src={item.coverImageUrl || item.imageUrl} alt="" className={styles.relatedProjectImage} />
                ) : (
                  <div className={styles.relatedProjectFallback}>Projeto</div>
                )}
                <div className={styles.relatedProjectBody}>
                  <strong>{item.title || 'Projeto sem titulo'}</strong>
                  <p>{item.description || 'Abrir detalhes completos do case.'}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileProjectDetails;

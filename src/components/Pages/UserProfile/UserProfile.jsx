import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { getPublicProfile } from '../../../services/users';
import { startConversation } from '../../../services/messages';
import {
  getProfileCompletion,
  getProfileLinks,
  getStoredProfileEnhancements,
  mergeProfileEnhancements,
} from '../../../utils/profileEnhancements';
import styles from './UserProfile.module.css';

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    getPublicProfile(handle)
      .then((data) => {
        if (cancelled) return;
        const enhancements =
          user?.id && data.id === user.id ? getStoredProfileEnhancements(user.id) : null;
        setProfile(mergeProfileEnhancements(data, enhancements));
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
  const projects = profile.portfolioProjects || [];
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
                  onClick={handleStartChat}
                  disabled={startingChat}
                >
                  {startingChat ? 'Iniciando...' : 'Enviar mensagem'}
                </button>
                {profile.website ? (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className={styles.secondaryAction}>
                    Abrir website
                  </a>
                ) : null}
              </>
            )}
          </div>

          {links.length > 0 && (
            <div className={styles.linkRow}>
              {links.map((link) => (
                <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.linkChip}>
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <aside className={styles.heroSide}>
          <div className={styles.metricCard}>
            <span>Servicos publicados</span>
            <strong>{services.length}</strong>
          </div>
          <div className={styles.metricCard}>
            <span>Projetos em destaque</span>
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
                    <div className={styles.projectMedia}>
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt="" className={styles.projectImage} />
                      ) : (
                        <div className={styles.projectFallback}>Projeto</div>
                      )}
                    </div>
                    <div className={styles.projectBody}>
                      <h3>{project.title || 'Projeto sem titulo'}</h3>
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
                      {project.projectUrl ? (
                        <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className={styles.projectLink}>
                          Ver projeto
                        </a>
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
                        {!cover && <span className={styles.coverFallback}>{svc.category?.icon || '📦'}</span>}
                      </div>
                      <div className={styles.serviceBody}>
                        <span className={styles.serviceCategory}>
                          {svc.category?.icon} {svc.category?.name}
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
    </div>
  );
}

export default UserProfile;

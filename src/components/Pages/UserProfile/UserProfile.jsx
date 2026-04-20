import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { getPublicProfile } from '../../../services/users';
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
  if (min < 60) return { label: `Visto há ${min} min`, online: false };
  const hours = Math.floor(min / 60);
  if (hours < 24) return { label: `Visto há ${hours}h`, online: false };
  const days = Math.floor(hours / 24);
  if (days < 30) return { label: `Visto há ${days}d`, online: false };
  return { label: 'Offline há tempos', online: false };
};

function UserProfile() {
  const { handle } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getPublicProfile(handle)
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [handle]);

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
        <h1 className={styles.emptyTitle}>Perfil não encontrado</h1>
        <p className={styles.emptyText}>
          O usuário pode ter removido a conta ou o link está desatualizado.
        </p>
        <Link to="/explore" className={styles.emptyButton}>
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

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.avatar}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span>{initials || 'U'}</span>
          )}
          <span className={`${styles.presenceDot} ${presence.online ? styles.presenceOn : ''}`} />
        </div>

        <div className={styles.heroInfo}>
          <div className={styles.nameRow}>
            <h1 className={styles.name}>{fullName}</h1>
            {profile.username && <span className={styles.handle}>@{profile.username}</span>}
          </div>

          {profile.headline && <p className={styles.headline}>{profile.headline}</p>}

          <div className={styles.metaRow}>
            <span className={`${styles.presenceLabel} ${presence.online ? styles.presenceLabelOn : ''}`}>
              {presence.label}
            </span>
            {profile.location && (
              <>
                <span className={styles.metaDivider} />
                <span className={styles.metaItem}>{profile.location}</span>
              </>
            )}
            {memberSince && (
              <>
                <span className={styles.metaDivider} />
                <span className={styles.metaItem}>Membro desde {memberSince}</span>
              </>
            )}
          </div>

          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className={styles.website}>
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </section>

      {profile.bio && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Sobre</h2>
          <p className={styles.bio}>{profile.bio}</p>
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Serviços ({services.length})</h2>
        </div>

        {services.length === 0 ? (
          <p className={styles.emptyServices}>Este usuário ainda não publicou serviços.</p>
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

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default UserProfile;

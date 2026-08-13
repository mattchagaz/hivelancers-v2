import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { FaBell, FaPalette, FaShieldHalved, FaUserCheck, FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { useAuth } from '../../../contexts/authContextStore';
import { useSettings } from '../../../contexts/SettingsContext';
import {
  updateProfile as apiUpdateProfile,
} from '../../../services/users';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
import CityAutocomplete from '../../CityAutocomplete/CityAutocomplete';
import { toRoleSlug } from '../../../utils/authFlow';
import { formatPersonName } from '../../../utils/formatters';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import ConfirmDialog from '../../UI/ConfirmDialog/ConfirmDialog';
import styles from './Settings.module.css';
import {
  PROFILE_FIELDS,
  ACCOUNT_FIELDS,
  THEME_LABEL,
  DENSITY_LABEL,
  IN_APP_NOTIFICATION_OPTIONS,
  PUSH_NOTIFICATION_OPTIONS,
  profileFromUser,
  formatDate,
  getInitials,
  clamp,
} from './Settings.helpers';
import ProfilePanel from './panels/ProfilePanel';
import AccountPanel from './panels/AccountPanel';
import NotificationsPanel from './panels/NotificationsPanel';
import AppearancePanel from './panels/AppearancePanel';
import PrivacyPanel from './panels/PrivacyPanel';
import BillingPanel from './panels/BillingPanel';
import LanguagePanel from './panels/LanguagePanel';
import DangerPanel from './panels/DangerPanel';

function Settings() {
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();
  const { settings, toggleField, updateSection } = useSettings();

  const userRole = toRoleSlug(user?.userType) || 'freelancer';
  const isFreelancer = userRole === 'freelancer';

  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [locationValid, setLocationValid] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showRemoveAvatarConfirm, setShowRemoveAvatarConfirm] = useState(false);
  const avatarInputRef = useRef(null);
  const profilePanelRef = useRef(null);

  const serverProfile = useMemo(() => profileFromUser(user), [user]);
  const { notifications, appearance, privacy, language } = settings;

  useEffect(() => {
    const timer = window.setTimeout(() => setProfile(serverProfile), 0);
    return () => window.clearTimeout(timer);
  }, [serverProfile]);

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || 'Usuário';
  const initials = getInitials(profile.firstName, profile.lastName);

  const getDirtyForFields = (fields) =>
    fields.some((field) => (profile[field] || '') !== (serverProfile[field] || ''));

  const profileDirty = getDirtyForFields(PROFILE_FIELDS);
  const accountDirty = getDirtyForFields(ACCOUNT_FIELDS);

  const profileCompletion = useMemo(() => {
    const checklist = [
      profile.avatarUrl,
      profile.firstName,
      profile.lastName,
      profile.username,
      profile.headline,
      profile.location,
      profile.bio,
      profile.website,
      profile.phone,
    ];
    const filled = checklist.filter(Boolean).length;
    return Math.round((filled / checklist.length) * 100);
  }, [profile]);

  const inAppEnabledCount = IN_APP_NOTIFICATION_OPTIONS
    .filter(({ field }) => Boolean(notifications[field]))
    .length;

  const pushEnabledCount = PUSH_NOTIFICATION_OPTIONS
    .filter(({ field }) => Boolean(notifications[field]))
    .length;

  const publicProfileHref = profile.username ? `/profile/${profile.username}` : null;

  const openProfilePanel = () => {
    setActiveTab('profile');
    window.requestAnimationFrame(() => {
      profilePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const tabs = useMemo(
    () => [
      { id: 'profile', label: 'Perfil Público', icon: 'user', description: 'Apresentação e vitrine' },
      { id: 'account', label: 'Conta e Acesso', icon: 'shield', description: 'Login, telefone e segurança' },
      { id: 'notifications', label: 'Notificações', icon: 'bell', description: 'Preferências de alertas' },
      { id: 'appearance', label: 'Aparência', icon: 'palette', description: 'Tema, cores e espaçamento' },
      { id: 'privacy', label: 'Privacidade', icon: 'lock', description: 'Visibilidade e mensagens' },
      { id: 'billing', label: 'Pagamentos', icon: 'card', description: isFreelancer ? 'Planos, verificação e repasses' : 'Planos, cartões e histórico' },
      { id: 'language', label: 'Localização', icon: 'globe', description: 'Idioma, fuso e moeda' },
      { id: 'danger', label: 'Segurança da conta', icon: 'alert', description: 'Dados e encerramento' },
    ],
    [isFreelancer]
  );

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) {
      const timer = window.setTimeout(() => setActiveTab(requestedTab), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, tabs]);

  useEffect(() => {
    const stripeFlow = searchParams.get('stripe');
    if (!stripeFlow) return undefined;

    const timer = window.setTimeout(() => setActiveTab('billing'), 0);

    if (stripeFlow === 'return') {
      toast.success('Voltamos da Stripe. Atualizando o status da sua conta.');
      return () => window.clearTimeout(timer);
    }

    if (stripeFlow === 'refresh') {
      toast.info('O link da Stripe expirou. Gere um novo para continuar a conexão.');
    }
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const updateProfileField = (field, value) => {
    const nextValue = field === 'firstName' || field === 'lastName'
      ? formatPersonName(value)
      : value;
    setProfile((prev) => ({ ...prev, [field]: nextValue }));
  };

  const updateProfileLocation = (value, details) => {
    setProfile((prev) => ({
      ...prev,
      location: value,
      locationCity: details?.city || '',
      locationState: details?.state || '',
      locationCountryCode: details?.countryCode || '',
      locationLatitude: details?.latitude ?? null,
      locationLongitude: details?.longitude ?? null,
    }));
  };

  const toggleNotificationPreference = async (field) => {
    const enablingBrowserNotification = field.startsWith('push') && !notifications[field];

    if (enablingBrowserNotification) {
      if (!('Notification' in window)) {
        toast.error('Este navegador não oferece notificações do sistema.');
        return;
      }

      const permission = window.Notification.permission === 'default'
        ? await window.Notification.requestPermission()
        : window.Notification.permission;

      if (permission !== 'granted') {
        toast.error('Permita notificações nas configurações do navegador para ativar este canal.');
        return;
      }
    }

    toggleField('notifications', field);
  };

  const resetProfileFields = (fields) => {
    setProfile((prev) => {
      const next = { ...prev };
      fields.forEach((field) => { next[field] = serverProfile[field]; });
      return next;
    });
    if (fields.includes('location')) setLocationValid(true);
  };

  const handleAvatarFile = async (file) => {
    if (!file || isUploadingAvatar) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida.'); return; }

    setIsUploadingAvatar(true);
    try {
      const { url } = await uploadImageToCloudinary(file);
      const updated = await apiUpdateProfile({ avatarUrl: url });
      setUser(updated);
      toast.success('Foto de perfil atualizada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (isUploadingAvatar || !profile.avatarUrl) return;
    setIsUploadingAvatar(true);
    try {
      const updated = await apiUpdateProfile({ avatarUrl: '' });
      setUser(updated);
      setShowRemoveAvatarConfirm(false);
      toast.success('Foto removida com sucesso.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const saveProfile = async (fields) => {
    if (isSavingProfile) return;
    if (fields.includes('location') && !locationValid) {
      toast.error('Selecione uma cidade válida nas sugestões antes de salvar.');
      return;
    }
    const payload = fields.reduce((acc, field) => {
      if (field === 'email') return acc;
      const value = profile[field];
      acc[field] = typeof value === 'string' ? value.trim() : value;
      return acc;
    }, {});

    setIsSavingProfile(true);
    try {
      const updated = await apiUpdateProfile(payload);
      setUser(updated);
      toast.success('Alterações salvas com sucesso.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const heroStats = [
    { label: 'Perfil público', value: `${profileCompletion}%`, helper: profileCompletion >= 80 ? 'Excelente' : 'Complete mais itens', icon: <FaUserCheck />, tone: 'blue' },
    { label: 'Tema ativo', value: THEME_LABEL[appearance.theme] || 'Claro', helper: `Espaçamento ${DENSITY_LABEL[appearance.density] || 'Confortável'}`, icon: <FaPalette />, tone: 'purple' },
    { label: 'Privacidade', value: privacy.profilePublic ? 'Público' : 'Privado', helper: privacy.allowDm === 'everyone' ? 'DM aberto' : 'Filtro ativo', icon: <FaShieldHalved />, tone: 'green' },
    { label: 'Alertas', value: `${inAppEnabledCount + pushEnabledCount} ativos`, helper: 'Histórico sempre disponível', icon: <FaBell />, tone: 'orange' },
  ];

  const checklist = [
    { label: 'Foto de perfil', done: Boolean(profile.avatarUrl) },
    { label: 'Headline estratégica', done: Boolean(profile.headline) },
    { label: 'Biografia', done: Boolean((profile.bio || '').trim()) },
    { label: 'Website ou Link', done: Boolean(profile.website) },
  ];

  return (
    <div className={styles.page}>
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.heroMain}>
          <span className={styles.heroEyebrow}>Configurações da Conta</span>
          <h1 className={styles.heroTitle}>Ajuste sua experiência na plataforma.</h1>
          <p className={styles.heroText}>
            Gerencie sua vitrine pública, controle as notificações que recebe, escolha a aparência da interface e mantenha seus dados financeiros seguros.
          </p>

          <div className={styles.heroActions}>
            {publicProfileHref ? (
              <Link to={publicProfileHref} className={styles.primaryAction}>Ver Perfil Público <FaArrowUpRightFromSquare /></Link>
            ) : (
              <button type="button" className={styles.primaryAction} onClick={openProfilePanel}>Completar Perfil</button>
            )}
            <Link to="/profile/customize" className={styles.secondaryAction}>Editor de Portfólio</Link>
          </div>
        </div>

        <aside className={styles.heroSide}>
          <div className={styles.identityCard}>
            <div className={styles.identityHeader}>
              <div className={styles.avatar}>
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className={styles.avatarImg} /> : initials}
              </div>
              <div className={styles.identityInfo}>
                <strong>{fullName}</strong>
                <span>{profile.username ? `@${profile.username}` : profile.email}</span>
                <div className={styles.identityMeta}>
                  <span className={styles.roleBadge}>{isFreelancer ? 'Freelancer' : 'Cliente'}</span>
                  <span>Desde {formatDate(user?.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className={styles.completionBlock}>
              <div className={styles.completionHead}>
                <span>Progresso do Perfil</span>
                <strong>{profileCompletion}%</strong>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${clamp(profileCompletion, 6, 100)}%` }} />
              </div>
              <div className={styles.checklist}>
                {checklist.map((item) => (
                  <div key={item.label} className={`${styles.checklistItem} ${item.done ? styles.checklistDone : ''}`}>
                    <span className={styles.checkIndicator}>{item.done ? '✓' : ''}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <input
              ref={avatarInputRef} type="file" accept="image/*" className={styles.hiddenInput}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarFile(file); e.target.value = ''; }}
            />

            <div className={styles.identityActions}>
              <button type="button" className={styles.identityButton} onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar}>
                {isUploadingAvatar ? 'Enviando...' : profile.avatarUrl ? 'Alterar Foto' : 'Adicionar Foto'}
              </button>
              {profile.avatarUrl && (
                <button type="button" className={styles.identityGhost} onClick={() => setShowRemoveAvatarConfirm(true)} disabled={isUploadingAvatar}>Remover</button>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* Mini Stats */}
      <section className={styles.statGrid}>
        {heroStats.map((item) => (
          <SpotlightCard key={item.label} className={`${styles.statCard} ${styles[item.tone]}`}>
            <div className={styles.statIcon}>{item.icon}</div>
            <div className={styles.statData}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.helper}</p>
            </div>
          </SpotlightCard>
        ))}
      </section>

      {/* Main Workspace Layout */}
      <div className={styles.workspace}>
        
        {/* Sidebar Nav */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarEyebrow}>Menu</span>
            <h2>Navegação</h2>
          </div>

          <nav className={styles.tabNav}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ''} ${tab.id === 'danger' ? styles.tabDanger : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabIcon}>{renderTabIcon(tab.icon)}</span>
                <span className={styles.tabCopy}>
                  <strong>{tab.label}</strong>
                  <small>{tab.description}</small>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main ref={profilePanelRef} className={styles.main}>
          <section className={styles.panelHero}>
            <div>
              <span className={styles.panelEyebrow}>{activeTabData.label}</span>
              <h2>{activeTabData.description}</h2>
            </div>
            <div className={styles.panelBadge}>Em edição</div>
          </section>

          {activeTab === 'profile' && (
            <ProfilePanel profile={profile} updateProfile={updateProfileField} updateLocation={updateProfileLocation} onLocationValidityChange={setLocationValid} locationValid={locationValid} isFreelancer={isFreelancer} isSaving={isSavingProfile} dirty={profileDirty} profileCompletion={profileCompletion} onSave={() => saveProfile(PROFILE_FIELDS)} onCancel={() => resetProfileFields(PROFILE_FIELDS)} />
          )}

          {activeTab === 'account' && (
            <AccountPanel profile={profile} updateProfile={updateProfileField} userRole={userRole} isSaving={isSavingProfile} dirty={accountDirty} onSave={() => saveProfile(ACCOUNT_FIELDS)} onCancel={() => resetProfileFields(ACCOUNT_FIELDS)} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPanel notifications={notifications} toggleNotification={toggleNotificationPreference} />
          )}

          {activeTab === 'appearance' && (
            <AppearancePanel appearance={appearance} setAppearance={(updater) => updateSection('appearance', typeof updater === 'function' ? updater(appearance) : updater)} />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPanel privacy={privacy} togglePrivacy={(field) => toggleField('privacy', field)} setPrivacy={(updater) => updateSection('privacy', typeof updater === 'function' ? updater(privacy) : updater)} />
          )}

          {activeTab === 'billing' && <BillingPanel isFreelancer={isFreelancer} />}

          {activeTab === 'language' && (
            <LanguagePanel language={language} setLanguage={(updater) => updateSection('language', typeof updater === 'function' ? updater(language) : updater)} />
          )}

          {activeTab === 'danger' && <DangerPanel />}
        </main>
      </div>

      <ConfirmDialog
        isOpen={showRemoveAvatarConfirm}
        title="Remover foto?"
        description="Sua foto atual será removida permanentemente. O avatar voltará a mostrar suas iniciais."
        confirmLabel="Sim, remover"
        isLoading={isUploadingAvatar}
        onCancel={() => setShowRemoveAvatarConfirm(false)}
        onConfirm={handleAvatarRemove}
      />
      <Toaster position="top-center" richColors />
    </div>
  );
}

// ================= Components Internos (Panels) =================

function renderTabIcon(icon) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (icon) {
    case 'user': return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'shield': return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case 'bell': return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'palette': return <svg {...props}><path d="M12 22a10 10 0 1 1 10-10c0 2.2-1.8 4-4 4h-1.3a1.7 1.7 0 0 0-1.7 1.7c0 .46.18.9.5 1.22A2 2 0 0 1 14 22z" /></svg>;
    case 'lock': return <svg {...props}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V8a5 5 0 0 1 10 0v3" /></svg>;
    case 'card': return <svg {...props}><rect x="2" y="5" width="20" height="14" rx="3" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
    case 'globe': return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
    case 'alert': return <svg {...props}><path d="M10.29 3.86 1.82 18A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    default: return null;
  }
}

export default Settings;

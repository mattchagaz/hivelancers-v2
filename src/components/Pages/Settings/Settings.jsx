import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { FaBell, FaPalette, FaShieldHalved, FaUserCheck, FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { updateProfile as apiUpdateProfile, updateUserType } from '../../../services/users';
import {
  createMyStripeConnectDashboardLink,
  createMyStripeConnectOnboardingLink,
  getMyStripeConnectStatus,
} from '../../../services/payments';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
import CityAutocomplete from '../../CityAutocomplete/CityAutocomplete';
import { toRoleSlug, toUserType } from '../../../utils/authFlow';
import { formatPhoneBR } from '../../../utils/formatters';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import ConfirmDialog from '../../UI/ConfirmDialog/ConfirmDialog';
import styles from './Settings.module.css';

const PROFILE_FIELDS = ['firstName', 'lastName', 'username', 'headline', 'location', 'bio', 'website'];
const ACCOUNT_FIELDS = ['phone'];

const THEME_LABEL = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
};

const DENSITY_LABEL = {
  compact: 'Compacta',
  comfortable: 'Confortável',
  spacious: 'Espaçosa',
};

const DIGEST_LABEL = {
  realtime: 'Tempo real',
  daily: 'Diário',
  weekly: 'Semanal',
  never: 'Desativado',
};

const STRIPE_REQUIREMENT_LABELS = {
  external_account: 'Conta bancária para repasse',
  'business_profile.url': 'Site, perfil público ou rede social',
  'business_profile.product_description': 'Descrição dos serviços',
  'individual.id_number': 'CPF',
  'individual.dob.day': 'Data de nascimento',
  'individual.dob.month': 'Data de nascimento',
  'individual.dob.year': 'Data de nascimento',
  'individual.address.line1': 'Endereço',
  'individual.address.city': 'Cidade',
  'individual.address.state': 'Estado',
  'individual.address.postal_code': 'CEP',
  'individual.verification.document': 'Documento de identidade',
  'individual.verification.additional_document': 'Documento complementar',
};

const formatStripeRequirement = (item) =>
  STRIPE_REQUIREMENT_LABELS[item] ||
  item
    .split('.')
    .filter(Boolean)
    .map((part) => part.replace(/_/g, ' '))
    .join(' · ');

const profileFromUser = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  email: user?.email || '',
  phone: formatPhoneBR(user?.phone || ''),
  username: user?.username || '',
  headline: user?.headline || '',
  bio: user?.bio || '',
  location: user?.location || '',
  website: user?.website || '',
  avatarUrl: user?.avatarUrl || '',
});

const formatDate = (value) => {
  if (!value) return 'Recentemente';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return 'Recentemente';
  }
};

const getInitials = (firstName, lastName, fallback = 'U') => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  if (!fullName) return fallback;
  return fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function Settings() {
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();
  const { settings, toggleField, updateSection, resetSettings } = useSettings();

  const userRole = toRoleSlug(user?.userType) || 'freelancer';
  const isFreelancer = userRole === 'freelancer';

  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showRemoveAvatarConfirm, setShowRemoveAvatarConfirm] = useState(false);
  const avatarInputRef = useRef(null);

  const serverProfile = useMemo(() => profileFromUser(user), [user]);
  const { notifications, appearance, privacy, language } = settings;

  useEffect(() => {
    setProfile(serverProfile);
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

  const emailEnabledCount = [
    notifications.orderUpdates,
    notifications.messages,
    notifications.reviews,
    notifications.marketing,
    notifications.newsletter,
  ].filter(Boolean).length;

  const pushEnabledCount = [
    notifications.pushMessages,
    notifications.pushOrders,
    notifications.pushPromos,
  ].filter(Boolean).length;

  const publicProfileHref = profile.username ? `/profile/${profile.username}` : null;

  const tabs = useMemo(
    () => [
      { id: 'profile', label: 'Perfil Público', icon: 'user', description: 'Apresentação e vitrine' },
      { id: 'account', label: 'Conta e Acesso', icon: 'shield', description: 'Login, telefone e segurança' },
      { id: 'notifications', label: 'Notificações', icon: 'bell', description: 'Preferências de alertas' },
      { id: 'appearance', label: 'Aparência', icon: 'palette', description: 'Tema, densidade e UI' },
      { id: 'privacy', label: 'Privacidade', icon: 'lock', description: 'Visibilidade e mensagens' },
      { id: 'billing', label: 'Pagamentos', icon: 'card', description: isFreelancer ? 'Recebimentos e repasses' : 'Cartões e histórico' },
      { id: 'language', label: 'Localização', icon: 'globe', description: 'Idioma, fuso e moeda' },
      { id: 'danger', label: 'Ações Críticas', icon: 'alert', description: 'Exclusão e dados' },
    ],
    [isFreelancer]
  );

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams, tabs]);

  useEffect(() => {
    const stripeFlow = searchParams.get('stripe');
    if (!stripeFlow) return;

    setActiveTab('billing');

    if (stripeFlow === 'return') {
      toast.success('Voltamos da Stripe. Atualizando o status da sua conta.');
      return;
    }

    if (stripeFlow === 'refresh') {
      toast.info('O link da Stripe expirou. Gere um novo para continuar a conexão.');
    }
  }, [searchParams]);

  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const resetProfileFields = (fields) => {
    setProfile((prev) => {
      const next = { ...prev };
      fields.forEach((field) => { next[field] = serverProfile[field]; });
      return next;
    });
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

  const restorePreferences = () => {
    resetSettings();
    toast.success('Preferências restauradas para o padrão.');
  };

  const heroStats = [
    { label: 'Perfil público', value: `${profileCompletion}%`, helper: profileCompletion >= 80 ? 'Excelente' : 'Complete mais itens', icon: <FaUserCheck />, tone: 'blue' },
    { label: 'Tema ativo', value: THEME_LABEL[appearance.theme] || 'Claro', helper: `Densidade ${DENSITY_LABEL[appearance.density] || 'Confortável'}`, icon: <FaPalette />, tone: 'purple' },
    { label: 'Privacidade', value: privacy.profilePublic ? 'Público' : 'Privado', helper: privacy.allowDm === 'everyone' ? 'DM aberto' : 'Filtro ativo', icon: <FaShieldHalved />, tone: 'green' },
    { label: 'Alertas', value: `${emailEnabledCount + pushEnabledCount} ativos`, helper: `Resumo ${DIGEST_LABEL[notifications.emailDigest] || 'Diário'}`, icon: <FaBell />, tone: 'orange' },
  ];

  const checklist = [
    { label: 'Foto de perfil', done: Boolean(profile.avatarUrl) },
    { label: 'Headline estratégica', done: Boolean(profile.headline) },
    { label: 'Biografia', done: (profile.bio || '').length >= 80 },
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
              <button type="button" className={styles.primaryAction} onClick={() => setActiveTab('profile')}>Completar Perfil</button>
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
        <main className={styles.main}>
          <section className={styles.panelHero}>
            <div>
              <span className={styles.panelEyebrow}>{activeTabData.label}</span>
              <h2>{activeTabData.description}</h2>
            </div>
            <div className={styles.panelBadge}>Em edição</div>
          </section>

          {activeTab === 'profile' && (
            <ProfilePanel profile={profile} updateProfile={updateProfileField} isFreelancer={isFreelancer} isSaving={isSavingProfile} dirty={profileDirty} profileCompletion={profileCompletion} onSave={() => saveProfile(PROFILE_FIELDS)} onCancel={() => resetProfileFields(PROFILE_FIELDS)} />
          )}

          {activeTab === 'account' && (
            <AccountPanel profile={profile} updateProfile={updateProfileField} userRole={userRole} isSaving={isSavingProfile} dirty={accountDirty} onSave={() => saveProfile(ACCOUNT_FIELDS)} onCancel={() => resetProfileFields(ACCOUNT_FIELDS)} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPanel notifications={notifications} toggleNotification={(field) => toggleField('notifications', field)} setNotifications={(updater) => updateSection('notifications', typeof updater === 'function' ? updater(notifications) : updater)} />
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

function SectionHeader({ title, subtitle, extra }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {extra && <div>{extra}</div>}
    </div>
  );
}

function Field({ label, hint, children, full = false }) {
  return (
    <label className={`${styles.field} ${full ? styles.fieldFull : ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </label>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`} onClick={onChange} aria-pressed={checked}>
      <span className={styles.toggleDot} />
    </button>
  );
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function FormActions({ primaryLabel = 'Salvar alterações', onSave, onCancel, isSaving = false, disabled = false }) {
  return (
    <div className={styles.formActions}>
      {onCancel && (
        <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={isSaving}>Cancelar</button>
      )}
      <button type="button" className={styles.btnPrimary} onClick={onSave} disabled={isSaving || disabled}>
        {isSaving ? 'Salvando...' : primaryLabel}
      </button>
    </div>
  );
}

function ProfilePanel({ profile, updateProfile, isFreelancer, isSaving, dirty, profileCompletion, onSave, onCancel }) {
  return (
    <section className={styles.card}>
      <SectionHeader title="Dados Públicos" subtitle="Essas informações moldam sua presença na plataforma." extra={<span className={styles.inlineBadge}>{profileCompletion}% Completo</span>} />

      <div className={styles.formGrid}>
        <Field label="Nome">
          <input type="text" className={styles.input} value={profile.firstName} onChange={(e) => updateProfile('firstName', e.target.value)} />
        </Field>
        <Field label="Sobrenome">
          <input type="text" className={styles.input} value={profile.lastName} onChange={(e) => updateProfile('lastName', e.target.value)} />
        </Field>
        <Field label="Nome de Usuário (URL)" hint="Use letras e números, sem espaços." full>
          <div className={styles.inputWithPrefix}>
            <span className={styles.inputPrefix}>hivelancers.com/</span>
            <input type="text" className={styles.input} value={profile.username} placeholder="seuusuario" onChange={(e) => updateProfile('username', e.target.value.toLowerCase())} />
          </div>
        </Field>
        <Field label={isFreelancer ? 'Especialidade Principal (Título)' : 'Cargo ou Empresa'}>
          <input type="text" className={styles.input} value={profile.headline} placeholder="Ex: UX/UI Designer Senior" onChange={(e) => updateProfile('headline', e.target.value)} />
        </Field>
        <Field label="Website ou Link Externo">
          <input type="url" className={styles.input} value={profile.website} placeholder="https://..." onChange={(e) => updateProfile('website', e.target.value)} />
        </Field>
        <Field label="Localização">
          <CityAutocomplete value={profile.location} onChange={(value) => updateProfile('location', value)} placeholder="Sua cidade" inputClassName={styles.input} />
        </Field>
        <Field label="Biografia / Resumo" hint={`${(profile.bio || '').length}/280 caracteres`} full>
          <textarea className={styles.textarea} value={profile.bio} maxLength={280} rows={4} placeholder="Um resumo atrativo sobre sua trajetória..." onChange={(e) => updateProfile('bio', e.target.value)} />
        </Field>
      </div>

      <FormActions onSave={onSave} onCancel={onCancel} isSaving={isSaving} disabled={!dirty} />
    </section>
  );
}

function AccountTypeCard({ userRole }) {
  const { setUser } = useAuth();
  const [selected, setSelected] = useState(userRole);
  const [isSaving, setIsSaving] = useState(false);
  const dirty = selected !== userRole;

  const save = async () => {
    if (!dirty || isSaving) return;
    setIsSaving(true);
    try {
      const updated = await updateUserType(toUserType(selected));
      setUser(updated);
      toast.success('Visão da conta atualizada!');
    } catch (err) {
      toast.error(err.message);
      setSelected(userRole);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.card}>
      <SectionHeader title="Visão da Conta" subtitle="Alterne sua experiência principal dentro da plataforma." />
      <div className={styles.optionGrid}>
        <button type="button" className={`${styles.optionCard} ${selected === 'freelancer' ? styles.optionCardActive : ''}`} onClick={() => setSelected('freelancer')}>
          <div className={styles.optionContent}>
            <strong>Como Freelancer </strong>
            <p>Foco em vender serviços, portfólio e receber pedidos.</p>
          </div>
        </button>
        <button type="button" className={`${styles.optionCard} ${selected === 'client' ? styles.optionCardActive : ''}`} onClick={() => setSelected('client')}>
          <div className={styles.optionContent}>
            <strong>Como Cliente</strong>
            <p>Foco em explorar, contratar talentos e gerenciar projetos.</p>
          </div>
        </button>
      </div>
      <FormActions primaryLabel="Aplicar Mudança" onSave={save} isSaving={isSaving} disabled={!dirty} />
    </section>
  );
}

function AccountPanel({ profile, updateProfile, userRole, isSaving, dirty, onSave, onCancel }) {
  return (
    <>
      <AccountTypeCard userRole={userRole} />
      <section className={styles.card}>
        <SectionHeader title="Credenciais" subtitle="Informações sensíveis usadas para login e segurança." />
        <div className={styles.formGrid}>
          <Field label="E-mail de Acesso" hint="Para alterar o e-mail, contate o suporte.">
            <input type="email" className={styles.input} value={profile.email} disabled />
          </Field>
          <Field label="Telefone de Contato">
            <input type="tel" className={styles.input} value={profile.phone} placeholder="(11) 99999-9999" maxLength={16} onChange={(e) => updateProfile('phone', formatPhoneBR(e.target.value))} />
          </Field>
        </div>
        <FormActions onSave={onSave} onCancel={onCancel} isSaving={isSaving} disabled={!dirty} />
      </section>
    </>
  );
}

function NotificationsPanel({ notifications, toggleNotification, setNotifications }) {
  return (
    <>
      <section className={styles.card}>
        <SectionHeader title="Alertas de Email" subtitle="O que chega na sua caixa de entrada." />
        <ToggleRow title="Atualizações de Projetos" description="Mudança de status, entregas e aprovações." checked={notifications.orderUpdates} onChange={() => toggleNotification('orderUpdates')} />
        <ToggleRow title="Novas Mensagens no Chat" description="Quando alguém te envia uma DM ou responde." checked={notifications.messages} onChange={() => toggleNotification('messages')} />
        <ToggleRow title="Dicas da Plataforma" description="Conteúdos para te ajudar a vender mais." checked={notifications.marketing} onChange={() => toggleNotification('marketing')} />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Notificações Push (Navegador)" subtitle="Avisos rápidos enquanto usa o PC." />
        <ToggleRow title="Mensagens e Chats" description="Não deixe o cliente esperando." checked={notifications.pushMessages} onChange={() => toggleNotification('pushMessages')} />
        <ToggleRow title="Pedidos e Entregas" description="Alertas imediatos sobre dinheiro e projetos." checked={notifications.pushOrders} onChange={() => toggleNotification('pushOrders')} />
      </section>
    </>
  );
}

function AppearancePanel({ appearance, setAppearance }) {
  return (
    <section className={styles.card}>
      <SectionHeader title="Tema Visual" subtitle="Escolha as cores da plataforma." />
      <div className={styles.themeGrid}>
        {[{id: 'light', lbl: 'Claro'}, {id: 'dark', lbl: 'Escuro'}, {id: 'system', lbl: 'Automático'}].map(t => (
          <button key={t.id} type="button" className={`${styles.themeCard} ${appearance.theme === t.id ? styles.themeActive : ''}`} onClick={() => setAppearance(prev => ({ ...prev, theme: t.id }))}>
            <div className={`${styles.themePreview} ${styles[`theme_${t.id}`]}`}>
              <div className={styles.themeSidebar} />
              <div className={styles.themeBody}><div className={styles.themeLine}/><div className={styles.themeLineShort}/></div>
            </div>
            <strong>{t.lbl}</strong>
          </button>
        ))}
      </div>

      <div className={styles.divider} />
      <SectionHeader title="Cor de Destaque" subtitle="Personalize botões e badges." />
      <div className={styles.accentRow}>
        {[{id:'blue',c:'#3b82f6'},{id:'green',c:'#10b981'},{id:'amber',c:'#f59e0b'},{id:'purple',c:'#8b5cf6'}].map(a => (
          <button key={a.id} type="button" className={`${styles.accentDot} ${appearance.accent === a.id ? styles.accentActive : ''}`} style={{ background: a.c }} onClick={() => setAppearance(p => ({ ...p, accent: a.id }))} />
        ))}
      </div>
    </section>
  );
}

function PrivacyPanel({ privacy, togglePrivacy }) {
  return (
    <section className={styles.card}>
      <SectionHeader title="Controle de Visibilidade" subtitle="Gerencie como os outros te enxergam." />
      <ToggleRow title="Perfil Totalmente Público" description="Permite ser encontrado nas buscas da Hivelancers." checked={privacy.profilePublic} onChange={() => togglePrivacy('profilePublic')} />
      <ToggleRow title="Exibir Status 'Online'" description="Mostra a bolinha verde quando você está ativo." checked={privacy.showOnline} onChange={() => togglePrivacy('showOnline')} />
      <ToggleRow title="Mostrar Ganhos Totais" description="Exibe quanto você já faturou (ótimo para prova social)." checked={privacy.showEarnings} onChange={() => togglePrivacy('showEarnings')} />
    </section>
  );
}

function BillingPanel({ isFreelancer }) {
  const [connectState, setConnectState] = useState({ configured: true, connected: false, account: null });
  const [isLoading, setIsLoading] = useState(isFreelancer);

  useEffect(() => {
    if (isFreelancer) {
      getMyStripeConnectStatus().then(setConnectState).catch(() => {}).finally(() => setIsLoading(false));
    }
  }, [isFreelancer]);

  return (
    <section className={styles.card}>
      <SectionHeader title="Módulo Financeiro (Stripe)" subtitle="Integração segura para processar repasses e pagamentos." />
      {isFreelancer ? (
        <div className={styles.listRow}>
          <div className={styles.listIcon}>{renderCardIcon()}</div>
          <div className={styles.listCopy}>
            <strong>Status do Recebedor</strong>
            <span>{isLoading ? 'Verificando...' : connectState.account ? 'Conta conectada e apta para receber Pix/Cartão.' : 'Complete o onboarding da Stripe para ativar seu perfil.'}</span>
          </div>
          <button className={styles.btnPrimary} onClick={async () => {
            const data = await createMyStripeConnectOnboardingLink();
            if (data?.url) window.location.assign(data.url);
          }}>{connectState.account ? 'Dashboard Stripe' : 'Conectar Conta'}</button>
        </div>
      ) : (
        <div className={styles.emptyContent}>Gerenciamento de cartões de clientes estará disponível em breve.</div>
      )}
    </section>
  );
}

function LanguagePanel({ language, setLanguage }) {
  return (
    <section className={styles.card}>
      <SectionHeader title="Região e Moeda" subtitle="Afeta formatos de data e exibição de preços." />
      <div className={styles.formGrid}>
        <Field label="País"><select className={styles.input} value={language.region} onChange={(e) => setLanguage(p => ({...p, region: e.target.value}))}><option value="BR">Brasil</option></select></Field>
        <Field label="Moeda Base"><select className={styles.input} value={language.currency} onChange={(e) => setLanguage(p => ({...p, currency: e.target.value}))}><option value="BRL">Real (R$)</option></select></Field>
      </div>
    </section>
  );
}

function DangerPanel() {
  return (
    <section className={`${styles.card} ${styles.dangerCard}`}>
      <SectionHeader title="Exclusão de Dados" subtitle="Ações irreversíveis." />
      <div className={styles.listRow}>
        <div className={styles.listCopy}>
          <strong>Excluir conta permanentemente</strong>
          <span>Apaga histórico, mensagens e dados financeiros.</span>
        </div>
        <button className={styles.rowActionDanger}>Solicitar Exclusão</button>
      </div>
    </section>
  );
}

function renderCardIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
}

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
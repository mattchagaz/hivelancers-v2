import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FaBell, FaPalette, FaShieldHalved, FaUserCheck } from 'react-icons/fa6';
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
      {
        id: 'profile',
        label: 'Perfil',
        icon: 'user',
        description: 'Dados públicos e apresentação',
      },
      {
        id: 'account',
        label: 'Conta',
        icon: 'shield',
        description: 'Login, telefone e segurança',
      },
      {
        id: 'notifications',
        label: 'Notificações',
        icon: 'bell',
        description: 'Email, push e resumos',
      },
      {
        id: 'appearance',
        label: 'Aparência',
        icon: 'palette',
        description: 'Tema, densidade e movimento',
      },
      {
        id: 'privacy',
        label: 'Privacidade',
        icon: 'lock',
        description: 'Visibilidade e mensagens',
      },
      {
        id: 'billing',
        label: 'Pagamentos',
        icon: 'card',
        description: isFreelancer ? 'Recebimentos e plano' : 'Cartoes e historico',
      },
      {
        id: 'language',
        label: 'Idioma e regiao',
        icon: 'globe',
        description: 'Idioma, fuso e moeda',
      },
      {
        id: 'danger',
        label: 'Zona de perigo',
        icon: 'alert',
        description: 'Acoes criticas da conta',
      },
    ],
    [
      isFreelancer,
    ]
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
      toast.message('O link da Stripe expirou. Gere um novo para continuar a conexão.');
    }
  }, [searchParams]);

  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const resetProfileFields = (fields) => {
    setProfile((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        next[field] = serverProfile[field];
      });
      return next;
    });
  };

  const handleAvatarFile = async (file) => {
    if (!file || isUploadingAvatar) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem valida.');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const { url } = await uploadImageToCloudinary(file);
      const updated = await apiUpdateProfile({ avatarUrl: url });
      setUser(updated);
      toast.success('Foto atualizada.');
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
      toast.success('Foto removida.');
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
      toast.success('Perfil atualizado.');
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
    {
      label: 'Perfil público',
      value: `${profileCompletion}%`,
      helper: profileCompletion >= 80 ? 'Quase la' : 'Vale completar mais campos',
      icon: <FaUserCheck />,
      tone: 'blue',
    },
    {
      label: 'Tema ativo',
      value: THEME_LABEL[appearance.theme] || 'Claro',
      helper: `${DENSITY_LABEL[appearance.density] || 'Confortável'} na interface`,
      icon: <FaPalette />,
      tone: 'purple',
    },
    {
      label: 'Privacidade',
      value: privacy.profilePublic ? 'Público' : 'Privado',
      helper: privacy.allowDm === 'everyone' ? 'DM aberto' : 'Mensagens filtradas',
      icon: <FaShieldHalved />,
      tone: 'green',
    },
    {
      label: 'Alertas',
      value: `${emailEnabledCount + pushEnabledCount} ativos`,
      helper: `${DIGEST_LABEL[notifications.emailDigest] || 'Diário'} por email`,
      icon: <FaBell />,
      tone: 'orange',
    },
  ];

  const checklist = [
    {
      label: 'Foto do perfil',
      done: Boolean(profile.avatarUrl),
    },
    {
      label: 'Headline estratégica',
      done: Boolean(profile.headline),
    },
    {
      label: 'Bio completa',
      done: (profile.bio || '').length >= 80,
    },
    {
      label: 'Link externo',
      done: Boolean(profile.website),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />

        <div className={styles.heroMain}>
          <span className={styles.heroEyebrow}>Personalizar experiência</span>
          <h1 className={styles.heroTitle}>Uma central completa para ajustar seu perfil, sua conta e a forma como a Hivelancers aparece para você.</h1>
          <p className={styles.heroText}>
            Aqui você organiza a vitrine pública, controla notificações, escolhe aparência, ajusta privacidade e deixa sua conta com cara de produto pronto.
          </p>

          <div className={styles.heroActions}>
            {publicProfileHref ? (
              <Link to={publicProfileHref} className={styles.primaryAction}>
                Ver perfil público
              </Link>
            ) : (
              <button type="button" className={styles.primaryAction} onClick={() => setActiveTab('profile')}>
                Completar perfil
              </button>
            )}

            <button type="button" className={styles.secondaryAction} onClick={restorePreferences}>
              Restaurar preferências
            </button>

            <Link to="/profile/customize" className={styles.secondaryAction}>
              Abrir editor completo
            </Link>
          </div>

        </div>

        <aside className={styles.heroSide}>
          <div className={styles.identityCard}>
            <div className={styles.identityHeader}>
              <div className={styles.avatar}>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className={styles.avatarImg} />
                ) : (
                  initials
                )}
              </div>

              <div className={styles.identityInfo}>
                <strong>{fullName}</strong>
                <span>{profile.username ? `@${profile.username}` : profile.email}</span>
                <div className={styles.identityMeta}>
                  <span className={styles.roleBadge}>{isFreelancer ? 'Freelancer' : 'Cliente'}</span>
                  <span>{formatDate(user?.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className={styles.completionBlock}>
              <div className={styles.completionHead}>
                <span>Força do perfil</span>
                <strong>{profileCompletion}%</strong>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${clamp(profileCompletion, 6, 100)}%` }}
                />
              </div>
              <div className={styles.checklist}>
                {checklist.map((item) => (
                  <div key={item.label} className={`${styles.checklistItem} ${item.done ? styles.checklistDone : ''}`}>
                    <span className={styles.checkIndicator}>{item.done ? '✓' : '•'}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleAvatarFile(file);
                event.target.value = '';
              }}
            />

            <div className={styles.identityActions}>
              <button
                type="button"
                className={styles.identityButton}
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? 'Enviando...' : profile.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
              </button>

              {profile.avatarUrl && (
                <button
                  type="button"
                  className={styles.identityGhost}
                  onClick={() => setShowRemoveAvatarConfirm(true)}
                  disabled={isUploadingAvatar}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.statGrid}>
        {heroStats.map((item) => (
          <SpotlightCard key={item.label} className={`${styles.statCard} ${styles[item.tone]}`}>
            <div className={styles.statIcon}>{item.icon}</div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </SpotlightCard>
        ))}
      </section>

      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarEyebrow}>Navegação</span>
            <h2>Ajustes da conta</h2>
            <p>Troque de seção sem sair da página.</p>
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

          <div className={styles.sidebarCard}>
            <span className={styles.sidebarCardTag}>Visibilidade</span>
            <strong>{privacy.profilePublic ? 'Perfil público' : 'Perfil privado'}</strong>
            <p>
              {privacy.profilePublic
                ? 'Sua vitrine está visível para outros usuários.'
                : 'Seu perfil está restrito fora dos fluxos principais.'}
            </p>
          </div>
        </aside>

        <main className={styles.main}>
          <section className={styles.panelHero}>
            <div>
              <span className={styles.panelEyebrow}>{activeTabData.label}</span>
              <h2>{activeTabData.description}</h2>
            </div>
            <div className={styles.panelBadge}>Em edição</div>
          </section>

          {activeTab === 'profile' && (
            <ProfilePanel
              profile={profile}
              updateProfile={updateProfileField}
              isFreelancer={isFreelancer}
              isSaving={isSavingProfile}
              dirty={profileDirty}
              profileCompletion={profileCompletion}
              onSave={() => saveProfile(PROFILE_FIELDS)}
              onCancel={() => resetProfileFields(PROFILE_FIELDS)}
            />
          )}

          {activeTab === 'account' && (
            <AccountPanel
              profile={profile}
              updateProfile={updateProfileField}
              userRole={userRole}
              isSaving={isSavingProfile}
              dirty={accountDirty}
              onSave={() => saveProfile(ACCOUNT_FIELDS)}
              onCancel={() => resetProfileFields(ACCOUNT_FIELDS)}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPanel
              notifications={notifications}
              toggleNotification={(field) => toggleField('notifications', field)}
              setNotifications={(updater) =>
                updateSection(
                  'notifications',
                  typeof updater === 'function' ? updater(notifications) : updater
                )
              }
            />
          )}

          {activeTab === 'appearance' && (
            <AppearancePanel
              appearance={appearance}
              setAppearance={(updater) =>
                updateSection(
                  'appearance',
                  typeof updater === 'function' ? updater(appearance) : updater
                )
              }
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyPanel
              privacy={privacy}
              togglePrivacy={(field) => toggleField('privacy', field)}
              setPrivacy={(updater) =>
                updateSection('privacy', typeof updater === 'function' ? updater(privacy) : updater)
              }
            />
          )}

          {activeTab === 'billing' && <BillingPanel isFreelancer={isFreelancer} />}

          {activeTab === 'language' && (
            <LanguagePanel
              language={language}
              setLanguage={(updater) =>
                updateSection('language', typeof updater === 'function' ? updater(language) : updater)
              }
            />
          )}

          {activeTab === 'danger' && <DangerPanel />}
        </main>
      </div>

      <ConfirmDialog
        isOpen={showRemoveAvatarConfirm}
        title="Remover foto de perfil?"
        description="Sua foto atual será removida do perfil público. Você poderá adicionar outra depois."
        confirmLabel="Remover foto"
        isLoading={isUploadingAvatar}
        onCancel={() => setShowRemoveAvatarConfirm(false)}
        onConfirm={handleAvatarRemove}
      />
    </div>
  );
}

function SectionHeader({ title, subtitle, extra }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {extra ? <div>{extra}</div> : null}
    </div>
  );
}

function Field({ label, hint, children, full = false }) {
  return (
    <label className={`${styles.field} ${full ? styles.fieldFull : ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={onChange}
      aria-pressed={checked}
    >
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

function FormActions({
  primaryLabel = 'Salvar alteracoes',
  onSave,
  onCancel,
  isSaving = false,
  disabled = false,
}) {
  return (
    <div className={styles.formActions}>
      {onCancel ? (
        <button
          type="button"
          className={styles.btnGhost}
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancelar
        </button>
      ) : null}

      <button
        type="button"
        className={styles.btnPrimary}
        onClick={onSave}
        disabled={isSaving || disabled}
      >
        {isSaving ? 'Salvando...' : primaryLabel}
      </button>
    </div>
  );
}

function ProfilePanel({
  profile,
  updateProfile,
  isFreelancer,
  isSaving,
  dirty,
  profileCompletion,
  onSave,
  onCancel,
}) {
  const recommendationCards = [
    {
      title: 'Clareza da proposta',
      text: isFreelancer
        ? 'Explique o que você entrega, para quem e por que sua abordagem é diferente.'
        : 'Use a headline para explicar sua empresa, setor ou contexto de compra.',
    },
    {
      title: 'Contexto visual',
      text: 'Uma boa foto e um username consistente deixam seu perfil mais memorável.',
    },
    {
      title: 'Conversão melhor',
      text: 'Bio com nicho, resultado e prova social tende a gerar conversas mais qualificadas.',
    },
  ];

  return (
    <>
      <section className={styles.card}>
        <SectionHeader
          title="Informações públicas"
          subtitle="Esses campos aparecem na sua vitrine e ajudam outras pessoas a entender rápido quem você é."
          extra={<span className={styles.inlineBadge}>{profileCompletion}% completo</span>}
        />

        <div className={styles.insightGrid}>
          {recommendationCards.map((card) => (
            <div key={card.title} className={styles.infoCard}>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
            </div>
          ))}
        </div>

        <div className={styles.formGrid}>
          <Field label="Nome">
            <input
              type="text"
              className={styles.input}
              value={profile.firstName}
              onChange={(event) => updateProfile('firstName', event.target.value)}
            />
          </Field>

          <Field label="Sobrenome">
            <input
              type="text"
              className={styles.input}
              value={profile.lastName}
              onChange={(event) => updateProfile('lastName', event.target.value)}
            />
          </Field>

          <Field
            label="Nome de usuário"
            hint="Aparece na URL do seu perfil. Use letras, números, ponto e underline."
            full
          >
            <div className={styles.inputWithPrefix}>
              <span className={styles.inputPrefix}>hivelancers.com/profile/</span>
              <input
                type="text"
                className={styles.input}
                value={profile.username}
                placeholder="seu_usuario"
                onChange={(event) => updateProfile('username', event.target.value.toLowerCase())}
              />
            </div>
          </Field>

          <Field label={isFreelancer ? 'Título profissional' : 'Empresa ou cargo'}>
            <input
              type="text"
              className={styles.input}
              value={profile.headline}
              placeholder={isFreelancer ? 'Ex: Designer de interfaces e branding' : 'Ex: Líder de produto na Acme'}
              onChange={(event) => updateProfile('headline', event.target.value)}
            />
          </Field>

          <Field label="Website">
            <input
              type="url"
              className={styles.input}
              value={profile.website}
              placeholder="https://seusite.com"
              onChange={(event) => updateProfile('website', event.target.value)}
            />
          </Field>

          <Field label="Localização" hint="Comece digitando e selecione a cidade correta.">
            <CityAutocomplete
              value={profile.location}
              onChange={(value) => updateProfile('location', value)}
              placeholder="Ex: Porto Alegre, RS"
              inputClassName={styles.input}
            />
          </Field>

          <Field label="Bio" hint={`${(profile.bio || '').length}/280 caracteres`} full>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={profile.bio}
              maxLength={280}
              rows={5}
              placeholder={
                isFreelancer
                  ? 'Conte sua especialidade, os tipos de projeto em que você se destaca e o que seu cliente pode esperar.'
                  : 'Descreva sua empresa, time ou contexto para facilitar conexões mais alinhadas.'
              }
              onChange={(event) => updateProfile('bio', event.target.value)}
            />
          </Field>
        </div>

        <FormActions onSave={onSave} onCancel={onCancel} isSaving={isSaving} disabled={!dirty} />
      </section>

      <section className={styles.card}>
        <SectionHeader
          title="Checklist de qualidade"
          subtitle="Pequenos ajustes que deixam seu perfil mais forte e passam mais confiança."
          extra={(
            <Link to="/profile/customize" className={styles.inlineAction}>
              Editor completo
            </Link>
          )}
        />

        <div className={styles.miniChecklistGrid}>
          {[
            {
              title: 'Imagem de perfil',
              status: profile.avatarUrl ? 'Pronto' : 'Pendente',
              positive: Boolean(profile.avatarUrl),
            },
            {
              title: 'Headline',
              status: profile.headline ? 'Pronto' : 'Pendente',
              positive: Boolean(profile.headline),
            },
            {
              title: 'Bio acima de 80 caracteres',
              status: (profile.bio || '').length >= 80 ? 'Pronto' : 'Ajustar',
              positive: (profile.bio || '').length >= 80,
            },
            {
              title: 'URL publica',
              status: profile.username ? 'Pronto' : 'Defina um username',
              positive: Boolean(profile.username),
            },
          ].map((item) => (
            <div key={item.title} className={styles.checkCard}>
              <span className={`${styles.statusDot} ${item.positive ? styles.statusPositive : styles.statusNeutral}`} />
              <strong>{item.title}</strong>
              <p>{item.status}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function AccountTypeCard({ userRole }) {
  const { setUser } = useAuth();
  const [selected, setSelected] = useState(userRole);
  const [isSaving, setIsSaving] = useState(false);
  const dirty = selected !== userRole;

  const options = [
    {
      id: 'freelancer',
      title: 'Freelancer',
      text: 'Publica servicos, recebe pedidos e construi reputacao.',
    },
    {
      id: 'client',
      title: 'Cliente',
      text: 'Explora servicos, contrata profissionais e acompanha entregas.',
    },
  ];

  const save = async () => {
    if (!dirty || isSaving) return;

    setIsSaving(true);

    try {
      const updated = await updateUserType(toUserType(selected));
      setUser(updated);
      toast.success('Tipo de conta atualizado.');
    } catch (err) {
      toast.error(err.message);
      setSelected(userRole);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.card}>
      <SectionHeader
        title="Tipo de conta"
        subtitle="Troque sua perspectiva principal na plataforma sem sair do painel."
      />

      <div className={styles.optionGrid}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`${styles.optionCard} ${selected === option.id ? styles.optionCardActive : ''}`}
            onClick={() => setSelected(option.id)}
          >
            <div>
              <strong>{option.title}</strong>
              <p>{option.text}</p>
            </div>
            <span className={styles.optionIndicator}>{selected === option.id ? 'Selecionado' : 'Selecionar'}</span>
          </button>
        ))}
      </div>

      <FormActions
        primaryLabel="Salvar tipo de conta"
        onSave={save}
        isSaving={isSaving}
        disabled={!dirty}
      />
    </section>
  );
}

function AccountPanel({ profile, updateProfile, userRole, isSaving, dirty, onSave, onCancel }) {
  const [passwordDraft, setPasswordDraft] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [security, setSecurity] = useState({
    authApp: false,
    sms: true,
    alertLogin: true,
  });

  return (
    <>
      <AccountTypeCard userRole={userRole} />

      <section className={styles.card}>
        <SectionHeader
          title="Contato principal"
          subtitle="Informações básicas usadas para acesso, recuperação e avisos importantes."
        />

        <div className={styles.formGrid}>
          <Field label="Email principal" hint="A alteração de email ainda é feita com suporte.">
            <input type="email" className={styles.input} value={profile.email} readOnly disabled />
          </Field>

          <Field label="Telefone">
            <input
              type="tel"
              className={styles.input}
              value={profile.phone}
              placeholder="(11) 99999-9999"
              maxLength={16}
              onChange={(event) => updateProfile('phone', formatPhoneBR(event.target.value))}
            />
          </Field>
        </div>

        <FormActions onSave={onSave} onCancel={onCancel} isSaving={isSaving} disabled={!dirty} />
      </section>

      <section className={styles.card}>
        <SectionHeader
          title="Seguranca da conta"
          subtitle="Deixe seu acesso mais protegido com verificacoes extras e senha forte."
        />

        <div className={styles.formGrid}>
          <Field label="Senha atual">
            <input
              type="password"
              className={styles.input}
              value={passwordDraft.current}
              placeholder="••••••••"
              onChange={(event) => setPasswordDraft((prev) => ({ ...prev, current: event.target.value }))}
            />
          </Field>

          <Field label="Nova senha">
            <input
              type="password"
              className={styles.input}
              value={passwordDraft.next}
              placeholder="••••••••"
              onChange={(event) => setPasswordDraft((prev) => ({ ...prev, next: event.target.value }))}
            />
          </Field>

          <Field label="Confirmar nova senha">
            <input
              type="password"
              className={styles.input}
              value={passwordDraft.confirm}
              placeholder="••••••••"
              onChange={(event) => setPasswordDraft((prev) => ({ ...prev, confirm: event.target.value }))}
            />
          </Field>
        </div>

        <div className={styles.divider} />

        <ToggleRow
          title="App autenticador"
          description="Use Google Authenticator, 1Password ou Authy para gerar codigos."
          checked={security.authApp}
          onChange={() => setSecurity((prev) => ({ ...prev, authApp: !prev.authApp }))}
        />
        <ToggleRow
          title="Verificacao por SMS"
          description="Receba um codigo extra no celular cadastrado quando houver risco."
          checked={security.sms}
          onChange={() => setSecurity((prev) => ({ ...prev, sms: !prev.sms }))}
        />
        <ToggleRow
          title="Alertas de novo login"
          description="Avisamos por email quando sua conta entrar em um dispositivo novo."
          checked={security.alertLogin}
          onChange={() => setSecurity((prev) => ({ ...prev, alertLogin: !prev.alertLogin }))}
        />

        <FormActions
          primaryLabel="Atualizar segurança"
          onSave={() => toast.message('Fluxo de senha em breve conectado ao backend.')}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader
          title="Sessoes ativas"
          subtitle="Dispositivos e locais que estao com acesso a sua conta agora."
        />

        <div className={styles.listStack}>
          {[
            { device: 'MacBook Pro · Safari', location: 'Sao Paulo, BR', time: 'Agora · dispositivo atual', current: true },
            { device: 'iPhone 15 · App Hivelancers', location: 'Sao Paulo, BR', time: 'Ha 2 horas', current: false },
            { device: 'Chrome · Windows', location: 'Rio de Janeiro, BR', time: 'Ha 3 dias', current: false },
          ].map((session) => (
            <div key={session.device} className={styles.listRow}>
              <div className={styles.listIcon}>{renderDeviceIcon()}</div>
              <div className={styles.listCopy}>
                <strong>{session.device}</strong>
                <span>{session.location} · {session.time}</span>
              </div>

              {session.current ? (
                <span className={styles.inlineBadge}>Atual</span>
              ) : (
                <button type="button" className={styles.rowAction}>
                  Encerrar
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NotificationsPanel({ notifications, toggleNotification, setNotifications }) {
  const [quietHours, setQuietHours] = useState({
    enabled: true,
    start: '22:00',
    end: '08:00',
  });

  return (
    <>
      <section className={styles.card}>
        <SectionHeader
          title="Panorama de alertas"
          subtitle="Combine email, push e resumos para continuar informado sem excesso."
        />

        <div className={styles.insightGrid}>
          <div className={styles.infoCard}>
            <strong>Email</strong>
            <p>
              {[
                notifications.orderUpdates,
                notifications.messages,
                notifications.reviews,
                notifications.marketing,
                notifications.newsletter,
              ].filter(Boolean).length} canais ativos
            </p>
          </div>
          <div className={styles.infoCard}>
            <strong>Push</strong>
            <p>
              {[
                notifications.pushMessages,
                notifications.pushOrders,
                notifications.pushPromos,
              ].filter(Boolean).length} categorias ligadas
            </p>
          </div>
          <div className={styles.infoCard}>
            <strong>Resumo</strong>
            <p>{DIGEST_LABEL[notifications.emailDigest] || 'Diário'}</p>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Notificações por email" subtitle="Escolha quais acontecimentos merecem um email." />

        <ToggleRow
          title="Atualizações de pedidos"
          description="Status, mensagens, aprovações e entregas dos seus pedidos."
          checked={notifications.orderUpdates}
          onChange={() => toggleNotification('orderUpdates')}
        />
        <ToggleRow
          title="Novas mensagens"
          description="Avisos quando alguém iniciar ou responder uma conversa."
          checked={notifications.messages}
          onChange={() => toggleNotification('messages')}
        />
        <ToggleRow
          title="Avaliações e feedback"
          description="Receba um lembrete sempre que uma nova avaliação chegar."
          checked={notifications.reviews}
          onChange={() => toggleNotification('reviews')}
        />
        <ToggleRow
          title="Dicas e promoções"
          description="Novidades da plataforma, recursos e oportunidades comerciais."
          checked={notifications.marketing}
          onChange={() => toggleNotification('marketing')}
        />
        <ToggleRow
          title="Newsletter semanal"
          description="Resumo editorial com tendências, destaques e boas práticas."
          checked={notifications.newsletter}
          onChange={() => toggleNotification('newsletter')}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Notificações push" subtitle="Alertas de alta prioridade no navegador e no app mobile." />

        <ToggleRow
          title="Mensagens"
          description="Ideal para não deixar conversas esfriarem."
          checked={notifications.pushMessages}
          onChange={() => toggleNotification('pushMessages')}
        />
        <ToggleRow
          title="Pedidos"
          description="Aprovações, novos pedidos, entregas e alterações importantes."
          checked={notifications.pushOrders}
          onChange={() => toggleNotification('pushOrders')}
        />
        <ToggleRow
          title="Promoções e missões"
          description="Campanhas, recompensas e incentivos de crescimento."
          checked={notifications.pushPromos}
          onChange={() => toggleNotification('pushPromos')}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Frequência dos resumos" subtitle="Defina o ritmo ideal de consolidação por email." />

        <div className={styles.optionGrid}>
          {[
            { id: 'realtime', label: 'Tempo real', desc: 'Cada evento relevante chega individualmente.' },
            { id: 'daily', label: 'Diário', desc: 'Um resumo objetivo no fim do dia.' },
            { id: 'weekly', label: 'Semanal', desc: 'Apenas uma curadoria por semana.' },
            { id: 'never', label: 'Nunca', desc: 'Sem consolidações por email.' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.optionCard} ${notifications.emailDigest === option.id ? styles.optionCardActive : ''}`}
              onClick={() => setNotifications((prev) => ({ ...prev, emailDigest: option.id }))}
            >
              <div>
                <strong>{option.label}</strong>
                <p>{option.desc}</p>
              </div>
              <span className={styles.optionIndicator}>
                {notifications.emailDigest === option.id ? 'Ativo' : 'Selecionar'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Horário silencioso" subtitle="Segure notificações fora do seu horário preferido." />

        <ToggleRow
          title="Ativar horário silencioso"
          description="Mensagens não críticas ficam pausadas durante a janela abaixo."
          checked={quietHours.enabled}
          onChange={() => setQuietHours((prev) => ({ ...prev, enabled: !prev.enabled }))}
        />

        <div className={styles.formGrid}>
          <Field label="Inicio">
            <input
              type="time"
              className={styles.input}
              value={quietHours.start}
              onChange={(event) => setQuietHours((prev) => ({ ...prev, start: event.target.value }))}
            />
          </Field>

          <Field label="Fim">
            <input
              type="time"
              className={styles.input}
              value={quietHours.end}
              onChange={(event) => setQuietHours((prev) => ({ ...prev, end: event.target.value }))}
            />
          </Field>
        </div>
      </section>
    </>
  );
}

function AppearancePanel({ appearance, setAppearance }) {
  const themes = [
    { id: 'light', label: 'Claro', desc: 'Mais limpo e iluminado.' },
    { id: 'dark', label: 'Escuro', desc: 'Contraste suave para noite.' },
    { id: 'system', label: 'Sistema', desc: 'Segue seu dispositivo automaticamente.' },
  ];

  const accents = [
    { id: 'blue', label: 'Azul', color: '#3e73e6' },
    { id: 'green', label: 'Verde', color: '#059669' },
    { id: 'amber', label: 'Amber', color: '#d97706' },
    { id: 'pink', label: 'Rosa', color: '#db2777' },
    { id: 'teal', label: 'Teal', color: '#0d9488' },
    { id: 'purple', label: 'Lavanda', color: '#7c3aed' },
  ];

  return (
    <>
      <section className={styles.card}>
        <SectionHeader title="Tema" subtitle="Escolha o clima visual principal da aplicação." />

        <div className={styles.themeGrid}>
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`${styles.themeCard} ${appearance.theme === theme.id ? styles.themeActive : ''}`}
              onClick={() => setAppearance((prev) => ({ ...prev, theme: theme.id }))}
            >
              <div className={`${styles.themePreview} ${styles[`theme_${theme.id}`]}`}>
                <div className={styles.themeSidebar} />
                <div className={styles.themeBody}>
                  <div className={styles.themeLine} />
                  <div className={styles.themeLineShort} />
                  <div className={styles.themeChip} />
                </div>
              </div>
              <strong>{theme.label}</strong>
              <span>{theme.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Cor de destaque" subtitle="Afeta botões, links, estados ativos e superfícies em destaque." />

        <div className={styles.accentRow}>
          {accents.map((accent) => (
            <button
              key={accent.id}
              type="button"
              className={`${styles.accentDot} ${appearance.accent === accent.id ? styles.accentActive : ''}`}
              style={{ background: accent.color }}
              onClick={() => setAppearance((prev) => ({ ...prev, accent: accent.id }))}
              aria-label={accent.label}
            >
              {appearance.accent === accent.id ? '✓' : ''}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Densidade da interface" subtitle="Mais conteúdo visível ou mais respiro visual entre os blocos." />

        <div className={styles.optionGrid}>
          {[
            { id: 'compact', label: 'Compacta', desc: 'Mais elementos por tela.' },
            { id: 'comfortable', label: 'Confortável', desc: 'Equilíbrio entre foco e leitura.' },
            { id: 'spacious', label: 'Espaçosa', desc: 'Mais ar e mais separação visual.' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.optionCard} ${appearance.density === option.id ? styles.optionCardActive : ''}`}
              onClick={() => setAppearance((prev) => ({ ...prev, density: option.id }))}
            >
              <div>
                <strong>{option.label}</strong>
                <p>{option.desc}</p>
              </div>
              <span className={styles.optionIndicator}>
                {appearance.density === option.id ? 'Ativo' : 'Selecionar'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Acessibilidade" subtitle="Ajustes visuais para deixar a navegacao mais confortavel." />

        <ToggleRow
          title="Reduzir animacoes"
          description="Desativa transicoes mais intensas e suaviza movimento no app."
          checked={appearance.reducedMotion}
          onChange={() => setAppearance((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }))}
        />

        <div className={styles.previewSurface}>
          <div className={styles.previewTop}>
            <span className={styles.previewPill}>Preview</span>
            <span className={styles.previewMuted}>{THEME_LABEL[appearance.theme]} · {DENSITY_LABEL[appearance.density]}</span>
          </div>

          <div className={styles.previewBoard}>
            <aside className={styles.previewSidebar}>
              <div className={styles.previewDot} />
              <div className={styles.previewDot} />
              <div className={styles.previewDot} />
            </aside>

            <div className={styles.previewMain}>
              <div className={styles.previewCardLarge}>
                <div className={styles.previewLineWide} />
                <div className={styles.previewLineShort} />
              </div>

              <div className={styles.previewCardRow}>
                <div className={styles.previewCardMini} />
                <div className={styles.previewCardMini} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PrivacyPanel({ privacy, togglePrivacy, setPrivacy }) {
  return (
    <>
      <section className={styles.card}>
        <SectionHeader title="Visibilidade do perfil" subtitle="Controle quem consegue te encontrar e o que pode ser exibido." />

        <ToggleRow
          title="Perfil público"
          description="Seu perfil fica acessível para navegação dentro da Hivelancers."
          checked={privacy.profilePublic}
          onChange={() => togglePrivacy('profilePublic')}
        />
        <ToggleRow
          title="Mostrar status online"
          description="Outras pessoas podem saber quando você está ativo."
          checked={privacy.showOnline}
          onChange={() => togglePrivacy('showOnline')}
        />
        <ToggleRow
          title="Aparecer na busca"
          description="Seu perfil e serviços podem surgir em resultados e recomendações."
          checked={privacy.searchable}
          onChange={() => togglePrivacy('searchable')}
        />
        <ToggleRow
          title="Mostrar ganhos públicos"
          description="Exibe faturamento acumulado na sua vitrine pública."
          checked={privacy.showEarnings}
          onChange={() => togglePrivacy('showEarnings')}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Mensagens diretas" subtitle="Defina quem pode iniciar conversas com você na plataforma." />

        <div className={styles.optionGrid}>
          {[
            { id: 'everyone', label: 'Todos', desc: 'Qualquer usuário pode te escrever.' },
            { id: 'connections', label: 'Apenas conexões', desc: 'Somente quem já interagiu com você.' },
            { id: 'noone', label: 'Ninguém', desc: 'Bloqueia novas conversas diretas.' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.optionCard} ${privacy.allowDm === option.id ? styles.optionCardActive : ''}`}
              onClick={() => setPrivacy((prev) => ({ ...prev, allowDm: option.id }))}
            >
              <div>
                <strong>{option.label}</strong>
                <p>{option.desc}</p>
              </div>
              <span className={styles.optionIndicator}>
                {privacy.allowDm === option.id ? 'Ativo' : 'Selecionar'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Dados e transparencia" subtitle="Acoes relacionadas a exportacao de dados e leitura das politicas da plataforma." />

        <div className={styles.listStack}>
          {[
            {
              title: 'Baixar meus dados',
              text: 'Receba um pacote com informacoes de perfil, pedidos e atividade.',
            },
            {
              title: 'Politica de privacidade',
              text: 'Veja como a Hivelancers trata armazenamento, uso e protecao de dados.',
            },
            {
              title: 'Preferencias de consentimento',
              text: 'Revise comunicacoes, cookies e compartilhamento interno.',
            },
          ].map((item) => (
            <button key={item.title} type="button" className={styles.listRow}>
              <div className={styles.listCopy}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </div>
              <span className={styles.rowAction}>Abrir</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function BillingPanel({ isFreelancer }) {
  const [connectState, setConnectState] = useState({
    configured: true,
    connected: false,
    account: null,
  });
  const [isLoadingConnect, setIsLoadingConnect] = useState(isFreelancer);
  const [isOpeningStripe, setIsOpeningStripe] = useState(false);

  const loadConnectState = async () => {
    if (!isFreelancer) return;

    setIsLoadingConnect(true);
    try {
      const data = await getMyStripeConnectStatus();
      setConnectState(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoadingConnect(false);
    }
  };

  useEffect(() => {
    loadConnectState();
  }, [isFreelancer]);

  const handleConnectStripe = async () => {
    if (isOpeningStripe) return;

    setIsOpeningStripe(true);
    try {
      const data = await createMyStripeConnectOnboardingLink();
      if (!data.url) throw new Error('A Stripe não retornou um link de conexão.');
      window.location.assign(data.url);
    } catch (err) {
      toast.error(err.message);
      setIsOpeningStripe(false);
    }
  };

  const handleOpenDashboard = async () => {
    if (isOpeningStripe) return;

    setIsOpeningStripe(true);
    try {
      const data = await createMyStripeConnectDashboardLink();
      if (!data.url) throw new Error('A Stripe não retornou um link de dashboard.');
      window.location.assign(data.url);
    } catch (err) {
      toast.error(err.message);
      setIsOpeningStripe(false);
    }
  };

  const account = connectState.account;
  const stripeReady = Boolean(account?.detailsSubmitted && account?.payoutsEnabled);
  const stripeRequirements = [
    ...(account?.requirementsPastDue || []),
    ...(account?.requirementsCurrentlyDue || []),
  ];
  const visibleStripeRequirements = [...new Set(stripeRequirements)].slice(0, 5);

  return (
    <>
      <section className={`${styles.card} ${styles.planCard}`}>
        <div className={styles.planHeader}>
          <div>
            <span className={styles.planTag}>Plano atual</span>
            <h3>Profissional</h3>
            <p>R$ 49/mês · renovacao em 28 de maio de 2026</p>
          </div>

          <button type="button" className={styles.btnGhost}>
            Gerenciar plano
          </button>
        </div>

        <div className={styles.planPerks}>
          {[
            ['Comissao reduzida', '5% em vez de 10%'],
            ['Destaque em buscas', 'Mais exposicao na descoberta'],
            ['Suporte prioritario', 'Resposta rapida em casos criticos'],
          ].map(([title, text]) => (
            <div key={title} className={styles.planPerk}>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader
          title={isFreelancer ? 'Formas de recebimento' : 'Metodos de pagamento'}
          subtitle={isFreelancer ? 'Contas e metodos usados para receber seus ganhos.' : 'Cartoes e contas usados nas suas compras.'}
        />

        {isFreelancer ? (
          <>
            <div className={styles.listStack}>
              <div className={styles.listRow}>
                <div className={styles.listIcon}>{renderCardIcon()}</div>
                <div className={styles.listCopy}>
                  <strong>Checkout Hivelancers via Stripe</strong>
                  <span>Seus clientes pagam com Pix ou cartão. O repasse sai após a aprovação da entrega.</span>
                </div>
                <span className={styles.inlineBadge}>Marketplace</span>
              </div>

              <div className={styles.listRow}>
                <div className={styles.listIcon}>{renderCardIcon()}</div>
                <div className={styles.listCopy}>
                  <strong>
                    {isLoadingConnect
                      ? 'Carregando conta Stripe...'
                      : !connectState.configured
                      ? 'Stripe ainda não configurada'
                      : !account
                      ? 'Conta Stripe não conectada'
                      : stripeReady
                      ? 'Conta Stripe pronta para repasses'
                      : 'Conta Stripe precisa de revisão'}
                  </strong>
                  <span>
                    {isLoadingConnect
                      ? 'Estamos verificando o status atual da sua conta recebedora.'
                      : !connectState.configured
                      ? 'Falta configurar as credenciais da Stripe no backend antes de ativar o pagamento.'
                      : !account
                      ? 'Conecte sua conta Stripe para receber pedidos pagos com Pix ou cartao.'
                      : stripeReady
                      ? `Conta ${account.country || 'BR'} conectada. Dashboard pronto para acompanhar recebimentos.`
                      : visibleStripeRequirements.length
                      ? 'A Stripe retornou pendências para liberar os repasses da sua conta.'
                      : 'Complete o onboarding da Stripe para liberar os repasses do marketplace.'}
                  </span>
                </div>
                <span className={styles.inlineBadge}>
                  {isLoadingConnect
                    ? 'Verificando'
                    : !connectState.configured
                    ? 'Backend'
                    : stripeReady
                    ? 'Pronto'
                    : account
                    ? 'Pendente'
                    : 'Desconectado'}
                </span>
              </div>
            </div>

            {account && !stripeReady && (
              <div className={styles.requirementsNotice}>
                <strong>Pendências de verificação</strong>
                {visibleStripeRequirements.length ? (
                  <div className={styles.requirementPills}>
                    {visibleStripeRequirements.map((item) => (
                      <span key={item}>{formatStripeRequirement(item)}</span>
                    ))}
                  </div>
                ) : (
                  <p>Nenhuma pendência específica foi retornada. Continue o onboarding para concluir.</p>
                )}
                {account.requirementsDisabledReason && (
                  <small>Motivo informado pela Stripe: {account.requirementsDisabledReason}</small>
                )}
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleConnectStripe}
                disabled={isOpeningStripe || !connectState.configured}
              >
                {isOpeningStripe ? 'Abrindo Stripe...' : account ? 'Revisar conexao Stripe' : 'Conectar Stripe'}
              </button>

              <button
                type="button"
                className={styles.btnGhost}
                onClick={handleOpenDashboard}
                disabled={isOpeningStripe || !account?.detailsSubmitted}
              >
                Abrir dashboard Stripe
              </button>

              <button
                type="button"
                className={styles.btnGhost}
                onClick={loadConnectState}
                disabled={isLoadingConnect}
              >
                {isLoadingConnect ? 'Atualizando...' : 'Atualizar status'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.listStack}>
              {[
                { title: 'Pix no checkout', text: 'Pagamento instantaneo com QR Code dentro da Stripe', badge: 'Ativo' },
                { title: 'Cartao no checkout', text: 'Credito e debito suportados pelo checkout hospedado', badge: 'Ativo' },
              ].map((item) => (
                <div key={item.title} className={styles.listRow}>
                  <div className={styles.listIcon}>{renderCardIcon()}</div>
                  <div className={styles.listCopy}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                  <span className={styles.inlineBadge}>{item.badge}</span>
                </div>
              ))}
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.btnGhost}>
                Metodos salvos em breve
              </button>
            </div>
          </>
        )}
      </section>

      <section className={styles.card}>
        <SectionHeader title="Historico de cobrancas" subtitle="Ultimas movimentacoes relacionadas ao seu plano." />

        <div className={styles.tableLike}>
          {[
            { date: '28 Abr 2026', description: 'Plano Profissional - mensal', amount: 'R$ 49,00', status: 'Pago' },
            { date: '28 Mar 2026', description: 'Plano Profissional - mensal', amount: 'R$ 49,00', status: 'Pago' },
            { date: '28 Fev 2026', description: 'Plano Profissional - mensal', amount: 'R$ 49,00', status: 'Pago' },
          ].map((item) => (
            <div key={item.date} className={styles.tableRow}>
              <div>
                <strong>{item.description}</strong>
                <span>{item.date}</span>
              </div>
              <span>{item.amount}</span>
              <span className={styles.inlineBadge}>{item.status}</span>
              <button type="button" className={styles.rowAction}>
                Baixar
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function LanguagePanel({ language, setLanguage }) {
  const preview = new Intl.NumberFormat(language.lang || 'pt-BR', {
    style: 'currency',
    currency: language.currency || 'BRL',
  }).format(1290.5);

  return (
    <>
      <section className={styles.card}>
        <SectionHeader title="Idioma e regiao" subtitle="Traducoes, horario local, pais e moeda preferida." />

        <div className={styles.formGrid}>
          <Field label="Idioma">
            <select
              className={styles.input}
              value={language.lang}
              onChange={(event) => setLanguage((prev) => ({ ...prev, lang: event.target.value }))}
            >
              <option value="pt-BR">Portugues (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Espanol</option>
              <option value="fr-FR">Francais</option>
            </select>
          </Field>

          <Field label="Pais ou regiao">
            <select
              className={styles.input}
              value={language.region}
              onChange={(event) => setLanguage((prev) => ({ ...prev, region: event.target.value }))}
            >
              <option value="BR">Brasil</option>
              <option value="PT">Portugal</option>
              <option value="US">Estados Unidos</option>
              <option value="ES">Espanha</option>
            </select>
          </Field>

          <Field label="Fuso horario">
            <select
              className={styles.input}
              value={language.timezone}
              onChange={(event) => setLanguage((prev) => ({ ...prev, timezone: event.target.value }))}
            >
              <option value="America/Sao_Paulo">(GMT-3) Sao Paulo</option>
              <option value="America/New_York">(GMT-5) Nova Iorque</option>
              <option value="Europe/Lisbon">(GMT+0) Lisboa</option>
              <option value="Europe/Madrid">(GMT+1) Madrid</option>
            </select>
          </Field>

          <Field label="Moeda">
            <select
              className={styles.input}
              value={language.currency}
              onChange={(event) => setLanguage((prev) => ({ ...prev, currency: event.target.value }))}
            >
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar (US$)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </Field>
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Preview local" subtitle="Como datas, valores e horários vão aparecer para você." />

        <div className={styles.miniChecklistGrid}>
          <div className={styles.checkCard}>
            <strong>Idioma</strong>
            <p>{language.lang}</p>
          </div>
          <div className={styles.checkCard}>
            <strong>Regiao</strong>
            <p>{language.region}</p>
          </div>
          <div className={styles.checkCard}>
            <strong>Fuso</strong>
            <p>{language.timezone}</p>
          </div>
          <div className={styles.checkCard}>
            <strong>Moeda</strong>
            <p>{preview}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function DangerPanel() {
  return (
    <section className={`${styles.card} ${styles.dangerCard}`}>
      <SectionHeader
        title="Zona de perigo"
        subtitle="Acoes abaixo impactam sua conta de forma permanente ou quase permanente."
      />

      <div className={styles.listStack}>
        {[
          {
            title: 'Pausar conta',
            text: 'Oculta seu perfil temporariamente sem apagar historico.',
            action: 'Pausar',
          },
          {
            title: 'Exportar e excluir',
            text: 'Baixa seus dados e inicia processo de remocao com carencia.',
            action: 'Iniciar processo',
          },
          {
            title: 'Excluir conta permanentemente',
            text: 'Remove dados, mensagens, pedidos e servicos de forma irreversivel.',
            action: 'Excluir conta',
            dangerous: true,
          },
        ].map((item) => (
          <div key={item.title} className={styles.listRow}>
            <div className={styles.listCopy}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
            <button
              type="button"
              className={`${styles.rowAction} ${item.dangerous ? styles.rowActionDanger : ''}`}
            >
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderDeviceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function renderCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function renderTabIcon(icon) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (icon) {
    case 'user':
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...props}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...props}>
          <path d="M12 22a10 10 0 1 1 10-10c0 2.2-1.8 4-4 4h-1.3a1.7 1.7 0 0 0-1.7 1.7c0 .46.18.9.5 1.22A2 2 0 0 1 14 22z" />
          <circle cx="7.5" cy="10.5" r="0.8" />
          <circle cx="12" cy="7.5" r="0.8" />
          <circle cx="16.5" cy="10.5" r="0.8" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...props}>
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <path d="M7 11V8a5 5 0 0 1 10 0v3" />
        </svg>
      );
    case 'card':
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...props}>
          <path d="M10.29 3.86 1.82 18A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    default:
      return null;
  }
}

export default Settings;

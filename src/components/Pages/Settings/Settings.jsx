import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { updateProfile as apiUpdateProfile, updateUserType } from '../../../services/users';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
import CityAutocomplete from '../../CityAutocomplete/CityAutocomplete';
import { toRoleSlug, toUserType } from '../../../utils/authFlow';
import { formatPhoneBR } from '../../../utils/formatters';
import styles from './Settings.module.css';

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

const TABS = [
  { id: 'profile', label: 'Perfil', icon: 'user' },
  { id: 'account', label: 'Conta', icon: 'shield' },
  { id: 'notifications', label: 'Notificações', icon: 'bell' },
  { id: 'appearance', label: 'Aparência', icon: 'palette' },
  { id: 'privacy', label: 'Privacidade', icon: 'lock' },
  { id: 'billing', label: 'Pagamentos', icon: 'card' },
  { id: 'language', label: 'Idioma e região', icon: 'globe' },
  { id: 'danger', label: 'Zona de perigo', icon: 'alert' },
];

function Settings() {
  const { user, setUser } = useAuth();
  const userRole = toRoleSlug(user?.userType) || 'freelancer';
  const isFreelancer = userRole === 'freelancer';

  const { settings, updateField, toggleField, updateSection } = useSettings();
  const { notifications, appearance, privacy, language } = settings;

  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const serverProfile = useMemo(() => profileFromUser(user), [user]);

  useEffect(() => {
    setProfile(serverProfile);
  }, [serverProfile]);

  const profileDirty = useMemo(
    () => Object.keys(serverProfile).some((k) => (profile[k] || '') !== (serverProfile[k] || '')),
    [profile, serverProfile]
  );

  const updateProfile = (field, value) => setProfile((prev) => ({ ...prev, [field]: value }));
  const resetProfile = () => setProfile(serverProfile);

  const handleAvatarFile = async (file) => {
    if (!file || isUploadingAvatar) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
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
      toast.success('Foto removida.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const saveProfile = async (fields) => {
    if (isSavingProfile) return;
    const payload = fields.reduce((acc, f) => {
      const val = profile[f];
      if (f === 'email') return acc; // email não é editável aqui
      acc[f] = typeof val === 'string' ? val.trim() : val;
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
  const toggleNotification = (field) => toggleField('notifications', field);
  const togglePrivacy = (field) => toggleField('privacy', field);
  const setNotifications = (updater) =>
    updateSection('notifications', typeof updater === 'function' ? updater(notifications) : updater);
  const setAppearance = (updater) =>
    updateSection('appearance', typeof updater === 'function' ? updater(appearance) : updater);
  const setPrivacy = (updater) =>
    updateSection('privacy', typeof updater === 'function' ? updater(privacy) : updater);
  const setLanguage = (updater) =>
    updateSection('language', typeof updater === 'function' ? updater(language) : updater);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroBadge}>Configurações da conta</div>
          <h1 className={styles.heroTitle}>Ajuste cada detalhe da sua experiência na Hivelancers.</h1>
          <p className={styles.heroText}>
            Controle o que aparece no seu perfil, como você recebe avisos, a aparência da plataforma e as preferências que moldam o seu dia a dia.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span>Conta criada</span>
              <strong>Jan 2024</strong>
            </div>
            <div className={styles.heroStat}>
              <span>Plano atual</span>
              <strong>Profissional</strong>
            </div>
            <div className={styles.heroStat}>
              <span>Último login</span>
              <strong>Hoje, 09:12</strong>
            </div>
          </div>
        </div>

        <div className={styles.heroSide}>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                />
              ) : (
                `${profile.firstName} ${profile.lastName}`.trim().split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U'
              )}
            </div>
            <div className={styles.profileInfo}>
              <strong>{`${profile.firstName} ${profile.lastName}`.trim() || 'Usuário'}</strong>
              <span>{profile.username ? `@${profile.username}` : profile.email}</span>
              <div className={styles.roleTag}>
                {isFreelancer ? 'Freelancer' : 'Cliente'}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarFile(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className={styles.avatarBtn}
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? 'Enviando...' : (profile.avatarUrl ? 'Trocar foto' : 'Adicionar foto')}
            </button>
            {profile.avatarUrl && (
              <button
                type="button"
                className={styles.avatarBtn}
                onClick={handleAvatarRemove}
                disabled={isUploadingAvatar}
                style={{ marginTop: 8 }}
              >
                Remover foto
              </button>
            )}
          </div>
        </div>
      </section>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <span className={styles.sidebarLabel}>Categorias</span>
          <nav className={styles.tabNav}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ''} ${tab.id === 'danger' ? styles.tabDanger : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabIcon}>{renderTabIcon(tab.icon)}</span>
                <span>{tab.label}</span>
                <span className={styles.tabArrow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            ))}
          </nav>

          <div className={styles.helpBox}>
            <strong>Precisa de ajuda?</strong>
            <p>Fale com nosso suporte e resolva dúvidas em minutos.</p>
            <button className={styles.helpBtn}>Abrir central de ajuda</button>
          </div>
        </aside>

        <div className={styles.content}>
          {activeTab === 'profile' && (
            <ProfilePanel
              profile={profile}
              updateProfile={updateProfile}
              isFreelancer={isFreelancer}
              isSaving={isSavingProfile}
              dirty={profileDirty}
              onSave={() => saveProfile(['firstName', 'lastName', 'username', 'headline', 'location', 'bio', 'website'])}
              onCancel={resetProfile}
            />
          )}
          {activeTab === 'account' && (
            <AccountPanel
              profile={profile}
              updateProfile={updateProfile}
              userRole={userRole}
              isSaving={isSavingProfile}
              dirty={profileDirty}
              onSave={() => saveProfile(['phone'])}
              onCancel={resetProfile}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsPanel notifications={notifications} toggleNotification={toggleNotification} setNotifications={setNotifications} />
          )}
          {activeTab === 'appearance' && (
            <AppearancePanel appearance={appearance} setAppearance={setAppearance} />
          )}
          {activeTab === 'privacy' && (
            <PrivacyPanel privacy={privacy} togglePrivacy={togglePrivacy} setPrivacy={setPrivacy} />
          )}
          {activeTab === 'billing' && <BillingPanel isFreelancer={isFreelancer} />}
          {activeTab === 'language' && <LanguagePanel language={language} setLanguage={setLanguage} />}
          {activeTab === 'danger' && <DangerPanel />}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className={styles.sectionHead}>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
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

function ProfilePanel({ profile, updateProfile, isFreelancer, isSaving, dirty, onSave, onCancel }) {
  return (
    <section className={styles.card}>
      <SectionHeader
        title="Informações do perfil"
        subtitle="Isso é o que aparece para outros usuários da plataforma."
      />

      <div className={styles.formGrid}>
        <Field label="Nome">
          <input
            type="text"
            className={styles.input}
            value={profile.firstName}
            onChange={(e) => updateProfile('firstName', e.target.value)}
          />
        </Field>

        <Field label="Sobrenome">
          <input
            type="text"
            className={styles.input}
            value={profile.lastName}
            onChange={(e) => updateProfile('lastName', e.target.value)}
          />
        </Field>

        <Field label="Nome de usuário" hint="Aparece na URL do seu perfil público. Apenas letras, números, . e _">
          <div className={styles.inputWithPrefix}>
            <span className={styles.inputPrefix}>hivelancers.com/</span>
            <input
              type="text"
              className={styles.input}
              value={profile.username}
              placeholder="seu-usuario"
              onChange={(e) => updateProfile('username', e.target.value.toLowerCase())}
            />
          </div>
        </Field>

        <Field label={isFreelancer ? 'Título profissional' : 'Empresa / Cargo'}>
          <input
            type="text"
            className={styles.input}
            value={profile.headline}
            onChange={(e) => updateProfile('headline', e.target.value)}
          />
        </Field>

        <Field label="Localização" hint="Comece a digitar para selecionar sua cidade.">
          <CityAutocomplete
            value={profile.location}
            onChange={(v) => updateProfile('location', v)}
            placeholder="Ex: Porto Alegre"
            inputClassName={styles.input}
          />
        </Field>

        <Field label="Bio" hint={`${(profile.bio || '').length}/280 caracteres`}>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={profile.bio}
            maxLength={280}
            rows={4}
            onChange={(e) => updateProfile('bio', e.target.value)}
          />
        </Field>

        <Field label="Website">
          <input
            type="url"
            className={styles.input}
            value={profile.website}
            placeholder="https://..."
            onChange={(e) => updateProfile('website', e.target.value)}
          />
        </Field>
      </div>

      {isFreelancer && (
        <>
          <div className={styles.divider} />
          <SectionHeader title="Habilidades" subtitle="Adicione até 10 tags que descrevem bem o seu trabalho." />
          <div className={styles.skills}>
            {['Branding', 'Logo design', 'Identidade visual', 'Figma', 'Ilustração', 'UI design'].map((skill) => (
              <span key={skill} className={styles.skillChip}>
                {skill}
                <button className={styles.skillRemove}>×</button>
              </span>
            ))}
            <button className={styles.skillAdd}>+ adicionar</button>
          </div>
        </>
      )}

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
      <SectionHeader title="Tipo de conta" subtitle="Escolha como você utiliza a Hivelancers. Você pode alternar quando quiser." />
      <div className={styles.formGrid}>
        <Field label="Perfil atual">
          <select
            className={styles.input}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="freelancer">Freelancer — ofereço serviços</option>
            <option value="client">Cliente — contrato serviços</option>
          </select>
        </Field>
      </div>
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={save}
          disabled={!dirty || isSaving}
        >
          {isSaving ? 'Salvando...' : 'Salvar alteração'}
        </button>
      </div>
    </section>
  );
}

function AccountPanel({ profile, updateProfile, userRole, isSaving, dirty, onSave, onCancel }) {
  return (
    <>
      <AccountTypeCard userRole={userRole} />
      <section className={styles.card}>
        <SectionHeader title="Conta e login" subtitle="Email, telefone e credenciais da sua conta." />

        <div className={styles.formGrid}>
          <Field label="Email principal" hint="Para alterar o email, entre em contato com o suporte.">
            <input
              type="email"
              className={styles.input}
              value={profile.email}
              disabled
              readOnly
            />
          </Field>

          <Field label="Telefone">
            <input
              type="tel"
              className={styles.input}
              value={profile.phone}
              placeholder="(11) 99999-9999"
              maxLength={16}
              onChange={(e) => updateProfile('phone', formatPhoneBR(e.target.value))}
            />
          </Field>
        </div>

        <FormActions onSave={onSave} onCancel={onCancel} isSaving={isSaving} disabled={!dirty} />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Senha" subtitle="Mantenha sua conta segura usando uma senha forte." />

        <div className={styles.formGrid}>
          <Field label="Senha atual">
            <input type="password" className={styles.input} placeholder="••••••••" />
          </Field>
          <Field label="Nova senha">
            <input type="password" className={styles.input} placeholder="••••••••" />
          </Field>
          <Field label="Confirmar nova senha">
            <input type="password" className={styles.input} placeholder="••••••••" />
          </Field>
        </div>

        <FormActions
          primaryLabel="Atualizar senha"
          onSave={() => toast.message('Em breve você poderá alterar a senha por aqui.')}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Autenticação em dois fatores" subtitle="Adicione uma camada extra de segurança ao seu login." />

        <ToggleRow
          title="App autenticador"
          description="Use Google Authenticator ou Authy para gerar códigos."
          checked={false}
          onChange={() => {}}
        />
        <ToggleRow
          title="Verificação por SMS"
          description="Receba um código no seu celular cadastrado."
          checked={true}
          onChange={() => {}}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Sessões ativas" subtitle="Dispositivos conectados à sua conta neste momento." />

        <div className={styles.sessionList}>
          {[
            { device: 'MacBook Pro · Safari', location: 'São Paulo, BR', time: 'Agora · dispositivo atual', current: true },
            { device: 'iPhone 15 · App Hivelancers', location: 'São Paulo, BR', time: 'Há 2 horas', current: false },
            { device: 'Chrome · Windows', location: 'Rio de Janeiro, BR', time: 'Há 3 dias', current: false },
          ].map((session) => (
            <div key={session.device} className={styles.sessionItem}>
              <div className={styles.sessionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className={styles.sessionInfo}>
                <strong>{session.device}</strong>
                <span>{session.location} · {session.time}</span>
              </div>
              {session.current ? (
                <span className={styles.sessionCurrent}>Atual</span>
              ) : (
                <button className={styles.sessionRevoke}>Encerrar</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function NotificationsPanel({ notifications, toggleNotification, setNotifications }) {
  return (
    <>
      <section className={styles.card}>
        <SectionHeader title="Notificações por email" subtitle="Escolha quando queremos falar com você por email." />

        <ToggleRow
          title="Atualizações de pedidos"
          description="Status, mensagens e entregas dos seus pedidos."
          checked={notifications.orderUpdates}
          onChange={() => toggleNotification('orderUpdates')}
        />
        <ToggleRow
          title="Novas mensagens"
          description="Avisos quando alguém te mandar uma mensagem direta."
          checked={notifications.messages}
          onChange={() => toggleNotification('messages')}
        />
        <ToggleRow
          title="Avaliações e feedback"
          description="Notificações sempre que receber uma nova avaliação."
          checked={notifications.reviews}
          onChange={() => toggleNotification('reviews')}
        />
        <ToggleRow
          title="Dicas e promoções"
          description="Novidades da plataforma, recursos e ofertas especiais."
          checked={notifications.marketing}
          onChange={() => toggleNotification('marketing')}
        />
        <ToggleRow
          title="Newsletter semanal"
          description="Resumo semanal de tendências, dicas e destaques."
          checked={notifications.newsletter}
          onChange={() => toggleNotification('newsletter')}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Notificações push" subtitle="Alertas em tempo real no navegador e no app mobile." />

        <ToggleRow
          title="Mensagens"
          description="Receba uma notificação push para cada nova mensagem."
          checked={notifications.pushMessages}
          onChange={() => toggleNotification('pushMessages')}
        />
        <ToggleRow
          title="Pedidos"
          description="Alertas de novos pedidos, aprovações e entregas."
          checked={notifications.pushOrders}
          onChange={() => toggleNotification('pushOrders')}
        />
        <ToggleRow
          title="Promoções e dicas"
          description="Notificações sobre missões, XP e recompensas novas."
          checked={notifications.pushPromos}
          onChange={() => toggleNotification('pushPromos')}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Frequência dos resumos" subtitle="Com que frequência queremos te mandar um resumo por email." />

        <div className={styles.radioGrid}>
          {[
            { id: 'realtime', label: 'Tempo real', desc: 'Receba assim que algo acontecer.' },
            { id: 'daily', label: 'Diário', desc: 'Um resumo todo fim de dia.' },
            { id: 'weekly', label: 'Semanal', desc: 'Apenas um email por semana.' },
            { id: 'never', label: 'Nunca', desc: 'Sem resumos por email.' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.radioCard} ${notifications.emailDigest === option.id ? styles.radioActive : ''}`}
              onClick={() => setNotifications((n) => ({ ...n, emailDigest: option.id }))}
            >
              <div className={styles.radioDot}>
                {notifications.emailDigest === option.id && <span />}
              </div>
              <div>
                <strong>{option.label}</strong>
                <span>{option.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function AppearancePanel({ appearance, setAppearance }) {
  const themes = [
    { id: 'light', label: 'Claro', desc: 'Ideal para ambientes iluminados.' },
    { id: 'dark', label: 'Escuro', desc: 'Descansa os olhos à noite.' },
    { id: 'system', label: 'Sistema', desc: 'Segue a preferência do seu dispositivo.' },
  ];

  const accents = [
    { id: 'blue', color: '#3e73e6' },
    { id: 'purple', color: '#7c3aed' },
    { id: 'green', color: '#059669' },
    { id: 'amber', color: '#d97706' },
    { id: 'pink', color: '#db2777' },
    { id: 'teal', color: '#0d9488' },
  ];

  return (
    <>
      <section className={styles.card}>
        <SectionHeader title="Tema" subtitle="Escolha como a Hivelancers aparece para você." />

        <div className={styles.themeGrid}>
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`${styles.themeCard} ${appearance.theme === theme.id ? styles.themeActive : ''}`}
              onClick={() => setAppearance((a) => ({ ...a, theme: theme.id }))}
            >
              <div className={`${styles.themePreview} ${styles[`theme_${theme.id}`]}`}>
                <div className={styles.themeSidebar} />
                <div className={styles.themeBody}>
                  <div className={styles.themeLine} />
                  <div className={styles.themeLineShort} />
                </div>
              </div>
              <div className={styles.themeInfo}>
                <strong>{theme.label}</strong>
                <span>{theme.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Cor de destaque" subtitle="Aplicada em botões, links e indicadores de seleção." />

        <div className={styles.accentRow}>
          {accents.map((accent) => (
            <button
              key={accent.id}
              type="button"
              className={`${styles.accentDot} ${appearance.accent === accent.id ? styles.accentActive : ''}`}
              style={{ background: accent.color }}
              onClick={() => setAppearance((a) => ({ ...a, accent: accent.id }))}
              aria-label={accent.id}
            >
              {appearance.accent === accent.id && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Densidade" subtitle="Quanto espaço entre os elementos da interface." />

        <div className={styles.radioGrid}>
          {[
            { id: 'compact', label: 'Compacta', desc: 'Mais conteúdo visível ao mesmo tempo.' },
            { id: 'comfortable', label: 'Confortável', desc: 'Espaçamento equilibrado (padrão).' },
            { id: 'spacious', label: 'Espaçosa', desc: 'Mais respiro entre os blocos.' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.radioCard} ${appearance.density === option.id ? styles.radioActive : ''}`}
              onClick={() => setAppearance((a) => ({ ...a, density: option.id }))}
            >
              <div className={styles.radioDot}>
                {appearance.density === option.id && <span />}
              </div>
              <div>
                <strong>{option.label}</strong>
                <span>{option.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Acessibilidade" subtitle="Ajustes visuais para uma experiência mais confortável." />

        <ToggleRow
          title="Reduzir animações"
          description="Desativa transições e efeitos de movimento na interface."
          checked={appearance.reducedMotion}
          onChange={() => setAppearance((a) => ({ ...a, reducedMotion: !a.reducedMotion }))}
        />
      </section>
    </>
  );
}

function PrivacyPanel({ privacy, togglePrivacy, setPrivacy }) {
  return (
    <>
      <section className={styles.card}>
        <SectionHeader title="Visibilidade do perfil" subtitle="Controle quem pode ver suas informações." />

        <ToggleRow
          title="Perfil público"
          description="Seu perfil aparece para qualquer pessoa navegando na Hivelancers."
          checked={privacy.profilePublic}
          onChange={() => togglePrivacy('profilePublic')}
        />
        <ToggleRow
          title="Mostrar status online"
          description="Outras pessoas podem ver quando você está ativo."
          checked={privacy.showOnline}
          onChange={() => togglePrivacy('showOnline')}
        />
        <ToggleRow
          title="Aparecer em buscas"
          description="Seu perfil pode ser encontrado no buscador da plataforma."
          checked={privacy.searchable}
          onChange={() => togglePrivacy('searchable')}
        />
        <ToggleRow
          title="Mostrar ganhos públicos"
          description="Exibe total faturado no seu perfil público."
          checked={privacy.showEarnings}
          onChange={() => togglePrivacy('showEarnings')}
        />
      </section>

      <section className={styles.card}>
        <SectionHeader title="Mensagens diretas" subtitle="Quem pode te mandar mensagens na plataforma." />

        <div className={styles.radioGrid}>
          {[
            { id: 'everyone', label: 'Todos', desc: 'Qualquer usuário pode iniciar uma conversa.' },
            { id: 'connections', label: 'Apenas conexões', desc: 'Somente pessoas com quem você já trabalhou.' },
            { id: 'noone', label: 'Ninguém', desc: 'Desabilita mensagens diretas completamente.' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.radioCard} ${privacy.allowDm === option.id ? styles.radioActive : ''}`}
              onClick={() => setPrivacy((p) => ({ ...p, allowDm: option.id }))}
            >
              <div className={styles.radioDot}>
                {privacy.allowDm === option.id && <span />}
              </div>
              <div>
                <strong>{option.label}</strong>
                <span>{option.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Dados e transparência" subtitle="Controle seus dados armazenados na plataforma." />

        <div className={styles.linkList}>
          <button className={styles.linkItem}>
            <div>
              <strong>Baixar meus dados</strong>
              <span>Receba um arquivo com tudo que a Hivelancers guarda sobre você.</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button className={styles.linkItem}>
            <div>
              <strong>Política de privacidade</strong>
              <span>Entenda como seus dados são usados e protegidos.</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </section>
    </>
  );
}

function BillingPanel({ isFreelancer }) {
  return (
    <>
      <section className={`${styles.card} ${styles.planCard}`}>
        <div className={styles.planHead}>
          <div>
            <span className={styles.planTag}>Plano atual</span>
            <h2>Profissional</h2>
            <p>R$ 49/mês · renovação em 28 de maio de 2026</p>
          </div>
          <button className={styles.planBtn}>Gerenciar plano</button>
        </div>

        <div className={styles.planPerks}>
          <div className={styles.planPerk}>
            <strong>Comissão reduzida</strong>
            <span>5% em vez de 10%</span>
          </div>
          <div className={styles.planPerk}>
            <strong>Destaque em buscas</strong>
            <span>Prioridade no ranking</span>
          </div>
          <div className={styles.planPerk}>
            <strong>Suporte prioritário</strong>
            <span>Resposta em até 2h</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader
          title={isFreelancer ? 'Formas de recebimento' : 'Métodos de pagamento'}
          subtitle={isFreelancer ? 'Para onde enviamos seus ganhos da plataforma.' : 'Cartões e contas usados nas suas compras.'}
        />

        <div className={styles.paymentList}>
          <div className={styles.paymentItem}>
            <div className={styles.paymentIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div className={styles.paymentInfo}>
              <strong>Cartão final 4242</strong>
              <span>Visa · expira 08/2028</span>
            </div>
            <span className={styles.paymentDefault}>Padrão</span>
          </div>

          <div className={styles.paymentItem}>
            <div className={styles.paymentIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <div className={styles.paymentInfo}>
              <strong>Pix · joao.silva@email.com</strong>
              <span>Transferências instantâneas</span>
            </div>
            <button className={styles.paymentAction}>Editar</button>
          </div>

          <button className={styles.addPayment}>+ adicionar novo método</button>
        </div>
      </section>

      <section className={styles.card}>
        <SectionHeader title="Histórico de cobranças" subtitle="Últimas transações da sua conta." />

        <div className={styles.invoiceList}>
          {[
            { date: '28 Abr 2026', desc: 'Plano Profissional — mensal', amount: 'R$ 49,00', status: 'Pago' },
            { date: '28 Mar 2026', desc: 'Plano Profissional — mensal', amount: 'R$ 49,00', status: 'Pago' },
            { date: '28 Fev 2026', desc: 'Plano Profissional — mensal', amount: 'R$ 49,00', status: 'Pago' },
          ].map((invoice) => (
            <div key={invoice.date} className={styles.invoiceRow}>
              <div>
                <strong>{invoice.desc}</strong>
                <span>{invoice.date}</span>
              </div>
              <span className={styles.invoiceAmount}>{invoice.amount}</span>
              <span className={styles.invoiceStatus}>{invoice.status}</span>
              <button className={styles.invoiceBtn}>Baixar</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function LanguagePanel({ language, setLanguage }) {
  return (
    <section className={styles.card}>
      <SectionHeader title="Idioma e região" subtitle="Preferências locais para tradução, horário e moeda." />

      <div className={styles.formGrid}>
        <Field label="Idioma">
          <select
            className={styles.input}
            value={language.lang}
            onChange={(e) => setLanguage((l) => ({ ...l, lang: e.target.value }))}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
            <option value="fr-FR">Français</option>
          </select>
        </Field>

        <Field label="País / região">
          <select
            className={styles.input}
            value={language.region}
            onChange={(e) => setLanguage((l) => ({ ...l, region: e.target.value }))}
          >
            <option value="BR">Brasil</option>
            <option value="PT">Portugal</option>
            <option value="US">Estados Unidos</option>
            <option value="ES">Espanha</option>
          </select>
        </Field>

        <Field label="Fuso horário">
          <select
            className={styles.input}
            value={language.timezone}
            onChange={(e) => setLanguage((l) => ({ ...l, timezone: e.target.value }))}
          >
            <option value="America/Sao_Paulo">(GMT-3) São Paulo</option>
            <option value="America/New_York">(GMT-5) Nova Iorque</option>
            <option value="Europe/Lisbon">(GMT+0) Lisboa</option>
            <option value="Europe/Madrid">(GMT+1) Madrid</option>
          </select>
        </Field>

        <Field label="Moeda">
          <select
            className={styles.input}
            value={language.currency}
            onChange={(e) => setLanguage((l) => ({ ...l, currency: e.target.value }))}
          >
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar (US$)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </Field>
      </div>

      <FormActions onSave={() => toast.success('Preferências salvas.')} />
    </section>
  );
}

function DangerPanel() {
  return (
    <section className={`${styles.card} ${styles.dangerCard}`}>
      <SectionHeader
        title="Zona de perigo"
        subtitle="As ações abaixo são permanentes. Pense bem antes de continuar."
      />

      <div className={styles.dangerList}>
        <div className={styles.dangerItem}>
          <div>
            <strong>Pausar conta</strong>
            <span>Seu perfil fica oculto temporariamente. Você pode reativar quando quiser.</span>
          </div>
          <button className={styles.dangerBtn}>Pausar</button>
        </div>

        <div className={styles.dangerItem}>
          <div>
            <strong>Exportar e excluir</strong>
            <span>Baixa seus dados e remove sua conta depois de 30 dias de carência.</span>
          </div>
          <button className={styles.dangerBtn}>Iniciar processo</button>
        </div>

        <div className={styles.dangerItem}>
          <div>
            <strong>Excluir conta permanentemente</strong>
            <span>Remove todos os dados, pedidos, mensagens e serviços. Não é possível reverter.</span>
          </div>
          <button className={`${styles.dangerBtn} ${styles.dangerBtnFilled}`}>Excluir conta</button>
        </div>
      </div>
    </section>
  );
}

function FormActions({ primaryLabel = 'Salvar alterações', onSave, onCancel, isSaving = false, disabled = false }) {
  return (
    <div className={styles.formActions}>
      <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={isSaving || disabled}>
        Cancelar
      </button>
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

function renderTabIcon(icon) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (icon) {
    case 'user':
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
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
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...props}>
          <circle cx="13.5" cy="6.5" r="0.5" />
          <circle cx="17.5" cy="10.5" r="0.5" />
          <circle cx="8.5" cy="7.5" r="0.5" />
          <circle cx="6.5" cy="12.5" r="0.5" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.52-4.5-10-10-10z" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...props}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
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
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...props}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    default:
      return null;
  }
}

export default Settings;

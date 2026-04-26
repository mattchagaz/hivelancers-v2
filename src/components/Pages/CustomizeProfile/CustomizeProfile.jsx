import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { updateProfile as apiUpdateProfile } from '../../../services/users';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
import CityAutocomplete from '../../CityAutocomplete/CityAutocomplete';
import {
  getEmptyPortfolioProject,
  getProfileCompletion,
  getProfileLinks,
  getPublicProfilePath,
  getStoredProfileEnhancements,
  mergeProfileEnhancements,
  saveStoredProfileEnhancements,
} from '../../../utils/profileEnhancements';
import styles from './CustomizeProfile.module.css';

const profileFromUser = (user) => ({
  firstName: user?.firstName || '',
  lastName: user?.lastName || '',
  username: user?.username || '',
  headline: user?.headline || '',
  bio: user?.bio || '',
  location: user?.location || '',
  website: user?.website || '',
  avatarUrl: user?.avatarUrl || '',
});

function CustomizeProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const avatarInputRef = useRef(null);
  const projectFileRefs = useRef({});

  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    github: '',
    behance: '',
    dribbble: '',
    instagram: '',
    youtube: '',
  });
  const [projects, setProjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingProjectId, setUploadingProjectId] = useState('');

  useEffect(() => {
    const base = profileFromUser(user);
    const stored = getStoredProfileEnhancements(user?.id);
    const merged = mergeProfileEnhancements(base, stored);
    setProfile(profileFromUser(merged));
    setSkills(merged.skills || []);
    setSocialLinks(merged.socialLinks || {});
    setProjects(merged.portfolioProjects || []);
  }, [user]);

  const previewProfile = useMemo(
    () =>
      mergeProfileEnhancements(
        {
          ...user,
          ...profile,
        },
        {
          skills,
          socialLinks,
          portfolioProjects: projects,
        }
      ),
    [user, profile, skills, socialLinks, projects]
  );

  const completion = useMemo(() => getProfileCompletion(previewProfile), [previewProfile]);
  const visibleLinks = useMemo(() => getProfileLinks(previewProfile), [previewProfile]);
  const profilePath = useMemo(() => getPublicProfilePath({ ...user, username: profile.username }), [user, profile.username]);

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (field, value) => {
    setSocialLinks((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    const next = skillInput.trim();
    if (!next) return;
    if (skills.includes(next)) {
      setSkillInput('');
      return;
    }
    if (skills.length >= 12) {
      toast.error('Voce pode adicionar ate 12 habilidades.');
      return;
    }
    setSkills((prev) => [...prev, next]);
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((item) => item !== skill));
  };

  const addProject = () => {
    if (projects.length >= 6) {
      toast.error('Voce pode destacar ate 6 projetos.');
      return;
    }
    setProjects((prev) => [...prev, getEmptyPortfolioProject()]);
  };

  const updateProject = (projectId, field, value) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              [field]:
                field === 'tags'
                  ? value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .slice(0, 5)
                  : value,
            }
          : project
      )
    );
  };

  const removeProject = (projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  };

  const handleAvatarUpload = async (file) => {
    if (!file || uploadingAvatar) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem valida.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const { url } = await uploadImageToCloudinary(file);
      updateProfileField('avatarUrl', url);
      toast.success('Foto carregada. Salve para publicar no perfil.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProjectImageUpload = async (projectId, file) => {
    if (!file || uploadingProjectId) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem valida.');
      return;
    }
    setUploadingProjectId(projectId);
    try {
      const { url } = await uploadImageToCloudinary(file);
      updateProject(projectId, 'imageUrl', url);
      toast.success('Capa do projeto carregada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingProjectId('');
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        username: profile.username.trim().toLowerCase(),
        headline: profile.headline.trim(),
        bio: profile.bio.trim(),
        location: profile.location.trim(),
        website: profile.website.trim(),
        avatarUrl: profile.avatarUrl.trim(),
      };

      const updated = await apiUpdateProfile(payload);
      setUser(updated);

      saveStoredProfileEnhancements(updated.id, {
        skills,
        socialLinks,
        portfolioProjects: projects,
      });

      toast.success('Perfil personalizado salvo com sucesso.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const goToPublicProfile = () => {
    navigate(profilePath);
  };

  const fullName =
    `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
    'Seu nome';
  const initials = fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroBadge}>Personalizar perfil</div>
          <h1 className={styles.heroTitle}>Monte uma vitrine forte para quando alguem abrir o seu perfil.</h1>
          <p className={styles.heroText}>
            Organize sua identidade, links, habilidades e projetos em destaque. Essa base tambem prepara a missao de perfil 80% completo.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar perfil'}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={goToPublicProfile}>
              Ver perfil publico
            </button>
          </div>

          <div className={styles.progressCard}>
            <div className={styles.progressHead}>
              <div>
                <span className={styles.progressLabel}>Forca do perfil</span>
                <strong>{completion.percent}% completo</strong>
              </div>
              <span className={`${styles.progressPill} ${completion.isReadyForMission ? styles.progressPillReady : ''}`}>
                {completion.isReadyForMission ? 'Pronto para a missao' : 'Meta: 80%'}
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${completion.percent}%` }} />
            </div>
            <div className={styles.checkList}>
              {completion.items.map((item) => (
                <div key={item.id} className={`${styles.checkItem} ${item.done ? styles.checkDone : ''}`}>
                  <span className={styles.checkDot} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className={styles.previewCard}>
          <div className={styles.previewCover} />
          <div className={styles.previewAvatar}>
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className={styles.previewAvatarImg} /> : initials || 'U'}
          </div>
          <div className={styles.previewBody}>
            <strong>{fullName}</strong>
            <span>{profile.username ? `@${profile.username}` : 'usuario-publico'}</span>
            <p>{profile.headline || 'Seu titulo profissional aparece aqui.'}</p>
          </div>
          <div className={styles.previewStats}>
            <div>
              <span>Skills</span>
              <strong>{skills.length}</strong>
            </div>
            <div>
              <span>Links</span>
              <strong>{visibleLinks.length}</strong>
            </div>
            <div>
              <span>Projetos</span>
              <strong>{projects.length}</strong>
            </div>
          </div>
        </aside>
      </section>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Identidade do perfil</h2>
                <p>Os elementos principais que aparecem primeiro para visitantes e clientes.</p>
              </div>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Enviando foto...' : 'Trocar foto'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = '';
                }}
              />
            </div>

            <div className={styles.formGrid}>
              <Field label="Nome">
                <input className={styles.input} value={profile.firstName} onChange={(e) => updateProfileField('firstName', e.target.value)} />
              </Field>
              <Field label="Sobrenome">
                <input className={styles.input} value={profile.lastName} onChange={(e) => updateProfileField('lastName', e.target.value)} />
              </Field>
              <Field label="Usuario publico">
                <div className={styles.inputWithPrefix}>
                  <span className={styles.inputPrefix}>hivelancers.com/</span>
                  <input
                    className={styles.input}
                    value={profile.username}
                    placeholder="seuusuario"
                    onChange={(e) => updateProfileField('username', e.target.value.toLowerCase())}
                  />
                </div>
              </Field>
              <Field label="Titulo profissional">
                <input className={styles.input} value={profile.headline} onChange={(e) => updateProfileField('headline', e.target.value)} />
              </Field>
              <Field label="Localizacao">
                <CityAutocomplete
                  value={profile.location}
                  onChange={(value) => updateProfileField('location', value)}
                  placeholder="Ex: Sao Paulo"
                  inputClassName={styles.input}
                />
              </Field>
              <Field label="Website principal">
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://seusite.com"
                  value={profile.website}
                  onChange={(e) => updateProfileField('website', e.target.value)}
                />
              </Field>
              <Field label="Bio" fullWidth hint={`${profile.bio.length}/280 caracteres`}>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  rows={5}
                  maxLength={280}
                  value={profile.bio}
                  onChange={(e) => updateProfileField('bio', e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Links e presenca online</h2>
                <p>Centralize os lugares onde seu trabalho pode ser validado por quem visita seu perfil.</p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <Field label="LinkedIn">
                <input className={styles.input} placeholder="linkedin.com/in/..." value={socialLinks.linkedin} onChange={(e) => updateSocialLink('linkedin', e.target.value)} />
              </Field>
              <Field label="GitHub">
                <input className={styles.input} placeholder="github.com/..." value={socialLinks.github} onChange={(e) => updateSocialLink('github', e.target.value)} />
              </Field>
              <Field label="Behance">
                <input className={styles.input} placeholder="behance.net/..." value={socialLinks.behance} onChange={(e) => updateSocialLink('behance', e.target.value)} />
              </Field>
              <Field label="Dribbble">
                <input className={styles.input} placeholder="dribbble.com/..." value={socialLinks.dribbble} onChange={(e) => updateSocialLink('dribbble', e.target.value)} />
              </Field>
              <Field label="Instagram">
                <input className={styles.input} placeholder="instagram.com/..." value={socialLinks.instagram} onChange={(e) => updateSocialLink('instagram', e.target.value)} />
              </Field>
              <Field label="YouTube">
                <input className={styles.input} placeholder="youtube.com/..." value={socialLinks.youtube} onChange={(e) => updateSocialLink('youtube', e.target.value)} />
              </Field>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Habilidades em destaque</h2>
                <p>Essas tags ajudam a contar rapidamente o que voce faz melhor.</p>
              </div>
            </div>

            <div className={styles.skillComposer}>
              <input
                className={styles.input}
                value={skillInput}
                placeholder="Digite uma habilidade e pressione Enter"
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button type="button" className={styles.primaryButton} onClick={addSkill}>
                Adicionar
              </button>
            </div>

            <div className={styles.skillList}>
              {skills.length === 0 ? (
                <p className={styles.emptyText}>Adicione pelo menos 3 habilidades para fortalecer o perfil.</p>
              ) : (
                skills.map((skill) => (
                  <span key={skill} className={styles.skillChip}>
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Projetos e portfolio</h2>
                <p>Monte uma pequena galeria dos melhores trabalhos para dar contexto e prova visual.</p>
              </div>
              <button type="button" className={styles.ghostButton} onClick={addProject}>
                Novo projeto
              </button>
            </div>

            {projects.length === 0 ? (
              <div className={styles.emptyBox}>
                <strong>Seu perfil ainda nao tem projetos em destaque.</strong>
                <p>Adicione ao menos um projeto com imagem para ficar elegivel ao marco de perfil 80%.</p>
              </div>
            ) : (
              <div className={styles.projectStack}>
                {projects.map((project) => (
                  <article key={project.id} className={styles.projectCard}>
                    <div className={styles.projectPreview}>
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt="" className={styles.projectImage} />
                      ) : (
                        <div className={styles.projectFallback}>Projeto</div>
                      )}
                    </div>

                    <div className={styles.projectForm}>
                      <div className={styles.projectActions}>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => projectFileRefs.current[project.id]?.click()}
                          disabled={uploadingProjectId === project.id}
                        >
                          {uploadingProjectId === project.id ? 'Enviando capa...' : 'Enviar capa'}
                        </button>
                        <button type="button" className={styles.dangerButton} onClick={() => removeProject(project.id)}>
                          Remover
                        </button>
                        <input
                          ref={(node) => {
                            projectFileRefs.current[project.id] = node;
                          }}
                          type="file"
                          accept="image/*"
                          className={styles.hiddenInput}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProjectImageUpload(project.id, file);
                            e.target.value = '';
                          }}
                        />
                      </div>

                      <div className={styles.formGrid}>
                        <Field label="Titulo do projeto">
                          <input className={styles.input} value={project.title} onChange={(e) => updateProject(project.id, 'title', e.target.value)} />
                        </Field>
                        <Field label="Link do projeto">
                          <input className={styles.input} value={project.projectUrl} placeholder="https://..." onChange={(e) => updateProject(project.id, 'projectUrl', e.target.value)} />
                        </Field>
                        <Field label="Tags" hint="Separe por virgula" fullWidth>
                          <input
                            className={styles.input}
                            value={project.tags.join(', ')}
                            placeholder="Branding, Figma, Landing page"
                            onChange={(e) => updateProject(project.id, 'tags', e.target.value)}
                          />
                        </Field>
                        <Field label="Descricao" fullWidth>
                          <textarea
                            className={`${styles.input} ${styles.textarea}`}
                            rows={4}
                            value={project.description}
                            onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.sideCard}>
            <h3>Como o perfil vai aparecer</h3>
            <p>Use esta referencia para pensar no que um cliente ou parceiro vai perceber nos primeiros segundos.</p>

            <div className={styles.miniProfile}>
              <div className={styles.miniProfileHead}>
                <div className={styles.miniAvatar}>
                  {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className={styles.previewAvatarImg} /> : initials || 'U'}
                </div>
                <div>
                  <strong>{fullName}</strong>
                  <span>{profile.headline || 'Seu titulo entra aqui'}</span>
                </div>
              </div>
              <div className={styles.miniMeta}>
                {profile.location ? <span>{profile.location}</span> : <span>Adicione sua cidade</span>}
                <span>{visibleLinks.length} links ativos</span>
              </div>
            </div>
          </section>

          <section className={styles.sideCard}>
            <h3>Checklist da missao</h3>
            <div className={styles.missionList}>
              {completion.items.map((item) => (
                <div key={item.id} className={styles.missionItem}>
                  <span className={`${styles.missionState} ${item.done ? styles.missionStateDone : ''}`} />
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.weight}% da completude</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sideCard}>
            <h3>Atalhos</h3>
            <div className={styles.linkStack}>
              <Link to={profilePath} className={styles.sideLink}>Abrir meu perfil publico</Link>
              <Link to="/settings" className={styles.sideLink}>Voltar para configuracoes</Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, hint, fullWidth = false, children }) {
  return (
    <label className={`${styles.field} ${fullWidth ? styles.fieldFull : ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  );
}

export default CustomizeProfile;

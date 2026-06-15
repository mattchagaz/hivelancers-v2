import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import {
  FaArrowUpRightFromSquare,
  FaCamera,
  FaGripVertical,
  FaImage,
  FaLink,
  FaLocationDot,
  FaMedal,
} from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getMyProfileCustomization,
  saveMyProfileCustomization,
  updateProfile as apiUpdateProfile,
} from '../../../services/users';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
import CityAutocomplete from '../../CityAutocomplete/CityAutocomplete';
import {
  getFeaturedProject,
  getEmptyPortfolioProject,
  getProfileCompletion,
  getProfileLinks,
  getProfileMilestones,
  getPublicProfilePath,
  mergeProfileEnhancements,
} from '../../../utils/profileEnhancements';
import { getProfileLinkMeta } from '../../../utils/profileLinks';
import { buildCustomizeProfileErrors, normalizeExternalUrl } from '../../../utils/profileValidation';
import { SKILL_SUGGESTIONS } from '../../../utils/skillSuggestions';
import ConfirmDialog from '../../UI/ConfirmDialog/ConfirmDialog';
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
  const projectCoverFileRefs = useRef({});
  const projectGalleryFileRefs = useRef({});

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
  const [featuredProjectId, setFeaturedProjectId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCustomization, setLoadingCustomization] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingProjectId, setUploadingProjectId] = useState('');
  const [draggingProjectId, setDraggingProjectId] = useState('');
  const [projectRemoveConfirm, setProjectRemoveConfirm] = useState(null);
  const [galleryImageRemoveConfirm, setGalleryImageRemoveConfirm] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setProfile(profileFromUser(user));
      setSkills([]);
      setSocialLinks({
        linkedin: '',
        github: '',
        behance: '',
        dribbble: '',
        instagram: '',
        youtube: '',
      });
      setProjects([]);
      setFeaturedProjectId(null);
      setLoadingCustomization(false);
      return undefined;
    }

    const hydrate = async () => {
      setLoadingCustomization(true);
      const base = profileFromUser(user);
      try {
        const customization = await getMyProfileCustomization();
        if (cancelled) return;
        const merged = mergeProfileEnhancements(
          {
            ...user,
            ...base,
          },
          customization
        );
        setProfile(profileFromUser(merged));
        setSkills(merged.skills || []);
        setSocialLinks(merged.socialLinks || {});
        setProjects(merged.portfolioProjects || []);
        setFeaturedProjectId(merged.featuredProjectId || null);
      } catch (err) {
        if (cancelled) return;
        setProfile(base);
        setSkills([]);
        setSocialLinks({
          linkedin: '',
          github: '',
          behance: '',
          dribbble: '',
          instagram: '',
          youtube: '',
        });
        setProjects([]);
        setFeaturedProjectId(null);
        toast.error(err.message);
      } finally {
        if (!cancelled) setLoadingCustomization(false);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
          featuredProjectId,
          portfolioProjects: projects,
        }
      ),
    [user, profile, skills, socialLinks, featuredProjectId, projects]
  );

  const completion = useMemo(() => getProfileCompletion(previewProfile), [previewProfile]);
  const milestones = useMemo(() => getProfileMilestones(previewProfile), [previewProfile]);
  const visibleLinks = useMemo(() => getProfileLinks(previewProfile), [previewProfile]);
  const profilePath = useMemo(() => getPublicProfilePath({ ...user, username: profile.username }), [user, profile.username]);
  const previewSkills = useMemo(() => skills.slice(0, 4), [skills]);
  const featuredProject = useMemo(() => getFeaturedProject(previewProfile), [previewProfile]);
  const bioPreview = profile.bio.trim() || 'Adicione uma bio curta para explicar sua especialidade, seu estilo de trabalho e o tipo de projeto que você mais resolve.';
  const validation = useMemo(
    () => buildCustomizeProfileErrors({ profile, socialLinks, projects }),
    [profile, socialLinks, projects]
  );
  
  const inputClassName = (hasError) => `${styles.input} ${hasError ? styles.inputError : ''}`;
  
  const skillSuggestions = useMemo(() => {
    const query = skillInput.trim().toLowerCase();
    return SKILL_SUGGESTIONS.filter(
      (suggestion) =>
        !skills.some((skill) => skill.toLowerCase() === suggestion.toLowerCase()) &&
        (!query || suggestion.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [skillInput, skills]);

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (field, value) => {
    setSocialLinks((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = (rawValue = skillInput) => {
    const next = rawValue.trim();
    if (!next) return;
    if (skills.some((skill) => skill.toLowerCase() === next.toLowerCase())) {
      setSkillInput('');
      return;
    }
    if (skills.length >= 12) {
      toast.error('Você pode adicionar até 12 habilidades.');
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
      toast.error('Você pode destacar até 6 projetos.');
      return;
    }
    setProjects((prev) => {
      const nextProject = getEmptyPortfolioProject();
      const next = [...prev, { ...nextProject, position: prev.length }];
      if (!featuredProjectId) {
        setFeaturedProjectId(nextProject.id);
      }
      return next;
    });
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

  const reorderProjects = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setProjects((prev) => {
      const sourceIndex = prev.findIndex((project) => project.id === sourceId);
      const targetIndex = prev.findIndex((project) => project.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((project, index) => ({
        ...project,
        position: index,
      }));
    });
  };

  const moveProject = (projectId, direction) => {
    setProjects((prev) => {
      const index = prev.findIndex((project) => project.id === projectId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((project, position) => ({
        ...project,
        position,
      }));
    });
  };

  const removeProject = (projectId) => {
    setProjects((prev) => {
      const next = prev
        .filter((project) => project.id !== projectId)
        .map((project, position) => ({ ...project, position }));
      if (featuredProjectId === projectId) {
        setFeaturedProjectId(next[0]?.id || null);
      }
      return next;
    });
    setProjectRemoveConfirm(null);
  };

  const handleAvatarUpload = async (file) => {
    if (!file || uploadingAvatar) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const { url } = await uploadImageToCloudinary(file);
      updateProfileField('avatarUrl', url);
      try {
        const updated = await apiUpdateProfile({ avatarUrl: url });
        setUser(updated);
        setProfile((prev) => ({ ...prev, avatarUrl: updated.avatarUrl || url }));
        toast.success('Foto de perfil atualizada.');
      } catch (err) {
        toast.error('A foto foi enviada, mas não conseguimos salvar no perfil agora.');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProjectCoverUpload = async (projectId, file) => {
    if (!file || uploadingProjectId) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
      return;
    }
    setUploadingProjectId(projectId);
    try {
      const { url } = await uploadImageToCloudinary(file);
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? { ...project, coverImageUrl: url, imageUrl: url }
            : project
        )
      );
      toast.success('Capa do projeto carregada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingProjectId('');
    }
  };

  const handleProjectGalleryUpload = async (projectId, files) => {
    const list = Array.from(files || []);
    if (list.length === 0 || uploadingProjectId) return;
    if (list.some((file) => !file.type.startsWith('image/'))) {
      toast.error('Selecione apenas imagens válidas.');
      return;
    }
    setUploadingProjectId(projectId);
    try {
      const uploaded = [];
      for (const file of list.slice(0, 8)) {
        const { url } = await uploadImageToCloudinary(file);
        uploaded.push(url);
      }
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const nextImages = [...(project.images || []), ...uploaded.map((url, index) => ({
            id: `${projectId}_image_${Date.now()}_${index}`,
            url,
            position: (project.images || []).length + index,
          }))].slice(0, 8);
          return {
            ...project,
            images: nextImages.map((image, position) => ({ ...image, position })),
          };
        })
      );
      toast.success('Galeria do projeto atualizada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingProjectId('');
    }
  };

  const removeProjectGalleryImage = (projectId, imageId) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              images: (project.images || [])
                .filter((image) => image.id !== imageId)
                .map((image, position) => ({ ...image, position })),
            }
          : project
      )
    );
    setGalleryImageRemoveConfirm(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (validation.hasErrors) {
      toast.error('Revise os campos destacados (em vermelho) antes de salvar.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        username: profile.username.trim().toLowerCase(),
        headline: profile.headline.trim(),
        bio: profile.bio.trim(),
        location: profile.location.trim(),
        website: normalizeExternalUrl(profile.website),
        avatarUrl: profile.avatarUrl.trim(),
      };

      const updated = await apiUpdateProfile(payload);
      setUser(updated);
      setProfile((prev) => ({
        ...prev,
        ...profileFromUser(updated),
      }));
      const customization = await saveMyProfileCustomization({
        skills,
        socialLinks: Object.fromEntries(
          Object.entries(socialLinks).map(([key, value]) => [key, normalizeExternalUrl(value)])
        ),
        featuredProjectId,
        portfolioProjects: projects.map((project) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          coverImageUrl: normalizeExternalUrl(project.coverImageUrl || project.imageUrl || ''),
          projectUrl: normalizeExternalUrl(project.projectUrl),
          tags: project.tags || [],
          images: (project.images || []).map((image) => ({
            id: image.id,
            url: normalizeExternalUrl(image.url),
          })),
        })),
      });
      const merged = mergeProfileEnhancements(
        {
          ...updated,
          ...profileFromUser(updated),
        },
        customization
      );
      setSkills(merged.skills || []);
      setSocialLinks(merged.socialLinks || {});
      setProjects(merged.portfolioProjects || []);
      setFeaturedProjectId(merged.featuredProjectId || null);

      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Seu Nome';
  const initials = fullName.split(' ').map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className={styles.page}>
      
      {/* Hero / Header Section */}
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.heroBadge}>Personalizar Perfil</span>
          <h1 className={styles.heroTitle}>Monte uma vitrine forte para o seu trabalho.</h1>
          <p className={styles.heroText}>
            Organize sua identidade, links, habilidades e projetos em destaque. Deixe seu perfil profissional e preparado para receber novos clientes.
          </p>

          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={isSaving || loadingCustomization}>
              {loadingCustomization ? 'Carregando...' : isSaving ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate(profilePath)}>
              Ver Perfil Público
            </button>
          </div>

          <div className={styles.progressCard}>
            <div className={styles.progressHead}>
              <div>
                <span className={styles.progressLabel}>Força do Perfil</span>
                <strong>{completion.percent}% Completo</strong>
              </div>
              <span className={`${styles.progressPill} ${completion.isReadyForMission ? styles.progressPillReady : ''}`}>
                {completion.isReadyForMission ? 'Missão Atingida!' : 'Meta: 80%'}
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
            
            <div className={styles.milestoneRow}>
              {milestones.map((milestone) => (
                <div key={milestone.id} className={`${styles.milestoneCard} ${milestone.unlocked ? styles.milestoneCardUnlocked : ''}`}>
                  <div className={styles.milestoneHead}>
                    <span className={styles.milestoneIcon}><FaMedal /></span>
                    <strong>{milestone.title}</strong>
                  </div>
                  <p>{milestone.reward}</p>
                  <span>{milestone.unlocked ? 'Desbloqueado ✓' : `Faltam ${milestone.threshold}%`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <aside className={styles.previewCard}>
          <div className={styles.previewCover} />
          
          <div className={styles.previewTopBar}>
            <span className={styles.previewBadge}><FaStar /> Preview</span>
            <button
              type="button"
              className={styles.previewPhotoButton}
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <FaCamera /> {uploadingAvatar ? 'Enviando...' : 'Trocar Foto'}
            </button>
          </div>
          
          <div className={styles.previewAvatar}>
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className={styles.previewAvatarImg} /> : initials || 'U'}
          </div>
          
          <div className={styles.previewBody}>
            <strong>{fullName}</strong>
            <span>@{profile.username || 'usuario'}</span>
            <p>{profile.headline || 'Seu título profissional aparece aqui.'}</p>
            <div className={styles.previewMetaRow}>
              <span className={styles.previewMetaPill}><FaLocationDot /> {profile.location || 'Sua Cidade'}</span>
              <span className={styles.previewMetaPill}><FaLink /> {visibleLinks.length} links</span>
            </div>
          </div>
          
          <div className={styles.previewStats}>
            <div><span>Força</span><strong>{completion.percent}%</strong></div>
            <div><span>Links</span><strong>{visibleLinks.length}</strong></div>
            <div><span>Projetos</span><strong>{projects.length}</strong></div>
          </div>
          
          <div className={styles.previewSections}>
            <section className={styles.previewSection}>
              <div className={styles.previewSectionHead}>
                <span>Sobre</span>
              </div>
              <p className={styles.previewBio}>{bioPreview}</p>
            </section>

            <section className={styles.previewSection}>
              <div className={styles.previewSectionHead}>
                <span>Habilidades em destaque</span>
                <strong>{skills.length}</strong>
              </div>
              <div className={styles.previewSkillList}>
                {previewSkills.length > 0 ? (
                  previewSkills.map((skill) => <span key={skill} className={styles.previewSkillChip}>{skill}</span>)
                ) : (
                  <span className={styles.previewEmpty}>Suas principais skills vão aparecer aqui.</span>
                )}
              </div>
            </section>

            <section className={styles.previewSection}>
              <div className={styles.previewSectionHead}>
                <span>Projeto em destaque</span>
              </div>
              {featuredProject ? (
                <div className={styles.previewProjectCard}>
                  {featuredProject.imageUrl ? (
                    <img src={featuredProject.imageUrl} alt="Capa" className={styles.previewProjectImage} />
                  ) : (
                    <div className={styles.previewProjectFallback}>Sem capa</div>
                  )}
                  <div className={styles.previewProjectBody}>
                    <strong>{featuredProject.title || 'Projeto sem título'}</strong>
                    <p>{featuredProject.description || 'Adicione uma descrição curta para dar contexto.'}</p>
                  </div>
                </div>
              ) : (
                <span className={styles.previewEmpty}>Seu melhor projeto pode virar a prova visual principal.</span>
              )}
            </section>
          </div>
        </aside>
      </section>

      {/* Main Form Layout */}
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          
          {/* Identidade */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Identidade do Perfil</h2>
                <p>Informações básicas que aparecem primeiro para quem visita a sua página.</p>
              </div>
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
              <Field label="Nome" error={validation.profile.firstName}>
                <input className={inputClassName(validation.profile.firstName)} value={profile.firstName} onChange={(e) => updateProfileField('firstName', e.target.value)} />
              </Field>
              <Field label="Sobrenome" error={validation.profile.lastName}>
                <input className={inputClassName(validation.profile.lastName)} value={profile.lastName} onChange={(e) => updateProfileField('lastName', e.target.value)} />
              </Field>
              <Field label="Usuário público (URL)" error={validation.profile.username}>
                <div className={`${styles.inputWithPrefix} ${validation.profile.username ? styles.inputWithPrefixError : ''}`}>
                  <span className={styles.inputPrefix}>hivelancers.com/</span>
                  <input
                    className={styles.input}
                    value={profile.username}
                    placeholder="seuusuario"
                    onChange={(e) => updateProfileField('username', e.target.value.toLowerCase())}
                  />
                </div>
              </Field>
              <Field label="Título profissional">
                <input className={styles.input} placeholder="Ex: Desenvolvedor Front-end" value={profile.headline} onChange={(e) => updateProfileField('headline', e.target.value)} />
              </Field>
              <Field label="Localização">
                <CityAutocomplete
                  value={profile.location}
                  onChange={(value) => updateProfileField('location', value)}
                  placeholder="Ex: São Paulo, SP"
                  inputClassName={styles.input}
                />
              </Field>
              <Field label="Website principal" error={validation.profile.website}>
                <input className={inputClassName(validation.profile.website)} type="text" placeholder="https://seusite.com" value={profile.website} onChange={(e) => updateProfileField('website', e.target.value)} />
              </Field>
              <Field label="Resumo (Bio)" fullWidth hint={`${profile.bio.length}/280 caracteres`}>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  maxLength={280}
                  value={profile.bio}
                  onChange={(e) => updateProfileField('bio', e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência, especialidades e no que você pode ajudar..."
                />
              </Field>
            </div>
          </section>

          {/* Links e Redes Sociais */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Links profissionais</h2>
                <p>Centralize os lugares onde seu trabalho pode ser validado e acompanhado.</p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <Field label="LinkedIn" error={validation.socialLinks.linkedin}>
                <input className={inputClassName(validation.socialLinks.linkedin)} placeholder="linkedin.com/in/..." value={socialLinks.linkedin} onChange={(e) => updateSocialLink('linkedin', e.target.value)} />
              </Field>
              <Field label="GitHub" error={validation.socialLinks.github}>
                <input className={inputClassName(validation.socialLinks.github)} placeholder="github.com/..." value={socialLinks.github} onChange={(e) => updateSocialLink('github', e.target.value)} />
              </Field>
              <Field label="Behance" error={validation.socialLinks.behance}>
                <input className={inputClassName(validation.socialLinks.behance)} placeholder="behance.net/..." value={socialLinks.behance} onChange={(e) => updateSocialLink('behance', e.target.value)} />
              </Field>
              <Field label="Dribbble" error={validation.socialLinks.dribbble}>
                <input className={inputClassName(validation.socialLinks.dribbble)} placeholder="dribbble.com/..." value={socialLinks.dribbble} onChange={(e) => updateSocialLink('dribbble', e.target.value)} />
              </Field>
              <Field label="Instagram" error={validation.socialLinks.instagram}>
                <input className={inputClassName(validation.socialLinks.instagram)} placeholder="instagram.com/..." value={socialLinks.instagram} onChange={(e) => updateSocialLink('instagram', e.target.value)} />
              </Field>
              <Field label="YouTube" error={validation.socialLinks.youtube}>
                <input className={inputClassName(validation.socialLinks.youtube)} placeholder="youtube.com/..." value={socialLinks.youtube} onChange={(e) => updateSocialLink('youtube', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Habilidades */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Habilidades (Tags)</h2>
                <p>Adicione até 12 palavras-chave que definem as tecnologias e áreas que você domina.</p>
              </div>
            </div>

            <div className={styles.skillComposer}>
              <input
                className={styles.input}
                value={skillInput}
                placeholder="Ex: React, Figma, Copywriting (Pressione Enter para adicionar)"
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button type="button" className={styles.primaryButton} onClick={() => addSkill()}>
                Adicionar
              </button>
            </div>

            {skillSuggestions.length > 0 && (
              <div className={styles.suggestionRow}>
                {skillSuggestions.map((suggestion) => (
                  <button key={suggestion} type="button" className={styles.suggestionChip} onClick={() => addSkill(suggestion)}>
                    + {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.skillList}>
              {skills.length === 0 ? (
                <p className={styles.emptyText}>Nenhuma habilidade adicionada ainda.</p>
              ) : (
                skills.map((skill) => (
                  <span key={skill} className={styles.skillChip}>
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>×</button>
                  </span>
                ))
              )}
            </div>
          </section>

          {/* Portfólio / Projetos */}
          <section className={styles.card}>
            <div className={styles.sectionHead}>
              <div>
                <h2>Portfólio em Destaque</h2>
                <p>Crie uma vitrine com até 6 projetos que representem o seu melhor trabalho.</p>
              </div>
              <button type="button" className={styles.primaryButton} onClick={addProject}>
                + Adicionar Projeto
              </button>
            </div>

            {projects.length === 0 ? (
              <div className={styles.emptyBox}>
                <strong>Você ainda não adicionou nenhum projeto.</strong>
                <p>Use este espaço para dar prova visual da sua capacidade técnica e encantar clientes.</p>
              </div>
            ) : (
              <div className={styles.projectStack}>
                {projects.map((project, index) => (
                  <article
                    key={project.id}
                    className={`${styles.projectCard} ${draggingProjectId === project.id ? styles.projectCardDragging : ''}`}
                    draggable
                    onDragStart={() => setDraggingProjectId(project.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { reorderProjects(draggingProjectId, project.id); setDraggingProjectId(''); }}
                    onDragEnd={() => setDraggingProjectId('')}
                  >
                    <div className={styles.projectPreview}>
                      {project.coverImageUrl || project.imageUrl ? (
                        <img src={project.coverImageUrl || project.imageUrl} alt="Capa" className={styles.projectImage} />
                      ) : (
                        <div className={styles.projectFallback} onClick={() => projectCoverFileRefs.current[project.id]?.click()}>
                          <FaImage size={24} />
                          <span>Adicionar Capa</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.projectForm}>
                      <div className={styles.projectCardHead}>
                        <div className={styles.projectDragHandle}>
                          <FaGripVertical /> Mover
                        </div>
                        <div className={styles.projectActions}>
                          <button type="button" className={styles.ghostButton} onClick={() => moveProject(project.id, 'up')} disabled={index === 0}>↑</button>
                          <button type="button" className={styles.ghostButton} onClick={() => moveProject(project.id, 'down')} disabled={index === projects.length - 1}>↓</button>
                          <button type="button" className={styles.dangerButton} onClick={() => setProjectRemoveConfirm({ id: project.id, title: project.title })}>Remover</button>
                        </div>
                      </div>

                      <div className={styles.projectControls}>
                        <button
                          type="button"
                          className={`${styles.featuredButton} ${featuredProjectId === project.id ? styles.featuredButtonActive : ''}`}
                          onClick={() => setFeaturedProjectId(project.id)}
                        >
                          <FaStar /> {featuredProjectId === project.id ? 'Destaque Principal' : 'Marcar como Destaque'}
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={() => projectCoverFileRefs.current[project.id]?.click()}>
                          {uploadingProjectId === project.id ? 'Carregando...' : 'Trocar Capa'}
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={() => projectGalleryFileRefs.current[project.id]?.click()}>
                          + Galeria (Fotos)
                        </button>
                        
                        <input
                          ref={(node) => { projectCoverFileRefs.current[project.id] = node; }}
                          type="file" accept="image/*" className={styles.hiddenInput}
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleProjectCoverUpload(project.id, file); e.target.value = ''; }}
                        />
                        <input
                          ref={(node) => { projectGalleryFileRefs.current[project.id] = node; }}
                          type="file" multiple accept="image/*" className={styles.hiddenInput}
                          onChange={(e) => { if (e.target.files?.length) handleProjectGalleryUpload(project.id, e.target.files); e.target.value = ''; }}
                        />
                      </div>

                      {project.images?.length > 0 && (
                        <div className={styles.galleryStrip}>
                          {project.images.map((image) => (
                            <div key={image.id} className={styles.galleryThumb}>
                              <img src={image.url} alt="" className={styles.galleryThumbImg} />
                              <button type="button" className={styles.galleryThumbRemove} onClick={() => setGalleryImageRemoveConfirm({ projectId: project.id, imageId: image.id })}>×</button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.formGrid}>
                        <Field label="Nome do Projeto" error={validation.projects[project.id]?.title} fullWidth>
                          <input className={inputClassName(validation.projects[project.id]?.title)} value={project.title} onChange={(e) => updateProject(project.id, 'title', e.target.value)} />
                        </Field>
                        <Field label="Link Externo (Behance, GitHub, Site)" error={validation.projects[project.id]?.projectUrl}>
                          <input className={inputClassName(validation.projects[project.id]?.projectUrl)} value={project.projectUrl} placeholder="https://..." onChange={(e) => updateProject(project.id, 'projectUrl', e.target.value)} />
                        </Field>
                        <Field label="Tags de Tecnologia/Estilo" hint="Separadas por vírgula">
                          <input className={styles.input} value={project.tags.join(', ')} placeholder="Figma, React, UX" onChange={(e) => updateProject(project.id, 'tags', e.target.value)} />
                        </Field>
                        <Field label="Descrição Curta" fullWidth>
                          <textarea className={styles.textarea} rows={3} value={project.description} onChange={(e) => updateProject(project.id, 'description', e.target.value)} />
                        </Field>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Lateral */}
        <aside className={styles.sideColumn}>
          <div className={styles.sideSticky}>
            <section className={styles.sideCard}>
              <h3>Próximos Passos</h3>
              <p>O preenchimento do perfil é crucial para ganhar confiança na plataforma.</p>
              
              <div className={styles.missionList}>
                {completion.items.map((item) => (
                  <div key={item.id} className={styles.missionItem}>
                    <div className={`${styles.missionState} ${item.done ? styles.missionStateDone : ''}`}>
                      {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <div>
                      <strong>{item.label}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.sideCard}>
              <h3>Ações Rápidas</h3>
              <div className={styles.linkStack}>
                <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <Link to={profilePath} className={styles.sideLink}>Visualizar Perfil Público</Link>
                <Link to="/settings" className={styles.sideLink}>Configurações de Conta</Link>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={Boolean(projectRemoveConfirm)}
        title="Remover Projeto"
        description={`Tem certeza que deseja remover "${projectRemoveConfirm?.title || 'este projeto'}"?`}
        confirmLabel="Remover"
        onCancel={() => setProjectRemoveConfirm(null)}
        onConfirm={() => { if (projectRemoveConfirm) removeProject(projectRemoveConfirm.id); }}
      />
      
      <ConfirmDialog
        isOpen={Boolean(galleryImageRemoveConfirm)}
        title="Remover Foto"
        description="Esta foto será removida da galeria do projeto."
        confirmLabel="Remover"
        onCancel={() => setGalleryImageRemoveConfirm(null)}
        onConfirm={() => { if (galleryImageRemoveConfirm) removeProjectGalleryImage(galleryImageRemoveConfirm.projectId, galleryImageRemoveConfirm.imageId); }}
      />
      
      <Toaster position="top-center" richColors />
    </div>
  );
}

function Field({ label, hint, error, fullWidth = false, children }) {
  return (
    <label className={`${styles.field} ${fullWidth ? styles.fieldFull : ''}`}>
      <div className={styles.fieldMetaRow}>
        <span className={styles.fieldLabel}>{label}</span>
        {error && <span className={styles.fieldError}>{error}</span>}
      </div>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </label>
  );
}

export default CustomizeProfile;

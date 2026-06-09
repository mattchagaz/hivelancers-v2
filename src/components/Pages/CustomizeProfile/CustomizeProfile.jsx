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
import { toast } from 'sonner';
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
  const bioPreview = profile.bio.trim() || 'Adicione uma bio curta para explicar sua especialidade, seu estilo de trabalho e o tipo de projeto que voce mais resolve.';
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
      toast.error('Selecione uma imagem valida.');
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
        toast.error(err.message || 'A foto foi enviada, mas nao conseguimos salvar no perfil agora.');
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
      toast.error('Selecione uma imagem valida.');
      return;
    }
    setUploadingProjectId(projectId);
    try {
      const { url } = await uploadImageToCloudinary(file);
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                coverImageUrl: url,
                imageUrl: url,
              }
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
      toast.error('Selecione apenas imagens validas.');
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
      toast.error('Revise os campos destacados antes de salvar.');
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
            <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={isSaving || loadingCustomization}>
              {loadingCustomization ? 'Carregando...' : isSaving ? 'Salvando...' : 'Salvar perfil'}
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
            <div className={styles.milestoneRow}>
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`${styles.milestoneCard} ${milestone.unlocked ? styles.milestoneCardUnlocked : ''}`}
                >
                  <div className={styles.milestoneHead}>
                    <span className={styles.milestoneIcon}>
                      <FaMedal />
                    </span>
                    <strong>{milestone.title}</strong>
                  </div>
                  <p>{milestone.reward}</p>
                  <span>{milestone.unlocked ? 'Desbloqueado' : `${milestone.threshold}% necessario`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className={styles.previewCard}>
          <div className={styles.previewCover} />
          <div className={styles.previewTopBar}>
            <span className={styles.previewBadge}>
              <FaStar />
              Preview publico
            </span>
            <button
              type="button"
              className={styles.previewPhotoButton}
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <FaCamera />
              {uploadingAvatar ? 'Enviando...' : 'Atualizar foto'}
            </button>
          </div>
          <div className={styles.previewAvatar}>
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className={styles.previewAvatarImg} /> : initials || 'U'}
          </div>
          <div className={styles.previewBody}>
            <strong>{fullName}</strong>
            <span>{profile.username ? `@${profile.username}` : 'usuario-publico'}</span>
            <p>{profile.headline || 'Seu titulo profissional aparece aqui.'}</p>
            <div className={styles.previewMetaRow}>
              <span className={styles.previewMetaPill}>
                <FaLocationDot />
                {profile.location || 'Adicione sua cidade'}
              </span>
              <span className={styles.previewMetaPill}>
                <FaLink />
                {visibleLinks.length} link{visibleLinks.length === 1 ? '' : 's'} ativo{visibleLinks.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <div className={styles.previewStats}>
            <div>
              <span>Forca</span>
              <strong>{completion.percent}%</strong>
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
                  previewSkills.map((skill) => (
                    <span key={skill} className={styles.previewSkillChip}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className={styles.previewEmpty}>Suas principais skills vao aparecer aqui.</span>
                )}
              </div>
            </section>

            <section className={styles.previewSection}>
              <div className={styles.previewSectionHead}>
                <span>Links visiveis</span>
                <strong>{visibleLinks.length}</strong>
              </div>
              <div className={styles.previewLinks}>
                {visibleLinks.length > 0 ? (
                  visibleLinks.slice(0, 3).map((link) => {
                    const meta = getProfileLinkMeta(link.key);
                    const Icon = meta.icon;
                    return (
                    <a
                      key={link.key}
                      className={styles.previewLinkItem}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.previewLinkLabel}>
                        <Icon />
                        {meta.shortLabel || link.label}
                      </span>
                      <FaArrowUpRightFromSquare />
                    </a>
                    );
                  })
                ) : (
                  <span className={styles.previewEmpty}>Adicione ao menos um link para passar mais confianca.</span>
                )}
              </div>
            </section>

            <section className={styles.previewSection}>
              <div className={styles.previewSectionHead}>
                <span>Projeto em destaque</span>
                <strong>{featuredProject ? '1 pronto' : 'vazio'}</strong>
              </div>
              {featuredProject ? (
                <div className={styles.previewProjectCard}>
                  {featuredProject.imageUrl ? (
                    <img src={featuredProject.imageUrl} alt="" className={styles.previewProjectImage} />
                  ) : (
                    <div className={styles.previewProjectFallback}>Sem capa</div>
                  )}
                  <div className={styles.previewProjectBody}>
                    <strong>{featuredProject.title || 'Projeto sem titulo'}</strong>
                    <p>
                      {featuredProject.description || 'Adicione uma descricao curta para dar contexto ao trabalho mostrado no perfil.'}
                    </p>
                    {featuredProject.projectUrl ? (
                      <a
                        href={normalizeExternalUrl(featuredProject.projectUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.previewProjectLink}
                      >
                        Ver projeto
                        <FaArrowUpRightFromSquare />
                      </a>
                    ) : null}
                    {featuredProject.images?.length > 0 ? (
                      <span className={styles.previewGalleryCount}>
                        +{featuredProject.images.length} foto{featuredProject.images.length === 1 ? '' : 's'} na galeria
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <span className={styles.previewEmpty}>Seu melhor projeto pode virar a prova visual principal do perfil.</span>
              )}
            </section>
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
              <Field label="Nome" error={validation.profile.firstName}>
                <input className={inputClassName(validation.profile.firstName)} value={profile.firstName} onChange={(e) => updateProfileField('firstName', e.target.value)} />
              </Field>
              <Field label="Sobrenome" error={validation.profile.lastName}>
                <input className={inputClassName(validation.profile.lastName)} value={profile.lastName} onChange={(e) => updateProfileField('lastName', e.target.value)} />
              </Field>
              <Field label="Usuario publico" error={validation.profile.username}>
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
              <Field label="Website principal" error={validation.profile.website}>
                <input
                  className={inputClassName(validation.profile.website)}
                  type="text"
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

            {skillSuggestions.length > 0 ? (
              <div className={styles.suggestionRow}>
                {skillSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={styles.suggestionChip}
                    onClick={() => {
                      addSkill(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

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
                {projects.map((project, index) => (
                  <article
                    key={project.id}
                    className={`${styles.projectCard} ${draggingProjectId === project.id ? styles.projectCardDragging : ''}`}
                    draggable
                    onDragStart={() => setDraggingProjectId(project.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      reorderProjects(draggingProjectId, project.id);
                      setDraggingProjectId('');
                    }}
                    onDragEnd={() => setDraggingProjectId('')}
                  >
                    <div className={styles.projectPreview}>
                      {project.coverImageUrl || project.imageUrl ? (
                        <img src={project.coverImageUrl || project.imageUrl} alt="" className={styles.projectImage} />
                      ) : (
                        <div className={styles.projectFallback}>Projeto</div>
                      )}
                    </div>

                    <div className={styles.projectForm}>
                      <div className={styles.projectCardHead}>
                        <div className={styles.projectDragHandle}>
                          <FaGripVertical />
                          <span>Arraste para ordenar</span>
                        </div>
                        <button
                          type="button"
                          className={`${styles.featuredButton} ${featuredProjectId === project.id ? styles.featuredButtonActive : ''}`}
                          onClick={() => setFeaturedProjectId(project.id)}
                        >
                          <FaStar />
                          {featuredProjectId === project.id ? 'Projeto em destaque' : 'Definir destaque'}
                        </button>
                      </div>

                      <div className={styles.projectActions}>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => projectCoverFileRefs.current[project.id]?.click()}
                          disabled={uploadingProjectId === project.id}
                        >
                          {uploadingProjectId === project.id ? 'Enviando capa...' : 'Trocar capa'}
                        </button>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => projectGalleryFileRefs.current[project.id]?.click()}
                          disabled={uploadingProjectId === project.id}
                        >
                          <FaImage />
                          Adicionar fotos
                        </button>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => moveProject(project.id, 'up')}
                          disabled={index === 0}
                        >
                          Subir
                        </button>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => moveProject(project.id, 'down')}
                          disabled={index === projects.length - 1}
                        >
                          Descer
                        </button>
                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={() => setProjectRemoveConfirm({ id: project.id, title: project.title })}
                        >
                          Remover
                        </button>
                        <input
                          ref={(node) => {
                            projectCoverFileRefs.current[project.id] = node;
                          }}
                          type="file"
                          accept="image/*"
                          className={styles.hiddenInput}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProjectCoverUpload(project.id, file);
                            e.target.value = '';
                          }}
                        />
                        <input
                          ref={(node) => {
                            projectGalleryFileRefs.current[project.id] = node;
                          }}
                          type="file"
                          multiple
                          accept="image/*"
                          className={styles.hiddenInput}
                          onChange={(e) => {
                            if (e.target.files?.length) handleProjectGalleryUpload(project.id, e.target.files);
                            e.target.value = '';
                          }}
                        />
                      </div>

                      {project.images?.length > 0 ? (
                        <div className={styles.galleryStrip}>
                          {project.images.map((image) => (
                            <div key={image.id} className={styles.galleryThumb}>
                              <img src={image.url} alt="" className={styles.galleryThumbImg} />
                              <button
                                type="button"
                                className={styles.galleryThumbRemove}
                                onClick={() =>
                                  setGalleryImageRemoveConfirm({
                                    projectId: project.id,
                                    imageId: image.id,
                                    projectTitle: project.title,
                                  })
                                }
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.galleryEmpty}>
                          Adicione fotos extras para mostrar mais detalhes alem da capa.
                        </div>
                      )}

                      <div className={styles.formGrid}>
                        <Field label="Titulo do projeto" error={validation.projects[project.id]?.title}>
                          <input className={inputClassName(validation.projects[project.id]?.title)} value={project.title} onChange={(e) => updateProject(project.id, 'title', e.target.value)} />
                        </Field>
                        <Field label="Link do projeto" error={validation.projects[project.id]?.projectUrl}>
                          <input className={inputClassName(validation.projects[project.id]?.projectUrl)} value={project.projectUrl} placeholder="https://..." onChange={(e) => updateProject(project.id, 'projectUrl', e.target.value)} />
                        </Field>
                        <Field label="Tags" hint="Separe por virgula" fullWidth>
                          <input
                            className={styles.input}
                            value={project.tags.join(', ')}
                            placeholder="Branding, Figma, Landing page"
                            onChange={(e) => updateProject(project.id, 'tags', e.target.value)}
                          />
                        </Field>
                        <Field
                          label="Capa principal"
                          error={validation.projects[project.id]?.coverImageUrl}
                          fullWidth
                          hint="A capa aparece no card e no projeto em destaque."
                        >
                          <input
                            className={inputClassName(validation.projects[project.id]?.coverImageUrl)}
                            value={project.coverImageUrl || ''}
                            placeholder="https://..."
                            onChange={(e) => updateProject(project.id, 'coverImageUrl', e.target.value)}
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
            <div className={styles.missionMilestones}>
              {milestones.map((milestone) => (
                <div key={milestone.id} className={`${styles.missionMilestone} ${milestone.unlocked ? styles.missionMilestoneUnlocked : ''}`}>
                  <strong>{milestone.title}</strong>
                  <span>{milestone.unlocked ? 'Liberado' : `${milestone.threshold}%`}</span>
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

      <ConfirmDialog
        isOpen={Boolean(projectRemoveConfirm)}
        title="Remover projeto?"
        description={`O projeto "${projectRemoveConfirm?.title || 'selecionado'}" será removido do seu portfólio.`}
        confirmLabel="Remover projeto"
        onCancel={() => setProjectRemoveConfirm(null)}
        onConfirm={() => {
          if (projectRemoveConfirm) removeProject(projectRemoveConfirm.id);
        }}
      />
      <ConfirmDialog
        isOpen={Boolean(galleryImageRemoveConfirm)}
        title="Remover foto do projeto?"
        description={`Esta foto será removida da galeria de "${galleryImageRemoveConfirm?.projectTitle || 'projeto'}".`}
        confirmLabel="Remover foto"
        onCancel={() => setGalleryImageRemoveConfirm(null)}
        onConfirm={() => {
          if (galleryImageRemoveConfirm) {
            removeProjectGalleryImage(galleryImageRemoveConfirm.projectId, galleryImageRemoveConfirm.imageId);
          }
        }}
      />
    </div>
  );
}

function Field({ label, hint, error, fullWidth = false, children }) {
  return (
    <label className={`${styles.field} ${fullWidth ? styles.fieldFull : ''}`}>
      <div className={styles.fieldMetaRow}>
        <span className={styles.fieldLabel}>{label}</span>
        {error ? <span className={styles.fieldError}>{error}</span> : null}
      </div>
      {children}
      {hint ? <span className={styles.fieldHint}>{hint}</span> : null}
    </label>
  );
}

export default CustomizeProfile;

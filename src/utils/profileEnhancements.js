const DEFAULT_SOCIAL_LINKS = {
  linkedin: '',
  github: '',
  behance: '',
  dribbble: '',
  instagram: '',
  youtube: '',
};

const emptyProject = () => ({
  id: `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  description: '',
  coverImageUrl: '',
  imageUrl: '',
  projectUrl: '',
  tags: [],
  position: 0,
  isFeatured: false,
  images: [],
});

const parseMaybeJson = (value) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const normalizeExternalUrl = (value = '') => {
  const next = String(value || '').trim();
  if (!next) return '';
  if (/^https?:\/\//i.test(next)) return next;
  return `https://${next}`;
};

export const normalizeSkills = (value) => {
  const parsed = parseMaybeJson(value) ?? value;
  if (!Array.isArray(parsed)) return [];

  const seen = new Set();
  return parsed
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
};

export const normalizeSocialLinks = (value) => {
  const parsed = parseMaybeJson(value);
  const source = parsed && typeof parsed === 'object' ? parsed : value;
  return Object.keys(DEFAULT_SOCIAL_LINKS).reduce((acc, key) => {
    acc[key] = normalizeExternalUrl(source?.[key] || '');
    return acc;
  }, { ...DEFAULT_SOCIAL_LINKS });
};

export const normalizePortfolioProjects = (value) => {
  const parsed = parseMaybeJson(value) ?? value;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item, index) => {
      const images = Array.isArray(item?.images)
        ? item.images
            .map((image, imageIndex) => ({
              id: String(image?.id || `${item?.id || `project_${index}`}_image_${imageIndex}`),
              url: normalizeExternalUrl(image?.url || ''),
              position: Number.isFinite(image?.position) ? Number(image.position) : imageIndex,
            }))
            .filter((image) => image.url)
            .sort((a, b) => a.position - b.position)
            .slice(0, 8)
        : [];

      const coverImageUrl = normalizeExternalUrl(
        item?.coverImageUrl || item?.imageUrl || images[0]?.url || ''
      );

      return {
        id: String(item?.id || `project_${index}`),
        title: String(item?.title || '').trim(),
        description: String(item?.description || '').trim(),
        coverImageUrl,
        imageUrl: coverImageUrl,
        projectUrl: normalizeExternalUrl(item?.projectUrl || ''),
        tags: normalizeSkills(item?.tags).slice(0, 5),
        position: Number.isFinite(item?.position) ? Number(item.position) : index,
        isFeatured: Boolean(item?.isFeatured),
        images,
      };
    })
    .filter(
      (item) =>
        item.title ||
        item.description ||
        item.coverImageUrl ||
        item.projectUrl ||
        item.tags.length > 0 ||
        item.images.length > 0
    )
    .sort((a, b) => a.position - b.position)
    .slice(0, 6);
};

export const getEmptyPortfolioProject = emptyProject;

export const mergeProfileEnhancements = (profile, enhancements) => {
  const portfolioProjects = normalizePortfolioProjects(
    enhancements?.portfolioProjects ?? profile?.portfolioProjects
  );
  const featuredProjectId =
    enhancements?.featuredProjectId ??
    profile?.featuredProjectId ??
    portfolioProjects.find((project) => project.isFeatured)?.id ??
    null;

  return {
    ...profile,
    skills: normalizeSkills(enhancements?.skills ?? profile?.skills),
    socialLinks: normalizeSocialLinks(enhancements?.socialLinks ?? profile?.socialLinks),
    featuredProjectId,
    portfolioProjects: portfolioProjects.map((project) => ({
      ...project,
      isFeatured: featuredProjectId ? project.id === featuredProjectId : project.isFeatured,
    })),
  };
};

export const getFeaturedProject = (profile) => {
  const projects = normalizePortfolioProjects(profile?.portfolioProjects);
  const featuredId = profile?.featuredProjectId;
  return (
    projects.find((project) => project.id === featuredId) ||
    projects.find((project) => project.isFeatured) ||
    projects[0] ||
    null
  );
};

export const getProfileCompletion = (profile) => {
  const portfolioProjects = normalizePortfolioProjects(profile?.portfolioProjects);
  const items = [
    { id: 'avatar', label: 'Foto de perfil', weight: 10, done: Boolean(profile?.avatarUrl) },
    {
      id: 'name',
      label: 'Nome completo',
      weight: 10,
      done: Boolean(String(profile?.firstName || '').trim() && String(profile?.lastName || '').trim()),
    },
    { id: 'username', label: 'Usuario publico', weight: 10, done: Boolean(profile?.username) },
    { id: 'headline', label: 'Titulo profissional', weight: 10, done: Boolean(profile?.headline) },
    { id: 'bio', label: 'Bio com contexto', weight: 15, done: Boolean(String(profile?.bio || '').trim()) },
    { id: 'location', label: 'Localizacao', weight: 10, done: Boolean(profile?.location) },
    {
      id: 'link',
      label: 'Ao menos um link',
      weight: 10,
      done: Boolean(
        profile?.website ||
        Object.values(normalizeSocialLinks(profile?.socialLinks)).some(Boolean)
      ),
    },
    {
      id: 'skills',
      label: 'Tres habilidades',
      weight: 10,
      done: normalizeSkills(profile?.skills).length >= 3,
    },
    {
      id: 'projects',
      label: 'Projeto com imagem',
      weight: 15,
      done: portfolioProjects.some((project) => (project.coverImageUrl || project.images[0]?.url) && project.title),
    },
  ];

  const percent = items.reduce((acc, item) => acc + (item.done ? item.weight : 0), 0);
  return {
    percent,
    items,
    isReadyForMission: percent >= 80,
  };
};

export const getProfileMilestones = (profile) => {
  const completion = getProfileCompletion(profile);
  const milestones = [
    {
      id: 'starter',
      title: 'Perfil montado',
      threshold: 40,
      reward: 'Comeca a passar confianca',
    },
    {
      id: 'trusted',
      title: 'Perfil confiavel',
      threshold: 80,
      reward: 'Desbloqueia a missao principal',
    },
    {
      id: 'showcase',
      title: 'Vitrine premium',
      threshold: 100,
      reward: 'Perfil pronto para campanhas e portfolio',
    },
  ];

  return milestones.map((milestone) => ({
    ...milestone,
    unlocked: completion.percent >= milestone.threshold,
  }));
};

export const getPublicProfilePath = (user) => {
  if (!user) return '/dashboard';
  return `/profile/${user.username || user.id}`;
};

export const getProfileLinks = (profile) => {
  const socialLinks = normalizeSocialLinks(profile?.socialLinks);
  const links = [
    profile?.website ? { key: 'website', label: 'Website', href: normalizeExternalUrl(profile.website) } : null,
    socialLinks.linkedin ? { key: 'linkedin', label: 'LinkedIn', href: socialLinks.linkedin } : null,
    socialLinks.github ? { key: 'github', label: 'GitHub', href: socialLinks.github } : null,
    socialLinks.behance ? { key: 'behance', label: 'Behance', href: socialLinks.behance } : null,
    socialLinks.dribbble ? { key: 'dribbble', label: 'Dribbble', href: socialLinks.dribbble } : null,
    socialLinks.instagram ? { key: 'instagram', label: 'Instagram', href: socialLinks.instagram } : null,
    socialLinks.youtube ? { key: 'youtube', label: 'YouTube', href: socialLinks.youtube } : null,
  ];
  return links.filter(Boolean);
};

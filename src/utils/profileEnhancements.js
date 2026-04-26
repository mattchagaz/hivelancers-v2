const STORAGE_KEY = 'hv_profile_enhancements';

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
  imageUrl: '',
  projectUrl: '',
  tags: [],
});

const isBrowser = typeof window !== 'undefined';

const readStorage = () => {
  if (!isBrowser) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStorage = (value) => {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const parseMaybeJson = (value) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeLink = (value = '') => {
  const next = String(value || '').trim();
  if (!next) return '';
  if (/^https?:\/\//i.test(next)) return next;
  return `https://${next}`;
};

export const normalizeSkills = (value) => {
  const parsed = parseMaybeJson(value) ?? value;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 12);
};

export const normalizeSocialLinks = (value) => {
  const parsed = parseMaybeJson(value);
  const source = parsed && typeof parsed === 'object' ? parsed : value;
  return Object.keys(DEFAULT_SOCIAL_LINKS).reduce((acc, key) => {
    acc[key] = normalizeLink(source?.[key] || '');
    return acc;
  }, { ...DEFAULT_SOCIAL_LINKS });
};

export const normalizePortfolioProjects = (value) => {
  const parsed = parseMaybeJson(value) ?? value;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item, index) => ({
      id: String(item?.id || `project_${index}`),
      title: String(item?.title || '').trim(),
      description: String(item?.description || '').trim(),
      imageUrl: normalizeLink(item?.imageUrl || ''),
      projectUrl: normalizeLink(item?.projectUrl || ''),
      tags: normalizeSkills(item?.tags).slice(0, 5),
    }))
    .filter((item) => item.title || item.description || item.imageUrl || item.projectUrl || item.tags.length > 0)
    .slice(0, 6);
};

export const getEmptyPortfolioProject = emptyProject;

export const getStoredProfileEnhancements = (userId) => {
  if (!userId) {
    return {
      skills: [],
      socialLinks: { ...DEFAULT_SOCIAL_LINKS },
      portfolioProjects: [],
    };
  }

  const all = readStorage();
  const entry = all[userId] || {};

  return {
    skills: normalizeSkills(entry.skills),
    socialLinks: normalizeSocialLinks(entry.socialLinks),
    portfolioProjects: normalizePortfolioProjects(entry.portfolioProjects),
  };
};

export const saveStoredProfileEnhancements = (userId, value) => {
  if (!userId) return;
  const all = readStorage();
  all[userId] = {
    skills: normalizeSkills(value?.skills),
    socialLinks: normalizeSocialLinks(value?.socialLinks),
    portfolioProjects: normalizePortfolioProjects(value?.portfolioProjects),
  };
  writeStorage(all);
};

export const mergeProfileEnhancements = (profile, enhancements) => ({
  ...profile,
  skills: normalizeSkills(enhancements?.skills ?? profile?.skills),
  socialLinks: normalizeSocialLinks(enhancements?.socialLinks ?? profile?.socialLinks),
  portfolioProjects: normalizePortfolioProjects(
    enhancements?.portfolioProjects ?? profile?.portfolioProjects
  ),
});

export const getProfileCompletion = (profile) => {
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
      done: normalizePortfolioProjects(profile?.portfolioProjects).some(
        (project) => project.imageUrl && project.title
      ),
    },
  ];

  const percent = items.reduce((acc, item) => acc + (item.done ? item.weight : 0), 0);
  return {
    percent,
    items,
    isReadyForMission: percent >= 80,
  };
};

export const getPublicProfilePath = (user) => {
  if (!user) return '/dashboard';
  return `/profile/${user.username || user.id}`;
};

export const getProfileLinks = (profile) => {
  const socialLinks = normalizeSocialLinks(profile?.socialLinks);
  const links = [
    profile?.website ? { key: 'website', label: 'Website', href: normalizeLink(profile.website) } : null,
    socialLinks.linkedin ? { key: 'linkedin', label: 'LinkedIn', href: socialLinks.linkedin } : null,
    socialLinks.github ? { key: 'github', label: 'GitHub', href: socialLinks.github } : null,
    socialLinks.behance ? { key: 'behance', label: 'Behance', href: socialLinks.behance } : null,
    socialLinks.dribbble ? { key: 'dribbble', label: 'Dribbble', href: socialLinks.dribbble } : null,
    socialLinks.instagram ? { key: 'instagram', label: 'Instagram', href: socialLinks.instagram } : null,
    socialLinks.youtube ? { key: 'youtube', label: 'YouTube', href: socialLinks.youtube } : null,
  ];
  return links.filter(Boolean);
};

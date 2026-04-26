const USERNAME_REGEX = /^[a-z0-9_.]+$/;

export const normalizeExternalUrl = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(normalizeExternalUrl(value));
    return ['http:', 'https:'].includes(url.protocol) && (url.hostname.includes('.') || url.hostname === 'localhost');
  } catch {
    return false;
  }
};

export const validateUsername = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.length < 3) return 'Use pelo menos 3 caracteres.';
  if (trimmed.length > 30) return 'Use no maximo 30 caracteres.';
  if (!USERNAME_REGEX.test(trimmed)) return 'Use apenas letras minusculas, numeros, . e _.';
  return '';
};

export const validateOptionalUrl = (value = '', label = 'Link') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (!isValidHttpUrl(trimmed)) return `${label} precisa ser um link valido.`;
  return '';
};

export const buildCustomizeProfileErrors = ({ profile, socialLinks, projects }) => {
  const profileErrors = {
    firstName: String(profile?.firstName || '').trim() ? '' : 'Informe seu nome.',
    lastName: String(profile?.lastName || '').trim() ? '' : 'Informe seu sobrenome.',
    username: validateUsername(profile?.username),
    website: validateOptionalUrl(profile?.website, 'Website'),
  };

  const socialErrors = Object.entries(socialLinks || {}).reduce((acc, [key, value]) => {
    acc[key] = validateOptionalUrl(value, key.charAt(0).toUpperCase() + key.slice(1));
    return acc;
  }, {});

  const projectErrors = (projects || []).reduce((acc, project) => {
    const projectUrlError = validateOptionalUrl(project?.projectUrl, 'Link do projeto');
    const coverImageUrlError = validateOptionalUrl(project?.coverImageUrl || project?.imageUrl, 'Capa do projeto');
    const hasProjectContent = Boolean(
      String(project?.title || '').trim() ||
        String(project?.description || '').trim() ||
        String(project?.coverImageUrl || '').trim() ||
        String(project?.imageUrl || '').trim() ||
        String(project?.projectUrl || '').trim() ||
        (project?.images || []).length > 0 ||
        (project?.tags || []).length > 0
    );

    const titleError =
      hasProjectContent && !String(project?.title || '').trim()
        ? 'Adicione um titulo para esse projeto.'
        : '';

    if (projectUrlError || coverImageUrlError || titleError) {
      acc[project.id] = {
        coverImageUrl: coverImageUrlError,
        projectUrl: projectUrlError,
        title: titleError,
      };
    }
    return acc;
  }, {});

  const hasErrors =
    Object.values(profileErrors).some(Boolean) ||
    Object.values(socialErrors).some(Boolean) ||
    Object.values(projectErrors).some((entry) => Object.values(entry).some(Boolean));

  return {
    profile: profileErrors,
    socialLinks: socialErrors,
    projects: projectErrors,
    hasErrors,
  };
};

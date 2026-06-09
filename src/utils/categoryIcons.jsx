import {
  FaBoxOpen,
  FaBriefcase,
  FaBullhorn,
  FaChartLine,
  FaCode,
  FaGlobeAmericas,
  FaHeadphones,
  FaHeart,
  FaLanguage,
  FaLeaf,
  FaLaptopCode,
  FaMusic,
  FaPalette,
  FaPenNib,
  FaPaintBrush,
  FaUserTie,
  FaVideo,
} from 'react-icons/fa';

const CATEGORY_ICON_MAP = {
  palette: FaPalette,
  design: FaPaintBrush,
  code: FaCode,
  desenvolvimento: FaLaptopCode,
  development: FaLaptopCode,
  megaphone: FaBullhorn,
  marketing: FaChartLine,
  'marketing-digital': FaChartLine,
  pen: FaPenNib,
  redacao: FaPenNib,
  'redacao-e-traducao': FaLanguage,
  traducao: FaLanguage,
  video: FaVideo,
  'video-e-animacao': FaVideo,
  animacao: FaVideo,
  headphones: FaHeadphones,
  audio: FaMusic,
  musica: FaMusic,
  'musica-e-audio': FaMusic,
  briefcase: FaBriefcase,
  negocios: FaUserTie,
  business: FaUserTie,
  heart: FaHeart,
  lifestyle: FaLeaf,
  'estilo-de-vida': FaLeaf,
  globe: FaGlobeAmericas,
};

const normalizeIconKey = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// eslint-disable-next-line react-refresh/only-export-components
export const getCategoryIconKey = (category) => {
  if (typeof category === 'string') return normalizeIconKey(category);
  return normalizeIconKey(category?.iconKey || category?.slug || category?.name || category?.icon || '');
};

export function CategoryIcon({ category, className }) {
  const iconKey = getCategoryIconKey(category);
  const Icon = CATEGORY_ICON_MAP[iconKey] || FaBoxOpen;
  return <Icon className={className} aria-hidden="true" />;
}

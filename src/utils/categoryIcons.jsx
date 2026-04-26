import {
  FaBoxOpen,
  FaBriefcase,
  FaBullhorn,
  FaCode,
  FaGlobeAmericas,
  FaHeadphones,
  FaHeart,
  FaPalette,
  FaPenNib,
  FaVideo,
} from 'react-icons/fa';

const CATEGORY_ICON_MAP = {
  palette: FaPalette,
  code: FaCode,
  megaphone: FaBullhorn,
  pen: FaPenNib,
  video: FaVideo,
  headphones: FaHeadphones,
  briefcase: FaBriefcase,
  heart: FaHeart,
  globe: FaGlobeAmericas,
};

export const getCategoryIconKey = (category) => {
  if (typeof category === 'string') return category;
  return category?.iconKey || category?.icon || null;
};

export function CategoryIcon({ category, className }) {
  const iconKey = getCategoryIconKey(category);
  const Icon = CATEGORY_ICON_MAP[iconKey] || FaBoxOpen;
  return <Icon className={className} aria-hidden="true" />;
}

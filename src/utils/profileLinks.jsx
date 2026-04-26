import {
  FaBehance,
  FaDribbble,
  FaExternalLinkAlt,
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from 'react-icons/fa';

const PROFILE_LINK_META = {
  website: { label: 'Website', shortLabel: 'Site', icon: FaGlobe },
  linkedin: { label: 'LinkedIn', shortLabel: 'LinkedIn', icon: FaLinkedinIn },
  github: { label: 'GitHub', shortLabel: 'GitHub', icon: FaGithub },
  behance: { label: 'Behance', shortLabel: 'Behance', icon: FaBehance },
  dribbble: { label: 'Dribbble', shortLabel: 'Dribbble', icon: FaDribbble },
  instagram: { label: 'Instagram', shortLabel: 'Instagram', icon: FaInstagram },
  youtube: { label: 'YouTube', shortLabel: 'YouTube', icon: FaYoutube },
};

const fallbackMeta = { label: 'Link externo', shortLabel: 'Link', icon: FaExternalLinkAlt };

export const getProfileLinkMeta = (key) => PROFILE_LINK_META[key] || fallbackMeta;

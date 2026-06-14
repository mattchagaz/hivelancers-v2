import { getCategoryIconKey } from './categoryIcons';

const unsplash = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const CATEGORY_IMAGE_MAP = {
  all: unsplash('photo-1497366811353-6870744d04b2'),
  globe: unsplash('photo-1497366811353-6870744d04b2'),
  todas: unsplash('photo-1497366811353-6870744d04b2'),
  desenvolvimento: unsplash('photo-1498050108023-c5249f4df085'),
  development: unsplash('photo-1498050108023-c5249f4df085'),
  code: unsplash('photo-1498050108023-c5249f4df085'),
  design: unsplash('photo-1518005020951-eccb494ad742'),
  palette: unsplash('photo-1518005020951-eccb494ad742'),
  'video-e-animacao': unsplash('photo-1492691527719-9d1e07e534b4'),
  video: unsplash('photo-1492691527719-9d1e07e534b4'),
  animacao: unsplash('photo-1492691527719-9d1e07e534b4'),
  marketing: unsplash('photo-1460925895917-afdab827c52f'),
  'marketing-digital': unsplash('photo-1460925895917-afdab827c52f'),
  megaphone: unsplash('photo-1460925895917-afdab827c52f'),
  escrita: unsplash('photo-1455390582262-044cdead277a'),
  redacao: unsplash('photo-1455390582262-044cdead277a'),
  'redacao-e-traducao': unsplash('photo-1455390582262-044cdead277a'),
  'redacao-traducao': unsplash('photo-1455390582262-044cdead277a'),
  traducao: unsplash('photo-1455390582262-044cdead277a'),
  pen: unsplash('photo-1455390582262-044cdead277a'),
  audio: unsplash('photo-1511379938547-c1f69419868d'),
  musica: unsplash('photo-1511379938547-c1f69419868d'),
  'musica-e-audio': unsplash('photo-1511379938547-c1f69419868d'),
  headphones: unsplash('photo-1511379938547-c1f69419868d'),
  negocios: unsplash('photo-1556761175-b413da4baf72'),
  business: unsplash('photo-1556761175-b413da4baf72'),
  briefcase: unsplash('photo-1556761175-b413da4baf72'),
  ia: unsplash('photo-1677442136019-21780ecad995'),
  ai: unsplash('photo-1677442136019-21780ecad995'),
  robot: unsplash('photo-1677442136019-21780ecad995'),
  magic: unsplash('photo-1677442136019-21780ecad995'),
  'estilo-de-vida': unsplash('photo-1500530855697-b586d89ba3ee'),
  lifestyle: unsplash('photo-1500530855697-b586d89ba3ee'),
  heart: unsplash('photo-1500530855697-b586d89ba3ee'),
};

export const getCategoryImageUrl = (category) => {
  const key = getCategoryIconKey(category);
  return CATEGORY_IMAGE_MAP[key] || CATEGORY_IMAGE_MAP.all;
};

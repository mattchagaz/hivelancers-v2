import { api } from './api';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const uploadImageToCloudinary = async (file) => {
  if (!file || !ALLOWED_IMAGE_TYPES.has(file.type?.toLowerCase())) {
    throw new Error('Envie uma imagem JPEG, PNG ou WebP.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('A imagem deve ter no máximo 4 MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  try {
    const { data } = await api.post('/uploads/images', formData);
    return data.image;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Falha ao enviar imagem.');
  }
};

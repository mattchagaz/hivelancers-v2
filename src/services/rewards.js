import { api } from './api';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

export const getMyRewards = async () => {
  try {
    const { data } = await api.get('/rewards/me');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar suas recompensas.'));
  }
};

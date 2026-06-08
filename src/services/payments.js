import { api } from './api';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.details) {
    const first = Object.values(data.details).flat()[0];
    if (first) return first;
  }
  return data?.message || fallback;
};

export const createCheckoutSession = async (payload) => {
  try {
    const { data } = await api.post('/payments/checkout-sessions', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível iniciar o pagamento.'));
  }
};

export const getCheckoutSessionStatus = async (sessionId) => {
  try {
    const { data } = await api.get(`/payments/checkout-sessions/${sessionId}`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível verificar o status do pagamento.'));
  }
};

export const getMyStripeConnectStatus = async () => {
  try {
    const { data } = await api.get('/payments/me/connect-account');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar o status da Stripe.'));
  }
};

export const createMyStripeConnectOnboardingLink = async () => {
  try {
    const { data } = await api.post('/payments/me/connect-account/onboarding-link');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível abrir a conexão com a Stripe.'));
  }
};

export const createMyStripeConnectDashboardLink = async () => {
  try {
    const { data } = await api.post('/payments/me/connect-account/dashboard-link');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível abrir o painel da Stripe.'));
  }
};

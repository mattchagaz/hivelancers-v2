import { api } from './api';

const extractMessage = (error, fallback) => {
  const data = error?.response?.data;
  const message = data?.message || error?.message || '';

  if (message.includes("You can only create new accounts if you've signed up for Connect")) {
    return 'A conta Stripe da Hivelancers ainda não está ativada como plataforma Connect. Complete o cadastro do Connect no Dashboard da Stripe usando a mesma chave do backend.';
  }

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

export const createProjectCheckoutSession = async (payload) => {
  try {
    const { data } = await api.post('/payments/project-checkout-sessions', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível iniciar o pagamento do projeto.'));
  }
};

export const getCheckoutOptions = async (params) => {
  try {
    const { data } = await api.get('/payments/checkout-options', { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível consultar as formas de pagamento.'));
  }
};

export const getMyPixPayoutAccount = async () => {
  try {
    const { data } = await api.get('/payments/me/pix-payout-account');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar sua chave Pix.'));
  }
};

export const saveMyPixPayoutAccount = async (payload) => {
  try {
    const { data } = await api.put('/payments/me/pix-payout-account', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível salvar sua chave Pix.'));
  }
};

export const cancelCheckoutPayment = async (paymentId) => {
  try {
    const { data } = await api.post(`/payments/checkout-sessions/${paymentId}/cancel`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível cancelar este checkout.'));
  }
};

export const resumeCheckoutPayment = async (paymentId) => {
  try {
    const { data } = await api.post(`/payments/checkout-sessions/${paymentId}/resume`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível retomar este checkout.'));
  }
};

export const previewCheckoutCoupon = async (payload) => {
  try {
    const { data } = await api.post('/payments/coupons/preview', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível aplicar este cupom.'));
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

export const getMyFinancialOverview = async () => {
  try {
    const { data } = await api.get('/payments/me/financial-overview');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar a central financeira.'));
  }
};

export const getMySubscription = async () => {
  try {
    const { data } = await api.get('/payments/me/subscription');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar sua assinatura.'));
  }
};

export const getMyFreelancerFeeRate = async () => {
  try {
    const { data } = await api.get('/payments/me/freelancer-fee-rate');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar a taxa da plataforma.'));
  }
};

export const createSubscriptionCheckoutSession = async (payload) => {
  try {
    const { data } = await api.post('/payments/subscription/checkout-session', payload);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível iniciar a assinatura.'));
  }
};

export const createSubscriptionPortalSession = async () => {
  try {
    const { data } = await api.post('/payments/me/subscription/portal-session');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível abrir o portal de cobrança.'));
  }
};

export const listAdminPayments = async (params = {}) => {
  try {
    const { data } = await api.get('/payments/admin/payments', { params });
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar pagamentos administrativos.'));
  }
};

export const retryAdminPaymentTransfer = async (paymentId) => {
  try {
    const { data } = await api.post(`/payments/admin/payments/${paymentId}/retry-transfer`);
    return data.payment;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível reprocessar o repasse.'));
  }
};

export const approveAdminPaymentRelease = async (paymentId) => {
  try {
    const { data } = await api.post(`/payments/admin/payments/${paymentId}/approve-release`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível aprovar o repasse.'));
  }
};

export const listAdminPixSandboxPayments = async () => {
  try {
    const { data } = await api.get('/payments/admin/pix-sandbox');
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível carregar as cobranças Pix de teste.'));
  }
};

export const simulateAdminPixPayment = async (paymentId) => {
  try {
    const { data } = await api.post(`/payments/admin/payments/${paymentId}/simulate-pix`);
    return data;
  } catch (error) {
    throw new Error(extractMessage(error, 'Não foi possível simular o pagamento Pix.'));
  }
};

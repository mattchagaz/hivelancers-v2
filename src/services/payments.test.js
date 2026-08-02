import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    get: mocks.get,
    post: mocks.post,
  },
}));

import {
  createCheckoutSession,
  getCheckoutSessionStatus,
  previewCheckoutCoupon,
} from './payments';

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia a sessão de checkout e retorna os dados do backend', async () => {
    const payload = { serviceId: 'svc-1', planId: 'basic', briefing: 'x'.repeat(40) };
    mocks.post.mockResolvedValue({ data: { url: 'https://stripe.example/session' } });

    await expect(createCheckoutSession(payload)).resolves.toEqual({
      url: 'https://stripe.example/session',
    });
    expect(mocks.post).toHaveBeenCalledWith('/payments/checkout-sessions', payload);
  });

  it('traduz o erro de Connect não ativado para uma mensagem acionável', async () => {
    mocks.post.mockRejectedValue({
      response: {
        data: {
          message: "You can only create new accounts if you've signed up for Connect",
        },
      },
    });

    await expect(createCheckoutSession({})).rejects.toThrow(/Connect no Dashboard da Stripe/);
  });

  it('usa a mensagem de fallback quando o backend não detalha o erro', async () => {
    mocks.post.mockRejectedValue({ response: { data: {} } });

    await expect(createCheckoutSession({})).rejects.toThrow('Não foi possível iniciar o pagamento.');
  });
});

describe('previewCheckoutCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna a prévia do cupom aplicado', async () => {
    mocks.post.mockResolvedValue({ data: { coupon: { code: 'PROMO10' }, total: 90 } });

    await expect(previewCheckoutCoupon({ code: 'PROMO10' })).resolves.toEqual({
      coupon: { code: 'PROMO10' },
      total: 90,
    });
    expect(mocks.post).toHaveBeenCalledWith('/payments/coupons/preview', { code: 'PROMO10' });
  });

  it('propaga o primeiro erro de validação vindo em details', async () => {
    mocks.post.mockRejectedValue({
      response: { data: { details: { code: ['Cupom expirado.'] } } },
    });

    await expect(previewCheckoutCoupon({ code: 'OLD' })).rejects.toThrow('Cupom expirado.');
  });
});

describe('getCheckoutSessionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('consulta o status da sessão pelo id', async () => {
    mocks.get.mockResolvedValue({ data: { payment: { status: 'paid' } } });

    await expect(getCheckoutSessionStatus('sess-123')).resolves.toEqual({
      payment: { status: 'paid' },
    });
    expect(mocks.get).toHaveBeenCalledWith('/payments/checkout-sessions/sess-123');
  });
});

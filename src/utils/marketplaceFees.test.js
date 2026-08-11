import { describe, expect, it } from 'vitest';
import { getClientCheckoutFees, getClientFeePercent } from './marketplaceFees';

describe('marketplaceFees', () => {
  it('aplica 3% ao cliente do plano gratuito', () => {
    expect(getClientCheckoutFees(10_000, null)).toEqual({
      clientFeePercent: 3,
      clientFeeCents: 300,
      totalCents: 10_300,
    });
  });

  it('reduz a taxa apenas para assinaturas ativas', () => {
    expect(getClientFeePercent({ status: 'active', planId: 'professional' })).toBe(1.5);
    expect(getClientFeePercent({ status: 'trialing', planId: 'business' })).toBe(0);
    expect(getClientFeePercent({ status: 'past_due', planId: 'business' })).toBe(3);
  });
});

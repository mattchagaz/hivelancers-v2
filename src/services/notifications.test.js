import { describe, expect, it } from 'vitest';
import { getOrderNotification } from './notifications';

describe('order notifications', () => {
  it('presents a dispute as an administrative pause for both participants', () => {
    const notification = getOrderNotification({
      id: 'order-1',
      status: 'DISPUTED',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      updatedAt: '2026-07-24T12:00:00.000Z',
      service: { title: 'Identidade visual' },
      freelancer: { firstName: 'Ana', lastName: 'Freela' },
    }, 'client-1');

    expect(notification).toEqual(expect.objectContaining({
      tone: 'red',
      title: 'Pedido em disputa',
      to: '/orders?id=order-1',
    }));
    expect(notification.description).toContain('decisão administrativa');
  });
});

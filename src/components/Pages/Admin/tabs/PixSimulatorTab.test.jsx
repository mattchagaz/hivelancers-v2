import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { listMock, simulateMock, successToast, errorToast } = vi.hoisted(() => ({
  listMock: vi.fn(),
  simulateMock: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));

vi.mock('../../../../services/payments', () => ({
  listAdminPixSandboxPayments: listMock,
  simulateAdminPixPayment: simulateMock,
}));

vi.mock('sonner', () => ({
  toast: { success: successToast, error: errorToast },
}));

import PixSimulatorTab from './PixSimulatorTab';

const pendingPayment = {
  id: 'payment-pix-12345678',
  provider: 'ABACATEPAY',
  status: 'CHECKOUT_CREATED',
  totalCents: 4120,
  sessionExpiresAt: '2026-08-11T23:30:00.000Z',
  canSimulate: true,
  service: { title: 'Landing page de teste' },
  project: null,
  client: { firstName: 'Cliente', lastName: 'Teste' },
  freelancer: { firstName: 'Freelancer', lastName: 'Teste' },
};

describe('PixSimulatorTab', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('exige confirmação e mostra o pedido criado após simular o Pix', async () => {
    listMock.mockResolvedValue({ configured: true, items: [pendingPayment] });
    simulateMock.mockResolvedValue({
      simulated: true,
      payment: { ...pendingPayment, status: 'SUCCEEDED' },
      order: { id: 'order-created-87654321', status: 'PENDING_ACCEPTANCE' },
    });

    render(
      <MemoryRouter>
        <PixSimulatorTab />
      </MemoryRouter>
    );

    expect(await screen.findByText('Landing page de teste')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Simular pagamento/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Marcar este Pix como pago?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Simular e criar pedido/i }));

    await waitFor(() => {
      expect(simulateMock).toHaveBeenCalledWith(pendingPayment.id);
      expect(successToast).toHaveBeenCalledWith('Pagamento Pix simulado e pedido criado.');
    });
    expect(await screen.findByRole('link', { name: /Abrir pedido/i })).toHaveAttribute(
      'href',
      '/orders?id=order-created-87654321'
    );
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Smoke test da página de pedidos: monta o Orders com serviços/socket mockados
// e garante que a lista e o painel de detalhe renderizam sem quebrar. Rede de
// segurança para a refatoração que quebra o Orders em partes.

const { fakeSocket, authUser } = vi.hoisted(() => ({
  fakeSocket: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), connected: false },
  authUser: { id: 'user-1', userType: 'CLIENT', firstName: 'Cliente' },
}));

vi.mock('../../../contexts/authContextStore', () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

vi.mock('../../../services/orders', () => ({
  acceptOrder: vi.fn(),
  approveOrder: vi.fn(),
  cancelOrder: vi.fn(),
  deliverOrder: vi.fn(),
  getOrder: vi.fn(() => Promise.resolve(null)),
  listOrders: vi.fn(() => Promise.resolve({ items: [] })),
  openOrderDispute: vi.fn(),
  rejectOrder: vi.fn(),
  reviewOrder: vi.fn(),
  requestOrderRevision: vi.fn(),
}));

vi.mock('../../../services/socket', () => ({
  connectSocket: () => fakeSocket,
  getSocket: () => fakeSocket,
}));

import { getOrder, listOrders } from '../../../services/orders';
import Orders from './Orders';

const buyerOrder = {
  id: 'order-123456789',
  status: 'IN_PROGRESS',
  clientId: 'user-1',
  freelancerId: 'freelancer-9',
  client: { id: 'user-1', firstName: 'Cliente' },
  freelancer: { id: 'freelancer-9', firstName: 'Free', username: 'free9' },
  priceCents: 50000,
  planTitle: 'Plano Pro',
  service: { title: 'Serviço X' },
  deliveryDays: 5,
  deliveryNote: '',
  requirements: 'Brief do projeto',
  events: [],
  revisionsAllowed: 2,
  revisionsUsed: 0,
  conversationId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const renderOrders = () =>
  render(
    <MemoryRouter initialEntries={['/orders']}>
      <Orders />
    </MemoryRouter>
  );

describe('Orders (smoke)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    authUser.userType = 'CLIENT';
  });

  it('monta a página e assina os eventos de socket (estado vazio)', async () => {
    listOrders.mockResolvedValue({ items: [] });
    renderOrders();

    await waitFor(() => {
      expect(fakeSocket.on).toHaveBeenCalledWith('order:updated', expect.any(Function));
    });
    expect(listOrders).toHaveBeenCalledWith({ role: 'buyer' });
    expect(screen.getByText('Exibindo pedidos como')).toBeInTheDocument();
    expect(screen.getByText('cliente')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Como cliente' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Como freelancer' })).not.toBeInTheDocument();
  });

  it('mostra automaticamente somente a fila de freelancer para essa conta', async () => {
    authUser.userType = 'FREELANCER';
    renderOrders();

    await waitFor(() => {
      expect(listOrders).toHaveBeenCalledWith({ role: 'seller' });
    });
    expect(screen.getByText('freelancer')).toBeInTheDocument();
  });

  it('nao abre o modal de detalhe sozinho ao montar a pagina', async () => {
    listOrders.mockResolvedValue({ items: [buyerOrder] });
    renderOrders();

    await waitFor(() => {
      expect(listOrders).toHaveBeenCalled();
    });
    // Dá tempo para qualquer efeito indevido de auto-seleção rodar.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('abre o painel de detalhe do pedido ao clicar no card', async () => {
    listOrders.mockResolvedValue({ items: [buyerOrder] });
    getOrder.mockResolvedValue(buyerOrder);
    renderOrders();

    await waitFor(() => {
      expect(screen.getByText('Serviço X')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Serviço X'));

    await waitFor(() => {
      expect(getOrder).toHaveBeenCalledWith('order-123456789');
    });
    // O painel de detalhe renderizou o título do pedido selecionado.
    await waitFor(() => {
      expect(screen.getAllByText(/Plano Pro/).length).toBeGreaterThan(0);
    });
  });
});

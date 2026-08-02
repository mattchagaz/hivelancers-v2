import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Smoke test do dashboard: monta as duas variantes (freelancer e cliente) com
// serviços mockados e garante que renderizam sem quebrar. Rede de segurança para
// a refatoração que quebra o Dashboard em partes.

const { authUser } = vi.hoisted(() => ({ authUser: { current: { id: 'user-1', firstName: 'Free', userType: 'FREELANCER' } } }));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authUser.current }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

vi.mock('../../../services/services', () => ({
  listMyServices: vi.fn(() => Promise.resolve([])),
  listCategories: vi.fn(() => Promise.resolve([])),
  listPublicServices: vi.fn(() => Promise.resolve({ items: [] })),
}));

vi.mock('../../../services/orders', () => ({
  listOrders: vi.fn(() => Promise.resolve({ items: [] })),
}));

vi.mock('../../../services/messages', () => ({
  listConversations: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../services/users', () => ({
  getMyFavorites: vi.fn(() => Promise.resolve({ services: [], freelancers: [] })),
}));

import Dashboard from './Dashboard';

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Dashboard />
    </MemoryRouter>
  );

describe('Dashboard (smoke)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('monta a variante do freelancer sem quebrar', async () => {
    authUser.current = { id: 'user-1', firstName: 'Free', userType: 'FREELANCER' };
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Painel do freelancer')).toBeInTheDocument();
    });
  });

  it('monta a variante do cliente sem quebrar', async () => {
    authUser.current = { id: 'user-2', firstName: 'Cli', userType: 'CLIENT' };
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Painel do cliente')).toBeInTheDocument();
    });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';

// Smoke test do painel administrativo: monta o Admin com todos os serviços
// mockados e navega por todas as abas garantindo que nenhuma quebra ao renderizar.
// Serve de rede de segurança para a refatoração que quebra o Admin em partes.

const { okList } = vi.hoisted(() => ({
  // Array vazio funciona para todos os loaders: os que usam o retorno direto
  // (ex. setCategories) e os que passam por listItems()/listTotal().
  okList: () => Promise.resolve([]),
}));

const healthFixture = {
  status: 'healthy',
  checkedAt: '2026-08-11T15:00:00.000Z',
  environment: 'test',
  uptimeSeconds: 120,
  summary: { operational: 1, degraded: 0, unavailable: 0, total: 1 },
  services: [{
    id: 'api',
    name: 'API e aplicação',
    description: 'API de teste',
    status: 'operational',
    latencyMs: null,
    message: 'Respondendo',
    details: [],
  }],
  metrics: {},
};

vi.mock('../../../contexts/authContextStore', () => ({
  useAuth: () => ({ user: { id: 'admin-1', firstName: 'Admin', isAdmin: true } }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
  Toaster: () => null,
}));

vi.mock('../../../services/services', () => ({
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  deleteAdminService: vi.fn(),
  listAdminCategories: okList,
  listAdminServices: okList,
  updateAdminService: vi.fn(),
  updateCategory: vi.fn(),
}));

vi.mock('../../../services/admin', () => ({
  createAdminCoupon: vi.fn(),
  createRewardLevel: vi.fn(),
  deleteAdminCoupon: vi.fn(),
  deleteRewardLevel: vi.fn(),
  getAdminSystemHealth: vi.fn(() => Promise.resolve(healthFixture)),
  listAdminAuditLogs: okList,
  listAdminCoupons: okList,
  listRewardLevels: okList,
  updateAdminCoupon: vi.fn(),
  updateRewardLevel: vi.fn(),
}));

vi.mock('../../../services/orders', () => ({
  listAdminDisputes: okList,
  resolveAdminDispute: vi.fn(),
}));

vi.mock('../../../services/users', () => ({
  listAdminUsers: okList,
  openAdminVerificationDocument: vi.fn(),
  reviewAdminAccountVerification: vi.fn(),
  updateAdminUser: vi.fn(),
}));

vi.mock('../../../services/payments', () => ({
  listAdminPayments: okList,
  listAdminPixSandboxPayments: vi.fn(() => Promise.resolve({ configured: true, items: [] })),
  retryAdminPaymentTransfer: vi.fn(),
  approveAdminPaymentRelease: vi.fn(),
  simulateAdminPixPayment: vi.fn(),
}));

vi.mock('../../../services/tickets', () => ({
  listAdminSupportTickets: okList,
  normalizeSupportTicketStatus: (status) => String(status || 'OPEN'),
  updateAdminSupportTicket: vi.fn(),
  SUPPORT_TICKET_CATEGORY_LABEL: {},
  SUPPORT_TICKET_PRIORITY_LABEL: {},
  SUPPORT_TICKET_STATUS_LABEL: {},
}));

import Admin from './Admin';

const TAB_LABELS = [
  'Visão geral',
  'Serviços',
  'Promoções',
  'Níveis',
  'Taxonomia',
  'Usuários',
  'Financeiro',
  'Simular Pix',
  'Disputas',
  'Suporte',
  'Saúde do sistema',
  'Auditoria',
];

describe('Admin (smoke)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('monta o painel e renderiza a navegação de todas as abas', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Admin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Visão geral/ })).toBeInTheDocument();
    });

    for (const label of TAB_LABELS) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it('navega por todas as abas sem quebrar', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Admin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Visão geral/ })).toBeInTheDocument();
    });

    for (const label of TAB_LABELS) {
      const tabButton = screen.getByRole('button', { name: new RegExp(label) });
      await act(async () => {
        tabButton.click();
      });
      // Se o painel da aba lançasse no render, o act acima estouraria.
      expect(tabButton).toBeInTheDocument();
    }
  });
});

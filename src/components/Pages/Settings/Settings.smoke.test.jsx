import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';

// Smoke test da página de configurações: monta o Settings com contextos/serviços
// mockados e navega por todas as abas garantindo que cada painel renderiza sem
// quebrar. Rede de segurança para a refatoração que quebra o Settings em partes.

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', userType: 'FREELANCER', email: 'free@example.com', firstName: 'Free' },
    setUser: vi.fn(),
  }),
}));

vi.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      notifications: { orderUpdates: true, messages: true, reviews: false, supportUpdates: true, securityUpdates: true, pushMessages: false, pushOrders: false, pushPayments: false, pushSupport: false },
      appearance: { theme: 'light', accent: 'blue', density: 'comfortable' },
      privacy: { profilePublic: true, showOnline: true, showEarnings: false },
      language: { region: 'BR', currency: 'BRL' },
    },
    toggleField: vi.fn(),
    updateSection: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
  Toaster: () => null,
}));

vi.mock('../../../services/users', () => ({
  deleteMyAccount: vi.fn(),
  exportMyData: vi.fn(),
  updateProfile: vi.fn(),
  updateUserType: vi.fn(),
}));

vi.mock('../../../services/payments', () => ({
  createMyStripeConnectDashboardLink: vi.fn(),
  createMyStripeConnectOnboardingLink: vi.fn(),
  getMyStripeConnectStatus: vi.fn(() => Promise.resolve({ configured: true, connected: false, account: null })),
}));

vi.mock('../../../services/cloudinary', () => ({
  uploadImageToCloudinary: vi.fn(),
}));

vi.mock('../../CityAutocomplete/CityAutocomplete', () => ({
  default: ({ value }) => <input readOnly value={value || ''} />,
}));

import Settings from './Settings';

const TAB_LABELS = [
  'Perfil Público',
  'Conta e Acesso',
  'Notificações',
  'Aparência',
  'Privacidade',
  'Pagamentos',
  'Localização',
  'Segurança da conta',
];

describe('Settings (smoke)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('monta e navega por todas as abas de configuração sem quebrar', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Settings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Perfil Público/ })).toBeInTheDocument();
    });

    for (const label of TAB_LABELS) {
      const tabButton = screen.getByRole('button', { name: new RegExp(label) });
      await act(async () => {
        tabButton.click();
      });
      expect(tabButton).toBeInTheDocument();
    }
  });
});

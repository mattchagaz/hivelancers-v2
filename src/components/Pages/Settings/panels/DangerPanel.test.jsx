import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  deleteMyAccount: vi.fn(),
  setUser: vi.fn(),
}));

vi.mock('../../../../contexts/authContextStore', () => ({
  useAuth: () => ({
    user: { id: 'client-1', email: 'cliente@example.com', userType: 'CLIENT' },
    setUser: mocks.setUser,
  }),
}));

vi.mock('../../../../services/users', () => ({
  deleteMyAccount: mocks.deleteMyAccount,
  exportMyData: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import DangerPanel from './DangerPanel';

describe('DangerPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('exige uma confirmação final antes de excluir a conta', async () => {
    mocks.deleteMyAccount.mockResolvedValue({});

    render(
      <MemoryRouter>
        <DangerPanel />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Confirme seu e-mail'), {
      target: { value: 'cliente@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Digite "EXCLUIR MINHA CONTA"'), {
      target: { value: 'EXCLUIR MINHA CONTA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Excluir definitivamente' }));

    expect(mocks.deleteMyAccount).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Tem certeza que deseja excluir sua conta?' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sim, excluir minha conta' }));

    await waitFor(() => {
      expect(mocks.deleteMyAccount).toHaveBeenCalledWith({
        email: 'cliente@example.com',
        confirmation: 'EXCLUIR MINHA CONTA',
      });
    });
  });
});

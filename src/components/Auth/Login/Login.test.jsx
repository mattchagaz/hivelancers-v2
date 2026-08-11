import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  setUser: vi.fn(),
  navigate: vi.fn(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
  resendOtp: vi.fn(),
  completeGoogleLogin: vi.fn(),
  getGoogleLoginUrl: vi.fn(() => 'https://google.example/auth'),
}));

vi.mock('../../../contexts/authContextStore', () => ({
  useAuth: () => ({ login: mocks.login, setUser: mocks.setUser }),
}));

vi.mock('sonner', () => ({
  toast: mocks.toast,
  Toaster: () => null,
}));

vi.mock('../../../services/auth', () => ({
  completeGoogleLogin: mocks.completeGoogleLogin,
  getGoogleLoginUrl: mocks.getGoogleLoginUrl,
  resendOtp: mocks.resendOtp,
}));

// react-router-dom real, apenas useNavigate substituído por um espião.
vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual();
  return { ...actual, useNavigate: () => mocks.navigate };
});

import Login from './Login';

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('faz login, normaliza o e-mail e navega para a rota pós-login', async () => {
    mocks.login.mockResolvedValue({ user: { userType: 'CLIENT', onboardedAt: '2024-01-01' } });

    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: '  User@Example.com  ' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret123' });
    });
    expect(mocks.toast.success).toHaveBeenCalledWith('Login realizado com sucesso!');
    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('não chama o serviço de login quando os campos estão vazios', async () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mocks.toast.error).toHaveBeenCalledWith('Preencha todos os campos.');
    });
    expect(mocks.login).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('mostra a mensagem de erro quando as credenciais são inválidas', async () => {
    mocks.login.mockRejectedValue(new Error('Credenciais inválidas.'));

    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mocks.toast.error).toHaveBeenCalledWith('Credenciais inválidas.');
    });
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});

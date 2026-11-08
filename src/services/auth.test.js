import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clear: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  resetSocket: vi.fn(),
  setTokens: vi.fn(),
  setUser: vi.fn(),
  invalidatePendingRefreshes: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    get: mocks.get,
    post: mocks.post,
  },
}));

vi.mock('./tokenStorage', () => ({
  tokenStorage: {
    clear: mocks.clear,
    invalidatePendingRefreshes: mocks.invalidatePendingRefreshes,
    setTokens: mocks.setTokens,
    setUser: mocks.setUser,
  },
}));

vi.mock('./socket', () => ({
  resetSocket: mocks.resetSocket,
}));

import { completeGoogleLogin, forgotPassword, loginUser, logoutUser } from './auth';

describe('loginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persiste tokens e usuario depois de um login valido', async () => {
    const response = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1', email: 'user@example.com' },
    };
    mocks.post.mockResolvedValue({ data: response });

    await expect(loginUser({ email: 'user@example.com', password: 'secret123' })).resolves.toEqual(response);

    expect(mocks.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(mocks.setTokens).toHaveBeenCalledWith(response);
    expect(mocks.setUser).toHaveBeenCalledWith(response.user);
  });

  it('explica o tempo de espera quando o backend responde 429', async () => {
    mocks.post.mockRejectedValue({
      response: {
        status: 429,
        data: {
          error: 'RATE_LIMITED',
          message: 'Muitas tentativas de login. Tente novamente mais tarde.',
        },
        headers: { 'retry-after': '120' },
      },
    });

    await expect(loginUser({ email: 'user@example.com', password: 'wrong' })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Muitas tentativas de login. Tente novamente mais tarde. Aguarde cerca de 2 minuto(s).',
    });

    expect(mocks.setTokens).not.toHaveBeenCalled();
    expect(mocks.setUser).not.toHaveBeenCalled();
  });
});

describe('forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia a solicitação pública sem cookies ou credenciais de sessão', async () => {
    mocks.post.mockResolvedValue({ data: { ok: true } });

    await expect(forgotPassword('user@example.com')).resolves.toEqual({ ok: true });

    expect(mocks.post).toHaveBeenCalledWith(
      '/auth/forgot-password',
      { email: 'user@example.com' },
      { withCredentials: false }
    );
  });
});

describe('Google OAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('troca o cookie HttpOnly por access token sem aceitar bearer na URL', async () => {
    mocks.post.mockResolvedValueOnce({ data: { accessToken: 'access-token' } });
    mocks.get.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } });

    await expect(completeGoogleLogin('?oauth=success')).resolves.toMatchObject({
      accessToken: 'access-token',
      user: { id: 'user-1' },
    });
    expect(mocks.post).toHaveBeenNthCalledWith(1, '/auth/refresh', {});
    expect(mocks.setTokens).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'access-token' }));
  });

  it('ignora tokens fornecidos diretamente na query string', async () => {
    await expect(completeGoogleLogin('?accessToken=attacker-token')).resolves.toBeNull();
    expect(mocks.setTokens).not.toHaveBeenCalled();
  });
});

describe('logoutUser', () => {
  it('invalida refresh pendente e destroi o socket antes de limpar a sessao', async () => {
    mocks.post.mockResolvedValue({ data: {} });
    await logoutUser();
    expect(mocks.resetSocket).toHaveBeenCalledOnce();
    expect(mocks.invalidatePendingRefreshes).toHaveBeenCalledOnce();
  });
});

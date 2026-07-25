import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  setTokens: vi.fn(),
  setUser: vi.fn(),
}));

vi.mock('./api', () => ({
  api: {
    post: mocks.post,
  },
}));

vi.mock('./tokenStorage', () => ({
  tokenStorage: {
    setTokens: mocks.setTokens,
    setUser: mocks.setUser,
  },
}));

import { forgotPassword, loginUser } from './auth';

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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const requestUse = vi.fn();
  const responseUse = vi.fn();
  const client = vi.fn(() => Promise.resolve({ data: {} }));
  client.interceptors = {
    request: { use: requestUse },
    response: { use: responseUse },
  };

  return {
    client,
    clear: vi.fn(),
    create: vi.fn(() => client),
    getAccess: vi.fn(() => null),
    getRefresh: vi.fn(() => null),
    getUser: vi.fn(() => null),
    getExpectedUserId: vi.fn(() => null),
    post: vi.fn(),
    requestUse,
    responseUse,
    setTokens: vi.fn(),
  };
});

vi.mock('axios', () => ({
  default: {
    create: mocks.create,
    post: mocks.post,
  },
}));

vi.mock('./tokenStorage', () => ({
  tokenStorage: {
    clear: mocks.clear,
    getAccess: mocks.getAccess,
    getRefresh: mocks.getRefresh,
    getUser: mocks.getUser,
    getExpectedUserId: mocks.getExpectedUserId,
    setTokens: mocks.setTokens,
  },
}));

import { AUTH_UNAUTHORIZED_EVENT } from './authEvents';
import './api';

const rejectResponse = mocks.responseUse.mock.calls[0][1];

describe('interceptor de autenticacao', () => {
  let unauthorizedListener;

  beforeEach(() => {
    vi.clearAllMocks();
    unauthorizedListener = vi.fn();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, unauthorizedListener);
  });

  afterEach(() => {
    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, unauthorizedListener);
  });

  it('encerra a sessao sem recarregar a pagina quando o refresh falha', async () => {
    const refreshError = new Error('Refresh indisponivel');
    mocks.post.mockRejectedValue(refreshError);

    await expect(rejectResponse({
      config: {
        headers: {},
        url: '/auth/me',
      },
      response: { status: 401 },
    })).rejects.toBe(refreshError);

    expect(mocks.post).toHaveBeenCalledWith(
      'https://hivelancers-backend.fly.dev/auth/refresh',
      {},
      { withCredentials: true }
    );
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(unauthorizedListener).toHaveBeenCalledOnce();
  });

  it('impede que a renovacao troque silenciosamente a conta desta aba', async () => {
    const payload = btoa(JSON.stringify({ sub: 'conta-2' }))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    mocks.getExpectedUserId.mockReturnValue('conta-1');
    mocks.post.mockResolvedValue({ data: { accessToken: `header.${payload}.signature` } });

    await expect(rejectResponse({
      config: {
        headers: {},
        url: '/auth/me',
      },
      response: { status: 401 },
    })).rejects.toThrow('não corresponde');

    expect(mocks.setTokens).not.toHaveBeenCalled();
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(unauthorizedListener).toHaveBeenCalledOnce();
  });

  it('encerra a sessao quando o token renovado nao tem um sujeito valido', async () => {
    mocks.getExpectedUserId.mockReturnValue(null);
    mocks.post.mockResolvedValue({ data: { accessToken: 'token-sem-payload-valido' } });

    await expect(rejectResponse({
      config: {
        headers: {},
        url: '/auth/me',
      },
      response: { status: 401 },
    })).rejects.toThrow('não corresponde');

    expect(mocks.setTokens).not.toHaveBeenCalled();
    expect(mocks.clear).toHaveBeenCalledOnce();
  });

  it('permite a renovacao quando esta aba ainda nao tinha uma conta esperada', async () => {
    const payload = btoa(JSON.stringify({ sub: 'conta-2' }))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    mocks.getExpectedUserId.mockReturnValue(null);
    mocks.post.mockResolvedValue({ data: { accessToken: `header.${payload}.signature` } });

    const originalRequest = { headers: {}, url: '/auth/me' };
    await rejectResponse({ config: originalRequest, response: { status: 401 } });

    expect(mocks.setTokens).toHaveBeenCalledOnce();
    expect(mocks.clear).not.toHaveBeenCalled();
  });
});

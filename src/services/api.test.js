import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const requestUse = vi.fn();
  const responseUse = vi.fn();
  const client = {
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
  };

  return {
    client,
    clear: vi.fn(),
    create: vi.fn(() => client),
    getAccess: vi.fn(() => null),
    getRefresh: vi.fn(() => null),
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
});

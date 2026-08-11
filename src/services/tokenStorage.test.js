import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ACCESS_KEY = 'hv_access_token';
const REFRESH_KEY = 'hv_refresh_token';
const USER_KEY = 'hv_user';

// Reimporta o módulo do zero para reexecutar a lógica de migração de topo.
const loadFresh = async () => {
  vi.resetModules();
  return (await import('./tokenStorage')).tokenStorage;
};

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('mantém o access token isolado na sessão da aba, nunca em localStorage', async () => {
    const tokenStorage = await loadFresh();

    tokenStorage.setTokens({ accessToken: 'abc123' });

    expect(tokenStorage.getAccess()).toBe('abc123');
    expect(sessionStorage.getItem(ACCESS_KEY)).toBe('abc123');
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it('migra um access token legado do localStorage e depois o apaga do disco', async () => {
    localStorage.setItem(ACCESS_KEY, 'legacy-token');

    const tokenStorage = await loadFresh();

    expect(tokenStorage.getAccess()).toBe('legacy-token');
    expect(sessionStorage.getItem(ACCESS_KEY)).toBe('legacy-token');
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it('não sobrescreve o token em memória quando setTokens vem sem accessToken', async () => {
    const tokenStorage = await loadFresh();
    tokenStorage.setTokens({ accessToken: 'keep-me' });

    tokenStorage.setTokens({});

    expect(tokenStorage.getAccess()).toBe('keep-me');
  });

  it('restaura o token depois de um redirecionamento na mesma aba', async () => {
    const tokenStorage = await loadFresh();
    tokenStorage.setTokens({ accessToken: 'checkout-token' });

    const restoredStorage = await loadFresh();

    expect(restoredStorage.getAccess()).toBe('checkout-token');
  });

  it('remove qualquer refresh token legado do localStorage ao gravar tokens', async () => {
    localStorage.setItem(REFRESH_KEY, 'legacy-refresh');
    const tokenStorage = await loadFresh();

    tokenStorage.setTokens({ accessToken: 'abc' });

    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it('persiste o usuário apenas na sessão da aba', async () => {
    const tokenStorage = await loadFresh();
    const user = { id: 'u1', email: 'a@b.com' };

    tokenStorage.setUser(user);

    expect(tokenStorage.getUser()).toEqual(user);
    expect(sessionStorage.getItem(USER_KEY)).toBe(JSON.stringify(user));
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('clear apaga o token em memória e todas as chaves persistidas', async () => {
    const tokenStorage = await loadFresh();
    tokenStorage.setTokens({ accessToken: 'abc' });
    tokenStorage.setUser({ id: 'u1' });

    tokenStorage.clear();

    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getUser()).toBeNull();
    expect(sessionStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(sessionStorage.getItem(USER_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});

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
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('mantém o access token apenas em memória, nunca em localStorage', async () => {
    const tokenStorage = await loadFresh();

    tokenStorage.setTokens({ accessToken: 'abc123' });

    expect(tokenStorage.getAccess()).toBe('abc123');
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it('migra um access token legado do localStorage e depois o apaga do disco', async () => {
    localStorage.setItem(ACCESS_KEY, 'legacy-token');

    const tokenStorage = await loadFresh();

    expect(tokenStorage.getAccess()).toBe('legacy-token');
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
  });

  it('não sobrescreve o token em memória quando setTokens vem sem accessToken', async () => {
    const tokenStorage = await loadFresh();
    tokenStorage.setTokens({ accessToken: 'keep-me' });

    tokenStorage.setTokens({});

    expect(tokenStorage.getAccess()).toBe('keep-me');
  });

  it('remove qualquer refresh token legado do localStorage ao gravar tokens', async () => {
    localStorage.setItem(REFRESH_KEY, 'legacy-refresh');
    const tokenStorage = await loadFresh();

    tokenStorage.setTokens({ accessToken: 'abc' });

    expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it('persiste o usuário em localStorage (dado não sensível)', async () => {
    const tokenStorage = await loadFresh();
    const user = { id: 'u1', email: 'a@b.com' };

    tokenStorage.setUser(user);

    expect(tokenStorage.getUser()).toEqual(user);
    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(user));
  });

  it('clear apaga o token em memória e todas as chaves persistidas', async () => {
    const tokenStorage = await loadFresh();
    tokenStorage.setTokens({ accessToken: 'abc' });
    tokenStorage.setUser({ id: 'u1' });

    tokenStorage.clear();

    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getUser()).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});

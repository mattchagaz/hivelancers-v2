import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const AUTH_CONTEXT_KEY = Symbol.for('hivelancers.auth-context');

describe('authContextStore', () => {
  beforeEach(() => {
    delete globalThis[AUTH_CONTEXT_KEY];
    vi.resetModules();
  });

  afterEach(() => {
    delete globalThis[AUTH_CONTEXT_KEY];
  });

  it('reutiliza a mesma instância após o módulo ser recarregado', async () => {
    const first = await import('./authContextStore');
    vi.resetModules();
    const second = await import('./authContextStore');

    expect(second.AuthContext).toBe(first.AuthContext);
  });
});

import { describe, expect, it } from 'vitest';
import { isAdminUser, nextRouteAfterAuth, toRoleSlug, toUserType } from './authFlow';

describe('authFlow', () => {
  it.each([
    [null, '/login'],
    [{ id: '1' }, '/user-selection'],
    [{ id: '1', userType: 'CLIENT' }, '/welcome-user'],
    [{ id: '1', userType: 'CLIENT', onboardedAt: '2026-01-01' }, '/dashboard'],
    [{ id: '1', userType: 'FREELANCER', onboardedAt: '2026-01-01', isAdmin: true }, '/admin'],
  ])('direciona o usuario conforme o estado da conta', (user, expectedRoute) => {
    expect(nextRouteAfterAuth(user)).toBe(expectedRoute);
  });

  it('reconhece as representacoes de permissao administrativa', () => {
    expect(isAdminUser({ permissions: ['admin_access'] })).toBe(true);
    expect(isAdminUser({ roles: ['ADMIN'] })).toBe(true);
    expect(isAdminUser({ userType: 'CLIENT' })).toBe(false);
  });

  it('converte papeis entre API e URL', () => {
    expect(toRoleSlug('FREELANCER')).toBe('freelancer');
    expect(toRoleSlug('CLIENT')).toBe('client');
    expect(toUserType('freelancer')).toBe('FREELANCER');
    expect(toUserType('client')).toBe('CLIENT');
    expect(toUserType('unknown')).toBeNull();
  });
});

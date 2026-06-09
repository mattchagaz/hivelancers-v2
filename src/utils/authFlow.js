export function nextRouteAfterAuth(user) {
  if (!user) return '/login';
  if (!user.userType) return '/user-selection';
  if (!user.onboardedAt) return '/welcome-user';
  if (isAdminUser(user)) return '/admin';
  return '/dashboard';
}

export const toRoleSlug = (userType) =>
  userType === 'ADMIN'
    ? 'admin'
    : userType === 'FREELANCER'
      ? 'freelancer'
      : userType === 'CLIENT'
        ? 'client'
        : null;

export const toUserType = (slug) =>
  slug === 'freelancer' ? 'FREELANCER' : slug === 'client' ? 'CLIENT' : null;

export const isAdminUser = (user) => {
  if (!user) return false;
  const normalizedType = String(user.userType || '').toUpperCase();
  const normalizedRole = String(user.role || '').toUpperCase();
  const roles = Array.isArray(user.roles) ? user.roles.map((role) => String(role).toUpperCase()) : [];
  const permissions = Array.isArray(user.permissions)
    ? user.permissions.map((permission) => String(permission).toUpperCase())
    : [];

  return Boolean(
    user.isAdmin ||
    normalizedType === 'ADMIN' ||
    normalizedRole === 'ADMIN' ||
    roles.includes('ADMIN') ||
    permissions.includes('ADMIN') ||
    permissions.includes('ADMIN_ACCESS')
  );
};

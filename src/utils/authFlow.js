export function nextRouteAfterAuth(user) {
  if (!user) return '/login';
  if (!user.userType) return '/user-selection';
  if (!user.onboardedAt) return '/welcome-user';
  return '/dashboard';
}

export const toRoleSlug = (userType) =>
  userType === 'FREELANCER' ? 'freelancer' : userType === 'CLIENT' ? 'client' : null;

export const toUserType = (slug) =>
  slug === 'freelancer' ? 'FREELANCER' : slug === 'client' ? 'CLIENT' : null;

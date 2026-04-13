const USER_ROLE_KEY = 'hivelancers:user-role';

export function getStoredUserRole() {
  if (typeof window === 'undefined') return 'freelancer';

  try {
    return localStorage.getItem(USER_ROLE_KEY) || 'freelancer';
  } catch {
    return 'freelancer';
  }
}

export function setStoredUserRole(role) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(USER_ROLE_KEY, role);
  } catch {
    // noop
  }
}

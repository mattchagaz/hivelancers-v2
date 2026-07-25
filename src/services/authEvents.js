export const AUTH_UNAUTHORIZED_EVENT = 'hivelancers:auth-unauthorized';

export const emitAuthUnauthorized = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
};

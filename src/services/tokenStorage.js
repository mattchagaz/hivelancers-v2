const ACCESS_KEY = 'hv_access_token';
const REFRESH_KEY = 'hv_refresh_token';
const USER_KEY = 'hv_user';

// O access token vive apenas em memória (não em localStorage) para reduzir a
// exposição a XSS. Ao recarregar a página ele é restaurado via cookie HttpOnly
// de refresh — ver o interceptor em `api.js`.
let accessToken = null;

const safeLocalStorage = (fn, fallback = null) => {
  try {
    return fn(localStorage);
  } catch {
    // localStorage pode estar indisponível (modo privado, SSR, testes).
    return fallback;
  }
};

// Migração única: adota qualquer access token persistido por builds antigos e
// depois o remove do localStorage para que nunca fique gravado em disco.
safeLocalStorage((ls) => {
  const legacy = ls.getItem(ACCESS_KEY);
  if (legacy) {
    accessToken = legacy;
    ls.removeItem(ACCESS_KEY);
  }
});

export const tokenStorage = {
  getAccess: () => accessToken,
  getRefresh: () => safeLocalStorage((ls) => ls.getItem(REFRESH_KEY)),
  getUser: () => {
    const raw = safeLocalStorage((ls) => ls.getItem(USER_KEY));
    return raw ? JSON.parse(raw) : null;
  },
  setTokens: ({ accessToken: newAccess, refreshToken } = {}) => {
    if (newAccess) accessToken = newAccess;
    // Refresh tokens agora vivem em um cookie HttpOnly. Remove cópias legadas.
    safeLocalStorage((ls) => {
      if (refreshToken || ls.getItem(REFRESH_KEY)) ls.removeItem(REFRESH_KEY);
    });
  },
  setUser: (user) => safeLocalStorage((ls) => ls.setItem(USER_KEY, JSON.stringify(user))),
  clear: () => {
    accessToken = null;
    safeLocalStorage((ls) => {
      ls.removeItem(ACCESS_KEY);
      ls.removeItem(REFRESH_KEY);
      ls.removeItem(USER_KEY);
    });
  },
};

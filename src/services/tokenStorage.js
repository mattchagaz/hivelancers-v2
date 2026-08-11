const ACCESS_KEY = 'hv_access_token';
const REFRESH_KEY = 'hv_refresh_token';
const USER_KEY = 'hv_user';

// O access token fica isolado na aba atual. O sessionStorage sobrevive ao
// redirecionamento para provedores externos (como a Stripe), mas não é
// compartilhado entre abas nem persiste após o fechamento da aba.
let accessToken = null;

const safeLocalStorage = (fn, fallback = null) => {
  try {
    return fn(localStorage);
  } catch {
    // localStorage pode estar indisponível (modo privado, SSR, testes).
    return fallback;
  }
};

const safeSessionStorage = (fn, fallback = null) => {
  try {
    return fn(sessionStorage);
  } catch {
    return fallback;
  }
};

accessToken = safeSessionStorage((storage) => storage.getItem(ACCESS_KEY));

// Migração única: adota qualquer access token persistido por builds antigos e
// depois o remove do localStorage para que nunca fique gravado em disco.
safeLocalStorage((ls) => {
  const legacy = ls.getItem(ACCESS_KEY);
  if (legacy) {
    accessToken = legacy;
    safeSessionStorage((storage) => storage.setItem(ACCESS_KEY, legacy));
    ls.removeItem(ACCESS_KEY);
  }
});

export const tokenStorage = {
  getAccess: () => accessToken,
  getRefresh: () => safeLocalStorage((ls) => ls.getItem(REFRESH_KEY)),
  getUser: () => {
    const raw = safeSessionStorage((storage) => storage.getItem(USER_KEY))
      || safeLocalStorage((storage) => storage.getItem(USER_KEY));
    return raw ? JSON.parse(raw) : null;
  },
  setTokens: ({ accessToken: newAccess, refreshToken } = {}) => {
    if (newAccess) {
      accessToken = newAccess;
      safeSessionStorage((storage) => storage.setItem(ACCESS_KEY, newAccess));
    }
    // Refresh tokens agora vivem em um cookie HttpOnly. Remove cópias legadas.
    safeLocalStorage((ls) => {
      if (refreshToken || ls.getItem(REFRESH_KEY)) ls.removeItem(REFRESH_KEY);
    });
  },
  setUser: (user) => {
    safeSessionStorage((storage) => storage.setItem(USER_KEY, JSON.stringify(user)));
    safeLocalStorage((storage) => storage.removeItem(USER_KEY));
  },
  clear: () => {
    accessToken = null;
    safeSessionStorage((storage) => {
      storage.removeItem(ACCESS_KEY);
      storage.removeItem(USER_KEY);
    });
    safeLocalStorage((ls) => {
      ls.removeItem(ACCESS_KEY);
      ls.removeItem(REFRESH_KEY);
      ls.removeItem(USER_KEY);
    });
  },
};

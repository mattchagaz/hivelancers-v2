const ACCESS_KEY = 'hv_access_token';
const REFRESH_KEY = 'hv_refresh_token';
const USER_KEY = 'hv_user';
const LAST_UID_COOKIE = 'hv_last_uid';

// Cookie não-HttpOnly (escrito pelo próprio frontend) usado só para lembrar
// qual conta esta aba estava usando antes de um redirecionamento externo
// (ex: Stripe Connect). Ao contrário do sessionStorage, cookies sobrevivem
// de forma confiável a navegações completas para outro domínio e de volta,
// então ele serve de referência extra para detectar se a sessão renovada
// ao retornar pertence a outra conta.
const setLastUidCookie = (userId) => {
  try {
    if (userId) {
      document.cookie = `${LAST_UID_COOKIE}=${encodeURIComponent(userId)};path=/;max-age=2592000;SameSite=Lax`;
    } else {
      document.cookie = `${LAST_UID_COOKIE}=;path=/;max-age=0;SameSite=Lax`;
    }
  } catch {
    // document indisponível (SSR, testes)
  }
};

const getLastUidCookie = () => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LAST_UID_COOKIE}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

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

// Builds antigas gravavam o usuário e o refresh token direto no localStorage
// (persistente entre contas/sessões). Isso já não é mais escrito, mas
// qualquer resíduo de uma conta anterior precisa ser purgado — caso
// contrário ele pode ser lido como se fosse a identidade da sessão atual.
safeLocalStorage((ls) => {
  ls.removeItem(USER_KEY);
  ls.removeItem(REFRESH_KEY);
});

export const tokenStorage = {
  getAccess: () => accessToken,
  getRefresh: () => safeLocalStorage((ls) => ls.getItem(REFRESH_KEY)),
  getUser: () => {
    const raw = safeSessionStorage((storage) => storage.getItem(USER_KEY));
    return raw ? JSON.parse(raw) : null;
  },
  // Identidade "durável" desta aba: sobrevive a uma navegação completa para
  // um domínio externo (Stripe Connect, Google OAuth) e de volta, ao
  // contrário do sessionStorage, que alguns navegadores podem não preservar
  // nesse trajeto. Usada só para detectar troca de conta ao retornar.
  getExpectedUserId: () => {
    const cached = safeSessionStorage((storage) => storage.getItem(USER_KEY));
    if (cached) {
      try {
        return JSON.parse(cached)?.id || null;
      } catch {
        return null;
      }
    }
    return getLastUidCookie();
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
    setLastUidCookie(user?.id);
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
    setLastUidCookie(null);
  },
};

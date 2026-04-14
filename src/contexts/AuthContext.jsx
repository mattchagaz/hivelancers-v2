import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { getMe, loginUser, logoutUser } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const access = tokenStorage.getAccess();
      const refresh = tokenStorage.getRefresh();
      if (!access && !refresh) {
        setUser(null);
        setIsInitializing(false);
        return;
      }
      try {
        const fresh = await getMe();
        setUser(fresh);
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };
    hydrate();
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await getMe();
      setUser(fresh);
      return fresh;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isInitializing,
    login,
    logout,
    setUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

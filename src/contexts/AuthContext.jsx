import { useCallback, useEffect, useState } from 'react';
import { AUTH_UNAUTHORIZED_EVENT } from '../services/authEvents';
import { tokenStorage } from '../services/tokenStorage';
import { getMe, loginUser, logoutUser } from '../services/auth';
import { AuthContext } from './authContextStore';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
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

  useEffect(() => {
    const handleUnauthorized = () => {
      tokenStorage.clear();
      setUser(null);
      setIsInitializing(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
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

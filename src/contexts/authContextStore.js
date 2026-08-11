import { createContext, useContext } from 'react';

// O registro global garante a mesma identidade mesmo quando o Vite mantém
// versões diferentes de módulos lazy no histórico durante o Fast Refresh.
const AUTH_CONTEXT_KEY = Symbol.for('hivelancers.auth-context');
export const AuthContext = globalThis[AUTH_CONTEXT_KEY] || createContext(null);
globalThis[AUTH_CONTEXT_KEY] = AuthContext;

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

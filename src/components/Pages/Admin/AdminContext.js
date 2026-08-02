import { createContext, useContext } from 'react';

// Contexto interno do painel administrativo. O componente container (Admin)
// concentra todo o estado e as ações e os disponibiliza aqui; cada aba
// (Admin/tabs/*) consome apenas o que precisa via useAdmin().
export const AdminContext = createContext(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin deve ser usado dentro de <AdminContext.Provider>');
  return ctx;
}

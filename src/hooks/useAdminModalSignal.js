import { useEffect } from 'react';

export const ADMIN_MODAL_VISIBILITY_EVENT = 'admin-modal:visibility';

// Avisa o AppLayout que um modal do admin está aberto, pra esconder a tab
// bar — senão ela fica sobreposta ao modal em tela cheia no mobile.
export function useAdminModalSignal(open) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(ADMIN_MODAL_VISIBILITY_EVENT, { detail: { open } }));
  }, [open]);

  useEffect(() => () => {
    window.dispatchEvent(new CustomEvent(ADMIN_MODAL_VISIBILITY_EVENT, { detail: { open: false } }));
  }, []);
}

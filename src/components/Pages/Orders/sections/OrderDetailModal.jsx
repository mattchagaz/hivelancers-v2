import { useEffect } from 'react';
import { FaXmark } from 'react-icons/fa6';
import styles from '../Orders.module.css';
import { useLockBodyScroll } from '../../../../hooks/useLockBodyScroll';
import { useOrders } from '../OrdersContext';
import OrderDetail from './OrderDetail';

export default function OrderDetailModal() {
  const { selectedOrderId, handleCloseOrder } = useOrders();
  const isOpen = Boolean(selectedOrderId);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleCloseOrder();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCloseOrder]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleCloseOrder}>
      <div
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do pedido"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.modalClose} onClick={handleCloseOrder} aria-label="Fechar">
          <FaXmark />
        </button>
        <OrderDetail />
      </div>
    </div>
  );
}

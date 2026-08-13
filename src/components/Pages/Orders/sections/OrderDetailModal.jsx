import { useEffect } from 'react';
import { FaXmark } from 'react-icons/fa6';
import styles from '../Orders.module.css';
import { useOrders } from '../OrdersContext';
import OrderDetail from './OrderDetail';

export default function OrderDetailModal() {
  const { selectedOrderId, handleCloseOrder } = useOrders();
  const isOpen = Boolean(selectedOrderId);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleCloseOrder();
    };

    document.addEventListener('keydown', handleKeyDown);

    // Trava o scroll do fundo (inclusive no touch/iOS, onde só "overflow: hidden"
    // no body não é suficiente e o gesto ainda vaza pra página por trás).
    const scrollY = window.scrollY;
    const { body } = document;
    const previousBodyStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      body.style.position = previousBodyStyle.position;
      body.style.top = previousBodyStyle.top;
      body.style.left = previousBodyStyle.left;
      body.style.right = previousBodyStyle.right;
      body.style.overflow = previousBodyStyle.overflow;
      window.scrollTo(0, scrollY);
    };
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

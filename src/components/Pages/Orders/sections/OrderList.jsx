import { FaInbox } from 'react-icons/fa6';
import styles from '../Orders.module.css';
import UserAvatar from '../UserAvatar';
import {
  STATUS_LABEL,
  formatPrice,
  formatRelativeDate,
  getFlowProgress,
  getName,
  getOrderCounterparty,
  getStatusTone,
} from '../Orders.helpers';
import { useOrders } from '../OrdersContext';

export default function OrderList() {
  const {
    orders,
    metrics,
    loadingList,
    selectedOrderId,
    user,
    handleOpenOrder,
  } = useOrders();

  return (
    <section className={styles.listPanel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.sectionKicker}>Controle</span>
          <h2>Fila de pedidos</h2>
          <p className={styles.panelText}>
            {orders.length} {orders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
          </p>
        </div>
      </div>

      <div className={styles.listSummary}>
        <div className={styles.summaryCard}>
          <span>Resposta imediata</span>
          <strong>{metrics.pending}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Operação ativa</span>
          <strong>{metrics.active + metrics.delivered}</strong>
        </div>
      </div>

      <div className={styles.orderList}>
        {loadingList && orders.length === 0 ? (
          <div className={styles.emptyState}>Carregando pedidos...</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaInbox /></div>
            <strong>Nenhum pedido encontrado</strong>
            <p>Altere o papel ou o status para procurar em outro recorte.</p>
          </div>
        ) : (
          orders.map((order) => {
            const otherUser = getOrderCounterparty(order, user?.id);
            const active = order.id === selectedOrderId;
            const tone = getStatusTone(order.status);

            return (
              <button
                key={order.id}
                type="button"
                className={`${styles.orderCard} ${active ? styles.orderCardActive : ''}`}
                onClick={() => handleOpenOrder(order.id)}
              >
                <div className={styles.orderCardTop}>
                  <div className={styles.orderIdentity}>
                    <UserAvatar
                      person={otherUser}
                      className={`${styles.orderAvatar} ${styles[`avatar${tone}`]}`}
                    />
                    <div>
                      <strong className={styles.orderTitle}>{order.service?.title || order.planTitle}</strong>
                      <p className={styles.orderMeta}>
                        {getName(otherUser)} · {order.planTitle}
                      </p>
                    </div>
                  </div>
                  <span className={styles.orderPrice}>{formatPrice(order.priceCents)}</span>
                </div>

                <div className={styles.orderCardFooter}>
                  <span className={`${styles.statusBadge} ${styles[`status${order.status}`]}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                  <span className={styles.orderMeta}>
                    Atualizado {formatRelativeDate(order.updatedAt)}
                  </span>
                </div>

                <div className={styles.orderMiniProgress} aria-hidden="true">
                  <span style={{ width: `${getFlowProgress(order.status)}%` }} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

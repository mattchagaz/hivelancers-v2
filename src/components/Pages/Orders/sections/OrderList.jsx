import { useNavigate } from 'react-router-dom';
import { FaInbox } from 'react-icons/fa6';
import styles from '../Orders.module.css';
import EmptyState from '../../../UI/EmptyState/EmptyState';
import UserAvatar from '../UserAvatar';
import {
  EARLY_TERMINAL_STATUSES,
  MOBILE_STAGE_LABELS,
  MOBILE_STATUS_LABEL,
  ORDER_STAGES,
  STATUS_LABEL,
  formatPrice,
  formatRelativeDate,
  getEarlyTerminationNote,
  getFlowProgress,
  getName,
  getOrderCounterparty,
  getOrderStageState,
  getStatusTone,
} from '../Orders.helpers';
import { useOrders } from '../OrdersContext';

function MobileOrderCard({ order, active, onOpen, user }) {
  const navigate = useNavigate();
  const otherUser = getOrderCounterparty(order, user?.id);

  const handleOpenConversation = (event) => {
    event.stopPropagation();
    if (order.conversationId) navigate(`/messages?chat=${order.conversationId}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(order.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.mobileOrderCard} ${active ? styles.orderCardActive : ''}`}
      onClick={() => onOpen(order.id)}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.mobileOrderTop}>
        <UserAvatar person={otherUser} className={`${styles.orderAvatar} ${styles[`avatar${getStatusTone(order.status)}`]}`} />
        <strong className={styles.mobileOrderTitle}>{order.service?.title || order.planTitle}</strong>
        <span className={`${styles.mobileStatusBadge} ${styles[`status${order.status}`]}`}>
          {MOBILE_STATUS_LABEL[order.status] || STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      <p className={styles.mobileOrderMeta}>
        {getName(otherUser)} · {formatPrice(order.priceCents)}
      </p>

      {EARLY_TERMINAL_STATUSES.includes(order.status) ? (
        <p className={styles.mobileStepperNote}>{getEarlyTerminationNote(order.status)}</p>
      ) : (
        <div className={styles.mobileStepper}>
          {ORDER_STAGES.map((stage, index) => {
            const state = getOrderStageState(order.status, stage.key);
            return (
              <div key={stage.key} className={styles.mobileStep}>
                <div className={styles.mobileStepLine}>
                  <span className={`${styles.mobileStepDot} ${styles[`mobileStepDot${state}`]}`} />
                  {index < ORDER_STAGES.length - 1 && (
                    <span className={`${styles.mobileStepConnector} ${styles[`mobileStepConnector${state}`]}`} />
                  )}
                </div>
                <span className={`${styles.mobileStepLabel} ${styles[`mobileStepLabel${state}`]}`}>
                  {MOBILE_STAGE_LABELS[stage.key]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {order.conversationId && (
        <button type="button" className={styles.mobileConvoButton} onClick={handleOpenConversation}>
          Abrir conversa
        </button>
      )}
    </div>
  );
}

export default function OrderList() {
  const {
    orders,
    metrics,
    loadingList,
    selectedOrderId,
    user,
    handleOpenOrder,
    mobileTab,
    mobileOrders,
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
          <EmptyState
            compact
            icon={<FaInbox />}
            title="Nenhum pedido encontrado"
            description="Altere o papel ou o status para procurar em outro recorte."
          />
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

      <div className={styles.mobileOrderList}>
        {loadingList && mobileOrders.length === 0 ? (
          <div className={styles.emptyState}>Carregando pedidos...</div>
        ) : mobileOrders.length === 0 ? (
          <EmptyState
            compact
            icon={<FaInbox />}
            title="Nenhum pedido encontrado"
            description={mobileTab === 'active' ? 'Nenhum pedido em andamento no momento.' : 'Nenhum pedido concluído ainda.'}
          />
        ) : (
          mobileOrders.map((order) => (
            <MobileOrderCard
              key={order.id}
              order={order}
              user={user}
              active={order.id === selectedOrderId}
              onOpen={handleOpenOrder}
            />
          ))
        )}
      </div>
    </section>
  );
}

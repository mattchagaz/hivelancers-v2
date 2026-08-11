import { useState } from 'react';
import { FaCircleCheck, FaTriangleExclamation } from 'react-icons/fa6';
import styles from '../Admin.module.css';
import {
  DISPUTE_STATUS_LABEL,
  DISPUTE_REASON_LABEL,
  toUserName,
  formatCents,
  formatDate,
  PAYMENT_STATUS_LABEL,
  RELEASE_STATUS_LABEL,
} from '../Admin.helpers';
import { useAdmin } from '../AdminContext';
import AdminModal from '../AdminModal';

export default function DisputesTab() {
  const [editorOpen, setEditorOpen] = useState(false);
  const {
    loadDisputes,
    disputesLoading,
    saveDisputeResolution,
    selectedDispute,
    disputeSaving,
    disputeStatusFilter,
    setDisputeStatusFilter,
    adminDisputesTotal,
    adminDisputes,
    selectedDisputeId,
    setSelectedDisputeId,
    setDisputeResolutionNote,
    disputeOutcome,
    setDisputeOutcome,
    disputeResolutionNote,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Mediação financeira</span>
          <h3>Disputas abertas por clientes e freelancers</h3>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.ghostButton} onClick={loadDisputes} disabled={disputesLoading}>
            {disputesLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className={styles.userFilters}>
        <select value={disputeStatusFilter} onChange={(event) => setDisputeStatusFilter(event.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(DISPUTE_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <span>{adminDisputesTotal} registros encontrados</span>
      </div>

      <div className={styles.supportQueue}>
          {disputesLoading ? (
            <div className={styles.taxonomyEmpty}>Carregando disputas...</div>
          ) : adminDisputes.length === 0 ? (
            <div className={styles.taxonomyEmpty}>Nenhuma disputa encontrada neste filtro.</div>
          ) : (
            adminDisputes.map((dispute) => (
              <button
                type="button"
                key={dispute.id}
                className={`${styles.supportTicketCard} ${selectedDisputeId === dispute.id ? styles.supportTicketCardActive : ''}`}
                onClick={() => {
                  setSelectedDisputeId(dispute.id);
                  setDisputeResolutionNote(dispute.resolutionNote || '');
                  setEditorOpen(true);
                }}
              >
                <span className={styles.supportTicketCode}>
                  Pedido #{dispute.order.id.slice(-8).toUpperCase()}
                </span>
                <strong>{dispute.order.service?.title || dispute.order.planTitle}</strong>
                <p>{dispute.description}</p>
                <div className={styles.supportTicketBadges}>
                  <em className={`${styles.badge} ${dispute.status === 'OPEN' ? styles.warning : styles.success}`}>
                    {DISPUTE_STATUS_LABEL[dispute.status] || dispute.status}
                  </em>
                  <em className={`${styles.badge} ${styles.neutral}`}>
                    {DISPUTE_REASON_LABEL[dispute.reason] || dispute.reason}
                  </em>
                </div>
                <div className={styles.supportTicketMeta}>
                  <span>{toUserName(dispute.openedBy)}</span>
                  <span>{formatCents(dispute.order.priceCents)}</span>
                  <span>{formatDate(dispute.createdAt)}</span>
                </div>
              </button>
            ))
          )}
      </div>

      <AdminModal
        open={editorOpen && Boolean(selectedDispute)}
        onClose={() => setEditorOpen(false)}
        kicker="Análise de disputa"
        title={selectedDispute?.order?.service?.title || selectedDispute?.order?.planTitle || 'Disputa'}
        description={selectedDispute ? `Pedido #${selectedDispute.order.id.slice(-8).toUpperCase()} · ${DISPUTE_REASON_LABEL[selectedDispute.reason] || selectedDispute.reason}` : ''}
        icon={<FaTriangleExclamation />}
        busy={disputeSaving}
      >
        {selectedDispute && (
          <>
              <div className={styles.ticketDetailBlock}>
                <span>Relato enviado</span>
                <p>{selectedDispute.description}</p>
              </div>

              <div className={styles.supportMetaGrid}>
                <div>
                  <span>Cliente</span>
                  <strong>{toUserName(selectedDispute.order.client)}</strong>
                </div>
                <div>
                  <span>Freelancer</span>
                  <strong>{toUserName(selectedDispute.order.freelancer)}</strong>
                </div>
                <div>
                  <span>Valor</span>
                  <strong>{formatCents(selectedDispute.order.priceCents)}</strong>
                </div>
                <div>
                  <span>Pagamento</span>
                  <strong>
                    {selectedDispute.order.payment
                      ? `${PAYMENT_STATUS_LABEL[selectedDispute.order.payment.status] || selectedDispute.order.payment.status} · ${RELEASE_STATUS_LABEL[selectedDispute.order.payment.releaseStatus] || selectedDispute.order.payment.releaseStatus}`
                      : 'Sem pagamento'}
                  </strong>
                </div>
              </div>

              {selectedDispute.status === 'OPEN' ? (
                <div className={styles.formGrid}>
                  <label className={`${styles.formField} ${styles.formFieldFull}`}>
                    <span>Decisão financeira</span>
                    <select value={disputeOutcome} onChange={(event) => setDisputeOutcome(event.target.value)}>
                      <option value="REFUND_CLIENT">Reembolsar o cliente e cancelar</option>
                      <option value="RELEASE_FREELANCER">Liberar ao freelancer e concluir</option>
                    </select>
                  </label>
                  <label className={`${styles.formField} ${styles.formFieldFull}`}>
                    <span>Fundamentação da decisão</span>
                    <textarea
                      rows={6}
                      value={disputeResolutionNote}
                      onChange={(event) => setDisputeResolutionNote(event.target.value)}
                      placeholder="Registre fatos analisados, evidências e justificativa da decisão."
                    />
                  </label>
                </div>
              ) : (
                <div className={styles.ticketDetailBlock}>
                  <span>Decisão registrada</span>
                  <p>{selectedDispute.resolutionNote || 'Sem nota registrada.'}</p>
                </div>
              )}
              {selectedDispute.status === 'OPEN' && (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={saveDisputeResolution}
                  disabled={disputeSaving}
                >
                  <FaCircleCheck /> {disputeSaving ? 'Resolvendo...' : 'Registrar decisão'}
                </button>
              )}
          </>
        )}
      </AdminModal>
    </section>
  );
}

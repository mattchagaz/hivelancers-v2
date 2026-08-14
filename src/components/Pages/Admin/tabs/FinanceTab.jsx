import {
  FaMoneyBillTransfer,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaArrowTrendUp,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import { toast } from 'sonner';
import styles from '../Admin.module.css';
import { approveAdminPaymentRelease, retryAdminPaymentTransfer } from '../../../../services/payments';
import {
  formatCents,
  toUserName,
  getStatusTone,
  PAYMENT_STATUS_LABEL,
  RELEASE_STATUS_LABEL,
} from '../Admin.helpers';
import { useAdmin } from '../AdminContext';
import AdminPagination from '../AdminPagination';

export default function FinanceTab() {
  const {
    loadAdminPayments,
    paymentsLoading,
    financeSummary,
    financeReleaseCounts,
    financePaymentCounts,
    paymentStatusFilter,
    setPaymentStatusFilter,
    releaseStatusFilter,
    setReleaseStatusFilter,
    adminPaymentsTotal,
    adminPayments,
    paymentsPage,
    setPaymentsPage,
    paymentsTotalPages,
    retryingPaymentId,
    setRetryingPaymentId,
    approvingPaymentId,
    setApprovingPaymentId,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Financeiro</span>
          <h3>Pagamentos, repasses e falhas operacionais</h3>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.ghostButton} onClick={loadAdminPayments} disabled={paymentsLoading}>
            {paymentsLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className={styles.financeGrid}>
        <div className={`${styles.financeCard} ${styles.financeCardWarning}`}>
          <FaMoneyBillTransfer />
          <span>Retido para repasse</span>
          <strong>{formatCents(financeSummary.heldCents)}</strong>
          <p>{financeReleaseCounts.HELD || 0} pagamentos em hold</p>
        </div>
        <div className={styles.financeCard}>
          <FaCreditCard />
          <span>GMV confirmado</span>
          <strong>{formatCents(financeSummary.succeededCents)}</strong>
          <p>{financePaymentCounts.SUCCEEDED || 0} pagamentos pagos</p>
        </div>
        <div className={styles.financeCard}>
          <FaFileInvoiceDollar />
          <span>Receita de taxas</span>
          <strong>{formatCents((financeSummary.platformFeeCents || 0) + (financeSummary.clientFeeCents || 0))}</strong>
          <p>Freelancer {formatCents(financeSummary.platformFeeCents)} · cliente {formatCents(financeSummary.clientFeeCents)}</p>
        </div>
        <div className={styles.financeCard}>
          <FaCreditCard />
          <span>Custos dos gateways</span>
          <strong>{formatCents(financeSummary.gatewayFeeCents ?? financeSummary.estimatedStripeFeeCents)}</strong>
          <p>AbacatePay real · Stripe estimada</p>
        </div>
        <div className={`${styles.financeCard} ${styles.financeCardSuccess}`}>
          <FaArrowTrendUp />
          <span>Líquido da plataforma</span>
          <strong>{formatCents(financeSummary.platformNetCents)}</strong>
          <p>Receita de taxas menos custos dos gateways</p>
        </div>
        <div className={`${styles.financeCard} ${styles.financeCardDanger}`}>
          <FaTriangleExclamation />
          <span>Falhas de repasse</span>
          <strong>{formatCents(financeSummary.failedTransferCents)}</strong>
          <p>{financeReleaseCounts.FAILED || 0} itens para revisar</p>
        </div>
      </div>

      <div className={styles.financeFilters}>
        <select value={paymentStatusFilter} onChange={(event) => setPaymentStatusFilter(event.target.value)}>
          <option value="">Todos os pagamentos</option>
          {Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={releaseStatusFilter} onChange={(event) => setReleaseStatusFilter(event.target.value)}>
          <option value="">Todos os repasses</option>
          {Object.entries(RELEASE_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <span className={styles.financeFiltersCount}>{adminPaymentsTotal} registros encontrados</span>
      </div>

      <div className={styles.ledger}>
        {paymentsLoading ? (
          <div className={styles.taxonomyEmpty}>Carregando pagamentos...</div>
        ) : adminPayments.length ? (
          adminPayments.map((payment) => (
          <article key={payment.id} className={styles.ledgerRow}>
            <div>
              <span>#{payment.id.slice(-8).toUpperCase()}</span>
              <strong>{payment.service?.title || payment.project?.title || 'Pagamento Hivelancers'}</strong>
              <p>
                {toUserName(payment.client)} {payment.order ? 'contratou' : 'iniciou checkout com'} {toUserName(payment.freelancer)}
              </p>
            </div>
            <strong>{formatCents(payment.totalCents ?? payment.amountCents)}</strong>
            <div className={styles.ledgerEconomics}>
              <span>Plataforma</span>
              <strong>{formatCents(payment.economics?.platformNetCents)}</strong>
              <p>
                {payment.provider === 'ABACATEPAY' ? 'AbacatePay' : 'Stripe'}:{' '}
                {formatCents(payment.economics?.gatewayFeeCents ?? payment.economics?.estimatedStripeFeeCents)}
                {payment.economics?.gatewayFeeEstimated ? ' (estimado)' : ''}
              </p>
            </div>
            <em className={`${styles.badge} ${getStatusTone(PAYMENT_STATUS_LABEL[payment.status] || payment.status)}`}>
              {PAYMENT_STATUS_LABEL[payment.status] || payment.status}
            </em>
            <div>
              <em className={`${styles.badge} ${getStatusTone(payment.order ? (RELEASE_STATUS_LABEL[payment.releaseStatus] || payment.releaseStatus) : 'Sem movimentação')}`}>
                {payment.order
                  ? (RELEASE_STATUS_LABEL[payment.releaseStatus] || payment.releaseStatus)
                  : 'Sem movimentação'}
              </em>
              {payment.releaseStatus === 'HELD' && payment.releaseEligibleAt && (
                <p>Libera sozinho em {new Date(payment.releaseEligibleAt).toLocaleString('pt-BR')}</p>
              )}
            </div>
            <div className={styles.buttonGroup}>
              {payment.canApproveRelease && (
                <button
                  type="button"
                  className={styles.ghostButton}
                  disabled={approvingPaymentId === payment.id}
                  onClick={async () => {
                    setApprovingPaymentId(payment.id);
                    try {
                      await approveAdminPaymentRelease(payment.id);
                      toast.success('Repasse aprovado e enviado.');
                      await loadAdminPayments();
                    } catch (err) {
                      toast.error(err.message);
                    } finally {
                      setApprovingPaymentId('');
                    }
                  }}
                >
                  {approvingPaymentId === payment.id ? 'Aprovando...' : 'Aprovar repasse'}
                </button>
              )}
              <button
                type="button"
                className={styles.ghostButton}
                disabled={
                  retryingPaymentId === payment.id ||
                  payment.status !== 'SUCCEEDED' ||
                  payment.releaseStatus !== 'FAILED'
                }
                onClick={async () => {
                  setRetryingPaymentId(payment.id);
                  try {
                    await retryAdminPaymentTransfer(payment.id);
                    toast.success('Repasse reprocessado.');
                    await loadAdminPayments();
                  } catch (err) {
                    toast.error(err.message);
                  } finally {
                    setRetryingPaymentId('');
                  }
                }}
              >
                {retryingPaymentId === payment.id ? 'Reprocessando...' : 'Reprocessar'}
              </button>
            </div>
          </article>
          ))
        ) : (
          <div className={styles.taxonomyEmpty}>Nenhum pagamento encontrado neste filtro.</div>
        )}
      </div>

      <AdminPagination
        currentPage={paymentsPage}
        totalPages={paymentsTotalPages}
        totalItems={adminPaymentsTotal}
        onPageChange={setPaymentsPage}
      />
    </section>
  );
}

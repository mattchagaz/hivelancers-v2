import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaArrowsRotate,
  FaCircleCheck,
  FaClock,
  FaPix,
  FaShieldHalved,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import { toast } from 'sonner';
import {
  listAdminPixSandboxPayments,
  simulateAdminPixPayment,
} from '../../../../services/payments';
import {
  formatCents,
  formatDate,
  PAYMENT_STATUS_LABEL,
  toUserName,
} from '../Admin.helpers';
import AdminModal from '../AdminModal';
import adminStyles from '../Admin.module.css';
import styles from './PixSimulatorTab.module.css';

export default function PixSimulatorTab() {
  const [payments, setPayments] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [simulatingId, setSimulatingId] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const loadPayments = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await listAdminPixSandboxPayments();
      setConfigured(Boolean(data?.configured));
      setPayments(Array.isArray(data?.items) ? data.items : []);
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível carregar as cobranças Pix.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const confirmSimulation = async () => {
    if (!selectedPayment || simulatingId) return;
    setSimulatingId(selectedPayment.id);
    try {
      const result = await simulateAdminPixPayment(selectedPayment.id);
      setLastResult(result);
      setSelectedPayment(null);
      toast.success('Pagamento Pix simulado e pedido criado.');
      await loadPayments({ silent: true });
    } catch (simulationError) {
      toast.error(simulationError.message);
    } finally {
      setSimulatingId('');
    }
  };

  return (
    <section className={`${adminStyles.panel} ${styles.simulatorPanel}`} aria-live="polite">
      <div className={adminStyles.panelHead}>
        <div>
          <span className={adminStyles.sectionKicker}>Sandbox Pix</span>
          <h3>Simulador de pagamento AbacatePay</h3>
          <p className={adminStyles.panelDescription}>
            Confirme cobranças Pix de desenvolvimento e valide a criação do pedido sem depender de uma simulação manual.
          </p>
        </div>
        <button
          type="button"
          className={adminStyles.ghostButton}
          onClick={() => loadPayments({ silent: true })}
          disabled={refreshing}
        >
          <FaArrowsRotate className={refreshing ? styles.spinning : ''} />
          {refreshing ? 'Atualizando...' : 'Atualizar cobranças'}
        </button>
      </div>

      <div className={styles.sandboxNotice}>
        <span className={styles.noticeIcon}><FaShieldHalved /></span>
        <div>
          <strong>Ferramenta exclusiva do ambiente de desenvolvimento</strong>
          <p>
            A ação confirma a cobrança no sandbox, executa o mesmo fluxo do webhook e cria um pedido com o valor protegido.
          </p>
        </div>
        <em><FaCircleCheck /> Somente administradores</em>
      </div>

      {!configured && (
        <div className={styles.warningBanner}>
          <FaTriangleExclamation />
          <div>
            <strong>Integração Pix não configurada</strong>
            <p>Configure as credenciais de teste da AbacatePay no backend antes de usar o simulador.</p>
          </div>
        </div>
      )}

      {lastResult?.order && (
        <div className={styles.successBanner}>
          <span><FaCircleCheck /></span>
          <div>
            <strong>Simulação concluída</strong>
            <p>O pagamento foi confirmado e o pedido #{lastResult.order.id.slice(-8).toUpperCase()} está com o valor protegido.</p>
          </div>
          <Link to={`/orders?id=${lastResult.order.id}`}>
            Abrir pedido <FaArrowRight />
          </Link>
        </div>
      )}

      <div className={styles.listHeading}>
        <div>
          <span>Cobranças elegíveis</span>
          <strong>{payments.length} Pix aguardando confirmação</strong>
        </div>
        <p>São exibidas até 50 cobranças pendentes, das mais recentes para as mais antigas.</p>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <span className={styles.loadingPix}><FaPix /></span>
          <strong>Buscando cobranças Pix...</strong>
          <p>Consultando os checkouts pendentes no backend.</p>
        </div>
      ) : error ? (
        <div className={styles.emptyState} data-tone="danger">
          <span><FaTriangleExclamation /></span>
          <strong>Não foi possível carregar o simulador</strong>
          <p>{error}</p>
          <button type="button" className={adminStyles.primaryButton} onClick={() => loadPayments()}>
            Tentar novamente
          </button>
        </div>
      ) : payments.length ? (
        <div className={styles.paymentList}>
          {payments.map((payment) => (
            <article key={payment.id} className={styles.paymentCard}>
              <div className={styles.paymentIcon}><FaPix /></div>
              <div className={styles.paymentMain}>
                <div className={styles.paymentTitle}>
                  <span>#{payment.id.slice(-8).toUpperCase()}</span>
                  <em>{PAYMENT_STATUS_LABEL[payment.status] || payment.status}</em>
                </div>
                <strong>{payment.service?.title || payment.project?.title || 'Pagamento Hivelancers'}</strong>
                <p>{toUserName(payment.client)} → {toUserName(payment.freelancer)}</p>
              </div>
              <div className={styles.paymentMeta}>
                <span>Total da cobrança</span>
                <strong>{formatCents(payment.totalCents)}</strong>
                <small><FaClock /> Expira em {formatDate(payment.sessionExpiresAt)}</small>
              </div>
              <button
                type="button"
                className={adminStyles.primaryButton}
                disabled={!configured || !payment.canSimulate || Boolean(simulatingId)}
                title={payment.simulationBlockReason || undefined}
                onClick={() => setSelectedPayment(payment)}
              >
                <FaCircleCheck /> Simular pagamento
              </button>
              {!payment.canSimulate && payment.simulationBlockReason && (
                <small className={styles.blockReason}>{payment.simulationBlockReason}</small>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span><FaPix /></span>
          <strong>Nenhuma cobrança Pix pendente</strong>
          <p>Crie um checkout Pix em uma conta cliente e volte aqui para simular a confirmação.</p>
        </div>
      )}

      <AdminModal
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        kicker="Confirmar simulação"
        title="Marcar este Pix como pago?"
        description="Esta ação percorre o fluxo real de confirmação do backend e cria o pedido protegido."
        icon={<FaPix />}
        busy={Boolean(simulatingId)}
      >
        {selectedPayment && (
          <div className={styles.confirmContent}>
            <div className={styles.confirmSummary}>
              <div>
                <span>Cobrança</span>
                <strong>#{selectedPayment.id.slice(-8).toUpperCase()}</strong>
              </div>
              <div>
                <span>Serviço ou projeto</span>
                <strong>{selectedPayment.service?.title || selectedPayment.project?.title || 'Pagamento Hivelancers'}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCents(selectedPayment.totalCents)}</strong>
              </div>
            </div>
            <div className={styles.confirmWarning}>
              <FaTriangleExclamation />
              <p>Depois da confirmação, esta cobrança deixa a lista de pendentes e passa a aparecer como paga no Financeiro.</p>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={adminStyles.ghostButton}
                onClick={() => setSelectedPayment(null)}
                disabled={Boolean(simulatingId)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={adminStyles.primaryButton}
                onClick={confirmSimulation}
                disabled={Boolean(simulatingId)}
              >
                <FaCircleCheck />
                {simulatingId ? 'Confirmando no sandbox...' : 'Simular e criar pedido'}
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </section>
  );
}

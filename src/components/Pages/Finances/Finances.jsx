import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaArrowRight,
  FaBuildingColumns,
  FaCircleCheck,
  FaClock,
  FaCreditCard,
  FaFileShield,
  FaMoneyBillTransfer,
  FaRotateRight,
  FaWallet,
} from 'react-icons/fa6';
import { useAuth } from '../../../contexts/authContextStore';
import {
  cancelCheckoutPayment,
  getMyFinancialOverview,
  getMyPixPayoutAccount,
  resumeCheckoutPayment,
} from '../../../services/payments';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import PixPaymentPanel from '../Checkout/PixPaymentPanel';
import checkoutStyles from '../Checkout/Checkout.module.css';
import styles from './Finances.module.css';

const ORDER_STATUS_LABEL = {
  PENDING: 'Aguardando',
  IN_PROGRESS: 'Em execução',
  DELIVERED: 'Entregue',
  COMPLETED: 'Concluído',
  REJECTED: 'Recusado',
  CANCELED: 'Cancelado',
};

const RELEASE_STATUS_LABEL = {
  HELD: 'Retido',
  TRANSFERRED: 'Repassado',
  FAILED: 'Revisão',
  NOT_REQUIRED: 'Sem repasse',
};

const PAYMENT_STATUS_LABEL = {
  CHECKOUT_CREATED: 'Aguardando pagamento',
  PENDING: 'Pagamento em processamento',
  SUCCEEDED: 'Pagamento confirmado',
  FAILED: 'Pagamento falhou',
  CANCELED: 'Checkout cancelado',
  EXPIRED: 'Checkout expirado',
  REFUNDED: 'Pagamento reembolsado',
};

const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((Number(cents) || 0) / 100);

const formatDate = (value) => {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getVerificationState = (pixAccount, loading) => {
  if (loading) {
    return {
      tone: 'blue',
      label: 'Verificando',
      title: 'Consultando sua chave Pix',
      text: 'Estamos sincronizando os dados da sua conta recebedora.',
    };
  }

  if (!pixAccount?.configured) {
    return {
      tone: 'red',
      label: 'Backend',
      title: 'Pix ainda não configurado',
      text: 'Configure as credenciais no backend para ativar recebimentos.',
    };
  }

  if (!pixAccount.connected) {
    return {
      tone: 'orange',
      label: 'Pendente',
      title: 'Chave Pix ainda não cadastrada',
      text: 'Cadastre uma chave Pix para poder receber pedidos pagos.',
    };
  }

  return {
    tone: 'green',
    label: 'Pronto',
    title: 'Chave Pix cadastrada',
    text: 'Os repasses podem ser liberados após aprovação dos pedidos.',
  };
};

function MetricCard({ icon, label, value, detail, tone = 'blue' }) {
  return (
    <SpotlightCard className={`${styles.metricCard} ${styles[tone]}`}>
      <div className={styles.metricIcon}>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </SpotlightCard>
  );
}

function Finances() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFreelancer = user?.userType === 'FREELANCER';

  const [pixAccount, setPixAccount] = useState({
    configured: true,
    connected: false,
    account: null,
  });
  const [overview, setOverview] = useState(null);
  const [loadingConnect, setLoadingConnect] = useState(isFreelancer);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [activeAction, setActiveAction] = useState('');
  const [resumedPix, setResumedPix] = useState(null);
  const [completedPixOrder, setCompletedPixOrder] = useState(null);

  const loadConnect = useCallback(async () => {
    if (!isFreelancer) return;

    setLoadingConnect(true);
    try {
      const data = await getMyPixPayoutAccount();
      setPixAccount(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingConnect(false);
    }
  }, [isFreelancer]);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await getMyFinancialOverview();
      setOverview(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadConnect();
    loadOverview();
  }, [loadConnect, loadOverview]);

  const verification = getVerificationState(pixAccount, loadingConnect);
  const account = pixAccount.account;

  const summary = overview?.summary || {};
  const movementCounts = summary.counts || {};
  const releaseCounts = summary.releaseCounts || {};

  const goToPixSettings = () => navigate('/settings?tab=billing');

  const refreshAll = async () => {
    setActiveAction('refresh');
    await Promise.all([loadConnect(), loadOverview()]);
    setActiveAction('');
  };

  const resumePayment = async (movement) => {
    setActiveAction(`resume-${movement.id}`);
    try {
      const data = await resumeCheckoutPayment(movement.id);
      if (data.pix && data.payment) {
        setCompletedPixOrder(null);
        setResumedPix(data);
        setActiveAction('');
        return;
      }
      if (!data.checkoutUrl) throw new Error('Este checkout não está mais disponível.');
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      toast.error(error.message);
      await loadOverview();
      setActiveAction('');
    }
  };

  const cancelPayment = async (movement) => {
    setActiveAction(`cancel-${movement.id}`);
    try {
      await cancelCheckoutPayment(movement.id);
      toast.success('Tentativa de pagamento cancelada.');
      await loadOverview();
    } catch (error) {
      toast.error(error.message);
      await loadOverview();
    } finally {
      setActiveAction('');
    }
  };

  const movements = overview?.movements || [];

  if (completedPixOrder) {
    const orderNumber = String(completedPixOrder.id || '').slice(-8).toUpperCase();

    return (
      <div className={checkoutStyles.successState}>
        <div className={checkoutStyles.successIcon}>
          <FaCircleCheck size={48} />
        </div>
        <h1 className={checkoutStyles.successTitle}>Pedido confirmado com sucesso!</h1>
        <p className={checkoutStyles.successText}>
          Seu pagamento via Pix foi confirmado e está protegido. Você pode continuar nesta tela e acessar o pedido quando quiser.
        </p>

        <div className={checkoutStyles.successGrid}>
          <div className={checkoutStyles.successCard}>
            <span className={checkoutStyles.successLabel}>Nº do Pedido</span>
            <strong>#{orderNumber}</strong>
          </div>
          <div className={checkoutStyles.successCard}>
            <span className={checkoutStyles.successLabel}>Status</span>
            <strong className={checkoutStyles.statusProtected}>Valor Protegido</strong>
          </div>
          <div className={checkoutStyles.successCard}>
            <span className={checkoutStyles.successLabel}>Próximo Passo</span>
            <strong>Aguardando Aceite</strong>
          </div>
        </div>

        <div className={checkoutStyles.successActions}>
          <button
            type="button"
            className={checkoutStyles.primaryButton}
            onClick={() => navigate(`/orders?id=${completedPixOrder.id}`)}
          >
            Acessar painel do pedido
          </button>
          <button
            type="button"
            className={checkoutStyles.secondaryButton}
            onClick={() => {
              setCompletedPixOrder(null);
              loadOverview();
            }}
          >
            Continuar no financeiro
          </button>
        </div>
      </div>
    );
  }

  if (resumedPix?.payment) {
    return (
      <PixPaymentPanel
        initialPayment={resumedPix.payment}
        pix={resumedPix.pix}
        onOrderCreated={(order) => {
          setCompletedPixOrder(order);
          setResumedPix(null);
        }}
        onBack={() => {
          setResumedPix(null);
          loadOverview();
        }}
      />
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>{isFreelancer ? 'Recebimentos' : 'Pagamentos'}</span>
          <h1>{isFreelancer ? 'Central financeira do freelancer' : 'Central financeira do cliente'}</h1>
          <p>
            {isFreelancer
              ? 'Acompanhe verificação, pedidos pagos, valores retidos e repasses liberados pela Hivelancers.'
              : 'Acompanhe pagamentos, pedidos protegidos e histórico de contratações dentro da plataforma.'}
          </p>
          <div className={styles.heroActions}>
            {isFreelancer ? (
              <button
                type="button"
                className={styles.primaryAction}
                onClick={goToPixSettings}
                disabled={!pixAccount.configured}
              >
                {account ? 'Revisar chave Pix' : 'Cadastrar chave Pix'} <FaArrowRight />
              </button>
            ) : (
              <Link to="/services" className={styles.primaryAction}>
                Explorar serviços <FaArrowRight />
              </Link>
            )}
          </div>
        </div>

        <aside className={`${styles.verificationCard} ${styles[verification.tone]}`}>
          <div className={styles.verificationTop}>
            <div className={styles.verificationIcon}>
              <FaFileShield />
            </div>
            <span>{verification.label}</span>
          </div>
          <strong>{verification.title}</strong>
          <p>{verification.text}</p>
          {isFreelancer && (
            <button
              type="button"
              className={styles.refreshButton}
              onClick={refreshAll}
              disabled={activeAction === 'refresh'}
            >
              <FaRotateRight /> {activeAction === 'refresh' ? 'Atualizando...' : 'Atualizar status'}
            </button>
          )}
        </aside>
      </section>

      <section className={styles.metricGrid}>
        {isFreelancer ? (
          <>
            <MetricCard
              icon={<FaMoneyBillTransfer />}
              label="Repassado"
              value={loadingOverview ? '...' : formatPrice(summary.transferredCents)}
              detail={`${releaseCounts.TRANSFERRED || 0} repasses concluídos`}
              tone="green"
            />
            <MetricCard
              icon={<FaClock />}
              label="A receber"
              value={loadingOverview ? '...' : formatPrice(summary.heldCents)}
              detail={`${releaseCounts.HELD || 0} pagamentos aguardando aprovação`}
              tone="orange"
            />
            <MetricCard
              icon={<FaWallet />}
              label="Bruto processado"
              value={loadingOverview ? '...' : formatPrice(summary.grossCents)}
              detail={`${movementCounts.SUCCEEDED || 0} pagamentos confirmados`}
              tone="blue"
            />
            <MetricCard
              icon={<FaBuildingColumns />}
              label="Taxas da plataforma"
              value={loadingOverview ? '...' : formatPrice(summary.platformFeeCents)}
              detail="Retidas antes do repasse"
              tone="purple"
            />
          </>
        ) : (
          <>
            <MetricCard
              icon={<FaCreditCard />}
              label="Total pago"
              value={loadingOverview ? '...' : formatPrice(summary.succeededChargedCents ?? summary.succeededCents)}
              detail="Contratações e taxas confirmadas"
              tone="blue"
            />
            <MetricCard
              icon={<FaClock />}
              label="Protegido"
              value={loadingOverview ? '...' : formatPrice(summary.heldCents)}
              detail="Aguardando entrega ou aprovação"
              tone="orange"
            />
            <MetricCard
              icon={<FaCircleCheck />}
              label="Confirmados"
              value={loadingOverview ? '...' : movementCounts.SUCCEEDED || 0}
              detail="Pagamentos bem-sucedidos"
              tone="green"
            />
            <MetricCard
              icon={<FaWallet />}
              label="Pendentes"
              value={loadingOverview ? '...' : (movementCounts.PENDING || 0) + (movementCounts.CHECKOUT_CREATED || 0)}
              detail="Checkout ou Pix aguardando confirmação"
              tone="purple"
            />
          </>
        )}
      </section>

      <section className={styles.workspaceGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionKicker}>Conta recebedora</span>
              <h2>{isFreelancer ? 'Chave Pix para repasses' : 'Pagamentos protegidos'}</h2>
              <p>
                {isFreelancer
                  ? 'O repasse só é liberado quando você tem uma chave Pix ativa cadastrada.'
                  : 'Os pagamentos ficam registrados no pedido e o freelancer recebe apenas após aprovação.'}
              </p>
            </div>
          </div>

          {isFreelancer ? (
            <div className={styles.statusStack}>
              <div className={styles.statusRow}>
                <span className={pixAccount.connected ? styles.statusDone : styles.statusPending}>
                  {pixAccount.connected ? <FaCircleCheck /> : <FaClock />}
                </span>
                <strong>Chave Pix cadastrada</strong>
                <em>{pixAccount.connected ? (account?.maskedKey || 'OK') : 'Pendente'}</em>
              </div>
            </div>
          ) : (
            <div className={styles.protectionBox}>
              <div className={styles.protectionIcon}>
                <FaFileShield />
              </div>
              <div>
                <strong>Fluxo protegido por aprovação</strong>
                <p>Após o pagamento, o pedido é criado e o repasse só ocorre quando você aprova a entrega.</p>
              </div>
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionKicker}>Histórico</span>
              <h2>{isFreelancer ? 'Pedidos e repasses' : 'Pagamentos recentes'}</h2>
              <p>{isFreelancer ? 'Últimos pedidos com status financeiro sincronizado.' : 'Pedidos confirmados e tentativas de checkout ficam separados com clareza.'}</p>
            </div>
            <Link to="/orders" className={styles.panelLink}>
              Ver pedidos <FaArrowRight />
            </Link>
          </div>

          <div className={styles.table}>
            {loadingOverview ? (
              <div className={styles.emptyLine}>Carregando histórico financeiro...</div>
            ) : movements.length ? (
              movements.map((movement) => {
                const hasOrder = Boolean(movement.order?.id);
                const paymentLabel = PAYMENT_STATUS_LABEL[movement.status] || movement.status;
                const financialLabel = hasOrder
                  ? (RELEASE_STATUS_LABEL[movement.releaseStatus] || movement.releaseStatus)
                  : (movement.status === 'PENDING'
                    ? 'Confirmação pendente'
                    : (movement.canResume ? 'Pagamento não concluído' : 'Sem cobrança'));

                return (
                <article key={movement.id} className={styles.tableRow}>
                  <div className={styles.rowBody}>
                    <strong>{movement.service?.title || movement.project?.title || 'Pagamento Hivelancers'}</strong>
                    <span>
                      {formatDate(movement.updatedAt)} · {ORDER_STATUS_LABEL[movement.order?.status] || paymentLabel}
                    </span>
                    {!hasOrder && movement.canResume && movement.sessionExpiresAt && (
                      <small className={styles.expiryText}>Link disponível até {formatDateTime(movement.sessionExpiresAt)}</small>
                    )}
                  </div>
                  <div className={styles.rowSide}>
                    <div className={styles.rowMeta}>
                      <em>{financialLabel}</em>
                      <strong>{formatPrice(isFreelancer ? movement.transferAmountCents : (movement.totalCents ?? movement.amountCents))}</strong>
                    </div>
                    <div className={styles.rowActions}>
                      {hasOrder && (
                        <Link to={`/orders?id=${movement.order.id}`} className={styles.orderAction}>
                          Ver pedido <FaArrowRight />
                        </Link>
                      )}
                      {!hasOrder && movement.canResume && (
                        <button
                          type="button"
                          className={styles.movementAction}
                          onClick={() => resumePayment(movement)}
                          disabled={Boolean(activeAction)}
                        >
                          {activeAction === `resume-${movement.id}` ? 'Abrindo...' : 'Retomar pagamento'}
                        </button>
                      )}
                      {!hasOrder && movement.canCancel && (
                        <button
                          type="button"
                          className={styles.cancelMovementAction}
                          onClick={() => cancelPayment(movement)}
                          disabled={Boolean(activeAction)}
                        >
                          {activeAction === `cancel-${movement.id}` ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FaWallet />
                </div>
                <strong>Nenhuma movimentação ainda</strong>
                <p>{isFreelancer ? 'Quando um pedido pago chegar, os valores aparecem aqui.' : 'Contrate um serviço para iniciar seu histórico financeiro.'}</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.sectionKicker}>Linha do tempo</span>
            <h2>{isFreelancer ? 'Ciclo dos recebimentos' : 'Ciclo das contratações'}</h2>
            <p>
              {isFreelancer
                ? 'Cada pagamento segue do checkout confirmado até o repasse após aprovação do cliente.'
                : 'Cada contratação passa por pagamento, execução, aprovação e liberação do repasse.'}
            </p>
          </div>
        </div>

        <div className={styles.flowCards}>
          {[
            [
              'Pagamento confirmado',
              formatPrice(isFreelancer ? summary.succeededCents : (summary.succeededChargedCents ?? summary.succeededCents)),
              'Cliente pagou via cartão ou Pix',
            ],
            ['Valor protegido', formatPrice(summary.heldCents), 'Aguardando aprovação final'],
            ['Repasse liberado', formatPrice(summary.transferredCents), 'Transferência feita ao freelancer'],
            ['Revisão operacional', formatPrice(summary.failedTransferCents), 'Falhas que exigem ação admin'],
          ].map(([title, value, text], index) => (
            <div key={title} className={styles.flowCard}>
              <span>{index + 1}</span>
              <strong>{title}</strong>
              <em>{value}</em>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Finances;

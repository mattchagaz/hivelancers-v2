import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  FaTriangleExclamation,
  FaWallet,
} from 'react-icons/fa6';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createMyStripeConnectDashboardLink,
  createMyStripeConnectOnboardingLink,
  getMyFinancialOverview,
  getMyStripeConnectStatus,
} from '../../../services/payments';
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

const REQUIREMENT_LABELS = {
  external_account: 'Conta bancária para repasse',
  'business_profile.url': 'Site, perfil público ou rede social',
  'business_profile.mcc': 'Categoria comercial',
  'business_profile.product_description': 'Descrição dos serviços',
  'individual.first_name': 'Nome do titular',
  'individual.last_name': 'Sobrenome do titular',
  'individual.email': 'E-mail do titular',
  'individual.phone': 'Telefone do titular',
  'individual.id_number': 'CPF',
  'individual.dob.day': 'Data de nascimento',
  'individual.dob.month': 'Data de nascimento',
  'individual.dob.year': 'Data de nascimento',
  'individual.address.line1': 'Endereço',
  'individual.address.city': 'Cidade',
  'individual.address.state': 'Estado',
  'individual.address.postal_code': 'CEP',
  'individual.verification.document': 'Documento de identidade',
  'individual.verification.additional_document': 'Documento complementar',
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

const humanizeRequirement = (key) =>
  REQUIREMENT_LABELS[key] ||
  key
    .split('.')
    .filter(Boolean)
    .map((part) => part.replace(/_/g, ' '))
    .join(' · ');

const getVerificationState = (connectState, loading) => {
  const account = connectState?.account;
  const currentlyDue = account?.requirementsCurrentlyDue || [];
  const pastDue = account?.requirementsPastDue || [];
  const pending = account?.requirementsPendingVerification || [];

  if (loading) {
    return {
      tone: 'blue',
      label: 'Verificando',
      title: 'Consultando status da Stripe',
      text: 'Estamos sincronizando os dados da conta recebedora.',
    };
  }

  if (!connectState?.configured) {
    return {
      tone: 'red',
      label: 'Backend',
      title: 'Stripe ainda não configurada',
      text: 'Configure as credenciais no backend para ativar verificação e repasses.',
    };
  }

  if (!account) {
    return {
      tone: 'orange',
      label: 'Pendente',
      title: 'Recebimentos ainda não ativados',
      text: 'Crie sua conta conectada e complete a verificação para poder receber pedidos pagos.',
    };
  }

  if (account.onboardingComplete) {
    return {
      tone: 'green',
      label: 'Pronto',
      title: 'Conta pronta para repasses',
      text: 'A Stripe confirmou o cadastro e os repasses podem ser liberados após aprovação dos pedidos.',
    };
  }

  if (pastDue.length || account.requirementsDisabledReason) {
    return {
      tone: 'red',
      label: 'Ação urgente',
      title: 'Conta bloqueada ou com prazo vencido',
      text: 'Revise a verificação na Stripe para liberar os recebimentos.',
    };
  }

  if (currentlyDue.length) {
    return {
      tone: 'orange',
      label: 'Ação necessária',
      title: 'Faltam dados para liberar repasses',
      text: 'A Stripe pediu informações adicionais antes de habilitar saques.',
    };
  }

  if (pending.length) {
    return {
      tone: 'purple',
      label: 'Em análise',
      title: 'Documentos em verificação',
      text: 'A Stripe está revisando os dados enviados. O status atualiza automaticamente pelo webhook.',
    };
  }

  return {
    tone: 'blue',
    label: 'Incompleto',
    title: 'Onboarding iniciado',
    text: 'Continue o cadastro na Stripe para finalizar a ativação dos recebimentos.',
  };
};

function MetricCard({ icon, label, value, detail, tone = 'blue' }) {
  return (
    <article className={`${styles.metricCard} ${styles[tone]}`}>
      <div className={styles.metricIcon}>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function Finances() {
  const { user } = useAuth();
  const isFreelancer = user?.userType === 'FREELANCER';

  const [connectState, setConnectState] = useState({
    configured: true,
    connected: false,
    account: null,
  });
  const [overview, setOverview] = useState(null);
  const [loadingConnect, setLoadingConnect] = useState(isFreelancer);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [activeAction, setActiveAction] = useState('');

  const loadConnect = useCallback(async () => {
    if (!isFreelancer) return;

    setLoadingConnect(true);
    try {
      const data = await getMyStripeConnectStatus();
      setConnectState(data);
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

  const verification = getVerificationState(connectState, loadingConnect);
  const account = connectState.account;
  const dueRequirements = [
    ...(account?.requirementsPastDue || []),
    ...(account?.requirementsCurrentlyDue || []),
  ];
  const uniqueRequirements = [...new Set(dueRequirements)].slice(0, 6);

  const summary = overview?.summary || {};
  const movementCounts = summary.counts || {};
  const releaseCounts = summary.releaseCounts || {};

  const openOnboarding = async () => {
    setActiveAction('onboarding');
    try {
      const data = await createMyStripeConnectOnboardingLink();
      if (!data.url) throw new Error('A Stripe não retornou um link de verificação.');
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error.message);
      setActiveAction('');
    }
  };

  const openDashboard = async () => {
    setActiveAction('dashboard');
    try {
      const data = await createMyStripeConnectDashboardLink();
      if (!data.url) throw new Error('A Stripe não retornou um link de dashboard.');
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error.message);
      setActiveAction('');
    }
  };

  const refreshAll = async () => {
    setActiveAction('refresh');
    await Promise.all([loadConnect(), loadOverview()]);
    setActiveAction('');
  };

  const movements = overview?.movements || [];

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
              <>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={openOnboarding}
                  disabled={activeAction === 'onboarding' || !connectState.configured}
                >
                  {account ? 'Revisar verificação' : 'Ativar recebimentos'} <FaArrowRight />
                </button>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={openDashboard}
                  disabled={activeAction === 'dashboard' || !account?.detailsSubmitted}
                >
                  Abrir Stripe
                </button>
              </>
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
              value={loadingOverview ? '...' : formatPrice(summary.succeededCents)}
              detail="Contratações confirmadas"
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
              <h2>{isFreelancer ? 'Verificação Stripe Connect' : 'Pagamentos protegidos'}</h2>
              <p>
                {isFreelancer
                  ? 'O repasse só é liberado quando a conta conectada está pronta para payouts.'
                  : 'Os pagamentos ficam registrados no pedido e o freelancer recebe apenas após aprovação.'}
              </p>
            </div>
          </div>

          {isFreelancer ? (
            <div className={styles.statusStack}>
              {[
                ['Conta conectada', Boolean(account)],
                ['Dados enviados', Boolean(account?.detailsSubmitted)],
                ['Pagamentos habilitados', Boolean(account?.chargesEnabled)],
                ['Repasses habilitados', Boolean(account?.payoutsEnabled)],
              ].map(([label, ready]) => (
                <div key={label} className={styles.statusRow}>
                  <span className={ready ? styles.statusDone : styles.statusPending}>
                    {ready ? <FaCircleCheck /> : <FaClock />}
                  </span>
                  <strong>{label}</strong>
                  <em>{ready ? 'OK' : 'Pendente'}</em>
                </div>
              ))}
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

          {isFreelancer && (
            <div className={styles.requirementsBox}>
              <div className={styles.requirementsTitle}>
                <FaTriangleExclamation />
                <strong>Pendências da Stripe</strong>
              </div>

              {uniqueRequirements.length ? (
                <div className={styles.requirementList}>
                  {uniqueRequirements.map((item) => (
                    <span key={item}>{humanizeRequirement(item)}</span>
                  ))}
                </div>
              ) : (
                <p>Nenhuma pendência aberta retornada pela Stripe neste momento.</p>
              )}

              {account?.requirementsDisabledReason && (
                <small>Motivo de bloqueio: {account.requirementsDisabledReason}</small>
              )}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionKicker}>Histórico</span>
              <h2>{isFreelancer ? 'Pedidos e repasses' : 'Pagamentos recentes'}</h2>
              <p>Últimos pedidos com status financeiro sincronizado.</p>
            </div>
            <Link to="/orders" className={styles.panelLink}>
              Ver pedidos <FaArrowRight />
            </Link>
          </div>

          <div className={styles.table}>
            {loadingOverview ? (
              <div className={styles.emptyLine}>Carregando histórico financeiro...</div>
            ) : movements.length ? (
              movements.map((movement) => (
                <Link to={movement.order?.id ? `/orders?id=${movement.order.id}` : '/orders'} key={movement.id} className={styles.tableRow}>
                  <div>
                    <strong>{movement.service?.title || 'Pagamento Hivelancers'}</strong>
                    <span>
                      {formatDate(movement.updatedAt)} · {ORDER_STATUS_LABEL[movement.order?.status] || movement.status}
                    </span>
                  </div>
                  <div className={styles.rowMeta}>
                    <em>{RELEASE_STATUS_LABEL[movement.releaseStatus] || movement.releaseStatus}</em>
                    <strong>{formatPrice(isFreelancer ? movement.transferAmountCents : movement.amountCents)}</strong>
                  </div>
                </Link>
              ))
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
            ['Pagamento confirmado', formatPrice(summary.succeededCents), 'Cliente pagou via Stripe'],
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

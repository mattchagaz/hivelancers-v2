import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaArrowRight,
  FaBuildingColumns,
  FaCircleCheck,
  FaClock,
  FaFileShield,
  FaIdCard,
  FaRotateRight,
  FaShieldHalved,
  FaTriangleExclamation,
  FaWallet,
} from 'react-icons/fa6';
import {
  createMyStripeConnectDashboardLink,
  createMyStripeConnectOnboardingLink,
  getMyStripeConnectStatus,
} from '../../../services/payments';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './AccountVerification.module.css';

const REQUIREMENT_LABELS = {
  external_account: 'Conta bancária ou chave de recebimento',
  'business_profile.url': 'Site, perfil público ou rede social',
  'business_profile.mcc': 'Categoria comercial',
  'business_profile.product_description': 'Descrição dos serviços prestados',
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

const humanizeRequirement = (key) =>
  REQUIREMENT_LABELS[key] ||
  key
    .split('.')
    .filter(Boolean)
    .map((part) => part.replace(/_/g, ' '))
    .join(' · ');

const getVerificationState = (state, loading) => {
  const account = state?.account;
  const current = account?.requirementsCurrentlyDue || [];
  const past = account?.requirementsPastDue || [];
  const pending = account?.requirementsPendingVerification || [];

  if (loading) {
    return {
      tone: 'blue',
      label: 'Sincronizando',
      title: 'Consultando verificação',
      text: 'Estamos buscando o status mais recente da sua conta recebedora.',
    };
  }

  if (!state?.configured) {
    return {
      tone: 'red',
      label: 'Backend',
      title: 'Stripe não configurada',
      text: 'Configure as chaves Stripe no backend para ativar verificação e repasses.',
    };
  }

  if (!account) {
    return {
      tone: 'orange',
      label: 'Pendente',
      title: 'Crie sua conta recebedora',
      text: 'Você precisa completar a verificação para receber pedidos pagos.',
    };
  }

  if (account.onboardingComplete) {
    return {
      tone: 'green',
      label: 'Aprovada',
      title: 'Conta pronta para receber',
      text: 'Sua conta está apta para receber repasses quando os pedidos forem aprovados.',
    };
  }

  if (past.length || account.requirementsDisabledReason) {
    return {
      tone: 'red',
      label: 'Ação urgente',
      title: 'Verificação bloqueada',
      text: 'A Stripe precisa de dados ou documentos para reativar os recebimentos.',
    };
  }

  if (current.length) {
    return {
      tone: 'orange',
      label: 'Ação necessária',
      title: 'Faltam dados obrigatórios',
      text: 'Continue o cadastro e envie as informações solicitadas pela Stripe.',
    };
  }

  if (pending.length) {
    return {
      tone: 'purple',
      label: 'Em análise',
      title: 'Documentos em revisão',
      text: 'A Stripe está analisando os dados enviados. O status atualiza pelo webhook.',
    };
  }

  return {
    tone: 'blue',
    label: 'Incompleta',
    title: 'Onboarding iniciado',
    text: 'Continue a verificação para liberar dados bancários, identidade e repasses.',
  };
};

function AccountVerification() {
  const [connectState, setConnectState] = useState({ configured: true, connected: false, account: null });
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState('');

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyStripeConnectStatus();
      setConnectState(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const account = connectState.account;
  const verification = getVerificationState(connectState, loading);

  const requirements = useMemo(() => {
    const values = [
      ...(account?.requirementsPastDue || []),
      ...(account?.requirementsCurrentlyDue || []),
      ...(account?.requirementsPendingVerification || []),
      ...(account?.requirementsEventuallyDue || []),
    ];
    return [...new Set(values)].slice(0, 12);
  }, [account]);

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

  const refreshStatus = async () => {
    setActiveAction('refresh');
    await loadStatus();
    setActiveAction('');
  };

  const checklist = [
    {
      icon: <FaIdCard />,
      title: 'Identidade',
      text: 'Nome legal, CPF, data de nascimento e documento quando solicitado.',
      ready: Boolean(account?.detailsSubmitted),
    },
    {
      icon: <FaBuildingColumns />,
      title: 'Dados de recebimento',
      text: 'Conta bancária, dados fiscais e moeda de repasse processados pela Stripe.',
      ready: Boolean(account?.payoutsEnabled),
    },
    {
      icon: <FaFileShield />,
      title: 'Documentos',
      text: 'Documento de identidade e comprovantes ficam no ambiente seguro da Stripe.',
      ready: Boolean(account?.onboardingComplete),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Verificação da conta</span>
          <h1>Libere recebimentos com uma verificação clara e segura.</h1>
          <p>
            Envie identidade, dados de recebimento e documentos pelo fluxo protegido da Stripe. A Hivelancers acompanha apenas status e pendências.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryAction} onClick={openOnboarding} disabled={activeAction === 'onboarding' || !connectState.configured}>
              {account ? 'Continuar verificação' : 'Começar verificação'} <FaArrowRight />
            </button>
            <button type="button" className={styles.secondaryAction} onClick={openDashboard} disabled={activeAction === 'dashboard' || !account?.detailsSubmitted}>
              Abrir Stripe
            </button>
            <button type="button" className={styles.secondaryAction} onClick={refreshStatus} disabled={activeAction === 'refresh'}>
              <FaRotateRight /> {activeAction === 'refresh' ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        <aside className={`${styles.statusCard} ${styles[verification.tone]}`}>
          <span>{verification.label}</span>
          <strong>{verification.title}</strong>
          <p>{verification.text}</p>
        </aside>
      </section>

      <section className={styles.metricGrid}>
        {[
          ['Conta conectada', Boolean(account), account?.stripeAccountId || 'Sem conta Stripe'],
          ['Dados enviados', Boolean(account?.detailsSubmitted), account?.detailsSubmitted ? 'Cadastro enviado' : 'Aguardando envio'],
          ['Pagamentos', Boolean(account?.chargesEnabled), account?.chargesEnabled ? 'Habilitados' : 'Pendente'],
          ['Repasses', Boolean(account?.payoutsEnabled), account?.payoutsEnabled ? 'Habilitados' : 'Pendente'],
        ].map(([label, ready, detail]) => (
          <SpotlightCard key={label} className={styles.metricCard}>
            <div className={ready ? styles.metricIconDone : styles.metricIconPending}>
              {ready ? <FaCircleCheck /> : <FaClock />}
            </div>
            <span>{label}</span>
            <strong>{ready ? 'OK' : 'Pendente'}</strong>
            <p>{detail}</p>
          </SpotlightCard>
        ))}
      </section>

      <section className={styles.workspaceGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.sectionKicker}>Checklist</span>
            <h2>O que precisa estar completo</h2>
            <p>Esses blocos representam as etapas mínimas para o freelancer receber com segurança.</p>
          </div>

          <div className={styles.checklist}>
            {checklist.map((item) => (
              <div key={item.title} className={styles.checkItem}>
                <div className={item.ready ? styles.checkIconDone : styles.checkIconPending}>{item.icon}</div>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
                <em>{item.ready ? 'Completo' : 'Pendente'}</em>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.sectionKicker}>Pendências</span>
            <h2>Solicitações da Stripe</h2>
            <p>Quando algo faltar, a Stripe retorna campos específicos para completar.</p>
          </div>

          {requirements.length ? (
            <div className={styles.requirementList}>
              {requirements.map((item) => (
                <span key={item}>{humanizeRequirement(item)}</span>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FaShieldHalved />
              <strong>Nenhuma pendência aberta</strong>
              <p>Se a conta ainda não estiver aprovada, continue o onboarding para finalizar as etapas restantes.</p>
            </div>
          )}

          {account?.requirementsDisabledReason && (
            <div className={styles.alertBox}>
              <FaTriangleExclamation />
              <span>Motivo de bloqueio: {account.requirementsDisabledReason}</span>
            </div>
          )}
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.sectionKicker}>Recebimento</span>
          <h2>Como o dinheiro chega ao freelancer</h2>
          <p>O cliente paga pelo checkout. O valor fica protegido na plataforma e o repasse é enviado para a conta Stripe conectada após a aprovação do pedido.</p>
        </div>

        <div className={styles.flowGrid}>
          {[
            ['1', 'Cliente paga', 'Cartão fica ativo hoje. Pix aparece como temporariamente indisponível até habilitação.'],
            ['2', 'Pedido é executado', 'A entrega e revisões ficam registradas no pedido.'],
            ['3', 'Cliente aprova', 'A plataforma libera o repasse retido.'],
            ['4', 'Stripe repassa', 'O freelancer acompanha saques e dados bancários no Dashboard Stripe.'],
          ].map(([step, title, text]) => (
            <div key={step} className={styles.flowItem}>
              <b>{step}</b>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <Link to="/finances" className={styles.panelLink}>
          Ver central financeira <FaArrowRight />
        </Link>
      </section>
    </div>
  );
}

export default AccountVerification;

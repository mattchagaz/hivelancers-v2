import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaCircleCheck,
  FaCreditCard,
  FaGift,
  FaLayerGroup,
  FaReceipt,
  FaRocket,
  FaShieldHalved,
  FaStar,
} from 'react-icons/fa6';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createSubscriptionCheckoutSession,
  createSubscriptionPortalSession,
  getMySubscription,
} from '../../../services/payments';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './Subscription.module.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);

const freelancerPlans = [
  {
    id: 'essential',
    name: 'Essencial',
    label: 'Plano atual',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Para publicar serviços, receber pedidos e validar sua operação na plataforma.',
    commission: '10%',
    features: ['Perfil público', 'Serviços publicados', 'Chat com clientes', 'Checkout seguro', 'Recompensas básicas'],
    limits: ['Comissão padrão', 'Sem mensalidade', 'Suporte por comunidade'],
    current: true,
  },
  {
    id: 'professional',
    name: 'Profissional',
    label: 'Mais indicado',
    priceMonthly: 29,
    priceYearly: 290,
    description: 'Para freelancers que querem mais visibilidade, reputação e controle comercial.',
    commission: '7,5%',
    features: ['Destaque em buscas', 'Selo profissional', 'Analytics de serviços', 'Cupons próprios', 'Suporte prioritário'],
    limits: ['Mais exposição na vitrine', '2 boosts mensais', 'Relatórios de conversão'],
    highlighted: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    label: 'Para escala',
    priceMonthly: 79,
    priceYearly: 790,
    description: 'Para operação com alto volume, múltiplas ofertas e necessidade de acompanhamento próximo.',
    commission: '5%',
    features: ['Prioridade máxima em descoberta', 'Boosts recorrentes', 'Gerente de conta', 'Disputas priorizadas', 'Relatórios avançados'],
    limits: ['Serviços sem limite operacional', 'Campanhas destacadas', 'Fila de suporte dedicada'],
  },
];

const clientPlans = [
  {
    id: 'essential',
    name: 'Essencial',
    label: 'Plano atual',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Para contratar freelancers, acompanhar pedidos e centralizar conversas.',
    commission: '0%',
    features: ['Contratações seguras', 'Chat com freelancers', 'Favoritos', 'Histórico de pedidos', 'Recompensas básicas'],
    limits: ['Sem mensalidade', 'Pagamento por pedido', 'Suporte por comunidade'],
    current: true,
  },
  {
    id: 'professional',
    name: 'Profissional',
    label: 'Mais indicado',
    priceMonthly: 19,
    priceYearly: 190,
    description: 'Para clientes que contratam com frequência e precisam de mais organização.',
    commission: '0%',
    features: ['Shortlists avançadas', 'Cupons exclusivos', 'Comparação de propostas', 'Suporte prioritário', 'Alertas de prazo'],
    limits: ['2 cupons mensais', 'Pedidos favoritos destacados', 'Histórico exportável'],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    label: 'Para equipes',
    priceMonthly: 59,
    priceYearly: 590,
    description: 'Para empresas que querem padronizar contratações e acompanhar gastos por área.',
    commission: '0%',
    features: ['Múltiplos usuários', 'Aprovação interna', 'Relatórios financeiros', 'Suporte dedicado', 'Controle de orçamento'],
    limits: ['Gestão por centro de custo', 'Painel de compras', 'SLA de atendimento'],
  },
];

const comparisonRows = [
  ['Serviços e pedidos', 'Base da plataforma', 'Mais controle e destaque', 'Operação avançada'],
  ['Destaque em busca', 'Padrão', 'Prioritário', 'Máximo'],
  ['Cupons e promoções', 'Campanhas gerais', 'Cupons mensais', 'Campanhas dedicadas'],
  ['Relatórios', 'Resumo simples', 'Analytics comercial', 'Relatórios avançados'],
  ['Suporte', 'Comunidade', 'Prioritário', 'Dedicado'],
];

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);

const getSubscriptionLabel = (subscription) => {
  if (!subscription) return 'Essencial';
  if (subscription.status === 'active' || subscription.status === 'trialing') return subscription.planName;
  if (subscription.status === 'past_due') return `${subscription.planName} pendente`;
  if (subscription.status === 'canceled') return 'Essencial';
  return subscription.planName;
};

function Subscription() {
  const { user } = useAuth();
  const location = useLocation();
  const [billingCycles, setBillingCycles] = useState({});
  const [subscriptionState, setSubscriptionState] = useState({ configured: true, subscription: null });
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [activeAction, setActiveAction] = useState('');
  const isFreelancer = user?.userType === 'FREELANCER';

  const plans = useMemo(() => (isFreelancer ? freelancerPlans : clientPlans), [isFreelancer]);
  const subscription = subscriptionState.subscription;
  const activePlan = useMemo(() => {
    if (subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      return plans.find((plan) => plan.id === subscription.planId) || plans[0];
    }
    return plans.find((plan) => plan.current) || plans[0];
  }, [plans, subscription]);
  const paidPlans = plans.filter((plan) => !plan.current);
  const annualSavings = paidPlans[0] ? (paidPlans[0].priceMonthly * 12) - paidPlans[0].priceYearly : 0;
  const activeBillingCycle = subscription?.billingCycle === 'yearly' ? 'yearly' : 'monthly';
  const activePrice = activeBillingCycle === 'yearly' ? activePlan.priceYearly : activePlan.priceMonthly;

  const loadSubscription = useCallback(async () => {
    setLoadingSubscription(true);
    try {
      const data = await getMySubscription();
      setSubscriptionState(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('subscription');
    if (status === 'success') {
      toast.success('Assinatura iniciada. Vamos sincronizar o status pela Stripe.');
      loadSubscription();
    }
    if (status === 'cancel') {
      toast.info('Assinatura cancelada antes da confirmação.');
    }
  }, [loadSubscription, location.search]);

  const setPlanCycle = (planId, cycle) => {
    setBillingCycles((prev) => ({ ...prev, [planId]: cycle }));
  };

  const handlePlanAction = async (plan) => {
    if (plan.current || activePlan.id === plan.id) {
      toast.info(`Você já está no plano ${plan.name}.`);
      return;
    }

    const billingCycle = billingCycles[plan.id] || 'monthly';
    setActiveAction(plan.id);
    try {
      const data = await createSubscriptionCheckoutSession({
        planId: plan.id,
        billingCycle,
      });
      if (!data.checkoutUrl) throw new Error('A Stripe não retornou um link de assinatura.');
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      toast.error(error.message);
      setActiveAction('');
    }
  };

  const openBillingPortal = async () => {
    setActiveAction('portal');
    try {
      const data = await createSubscriptionPortalSession();
      if (!data.url) throw new Error('A Stripe não retornou um link do portal.');
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error.message);
      setActiveAction('');
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Planos e assinatura</span>
          <h1>Escolha como quer crescer dentro da Hivelancers.</h1>
          <p>
            Compare recursos, benefícios e limites da assinatura. Os planos pagos usam Stripe Billing para cobrança recorrente e gestão segura do cartão.
          </p>
          <div className={styles.heroActions}>
            <a href="#plans" className={styles.primaryAction}>Comparar planos <FaArrowRight /></a>
            <Link to={isFreelancer ? '/finances' : '/orders'} className={styles.secondaryAction}>
              {isFreelancer ? 'Ver financeiro' : 'Ver pedidos'}
            </Link>
            {subscription?.stripeCustomerId && (
              <button type="button" className={styles.secondaryAction} onClick={openBillingPortal} disabled={activeAction === 'portal'}>
                {activeAction === 'portal' ? 'Abrindo...' : 'Gerenciar cobrança'}
              </button>
            )}
          </div>
        </div>

        <aside className={styles.currentPlan}>
          <div className={styles.planSignal}>
            <FaStar />
            <span>Beta ativo</span>
          </div>
          <h2>{activePlan.name}</h2>
          <strong>{formatPrice(activePrice)}<small>{activeBillingCycle === 'yearly' ? '/ano' : '/mês'}</small></strong>
          <p>
            {subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
              ? `Assinatura ${subscription.status === 'past_due' ? 'com pagamento pendente' : 'ativa'} no ciclo ${subscription.billingCycle === 'yearly' ? 'anual' : 'mensal'}.`
              : 'Sem cobrança recorrente ativa. Você pode continuar usando os recursos essenciais da plataforma.'}
          </p>
          <div className={styles.currentMeta}>
            <span>{subscription ? 'Status Stripe' : 'Comissão atual'}</span>
            <b>{subscription ? subscription.status : activePlan.commission}</b>
          </div>
        </aside>
      </section>

      <section className={styles.metricGrid}>
        <Metric icon={<FaCreditCard />} label="Plano atual" value={getSubscriptionLabel(subscription)} detail={loadingSubscription ? 'Sincronizando status...' : 'Status sincronizado com Stripe.'} />
        <Metric icon={<FaReceipt />} label="Próxima cobrança" value="R$ 0,00" detail="Nenhuma renovação pendente." tone="green" />
        <Metric icon={<FaGift />} label="Economia anual" value={formatPrice(annualSavings)} detail="No primeiro plano pago anual." tone="purple" />
        <Metric icon={<FaShieldHalved />} label="Status" value={subscription?.status || 'Gratuito'} detail={subscriptionState.configured ? 'Stripe Billing configurado.' : 'Stripe não configurada neste ambiente.'} tone="orange" />
      </section>

      <section id="plans" className={styles.plansSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionKicker}>Planos</span>
            <h2>Recursos para cada fase</h2>
            <p>Escolha mensal ou anual em cada plano. Você será redirecionado para o Checkout seguro da Stripe.</p>
          </div>
        </div>

        <div className={styles.planGrid}>
          {plans.map((plan) => {
            const planCycle = billingCycles[plan.id] || 'monthly';
            const price = planCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const period = planCycle === 'yearly' ? '/ano' : '/mês';
            const isActivePlan = activePlan.id === plan.id;

            return (
              <SpotlightCard key={plan.id} className={`${styles.planCard} ${plan.highlighted ? styles.planFeatured : ''} ${isActivePlan ? styles.planCurrent : ''}`}>
                <div className={styles.planTop}>
                  <span>{plan.label}</span>
                  {plan.highlighted ? <FaStar /> : <FaLayerGroup />}
                </div>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className={styles.cardBillingToggle} role="group" aria-label={`Ciclo de cobrança do plano ${plan.name}`}>
                  <button type="button" className={planCycle === 'monthly' ? styles.toggleActive : ''} onClick={() => setPlanCycle(plan.id, 'monthly')}>
                    Mensal
                  </button>
                  <button type="button" className={planCycle === 'yearly' ? styles.toggleActive : ''} onClick={() => setPlanCycle(plan.id, 'yearly')}>
                    Anual
                  </button>
                </div>
                <div className={styles.priceBlock}>
                  <strong>{formatPrice(price)}</strong>
                  <small>{period}</small>
                </div>
                <div className={styles.commissionPill}>
                  {isFreelancer ? 'Comissão sobre pedidos' : 'Taxa de assinatura'} <b>{plan.commission}</b>
                </div>
                <button
                  type="button"
                  className={plan.highlighted ? styles.planPrimary : styles.planSecondary}
                  onClick={() => handlePlanAction(plan)}
                  disabled={activeAction === plan.id || isActivePlan}
                >
                  {activeAction === plan.id ? 'Abrindo Stripe...' : isActivePlan ? 'Plano atual' : 'Quero este plano'}
                </button>
                <ul className={styles.featureList}>
                  {plan.features.map((feature) => (
                    <li key={feature}><FaCircleCheck /> {feature}</li>
                  ))}
                </ul>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      <section className={styles.workspaceGrid}>
        <div className={styles.comparisonPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionKicker}>Comparativo</span>
              <h2>O que muda entre os planos</h2>
            </div>
          </div>
          <div className={styles.comparisonTable}>
            <div className={styles.comparisonHead}>
              <span>Recurso</span>
              <span>Essencial</span>
              <span>Profissional</span>
              <span>{isFreelancer ? 'Studio' : 'Business'}</span>
            </div>
            {comparisonRows.map((row) => (
              <div key={row[0]} className={styles.comparisonRow}>
                {row.map((cell) => <span key={cell}>{cell}</span>)}
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.sideStack}>
          <section className={styles.billingPanel}>
            <span className={styles.sectionKicker}>Cobrança</span>
            <h2>Histórico de assinatura</h2>
            <div className={styles.emptyInvoice}>
              <FaReceipt />
              <strong>Nenhuma cobrança recorrente</strong>
              <p>Quando a assinatura paga for ativada, faturas, recibos e forma de pagamento aparecerão aqui.</p>
            </div>
          </section>

          <section className={styles.billingPanel}>
            <span className={styles.sectionKicker}>Próximos recursos</span>
            <div className={styles.addonStack}>
              <Addon icon={<FaRocket />} title="Boost de vitrine" text="Destaque temporário em buscas e recomendações." />
              <Addon icon={<FaChartLine />} title="Analytics comercial" text="Visualizações, cliques, conversões e performance por serviço." />
              <Addon icon={<FaBolt />} title="Cupons próprios" text="Campanhas promocionais com controle por período e limite." />
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, detail, tone = 'blue' }) {
  return (
    <SpotlightCard className={`${styles.metricCard} ${styles[tone]}`}>
      <div className={styles.metricIcon}>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </SpotlightCard>
  );
}

function Addon({ icon, title, text }) {
  return (
    <article className={styles.addonItem}>
      <div className={styles.addonIcon}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </article>
  );
}

export default Subscription;

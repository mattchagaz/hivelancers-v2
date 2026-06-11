import { createElement, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaCreditCard, FaPix } from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { getMyService, getPublicService } from '../../../services/services';
import { createCheckoutSession, getCheckoutSessionStatus } from '../../../services/payments';
import styles from './Checkout.module.css';

const PAYMENT_METHODS = [
  {
    id: 'pix',
    title: 'Pix',
    description: 'Temporariamente desabilitado. Logo ativaremos QR Code e copia e cola.',
    icon: FaPix,
    disabled: true,
    badge: 'Em breve',
  },
  {
    id: 'card',
    title: 'Cartão',
    description: 'Crédito com confirmação imediata no Checkout seguro.',
    icon: FaCreditCard,
  },
];

const PAYMENT_METHOD_LABEL = {
  pix: 'Pix',
  card: 'Cartão de Crédito',
};

const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);

const getPlanFeatures = (plan) =>
  (plan?.description || '')
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);

const getSellerName = (service) =>
  `${service?.owner?.firstName || ''} ${service?.owner?.lastName || ''}`.trim() || 'freelancer';

const getSellerInitials = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'F';

function Checkout() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const checkoutSessionId = searchParams.get('session_id');
  const checkoutReturnStatus = searchParams.get('status');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    const loadService = async () => {
      try {
        const data = await getPublicService(id);
        if (!cancelled) setService(data);
      } catch {
        try {
          const data = await getMyService(id);
          if (!cancelled) setService(data);
        } catch {
          if (!cancelled) setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadService();
    return () => { cancelled = true; };
  }, [id]);

  const selectedPlan = useMemo(() => {
    if (!service) return null;
    const planId = searchParams.get('plan') || searchParams.get('package');
    const plans = service.plans || [];
    return (
      plans.find((item) => item.id === planId) ||
      plans[0] ||
      null
    );
  }, [service, searchParams]);

  const [orderTitle, setOrderTitle] = useState('');
  const [briefing, setBriefing] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [attachments, setAttachments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentMethodType, setPaymentMethodType] = useState('card');

  useEffect(() => {
    if (service?.title) {
      setOrderTitle((current) => current || `Pedido para ${service.title}`);
    }
  }, [service]);

  useEffect(() => {
    if (checkoutReturnStatus !== 'cancel') return;
    toast.message('Pagamento cancelado. Você pode revisar o briefing e tentar novamente.');
  }, [checkoutReturnStatus]);

  useEffect(() => {
    if (checkoutReturnStatus !== 'success' || !checkoutSessionId) return;

    let cancelled = false;
    let intervalId = null;

    const checkStatus = async () => {
      if (!cancelled) setIsCheckingPayment(true);

      try {
        const { payment } = await getCheckoutSessionStatus(checkoutSessionId);
        if (cancelled) return false;

        setPaymentStatus(payment);

        if (payment.order) {
          setCreatedOrder(payment.order);
          return false;
        }

        return ['CHECKOUT_CREATED', 'PENDING'].includes(payment.status);
      } catch (err) {
        if (!cancelled) {
          toast.error(err.message);
        }
        return false;
      } finally {
        if (!cancelled) setIsCheckingPayment(false);
      }
    };

    const bootstrap = async () => {
      const shouldKeepPolling = await checkStatus();
      if (!shouldKeepPolling || cancelled) return;

      intervalId = window.setInterval(async () => {
        const shouldContinue = await checkStatus();
        if (!shouldContinue && intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      }, 4000);
    };

    bootstrap();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [checkoutReturnStatus, checkoutSessionId]);

  useEffect(() => {
    if (!createdOrder?.id) return undefined;

    const timer = window.setTimeout(() => {
      navigate(`/orders?id=${createdOrder.id}`, { replace: true });
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [createdOrder?.id, navigate]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <h1 className={styles.emptyTitle}>Preparando o checkout...</h1>
      </div>
    );
  }

  if (notFound || !service || !selectedPlan) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className={styles.emptyTitle}>Checkout indisponível</h1>
        <p className={styles.emptyText}>
          Não foi possível carregar este serviço. Ele pode ter sido pausado ou removido.
        </p>
        <Link to="/explore" className={styles.primaryButton}>
          Explorar outros serviços
        </Link>
      </div>
    );
  }

  const sellerName = getSellerName(service);
  const sellerInitials = getSellerInitials(sellerName);
  const selectedPlanFeatures = getPlanFeatures(selectedPlan);

  const orderSteps = [
    {
      title: 'Briefing alinhado',
      text: 'Você descreve o objetivo, as referências e o que espera receber.',
    },
    {
      title: 'Execução do serviço',
      text: `${sellerName} inicia a produção dentro do prazo de ${selectedPlan.deliveryDays} dias.`,
    },
    {
      title: 'Entrega e revisões',
      text: `Você recebe a entrega e pode solicitar até ${selectedPlan.revisions} revisões.`,
    },
    {
      title: 'Aprovação e liberação',
      text: 'Após sua aprovação final, o pagamento é liberado ao freelancer.',
    },
  ];

  const protections = [
    'Pagamento retido na plataforma até a sua aprovação',
    'Histórico de mensagens e entregas centralizado',
    'Suporte ativo caso haja divergência no escopo',
  ];

  const handleSubmit = async () => {
    if (paymentMethodType === 'pix') {
      toast.message('Pix está temporariamente desabilitado. Em breve essa forma de pagamento será ativada.');
      return;
    }

    if (!briefing.trim() || briefing.trim().length < 30) {
      toast.error('Descreva o briefing com pelo menos 30 caracteres para orientar bem o profissional.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requirements = [
        orderTitle.trim() ? `Título interno: ${orderTitle.trim()}` : null,
        briefing.trim() ? `Briefing:\n${briefing.trim()}` : null,
        deliveryNote.trim() ? `Prazo/Contexto importante: ${deliveryNote.trim()}` : null,
        attachments.trim() ? `Links e referências:\n${attachments.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      const result = await createCheckoutSession({
        serviceId: service.id,
        planTier: selectedPlan.tier,
        requirements,
        paymentMethodType,
      });

      if (!result.checkoutUrl) {
        throw new Error('Não foi possível gerar o link de pagamento no momento.');
      }

      window.location.assign(result.checkoutUrl);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdOrder) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1 className={styles.successTitle}>Pedido confirmado com sucesso!</h1>
        <p className={styles.successText}>
          Seu pagamento está protegido. O briefing foi enviado para <strong>{sellerName}</strong> e em breve você receberá atualizações no seu painel.
        </p>

        <div className={styles.successGrid}>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Nº do Pedido</span>
            <strong>#{createdOrder.id.slice(-8).toUpperCase()}</strong>
          </div>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Status</span>
            <strong className={styles.statusProtected}>Valor Protegido</strong>
          </div>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Próximo Passo</span>
            <strong>Aguardando Aceite</strong>
          </div>
        </div>

        <div className={styles.successActions}>
          <button type="button" className={styles.primaryButton} onClick={() => navigate(`/orders?id=${createdOrder.id}`)}>
            Acessar painel do pedido
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => navigate(`/messages${createdOrder.conversationId ? `?chat=${createdOrder.conversationId}` : ''}`)}
          >
            Enviar mensagem
          </button>
        </div>

        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (checkoutReturnStatus === 'success' && checkoutSessionId && paymentStatus && !createdOrder) {
    const isPending = ['CHECKOUT_CREATED', 'PENDING'].includes(paymentStatus.status);
    const isFailed = ['FAILED', 'CANCELED', 'REFUNDED'].includes(paymentStatus.status);

    return (
      <div className={styles.successState}>
        <div className={styles.processingIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h1 className={styles.successTitle}>
          {isPending ? 'Processando seu pagamento...' : 'Ops, o pagamento falhou.'}
        </h1>
        <p className={styles.successText}>
          {isPending
            ? 'Se você pagou via Pix, a confirmação pode levar alguns segundos. O pedido será criado automaticamente assim que o pagamento for aprovado.'
            : 'Houve um problema ao confirmar seu pagamento. Nenhuma cobrança foi efetivada.'}
        </p>

        <div className={styles.successGrid}>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Método Escolhido</span>
            <strong>{PAYMENT_METHOD_LABEL[paymentStatus.paymentMethodType] || 'Cartão de Crédito'}</strong>
          </div>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Valor Total</span>
            <strong>{formatPrice(paymentStatus.amountCents)}</strong>
          </div>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Status</span>
            <strong className={isFailed ? styles.statusFailed : styles.statusPending}>
              {isPending ? 'Aguardando Confirmação' : 'Cancelado / Falhou'}
            </strong>
          </div>
        </div>

        <div className={styles.successActions}>
          {isPending ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={async () => {
                setIsCheckingPayment(true);
                try {
                  const { payment } = await getCheckoutSessionStatus(checkoutSessionId);
                  setPaymentStatus(payment);
                  if (payment.order) setCreatedOrder(payment.order);
                } catch (err) {
                  toast.error(err.message);
                } finally {
                  setIsCheckingPayment(false);
                }
              }}
            >
              {isCheckingPayment ? 'Verificando...' : 'Atualizar Status'}
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate(`/checkout/${service.id}?plan=${selectedPlan.id}`)}
            >
              Tentar Novamente
            </button>
          )}

          <Link to={`/services/${service.id}`} className={styles.secondaryButton}>
            Voltar ao Serviço
          </Link>
        </div>

        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link to="/dashboard">Dashboard</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <Link to={`/services/${service.id}`}>Serviço</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        <span className={styles.currentCrumb}>Finalizar Pedido</span>
      </div>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.headerBadge}>Check-out Seguro</span>
          <h1 className={styles.title}>Revise e confirme seu pedido</h1>
          <p className={styles.subtitle}>
            Forneça os detalhes necessários para que <strong>{sellerName}</strong> possa iniciar o trabalho com perfeição.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          {/* Resumo do Serviço - Reestilizado */}
          <section className={styles.serviceSummaryBox}>
            <div className={styles.sellerChip}>
              <div className={styles.avatar}>
                {service.owner?.avatarUrl ? (
                  <img src={service.owner.avatarUrl} alt={sellerName} className={styles.avatarImg} />
                ) : (
                  sellerInitials
                )}
              </div>
              <div className={styles.sellerMeta}>
                <strong>{sellerName}</strong>
                <span>{service.owner?.headline || 'Profissional'}</span>
              </div>
            </div>

            <div className={styles.serviceDivider}></div>

            <div className={styles.serviceDetails}>
              <div className={styles.serviceInfo}>
                <span className={styles.serviceLabel}>Serviço Contratado</span>
                <h3>{service.title}</h3>
              </div>
              <div className={styles.packageBox}>
                <div className={styles.packageHeader}>
                  <span className={styles.packageLabel}>Pacote</span>
                  <strong>{selectedPlan.title}</strong>
                </div>
                <div className={styles.packageMeta}>
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {selectedPlan.deliveryDays} dias</span>
                  <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg> {selectedPlan.revisions} revisões</span>
                </div>
              </div>
            </div>
          </section>

          {/* Formulário de Briefing */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Instruções e Briefing</h2>
              <p className={styles.cardSub}>
                Passe todas as diretrizes para garantir uma entrega certeira.
              </p>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Título do Projeto (Interno)</span>
                <input
                  className={styles.input}
                  type="text"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="Ex: Identidade Visual da Loja Nova"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Prazo ideal ou Nota especial</span>
                <input
                  className={styles.input}
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Ex: Preciso revisar antes do dia 15"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Briefing detalhado <span className={styles.required}>*</span></span>
              <textarea
                className={styles.textarea}
                rows={5}
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="Qual o objetivo do projeto? Quem é o público? Qual o tom de voz ou estilo visual esperado? Descreva com o máximo de detalhes possível."
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Links, Arquivos e Referências</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                placeholder="Cole aqui links do Google Drive, Figma, referências do Pinterest, etc."
              />
            </label>
          </section>

          {/* Timeline de Etapas */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>O que acontece agora?</h2>
              <p className={styles.cardSub}>Entenda o fluxo seguro da plataforma.</p>
            </div>

            <div className={styles.timeline}>
              {orderSteps.map((step, index) => (
                <div key={step.title} className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>
                    {index === 0 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                    {index === 1 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
                    {index === 2 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>}
                    {index === 3 && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                  </div>
                  <div className={styles.timelineContent}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          {/* Card Fixo de Pagamento */}
          <section className={`${styles.card} ${styles.checkoutCard}`}>
            <div className={styles.checkoutHeader}>
              <h3>Resumo da Compra</h3>
            </div>

            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span className={styles.rowLabel}>Pacote <strong>{selectedPlan.title}</strong></span>
                <span className={styles.rowValue}>{formatPrice(selectedPlan.priceCents)}</span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.rowLabel}>Prazo de Entrega</span>
                <span className={styles.rowValue}>{selectedPlan.deliveryDays} {selectedPlan.deliveryDays === 1 ? 'dia' : 'dias'}</span>
              </div>
              <div className={styles.priceRow}>
                <span className={styles.rowLabel}>Revisões Inclusas</span>
                <span className={styles.rowValue}>{selectedPlan.revisions}</span>
              </div>
              
              <div className={styles.divider}></div>
              
              <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                <span>Total a Pagar</span>
                <strong>{formatPrice(selectedPlan.priceCents)}</strong>
              </div>
            </div>

            <div className={styles.packageFeatures}>
              <h4>O que está incluso:</h4>
              <ul>
                {(selectedPlanFeatures.length > 0 ? selectedPlanFeatures : ['Escopo conforme descrito no pacote']).map((item, idx) => (
                  <li key={idx}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.paymentMethodSection}>
              <span className={styles.paymentMethodTitle}>Forma de pagamento</span>
              <div className={styles.paymentMethodGrid} role="radiogroup" aria-label="Forma de pagamento">
                {PAYMENT_METHODS.map(({ id: methodId, title, description, icon, disabled, badge }) => {
                  const isSelected = paymentMethodType === methodId;

                  return (
                    <label
                      key={methodId}
                      className={`${styles.paymentMethodOption} ${isSelected ? styles.paymentMethodOptionActive : ''} ${disabled ? styles.paymentMethodOptionDisabled : ''}`}
                      aria-disabled={disabled ? 'true' : undefined}
                    >
                      <input
                        type="radio"
                        name="paymentMethodType"
                        value={methodId}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => {
                          if (!disabled) setPaymentMethodType(methodId);
                        }}
                      />
                      <span className={styles.paymentMethodIcon}>
                        {createElement(icon)}
                      </span>
                      <span className={styles.paymentMethodCopy}>
                        <span className={styles.paymentMethodName}>
                          <strong>{title}</strong>
                          {badge ? <em>{badge}</em> : null}
                        </span>
                        <small>{description}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.btnSpinner}></div>
                  Processando...
                </>
              ) : (
                'Ir para Pagamento Seguro'
              )}
            </button>
            <p className={styles.secureNote}>Você será redirecionado para o ambiente seguro da plataforma.</p>
          </section>

          {/* Garantias */}
          <section className={styles.protectionCard}>
            <div className={styles.shieldIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <div>
              <h3>Garantia Plataforma</h3>
              <ul className={styles.protectionList}>
                {protections.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Checkout;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FaArrowUpRightFromSquare,
  FaCircleCheck,
  FaCreditCard,
  FaLocationDot,
  FaQuoteLeft,
  FaShieldHalved,
} from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { getMyProject, listProjectProposals } from '../../../services/projects';
import {
  cancelCheckoutPayment,
  createProjectCheckoutSession,
  getCheckoutSessionStatus,
  getMySubscription,
  previewCheckoutCoupon,
} from '../../../services/payments';
import { getClientCheckoutFees } from '../../../utils/marketplaceFees';
import styles from '../Checkout/Checkout.module.css';

const formatPrice = (cents = 0) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(cents / 100);

const personName = (person) => (
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim()
  || person?.username
  || 'Freelancer'
);

function ProjectCheckout() {
  const { id: projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const proposalId = searchParams.get('proposal');
  const returnStatus = searchParams.get('status');
  const sessionId = searchParams.get('session_id');
  const canceledPaymentId = searchParams.get('payment_id');
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const loadContext = useCallback(async () => {
    const [projectData, proposalData, subscriptionData] = await Promise.all([
      getMyProject(projectId),
      listProjectProposals(projectId),
      getMySubscription().catch(() => ({ subscription: null })),
    ]);
    setProject(projectData);
    setProposals(proposalData);
    setSubscription(subscriptionData.subscription || null);
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    loadContext()
      .catch((error) => {
        if (!cancelled) toast.error(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadContext]);

  useEffect(() => {
    if (returnStatus !== 'cancel' || !canceledPaymentId) return;
    let cancelled = false;
    cancelCheckoutPayment(canceledPaymentId)
      .then(async () => {
        if (cancelled) return;
        toast.info('Pagamento cancelado. A proposta voltou a ficar disponível.');
        await loadContext();
        navigate(`/projects/${projectId}/checkout?proposal=${proposalId}`, { replace: true });
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message);
      });
    return () => { cancelled = true; };
  }, [canceledPaymentId, loadContext, navigate, projectId, proposalId, returnStatus]);

  useEffect(() => {
    if (returnStatus !== 'success' || !sessionId) return;
    let cancelled = false;
    let intervalId = null;

    const check = async () => {
      try {
        const { payment } = await getCheckoutSessionStatus(sessionId);
        if (cancelled) return false;
        setPaymentStatus(payment);
        if (payment.order) {
          setCreatedOrder(payment.order);
          return false;
        }
        return ['CHECKOUT_CREATED', 'PENDING'].includes(payment.status);
      } catch (error) {
        if (!cancelled) toast.error(error.message);
        return false;
      }
    };

    check().then((keepPolling) => {
      if (!keepPolling || cancelled) return;
      intervalId = window.setInterval(async () => {
        const shouldContinue = await check();
        if (!shouldContinue && intervalId) window.clearInterval(intervalId);
      }, 4000);
    });

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [returnStatus, sessionId]);

  const proposal = useMemo(
    () => proposals.find((item) => item.id === proposalId) || null,
    [proposalId, proposals]
  );
  const currentAppliedCoupon = appliedCoupon?.proposalId === proposal?.id ? appliedCoupon : null;
  const discountCents = currentAppliedCoupon?.discountCents || 0;
  const contractCents = Math.max(0, (proposal?.priceCents || 0) - discountCents);
  const fees = getClientCheckoutFees(contractCents, subscription);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!proposal || !code) {
      toast.error('Digite um código de cupom.');
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const preview = await previewCheckoutCoupon({
        projectId,
        proposalId: proposal.id,
        couponCode: code,
      });
      setAppliedCoupon({ ...preview, proposalId: proposal.id });
      setCouponInput(preview.coupon.code);
      toast.success(`Cupom ${preview.coupon.code} aplicado.`);
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(error.message);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const startCheckout = async () => {
    if (!proposal || submitting) return;
    setSubmitting(true);
    try {
      const data = await createProjectCheckoutSession({
        projectId,
        proposalId: proposal.id,
        paymentMethodType: 'card',
        couponCode: currentAppliedCoupon?.coupon?.code || undefined,
      });
      if (!data.checkoutUrl) throw new Error('A Stripe não retornou um link de pagamento.');
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      toast.error(error.message);
      setSubmitting(false);
      await loadContext().catch(() => {});
    }
  };

  if (loading) return <div className={styles.loadingState}><div className={styles.spinner} /><h1>Preparando contrato...</h1></div>;

  if (createdOrder) {
    return (
      <div className={styles.successState}>
        <div className={styles.successIcon}><FaShieldHalved /></div>
        <h1 className={styles.successTitle}>Pagamento protegido e contrato criado</h1>
        <p className={styles.successText}>A proposta foi aceita somente após a confirmação do pagamento. O valor ficará retido até a aprovação da entrega.</p>
        <div className={styles.successActions}>
          <button type="button" className={styles.primaryButton} onClick={() => navigate(`/orders?id=${createdOrder.id}`)}>Acompanhar contrato</button>
          <button type="button" className={styles.secondaryButton} onClick={() => navigate(`/messages?chat=${createdOrder.conversationId}`)}>Abrir conversa</button>
        </div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (returnStatus === 'success' && paymentStatus) {
    const pending = ['CHECKOUT_CREATED', 'PENDING'].includes(paymentStatus.status);
    return (
      <div className={styles.successState}>
        <div className={styles.processingIcon}><FaCreditCard /></div>
        <h1 className={styles.successTitle}>{pending ? 'Confirmando pagamento...' : 'Pagamento não confirmado'}</h1>
        <p className={styles.successText}>{pending ? 'O contrato será criado automaticamente assim que a Stripe confirmar o pagamento.' : 'A proposta não foi aceita e nenhum contrato foi iniciado.'}</p>
        <Link to={`/projects/${projectId}`} className={styles.secondaryButton}>Voltar ao projeto</Link>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (!project || !proposal) {
    return <div className={styles.emptyState}><h1 className={styles.emptyTitle}>Proposta indisponível</h1><Link className={styles.secondaryButton} to={`/projects/${projectId}`}>Voltar ao projeto</Link></div>;
  }

  const freelancerName = personName(proposal.freelancer);
  const profileHandle = proposal.freelancer.username || proposal.freelancer.id;
  const profileUrl = `/profile/${profileHandle}`;
  const canCheckout = project.status === 'OPEN' && proposal.status === 'PENDING';

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link to={`/projects/${projectId}`}>Projeto</Link><span>›</span><span>Contrato protegido</span>
      </div>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.headerBadge}>Contrato protegido</span>
          <h1 className={styles.title}>Revise a proposta antes de contratar</h1>
          <p className={styles.subtitle}>A proposta só será aceita depois que o pagamento for confirmado.</p>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.serviceSummaryBox}>
            <div className={styles.sellerChip}>
              <div className={styles.avatar}>
                {proposal.freelancer.avatarUrl
                  ? <img className={styles.avatarImg} src={proposal.freelancer.avatarUrl} alt="" />
                  : freelancerName.slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.sellerMeta}>
                <strong>{freelancerName}</strong>
                <span>{proposal.freelancer.headline || 'Freelancer Hivelancers'}</span>
                <div className={styles.freelancerFacts}>
                  {proposal.freelancer.location && <span><FaLocationDot /> {proposal.freelancer.location}</span>}
                  {proposal.freelancer.identityVerified && <span className={styles.verifiedFact}><FaCircleCheck /> Identidade verificada</span>}
                </div>
              </div>
              <Link className={styles.profileButton} to={profileUrl} target="_blank" rel="noreferrer">
                Ver perfil e portfólio <FaArrowUpRightFromSquare />
              </Link>
            </div>
            <div className={styles.serviceDivider} />
            <div className={styles.serviceDetails}>
              <div className={styles.serviceInfo}><span className={styles.serviceLabel}>Projeto</span><h3>{project.title}</h3></div>
            </div>
          </section>

          <section className={`${styles.card} ${styles.proposalReviewCard}`}>
            <div className={`${styles.cardHead} ${styles.proposalCardHead}`}>
              <div><span className={styles.serviceLabel}>Mensagem da proposta</span><h2 className={styles.cardTitle}>Como {freelancerName} pretende realizar o projeto</h2></div>
              <Link to={profileUrl}>Conhecer profissional <FaArrowUpRightFromSquare /></Link>
            </div>
            <div className={styles.proposalMessage}>
              <FaQuoteLeft aria-hidden="true" />
              <p>{proposal.coverLetter}</p>
            </div>
            <div className={`${styles.successGrid} ${styles.proposalMetrics}`}>
              <div className={styles.successCard}><span className={styles.successLabel}>Valor</span><strong>{formatPrice(proposal.priceCents)}</strong></div>
              <div className={styles.successCard}><span className={styles.successLabel}>Entrega</span><strong>{proposal.deliveryDays} dias</strong></div>
              <div className={styles.successCard}><span className={styles.successLabel}>Revisões</span><strong>{proposal.revisions}</strong></div>
            </div>
            {proposal.freelancer.skills?.length > 0 && (
              <div className={styles.proposalSkills}>
                <span>Competências declaradas</span>
                <div>{proposal.freelancer.skills.slice(0, 6).map((skill) => <em key={skill}>{skill}</em>)}</div>
              </div>
            )}
            {proposal.freelancer.portfolioProjects?.length > 0 && (
              <div className={styles.portfolioPreview}>
                <div className={styles.portfolioPreviewHead}><strong>Projetos em destaque</strong><Link to={profileUrl}>Ver portfólio completo</Link></div>
                <div className={styles.portfolioPreviewGrid}>
                  {proposal.freelancer.portfolioProjects.map((item) => (
                    <Link key={item.id} to={`${profileUrl}/projects/${item.id}`} target="_blank" rel="noreferrer">
                      {item.coverImageUrl
                        ? <img src={item.coverImageUrl} alt="" />
                        : <span>{item.title.slice(0, 1).toUpperCase()}</span>}
                      <strong>{item.title}</strong>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={styles.protectionCard}>
            <FaShieldHalved className={styles.shieldIcon} />
            <div><h3>Proteção Hivelancers</h3><ul className={styles.protectionList}><li>Pagamento retido até a aprovação da entrega</li><li>Contrato, conversa, revisões e arquivos centralizados</li><li>Disputa administrativa disponível em caso de divergência</li></ul></div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={`${styles.card} ${styles.checkoutCard}`}>
            <div className={styles.checkoutHeader}><h3>Resumo da contratação</h3></div>
            <div className={styles.priceRows}>
              <div className={styles.priceRow}><span className={styles.rowLabel}>Valor da proposta</span><span className={styles.rowValue}>{formatPrice(proposal.priceCents)}</span></div>
              <div className={styles.couponBox}>
                <label className={styles.couponLabel} htmlFor="project-checkout-coupon">Cupom de desconto</label>
                <div className={styles.couponForm}>
                  <input
                    id="project-checkout-coupon"
                    className={styles.couponInput}
                    type="text"
                    value={couponInput}
                    onChange={(event) => {
                      setCouponInput(event.target.value.toUpperCase());
                      if (currentAppliedCoupon) setAppliedCoupon(null);
                    }}
                    placeholder="Ex: BEMVINDO10"
                    disabled={isApplyingCoupon || submitting || !canCheckout}
                  />
                  <button type="button" className={styles.couponButton} onClick={applyCoupon} disabled={isApplyingCoupon || submitting || !canCheckout}>
                    {isApplyingCoupon ? 'Validando...' : 'Aplicar'}
                  </button>
                </div>
                {currentAppliedCoupon && (
                  <div className={styles.appliedCoupon}>
                    <div><strong>{currentAppliedCoupon.coupon.name}</strong><span>{currentAppliedCoupon.coupon.description || `Cupom ${currentAppliedCoupon.coupon.code} aplicado.`}</span></div>
                    <button type="button" onClick={removeCoupon} disabled={submitting}>Remover</button>
                  </div>
                )}
              </div>
              {currentAppliedCoupon && <div className={`${styles.priceRow} ${styles.discountRow}`}><span className={styles.rowLabel}>Desconto ({currentAppliedCoupon.coupon.code})</span><span className={styles.rowValue}>- {formatPrice(discountCents)}</span></div>}
              <div className={styles.priceRow}><span className={styles.rowLabel}>Taxa de serviço ({fees.clientFeePercent}%)<small>Planos pagos reduzem esta taxa</small></span><span className={styles.rowValue}>{fees.clientFeeCents ? formatPrice(fees.clientFeeCents) : 'Grátis'}</span></div>
              <div className={styles.divider} />
              <div className={`${styles.priceRow} ${styles.priceTotal}`}><span>Total a pagar</span><strong>{formatPrice(fees.totalCents)}</strong></div>
            </div>
            <div className={styles.paymentMethodSection}><span className={styles.paymentMethodTitle}>Forma de pagamento</span><div className={`${styles.paymentMethodOption} ${styles.paymentMethodOptionActive}`}><span className={styles.paymentMethodIcon}><FaCreditCard /></span><span className={styles.paymentMethodCopy}><strong>Cartão de crédito</strong><small>Confirmação imediata no checkout seguro</small></span></div></div>
            <button type="button" className={styles.primaryButton} onClick={startCheckout} disabled={!canCheckout || submitting}>{submitting ? 'Abrindo pagamento...' : canCheckout ? 'Pagar e contratar' : 'Proposta indisponível'}</button>
            <p className={styles.secureNote}>Você será redirecionado para o Checkout seguro da Stripe.</p>
          </section>
        </aside>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default ProjectCheckout;

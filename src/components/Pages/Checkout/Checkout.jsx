import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { getMyService, getPublicService } from '../../../services/services';
import { createOrder } from '../../../services/orders';
import styles from './Checkout.module.css';

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

  useEffect(() => {
    if (service?.title) {
      setOrderTitle((current) => current || `Pedido para ${service.title}`);
    }
  }, [service]);

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <h1 className={styles.emptyTitle}>Carregando checkout...</h1>
      </div>
    );
  }

  if (notFound || !service || !selectedPlan) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h1 className={styles.emptyTitle}>Checkout não encontrado</h1>
        <p className={styles.emptyText}>
          Não foi possível carregar este checkout. Volte para o serviço e tente novamente.
        </p>
        <Link to="/explore" className={styles.primaryButton}>
          Voltar para serviços
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
      text: 'Você descreve objetivo, referências e o que espera receber.',
    },
    {
      title: 'Execução do serviço',
      text: `${sellerName} inicia a produção dentro do prazo combinado.`,
    },
    {
      title: 'Entrega e revisões',
      text: `Você recebe a primeira entrega e pode usar as ${selectedPlan.revisions} revisões inclusas.`,
    },
    {
      title: 'Aprovação e liberação',
      text: 'Voce aprova a entrega final ou pede revisao dentro do fluxo do pedido.',
    },
  ];

  const protections = [
    'Todo o historico do pedido fica salvo na plataforma',
    'Entregas e revisoes ficam centralizadas no mesmo fluxo',
    'Cliente e freelancer acompanham o status em tempo real pela plataforma',
  ];

  const handleSubmit = async () => {
    if (!briefing.trim() || briefing.trim().length < 30) {
      toast.error('Descreva o briefing com pelo menos 30 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requirements = [
        orderTitle.trim() ? `Titulo interno: ${orderTitle.trim()}` : null,
        briefing.trim() ? `Briefing:\n${briefing.trim()}` : null,
        deliveryNote.trim() ? `Prazo ou contexto importante: ${deliveryNote.trim()}` : null,
        attachments.trim() ? `Links e referencias:\n${attachments.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      const result = await createOrder({
        serviceId: service.id,
        planTier: selectedPlan.tier,
        requirements,
      });

      setCreatedOrder(result.order);
      toast.success('Pedido criado com sucesso!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdOrder) {
    return (
      <div className={styles.successState}>
        <div className={styles.successBadge}>Pedido criado</div>
        <h1 className={styles.successTitle}>Seu projeto já entrou no fluxo da Hivelancers.</h1>
        <p className={styles.successText}>
          O pedido foi registrado com o briefing salvo. Agora o proximo passo e o freelancer aceitar o pedido e iniciar a execucao.
        </p>

        <div className={styles.successGrid}>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Número do pedido</span>
            <strong>#{createdOrder.id.slice(-8).toUpperCase()}</strong>
          </div>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Status atual</span>
            <strong>Aguardando aceite do freelancer</strong>
          </div>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Próximo passo</span>
            <strong>Voce pode acompanhar tudo na area de pedidos</strong>
          </div>
        </div>

        <div className={styles.successActions}>
          <button type="button" className={styles.primaryButton} onClick={() => navigate(`/orders?id=${createdOrder.id}`)}>
            Ver pedido
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => navigate(`/messages${createdOrder.conversationId ? `?chat=${createdOrder.conversationId}` : ''}`)}
          >
            Abrir conversa
          </button>
          <Link to={`/services/${service.id}`} className={styles.secondaryButton}>
            Voltar ao servico
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
        <span>/</span>
        <Link to={`/services/${service.id}`}>Serviço</Link>
        <span>/</span>
        <span>Checkout</span>
      </div>

      <section className={styles.header}>
        <div>
          <div className={styles.headerBadge}>Criacao formal de pedido</div>
          <h1 className={styles.title}>Finalizar pedido</h1>
          <p className={styles.subtitle}>
            Monte o briefing e confirme o escopo antes de iniciar o projeto com {sellerName}.
          </p>
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Resumo do serviço</h2>
                <p className={styles.cardSub}>
                  O pedido será criado com base no pacote selecionado na página de detalhes.
                </p>
              </div>
            </div>

            <div className={styles.serviceSummary}>
              <div className={styles.sellerChip}>
                <div className={styles.avatar}>
                  {service.owner?.avatarUrl ? (
                    <img src={service.owner.avatarUrl} alt="" className={styles.avatarImg} />
                  ) : (
                    sellerInitials
                  )}
                </div>
                <div>
                  <strong>{sellerName}</strong>
                  <span>{service.owner?.headline || service.owner?.username || 'Freelancer'}</span>
                </div>
              </div>

              <div className={styles.serviceInfo}>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>

              <div className={styles.packageBox}>
                <span className={styles.packageLabel}>Pacote</span>
                <strong>{selectedPlan.title}</strong>
                <small>
                  {selectedPlan.deliveryDays} {selectedPlan.deliveryDays === 1 ? 'dia' : 'dias'} · {selectedPlan.revisions} revisões
                </small>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Detalhes do pedido</h2>
                <p className={styles.cardSub}>
                  Quanto mais contexto você der aqui, maior a chance de uma entrega certa já no primeiro envio.
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Título interno do pedido</span>
                <input
                  className={styles.input}
                  type="text"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="Ex: Landing page para campanha de maio"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Prazo ou data importante</span>
                <input
                  className={styles.input}
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Ex: preciso da primeira versão até sexta"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Briefing do projeto</span>
              <textarea
                className={styles.textarea}
                rows={7}
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                placeholder="Descreva objetivo, público, referências, tom de voz, entregáveis esperados e qualquer detalhe que ajude o freelancer a produzir melhor."
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Links, arquivos e referências</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                placeholder="Cole links de drive, Figma, Pinterest, site atual, exemplos visuais ou notas adicionais."
              />
            </label>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Como funciona daqui para frente</h2>
                <p className={styles.cardSub}>
                  O fluxo é simples, mas organizado para reduzir retrabalho e proteger ambas as partes.
                </p>
              </div>
            </div>

            <div className={styles.timeline}>
              {orderSteps.map((step, index) => (
                <div key={step.title} className={styles.timelineItem}>
                  <div className={styles.timelineIndex}>{index + 1}</div>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={`${styles.card} ${styles.checkoutCard}`}>
            <div className={styles.checkoutTop}>
              <div>
                <span className={styles.checkoutLabel}>Resumo do pedido</span>
                <h2>{selectedPlan.title}</h2>
              </div>
              <strong>{formatPrice(selectedPlan.priceCents)}</strong>
            </div>

            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span>Pacote base</span>
                <strong>{formatPrice(selectedPlan.priceCents)}</strong>
              </div>
              <div className={styles.priceRow}>
                <span>Prazo</span>
                <strong>{selectedPlan.deliveryDays} {selectedPlan.deliveryDays === 1 ? 'dia' : 'dias'}</strong>
              </div>
              <div className={styles.priceRow}>
                <span>Revisoes</span>
                <strong>{selectedPlan.revisions}</strong>
              </div>
              <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                <span>Valor do plano</span>
                <strong>{formatPrice(selectedPlan.priceCents)}</strong>
              </div>
            </div>

            <div className={styles.packageFeatures}>
              {(selectedPlanFeatures.length > 0 ? selectedPlanFeatures : ['Escopo conforme descrito no pacote']).map((item) => (
                <div key={item} className={styles.packageFeature}>
                  <span className={styles.featureDot} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Criando pedido...' : 'Confirmar e criar pedido'}
            </button>

            <Link to={`/services/${service.id}`} className={styles.secondaryButton}>
              Voltar ao servico
            </Link>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Compra com segurança</h2>
            <div className={styles.protectionList}>
              {protections.map((item) => (
                <div key={item} className={styles.protectionItem}>
                  <span className={styles.protectionIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Dica para um pedido melhor</h2>
            <p className={styles.tipText}>
              Briefings com objetivo claro, público definido e referências visuais costumam reduzir revisões e acelerar a primeira entrega.
            </p>
          </section>
        </aside>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Checkout;

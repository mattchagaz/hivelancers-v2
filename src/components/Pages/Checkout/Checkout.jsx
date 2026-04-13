import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { getServiceById } from '../../../data/services';
import styles from './Checkout.module.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);

function Checkout() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const service = getServiceById(id);

  const selectedPackage = useMemo(() => {
    if (!service) return null;
    const packageId = searchParams.get('package');
    return (
      service.packages.find((item) => item.id === packageId) ||
      service.packages.find((item) => item.popular) ||
      service.packages[0]
    );
  }, [service, searchParams]);

  const [orderTitle, setOrderTitle] = useState(
    service ? `Pedido para ${service.title}` : ''
  );
  const [briefing, setBriefing] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [attachments, setAttachments] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  if (!service || !selectedPackage) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h1 className={styles.emptyTitle}>Pedido nao encontrado</h1>
        <p className={styles.emptyText}>
          Nao foi possivel carregar este checkout. Volte para o servico e tente novamente.
        </p>
        <Link to="/services" className={styles.primaryButton}>
          Voltar para servicos
        </Link>
      </div>
    );
  }

  const addons = [
    {
      id: 'priority',
      label: 'Fila prioritario',
      description: 'Seu pedido entra com prioridade no cronograma do freelancer.',
      price: Math.max(40, Math.round(selectedPackage.price * 0.18)),
    },
    {
      id: 'extended_support',
      label: 'Suporte pos-entrega',
      description: 'Acompanhamento por 7 dias apos a entrega final.',
      price: Math.max(30, Math.round(selectedPackage.price * 0.12)),
    },
    {
      id: 'express_revision',
      label: 'Revisao expressa',
      description: 'Ajustes priorizados em ate 24 horas depois do primeiro envio.',
      price: Math.max(25, Math.round(selectedPackage.price * 0.1)),
    },
  ];

  const selectedExtrasTotal = addons
    .filter((addon) => selectedAddons.includes(addon.id))
    .reduce((acc, item) => acc + item.price, 0);
  const platformFee = Math.max(12, Math.round(selectedPackage.price * 0.09));
  const total = selectedPackage.price + selectedExtrasTotal + platformFee;

  const orderSteps = [
    {
      title: 'Briefing alinhado',
      text: 'Voce descreve objetivo, referencias e o que espera receber.',
    },
    {
      title: 'Execucao do servico',
      text: `${service.seller.name} inicia a producao dentro do prazo combinado.`,
    },
    {
      title: 'Entrega e revisoes',
      text: `Voce recebe a primeira entrega e pode usar as ${selectedPackage.revisions} revisoes inclusas.`,
    },
    {
      title: 'Aprovacao e liberacao',
      text: 'O pagamento fica protegido ate sua aprovacao final.',
    },
  ];

  const protections = [
    'Pagamento protegido via escrow ate a aprovacao',
    'Todo o historico do pedido fica salvo na plataforma',
    'Arquivos, mensagens e revisoes centralizados em um unico fluxo',
  ];

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((item) => item !== addonId)
        : [...prev, addonId]
    );
  };

  const handleSubmit = () => {
    if (!briefing.trim() || briefing.trim().length < 30) {
      toast.error('Descreva o briefing com pelo menos 30 caracteres.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setOrderComplete(true);
      toast.success('Pedido iniciado com sucesso!');
    }, 1400);
  };

  if (orderComplete) {
    return (
      <div className={styles.successState}>
        <div className={styles.successBadge}>Pedido criado</div>
        <h1 className={styles.successTitle}>Seu projeto ja entrou no fluxo da Hivelancers.</h1>
        <p className={styles.successText}>
          O pedido foi registrado com pagamento protegido e briefing salvo. O proximo passo e o freelancer confirmar o inicio do trabalho e alinhar detalhes finos com voce.
        </p>

        <div className={styles.successGrid}>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Numero do pedido</span>
            <strong>#HL-{service.id}48</strong>
          </div>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>XP desbloqueado</span>
            <strong>+40 XP como cliente ativo</strong>
          </div>
          <div className={styles.successCard}>
            <span className={styles.successLabel}>Proximo passo</span>
            <strong>Aguardando confirmacao do freelancer</strong>
          </div>
        </div>

        <div className={styles.successActions}>
          <button type="button" className={styles.primaryButton} onClick={() => navigate('/dashboard')}>
            Ir para dashboard
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
        <Link to={`/services/${service.id}`}>Servico</Link>
        <span>/</span>
        <span>Checkout</span>
      </div>

      <section className={styles.header}>
        <div>
          <div className={styles.headerBadge}>Fluxo de pedido protegido</div>
          <h1 className={styles.title}>Finalizar pedido</h1>
          <p className={styles.subtitle}>
            Monte o briefing, escolha extras e confirme o escopo antes de iniciar o projeto com {service.seller.name}.
          </p>
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Resumo do servico</h2>
                <p className={styles.cardSub}>
                  O pedido sera criado com base no pacote selecionado na pagina de detalhes.
                </p>
              </div>
            </div>

            <div className={styles.serviceSummary}>
              <div className={styles.sellerChip}>
                <div className={styles.avatar}>{service.seller.avatar}</div>
                <div>
                  <strong>{service.seller.name}</strong>
                  <span>{service.seller.level}</span>
                </div>
              </div>

              <div className={styles.serviceInfo}>
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
              </div>

              <div className={styles.packageBox}>
                <span className={styles.packageLabel}>Pacote</span>
                <strong>{selectedPackage.name}</strong>
                <small>
                  {selectedPackage.delivery} {selectedPackage.delivery === 1 ? 'dia' : 'dias'} · {selectedPackage.revisions} revisoes
                </small>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Detalhes do pedido</h2>
                <p className={styles.cardSub}>
                  Quanto mais contexto voce der aqui, maior a chance de uma entrega certa ja no primeiro envio.
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span className={styles.label}>Titulo interno do pedido</span>
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
                  placeholder="Ex: preciso da primeira versao ate sexta"
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
                placeholder="Descreva objetivo, publico, referencias, ton de voz, entregaveis esperados e qualquer detalhe que ajude o freelancer a produzir melhor."
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Links, arquivos e referencias</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                placeholder="Cole links de drive, figma, pinterest, site atual, exemplos visuais ou notas adicionais."
              />
            </label>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Extras para este pedido</h2>
                <p className={styles.cardSub}>
                  Ajustes opcionais para acelerar, ampliar suporte ou ganhar prioridade de resposta.
                </p>
              </div>
            </div>

            <div className={styles.addonList}>
              {addons.map((addon) => {
                const active = selectedAddons.includes(addon.id);

                return (
                  <button
                    key={addon.id}
                    type="button"
                    className={`${styles.addonCard} ${active ? styles.addonCardActive : ''}`}
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <div className={styles.addonTop}>
                      <div>
                        <h3>{addon.label}</h3>
                        <p>{addon.description}</p>
                      </div>
                      <strong>{formatPrice(addon.price)}</strong>
                    </div>
                    <span className={styles.addonState}>
                      {active ? 'Selecionado' : 'Adicionar ao pedido'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2 className={styles.cardTitle}>Como funciona daqui para frente</h2>
                <p className={styles.cardSub}>
                  O fluxo e simples, mas organizado para reduzir retrabalho e proteger ambas as partes.
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
                <span className={styles.checkoutLabel}>Resumo financeiro</span>
                <h2>{selectedPackage.name}</h2>
              </div>
              <strong>{formatPrice(total)}</strong>
            </div>

            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span>Pacote base</span>
                <strong>{formatPrice(selectedPackage.price)}</strong>
              </div>
              <div className={styles.priceRow}>
                <span>Extras</span>
                <strong>{formatPrice(selectedExtrasTotal)}</strong>
              </div>
              <div className={styles.priceRow}>
                <span>Taxa da plataforma</span>
                <strong>{formatPrice(platformFee)}</strong>
              </div>
              <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                <span>Total protegido</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>

            <div className={styles.packageFeatures}>
              {selectedPackage.features.map((item) => (
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
            <h2 className={styles.cardTitle}>Compra com seguranca</h2>
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
              Briefings com objetivo claro, publico definido e referencias visuais costumam reduzir revisoes e acelerar a primeira entrega.
            </p>
          </section>
        </aside>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Checkout;

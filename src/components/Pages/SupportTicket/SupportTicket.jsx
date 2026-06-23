import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaAngleDown,
  FaArrowRight,
  FaCircleArrowLeft,
  FaCircleCheck,
  FaComments,
  FaCreditCard,
  FaInbox,
  FaImage,
  FaLifeRing,
  FaListCheck,
  FaMagnifyingGlass,
  FaPaperclip,
  FaPaperPlane,
  FaReceipt,
  FaShieldHalved,
  FaTicket,
  FaTrash,
  FaUserGear,
} from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createSupportTicket,
  listMySupportTickets,
  normalizeSupportTicketStatus,
  SUPPORT_TICKET_CATEGORY_LABEL,
  SUPPORT_TICKET_PRIORITY_LABEL,
  SUPPORT_TICKET_STATUS_LABEL,
} from '../../../services/tickets';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
import { listOrders } from '../../../services/orders';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './SupportTicket.module.css';

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;

const topics = [
  {
    id: 'orders',
    category: 'ORDERS',
    title: 'Pedido ou entrega',
    summary: 'Atrasos, revisão, disputa ou entrega incorreta.',
    icon: <FaReceipt />,
    subject: 'Preciso de ajuda com um pedido',
    questions: [
      {
        question: 'Meu pedido está atrasado',
        answer: 'Confira se existe uma entrega enviada em revisão. Se o prazo venceu e não houve atualização, descreva o serviço contratado e o contexto no ticket.',
      },
      {
        question: 'Recebi algo diferente do combinado',
        answer: 'Descreva o combinado original, anexe evidências se tiver e informe o que precisa ser corrigido.',
      },
    ],
  },
  {
    id: 'payments',
    category: 'PAYMENTS',
    title: 'Pagamento ou reembolso',
    summary: 'Cobrança, Pix, cartão, repasse ou reembolso.',
    icon: <FaCreditCard />,
    subject: 'Preciso de ajuda com pagamento',
    questions: [
      {
        question: 'Paguei e o pedido não liberou',
        answer: 'Informe o método de pagamento e o horário aproximado. A equipe confere o status da transação internamente.',
      },
      {
        question: 'Quero solicitar reembolso',
        answer: 'Explique o motivo do reembolso e relacione o pedido. Isso ajuda a equipe a analisar a compra sem trocar várias mensagens.',
      },
    ],
  },
  {
    id: 'account',
    category: 'ACCOUNT',
    title: 'Conta e acesso',
    summary: 'Login, perfil, verificação e dados da conta.',
    icon: <FaUserGear />,
    subject: 'Preciso de ajuda com minha conta',
    questions: [
      {
        question: 'Não consigo acessar minha conta',
        answer: 'Use a recuperação de senha primeiro. Se continuar travado, abra ticket com email da conta e o erro exibido.',
      },
      {
        question: 'Minha verificação foi recusada',
        answer: 'Envie no ticket o nome completo, CPF mascarado e o motivo exibido para acelerar a revisão manual.',
      },
    ],
  },
  {
    id: 'messages',
    category: 'MESSAGES',
    title: 'Mensagens e conversa',
    summary: 'Chat, notificações e contato com outro usuário.',
    icon: <FaComments />,
    subject: 'Preciso de ajuda com mensagens',
    questions: [
      {
        question: 'Não recebo mensagens',
        answer: 'Confira notificações e conexão. Se a conversa sumiu ou não atualiza, envie o nome do contato no ticket.',
      },
      {
        question: 'Preciso reportar uma conversa',
        answer: 'Explique o contexto e informe o usuário envolvido. Casos sensíveis entram como prioridade alta.',
      },
    ],
  },
  {
    id: 'safety',
    category: 'SAFETY',
    title: 'Segurança',
    summary: 'Conta suspeita, golpe, fraude ou denúncia.',
    icon: <FaShieldHalved />,
    subject: 'Quero reportar um problema de segurança',
    questions: [
      {
        question: 'Vi uma atividade suspeita',
        answer: 'Troque sua senha e abra ticket com horário, ação suspeita e qualquer usuário envolvido.',
      },
      {
        question: 'Acho que encontrei um golpe',
        answer: 'Não conclua pagamentos fora da plataforma. Envie o máximo de contexto para análise da equipe.',
      },
    ],
  },
  {
    id: 'marketplace',
    category: 'MARKETPLACE',
    title: 'Serviços e marketplace',
    summary: 'Publicação, busca, favoritos e serviços.',
    icon: <FaListCheck />,
    subject: 'Preciso de ajuda com um serviço',
    questions: [
      {
        question: 'Meu serviço não aparece na busca',
        answer: 'Confira status, categoria e descrição. Se estiver publicado e invisível, abra ticket com o ID do serviço.',
      },
      {
        question: 'Quero corrigir um serviço publicado',
        answer: 'Edite o serviço pela área de serviços. Se a edição não salvar, registre o erro no ticket.',
      },
    ],
  },
];

const emptyTicket = {
  subject: '',
  category: 'ORDERS',
  priority: 'NORMAL',
  relatedOrderId: '',
  contactPreference: 'EMAIL',
  description: '',
};

const statusTone = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  ANSWERED: 'success',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const formatDate = (value) => {
  if (!value) return 'Agora';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

function SupportTicket() {
  const { user } = useAuth();
  const [activeTopicId, setActiveTopicId] = useState('orders');
  const [activeQuestion, setActiveQuestion] = useState('orders-0');
  const [ticketDraft, setTicketDraft] = useState(emptyTicket);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const activeTopic = useMemo(
    () => topics.find((topic) => topic.id === activeTopicId) || topics[0],
    [activeTopicId]
  );

  const requesterName = useMemo(() => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    return fullName || user?.username || user?.email || 'sua conta';
  }, [user]);

  const showOrderSelector = ['ORDERS', 'PAYMENTS'].includes(ticketDraft.category);

  const formatOrderLabel = (order) => {
    const code = order.code || order.orderCode || `#${String(order.id || '').slice(-8).toUpperCase()}`;
    const title = order.service?.title || order.serviceTitle || order.title || 'Pedido Hivelancers';
    return `${code} · ${title}`;
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const data = await listMySupportTickets({ pageSize: 5 }, user);
      setTickets(data.items || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadTickets, 0);
    const refresh = () => loadTickets();
    window.addEventListener('support:tickets:changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('support:tickets:changed', refresh);
      window.removeEventListener('storage', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  useEffect(() => {
    let cancelled = false;
    const loadRecentOrders = async () => {
      const results = await Promise.allSettled([
        listOrders({ role: 'buyer', pageSize: 8 }),
        listOrders({ role: 'seller', pageSize: 8 }),
      ]);
      if (cancelled) return;
      const nextOrders = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value?.items || [])
        .filter(Boolean);
      const unique = Array.from(new Map(nextOrders.map((order) => [order.id, order])).values());
      setRecentOrders(unique.slice(0, 8));
    };
    window.setTimeout(loadRecentOrders, 0);
    return () => {
      cancelled = true;
    };
  }, []);

  const selectTopic = (topic) => {
    setActiveTopicId(topic.id);
    setActiveQuestion(`${topic.id}-0`);
    setTicketDraft((current) => ({
      ...current,
      category: topic.category,
    }));
  };

  const fillFromQuestion = (topic, question) => {
    setActiveTopicId(topic.id);
    setTicketDraft((current) => ({
      ...current,
      category: topic.category,
      description: current.description || `${question.question}\n\n`,
      priority: topic.category === 'SAFETY' ? 'HIGH' : current.priority,
    }));
    document.getElementById('ticket-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateTicketDraft = (field, value) => {
    setTicketDraft((current) => ({ ...current, [field]: value }));
  };

  const clearAttachment = () => {
    setAttachment(null);
  };

  const readImageAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.readAsDataURL(file);
    });

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Envie apenas imagens.');
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error('A imagem deve ter até 2 MB.');
      return;
    }

    try {
      const previewUrl = await readImageAsDataUrl(file);
      setAttachment({
        file,
        previewUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const prepareAttachment = async () => {
    if (!attachment?.file) return null;

    try {
      const uploaded = await uploadImageToCloudinary(attachment.file);
      return {
        url: uploaded.url,
        publicId: uploaded.publicId,
        type: attachment.type,
        name: attachment.name,
        size: attachment.size,
      };
    } catch {
      return {
        url: attachment.previewUrl,
        type: attachment.type,
        name: attachment.name,
        size: attachment.size,
        localPreview: true,
      };
    }
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    const subject = ticketDraft.subject.trim();
    const description = ticketDraft.description.trim();

    if (subject.length < 6) {
      toast.error('Informe um assunto um pouco mais claro.');
      return;
    }

    if (description.length < 20) {
      toast.error('Descreva o problema com pelo menos 20 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const preparedAttachment = await prepareAttachment();
      const created = await createSupportTicket(
        {
          ...ticketDraft,
          subject,
          description,
          relatedOrderId: ticketDraft.relatedOrderId,
          attachment: preparedAttachment,
        },
        user
      );
      setTickets((current) => [created, ...current]);
      setTicketDraft({ ...emptyTicket, category: activeTopic.category });
      clearAttachment();
      setCreatedTicket(created);
      toast.success(`Ticket ${created.code || ''} registrado.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <Link className={styles.backLink} to="/support">
            <FaCircleArrowLeft /> Voltar para suporte
          </Link>
          <span className={styles.eyebrow}>Abrir ticket</span>
          <h1>Como podemos ajudar?</h1>
          <p>
            Escolha um tema, veja respostas rápidas e envie um chamado com as informações certas para a equipe.
          </p>
        </div>
        <SpotlightCard className={styles.heroCard}>
          <FaLifeRing />
          <span>Solicitante</span>
          <strong>{requesterName}</strong>
          <p>{user?.email || 'Conta autenticada'}</p>
        </SpotlightCard>
      </section>

      <section className={styles.topicShell}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionKicker}>FAQ</span>
            <h2>Escolha o assunto antes de enviar</h2>
          </div>
          <span className={styles.headerPill}><FaMagnifyingGlass /> Triagem por tema</span>
        </div>

        <div className={styles.topicCards}>
          {topics.map((topic) => (
            <button
              type="button"
              key={topic.id}
              className={`${styles.topicCard} ${activeTopicId === topic.id ? styles.topicActive : ''}`}
              onClick={() => selectTopic(topic)}
            >
              <span>{topic.icon}</span>
              <strong>{topic.title}</strong>
              <small>{topic.summary}</small>
            </button>
          ))}
        </div>

        <div className={styles.faqGrid}>
          <div className={styles.faqPanel}>
            <div className={styles.faqHeader}>
              <span className={styles.topicIcon}>{activeTopic.icon}</span>
              <div>
                <h3>{activeTopic.title}</h3>
                <p>{activeTopic.summary}</p>
              </div>
            </div>

            <div className={styles.faqList}>
              {activeTopic.questions.map((item, index) => {
                const questionId = `${activeTopic.id}-${index}`;
                const isOpen = activeQuestion === questionId;
                return (
                  <article className={styles.faqItem} key={questionId}>
                    <button type="button" onClick={() => setActiveQuestion(isOpen ? '' : questionId)}>
                      <span>{item.question}</span>
                      <FaAngleDown className={isOpen ? styles.rotateIcon : ''} />
                    </button>
                    {isOpen && (
                      <div className={styles.faqAnswer}>
                        <p>{item.answer}</p>
                        <button type="button" onClick={() => fillFromQuestion(activeTopic, item)}>
                          Abrir ticket sobre isso <FaArrowRight />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <aside className={styles.guidancePanel}>
            <span className={styles.formIcon}><FaLifeRing /></span>
            <h3>O que ajuda a resolver mais rápido</h3>
            <ul>
              <li>Explique o que aconteceu e quando começou.</li>
              <li>Cite o serviço, freelancer ou conversa envolvida, se existir.</li>
              <li>Depois do envio, um protocolo é criado automaticamente.</li>
              <li>O prazo padrão de resposta é de até 24h úteis.</li>
            </ul>
            <button type="button" onClick={() => document.getElementById('ticket-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              Preencher ticket <FaArrowRight />
            </button>
          </aside>
        </div>
      </section>

      <section className={styles.ticketShell} id="ticket-form">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionKicker}>Formulário</span>
            <h2>Enviar ticket de suporte</h2>
          </div>
          <span className={styles.headerPill}><FaTicket /> {SUPPORT_TICKET_CATEGORY_LABEL[ticketDraft.category]}</span>
        </div>

        <div className={styles.ticketGrid}>
          <form className={styles.ticketForm} onSubmit={submitTicket}>
            {createdTicket && (
              <div className={styles.confirmation}>
                <FaCircleCheck />
                <div>
                  <span>Ticket enviado</span>
                  <strong>{createdTicket.code || createdTicket.id}</strong>
                  <p>Seu chamado foi registrado. A resposta deve chegar em até 24h úteis e você pode acompanhar o andamento em “Tickets recentes”.</p>
                </div>
              </div>
            )}

            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span>Assunto</span>
              <input
                value={ticketDraft.subject}
                onChange={(event) => updateTicketDraft('subject', event.target.value)}
                placeholder="Ex: pagamento aprovado não liberou o pedido"
                maxLength={120}
              />
            </label>

            <label className={styles.formField}>
              <span>Categoria</span>
              <select value={ticketDraft.category} onChange={(event) => updateTicketDraft('category', event.target.value)}>
                {Object.entries(SUPPORT_TICKET_CATEGORY_LABEL).map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className={styles.formField}>
              <span>Prioridade</span>
              <select value={ticketDraft.priority} onChange={(event) => updateTicketDraft('priority', event.target.value)}>
                {Object.entries(SUPPORT_TICKET_PRIORITY_LABEL).map(([value, label]) => (
                  <option value={value} key={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className={styles.formField}>
              <span>Contato</span>
              <select value={ticketDraft.contactPreference} onChange={(event) => updateTicketDraft('contactPreference', event.target.value)}>
                <option value="EMAIL">Email</option>
                <option value="PLATFORM">Mensagens da plataforma</option>
                <option value="WHATSAPP">WhatsApp cadastrado</option>
              </select>
            </label>

            {showOrderSelector && (
              <label className={`${styles.formField} ${styles.formFieldFull}`}>
                <span>Pedido relacionado</span>
                <select value={ticketDraft.relatedOrderId} onChange={(event) => updateTicketDraft('relatedOrderId', event.target.value)}>
                  <option value="">Nenhum pedido selecionado</option>
                  {recentOrders.map((order) => (
                    <option key={order.id} value={order.id}>{formatOrderLabel(order)}</option>
                  ))}
                </select>
              </label>
            )}

            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span>Descrição</span>
              <textarea
                rows={7}
                value={ticketDraft.description}
                onChange={(event) => updateTicketDraft('description', event.target.value)}
                placeholder="Conte o que aconteceu, quando começou, qual serviço ou conversa está envolvida e qual resultado você esperava."
                maxLength={1400}
              />
            </label>

            <div className={styles.attachmentField}>
              <div>
                <span>Anexo opcional</span>
                <strong>Imagem de comprovação</strong>
                <p>PNG, JPG ou WebP até 2 MB.</p>
              </div>

              {attachment ? (
                <div className={styles.attachmentPreview}>
                  <img src={attachment.previewUrl} alt="Prévia do anexo" />
                  <div>
                    <strong>{attachment.name}</strong>
                    <span>{(attachment.size / 1024).toFixed(0)} KB</span>
                  </div>
                  <button type="button" onClick={clearAttachment} aria-label="Remover anexo">
                    <FaTrash />
                  </button>
                </div>
              ) : (
                <label className={styles.attachmentDrop}>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAttachmentChange} />
                  <FaImage />
                  <span>Anexar imagem</span>
                </label>
              )}
            </div>

            <div className={styles.formFooter}>
              <span>{ticketDraft.description.length}/1400</span>
              <button type="submit" className={styles.submitButton} disabled={submitting}>
                <FaPaperPlane /> {submitting ? 'Enviando...' : 'Enviar ticket'}
              </button>
            </div>
          </form>

          <aside className={styles.ticketHistory}>
            <div className={styles.historyHead}>
              <span className={styles.formIcon}><FaInbox /></span>
              <div>
                <h3>Tickets recentes</h3>
                <p>{tickets.length} chamados encontrados</p>
              </div>
            </div>

            <div className={styles.historyList}>
              {ticketsLoading ? (
                <div className={styles.emptyState}>Carregando tickets...</div>
              ) : tickets.length === 0 ? (
                <div className={styles.emptyState}>Nenhum ticket aberto por enquanto.</div>
              ) : (
                tickets.map((ticket) => {
                  const normalizedStatus = normalizeSupportTicketStatus(ticket.status);
                  return (
                    <Link className={styles.ticketCard} to={`/support/tickets/${ticket.id}`} key={ticket.id}>
                      <div className={styles.ticketTop}>
                        <span>{ticket.code || ticket.id}</span>
                        <em className={`${styles.badge} ${styles[statusTone[normalizedStatus] || 'neutral']}`}>
                          {SUPPORT_TICKET_STATUS_LABEL[normalizedStatus] || normalizedStatus}
                        </em>
                      </div>
                      <strong>{ticket.subject}</strong>
                      <p>{formatDate(ticket.updatedAt || ticket.createdAt)}</p>
                      {ticket.attachment?.url && (
                        <small><FaPaperclip /> Imagem anexada</small>
                      )}
                      {ticket.publicReply && (
                        <small><FaCircleCheck /> Resposta disponível</small>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </section>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default SupportTicket;

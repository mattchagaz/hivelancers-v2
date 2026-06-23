import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaArrowUpRightFromSquare,
  FaCircleArrowLeft,
  FaCircleCheck,
  FaClock,
  FaComments,
  FaImage,
  FaLifeRing,
  FaPaperclip,
  FaTicket,
} from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getSupportTicket,
  normalizeSupportTicketStatus,
  SUPPORT_TICKET_CATEGORY_LABEL,
  SUPPORT_TICKET_PRIORITY_LABEL,
  SUPPORT_TICKET_STATUS_LABEL,
} from '../../../services/tickets';
import styles from './SupportTicketDetails.module.css';

const statusSteps = [
  { id: 'OPEN', label: 'Aberto' },
  { id: 'IN_PROGRESS', label: 'Em análise' },
  { id: 'ANSWERED', label: 'Respondido' },
  { id: 'RESOLVED', label: 'Resolvido' },
];

const statusTone = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  ANSWERED: 'success',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const formatDate = (value) => {
  if (!value) return 'Ainda não registrado';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

function SupportTicketDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadTicket = async () => {
      setLoading(true);
      try {
        const data = await getSupportTicket(id, user);
        if (!cancelled) setTicket(data);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timer = window.setTimeout(loadTicket, 0);
    const refresh = () => loadTicket();
    window.addEventListener('support:tickets:changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('support:tickets:changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [id, user]);

  const normalizedStatus = useMemo(() => normalizeSupportTicketStatus(ticket?.status), [ticket?.status]);

  const activeStepIndex = useMemo(() => {
    if (!ticket) return 0;
    if (normalizedStatus === 'CLOSED') return statusSteps.length - 1;
    const index = statusSteps.findIndex((step) => step.id === normalizedStatus);
    return index === -1 ? 0 : index;
  }, [normalizedStatus, ticket]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>Carregando ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={styles.page}>
        <section className={styles.emptyState}>
          <strong>Ticket não encontrado</strong>
          <Link to="/support">Voltar para suporte</Link>
        </section>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <Link className={styles.backLink} to="/support">
            <FaCircleArrowLeft /> Voltar para suporte
          </Link>
          <span className={styles.eyebrow}>Acompanhamento</span>
          <h1>{ticket.subject}</h1>
          <p>Protocolo {ticket.code || ticket.id}</p>
        </div>
        <div className={styles.heroStatus}>
          <FaTicket />
          <span>Status atual</span>
          <strong>{SUPPORT_TICKET_STATUS_LABEL[normalizedStatus] || normalizedStatus}</strong>
        </div>
      </section>

      <section className={styles.ticketShell}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionKicker}>Status</span>
            <h2>Andamento do chamado</h2>
          </div>
          <em className={`${styles.badge} ${styles[statusTone[normalizedStatus] || 'neutral']}`}>
            {SUPPORT_TICKET_STATUS_LABEL[normalizedStatus] || normalizedStatus}
          </em>
        </div>

        <div className={styles.progress}>
          {statusSteps.map((step, index) => (
            <div key={step.id} className={`${styles.progressStep} ${index <= activeStepIndex ? styles.progressStepActive : ''}`}>
              <span>{index <= activeStepIndex ? <FaCircleCheck /> : <FaClock />}</span>
              <strong>{step.label}</strong>
            </div>
          ))}
        </div>

        <div className={styles.ticketGrid}>
          <main className={styles.thread}>
            <article className={styles.messageCard}>
              <div className={styles.messageIcon}><FaComments /></div>
              <div>
                <span>Sua solicitação</span>
                <p>{ticket.description}</p>
              </div>
            </article>

            {ticket.attachment?.url && (
              <article className={styles.attachmentCard}>
                <div>
                  <FaImage />
                  <span>Evidência anexada</span>
                  <strong>{ticket.attachment.name || 'Imagem enviada'}</strong>
                </div>
                <img src={ticket.attachment.url} alt="Evidência anexada ao ticket" />
                <a href={ticket.attachment.url} target="_blank" rel="noreferrer">
                  <FaArrowUpRightFromSquare /> Abrir imagem
                </a>
              </article>
            )}

            <article className={`${styles.messageCard} ${ticket.publicReply ? styles.replyReady : styles.replyWaiting}`}>
              <div className={styles.messageIcon}><FaLifeRing /></div>
              <div>
                <span>Resposta do suporte</span>
                {ticket.publicReply ? (
                  <p>{ticket.publicReply}</p>
                ) : (
                  <p>Seu chamado está na fila de atendimento. A resposta deve aparecer aqui em até 24h úteis.</p>
                )}
              </div>
            </article>
          </main>

          <aside className={styles.summary}>
            <div>
              <span>Protocolo</span>
              <strong>{ticket.code || ticket.id}</strong>
            </div>
            <div>
              <span>Categoria</span>
              <strong>{SUPPORT_TICKET_CATEGORY_LABEL[ticket.category] || ticket.category}</strong>
            </div>
            <div>
              <span>Prioridade</span>
              <strong>{SUPPORT_TICKET_PRIORITY_LABEL[ticket.priority] || ticket.priority}</strong>
            </div>
            {ticket.relatedOrderId && (
              <div>
                <span>Pedido relacionado</span>
                <strong>{ticket.relatedOrderId}</strong>
              </div>
            )}
            <div>
              <span>Criado em</span>
              <strong>{formatDate(ticket.createdAt)}</strong>
            </div>
            <div>
              <span>Última atualização</span>
              <strong>{formatDate(ticket.updatedAt)}</strong>
            </div>
            {ticket.attachment?.url && (
              <div>
                <span>Anexo</span>
                <strong><FaPaperclip /> Imagem enviada</strong>
              </div>
            )}
          </aside>
        </div>
      </section>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default SupportTicketDetails;

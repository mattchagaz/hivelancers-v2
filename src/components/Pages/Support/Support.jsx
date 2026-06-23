import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaCircleCheck,
  FaClock,
  FaComments,
  FaCreditCard,
  FaHeadset,
  FaInbox,
  FaLifeRing,
  FaLock,
  FaTicket,
  FaUserGear,
} from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import {
  listMySupportTickets,
  normalizeSupportTicketStatus,
  SUPPORT_TICKET_STATUS_LABEL,
} from '../../../services/tickets';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './Support.module.css';

const supportStacks = [
  {
    title: 'Gerenciamento',
    icon: <FaUserGear />,
    links: [
      { label: 'Recuperar sua conta', href: '/forget-password' },
      { label: 'Verificar identidade', href: '/verification' },
      { label: 'Configurações da conta', href: '/settings' },
    ],
  },
  {
    title: 'Pagamentos',
    icon: <FaCreditCard />,
    links: [
      { label: 'Reembolso de compra', href: '/orders' },
      { label: 'Resolver estornos', href: '/finances' },
      { label: 'Assinatura e plano', href: '/subscription' },
    ],
  },
  {
    title: 'Privacidade',
    icon: <FaLock />,
    links: [
      { label: 'Dados da conta', href: '/settings' },
      { label: 'Segurança do perfil', href: '/verification' },
      { label: 'Mensagens e contatos', href: '/messages' },
    ],
  },
];

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

function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const ticketStats = useMemo(() => {
    const active = tickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes(normalizeSupportTicketStatus(ticket.status))).length;
    const answered = tickets.filter((ticket) => (
      normalizeSupportTicketStatus(ticket.status) === 'ANSWERED' || Boolean(ticket.publicReply)
    )).length;
    const solved = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(normalizeSupportTicketStatus(ticket.status))).length;
    return { active, answered, solved };
  }, [tickets]);

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

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.eyebrow}>Suporte</span>
          <h1>Central de suporte Hivelancers</h1>
          <p>
            Encontre respostas rápidas, acompanhe seus chamados e abra um ticket quando precisar da equipe.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.heroAction} to="/support/ticket">
              <FaTicket /> Abrir ticket
            </Link>
            <Link className={styles.heroGhost} to="/messages">
              <FaComments /> Conversas
            </Link>
          </div>
        </div>

        <div className={styles.heroStats}>
          <SpotlightCard className={styles.statCard}>
            <FaTicket />
            <span>Tickets ativos</span>
            <strong>{ticketStats.active}</strong>
          </SpotlightCard>
          <SpotlightCard className={styles.statCard}>
            <FaClock />
            <span>Respondidos</span>
            <strong>{ticketStats.answered}</strong>
          </SpotlightCard>
          <SpotlightCard className={styles.statCard}>
            <FaCircleCheck />
            <span>Resolvidos</span>
            <strong>{ticketStats.solved}</strong>
          </SpotlightCard>
        </div>
      </section>

      <section className={styles.tools}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionKicker}>Atalhos</span>
            <h2>Ferramentas de suporte</h2>
          </div>
          <span className={styles.headerPill}><FaHeadset /> Atendimento organizado por tema</span>
        </div>

        <div className={styles.stackGrid}>
          {supportStacks.map((stack) => (
            <SpotlightCard className={styles.stackPanel} key={stack.title}>
              <div className={styles.stackHead}>
                <span className={styles.stackIcon}>{stack.icon}</span>
                <div>
                  <span className={styles.sectionKicker}>Controle</span>
                  <h3>{stack.title}</h3>
                </div>
              </div>
              <div className={styles.actionList}>
                {stack.links.map((item) => (
                  <Link className={styles.panelAction} to={item.href} key={item.label}>
                    {item.label} <FaArrowRight />
                  </Link>
                ))}
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <section className={styles.ticketPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionKicker}>Chamados</span>
            <h2>Tickets e atendimento</h2>
          </div>
          <Link className={styles.heroAction} to="/support/ticket">
            <FaLifeRing /> Novo ticket
          </Link>
        </div>

        <div className={styles.supportHubGrid}>
          <SpotlightCard className={styles.ticketEntry}>
            <span className={styles.formIcon}><FaTicket /></span>
            <div>
              <h3>Enviar um ticket</h3>
              <p>Abra uma triagem com FAQ e formulário. A resposta padrão chega em até 24h úteis.</p>
            </div>
            <Link className={styles.panelAction} to="/support/ticket">
              Abrir página de ticket <FaArrowRight />
            </Link>
          </SpotlightCard>

          <aside className={styles.ticketHistory}>
            <div className={styles.historyHead}>
              <span className={styles.formIcon}><FaInbox /></span>
              <div>
                <h3>Meus tickets recentes</h3>
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
                        <span className={styles.ticketCategory}>{ticket.code || ticket.id}</span>
                        <em className={`${styles.badge} ${styles[statusTone[normalizedStatus] || 'neutral']}`}>
                          {SUPPORT_TICKET_STATUS_LABEL[normalizedStatus] || normalizedStatus}
                        </em>
                      </div>
                      <strong>{ticket.subject}</strong>
                      <div className={styles.ticketMeta}>
                        <span>{formatDate(ticket.updatedAt || ticket.createdAt)}</span>
                      </div>
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

export default Support;

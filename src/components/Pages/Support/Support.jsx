import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBookOpen,
  FaBriefcase,
  FaChevronRight,
  FaCircleCheck,
  FaClock,
  FaCreditCard,
  FaHeadset,
  FaInbox,
  FaLifeRing,
  FaMagnifyingGlass,
  FaShieldHalved,
  FaTicket,
  FaUserGroup,
  FaWallet,
  FaXmark,
} from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/authContextStore';
import {
  listMySupportTickets,
  normalizeSupportTicketStatus,
  SUPPORT_TICKET_STATUS_LABEL,
} from '../../../services/tickets';
import {
  DEFAULT_HELP_ARTICLE_ID,
  HELP_ARTICLES,
  HELP_CATEGORIES,
  findHelpArticles,
} from './supportContent';
import styles from './Support.module.css';

const categoryIcons = {
  start: <FaBookOpen />,
  client: <FaUserGroup />,
  freelancer: <FaBriefcase />,
  payments: <FaWallet />,
  orders: <FaCreditCard />,
  security: <FaShieldHalved />,
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
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

function Support() {
  const { user } = useAuth();
  const articleRef = useRef(null);
  const [query, setQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState(DEFAULT_HELP_ARTICLE_ID);
  const [feedback, setFeedback] = useState('');
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const activeArticle = useMemo(
    () => HELP_ARTICLES.find((article) => article.id === activeArticleId) || HELP_ARTICLES[0],
    [activeArticleId],
  );
  const activeCategory = useMemo(
    () => HELP_CATEGORIES.find((category) => category.id === activeArticle.categoryId),
    [activeArticle.categoryId],
  );
  const searchResults = useMemo(() => findHelpArticles(query), [query]);

  const ticketStats = useMemo(() => {
    const active = tickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes(normalizeSupportTicketStatus(ticket.status))).length;
    const answered = tickets.filter((ticket) => (
      normalizeSupportTicketStatus(ticket.status) === 'ANSWERED' || Boolean(ticket.publicReply)
    )).length;
    return { active, answered };
  }, [tickets]);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const data = await listMySupportTickets({ pageSize: 5 }, user);
      setTickets(data.items || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTicketsLoading(false);
    }
  }, [user]);

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
  }, [loadTickets]);

  const openArticle = (articleId, { clearSearch = true } = {}) => {
    setActiveArticleId(articleId);
    setFeedback('');
    if (clearSearch) setQuery('');
    window.requestAnimationFrame(() => {
      articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openCategory = (category) => {
    const firstArticle = category.articles[0];
    if (firstArticle) openArticle(firstArticle.id);
  };

  return (
    <div className={styles.page}>
      <header className={styles.helpHero}>
        <div className={styles.heroTopline}>
          <span className={styles.eyebrow}><FaLifeRing /> Central de Ajuda</span>
          <div className={styles.heroLinks}>
            <a href="#my-tickets"><FaInbox /> Meus chamados</a>
            <Link to="/support/ticket"><FaTicket /> Abrir chamado</Link>
          </div>
        </div>

        <div className={styles.heroCopy}>
          <h1>Como podemos ajudar?</h1>
          <p>Pesquise uma dúvida ou navegue pelos guias completos da Hivelancers.</p>
        </div>

        <form className={styles.searchBox} onSubmit={(event) => event.preventDefault()} role="search">
          <FaMagnifyingGlass />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque por pagamento, Pix, projeto, entrega, Stripe..."
            aria-label="Buscar na Central de Ajuda"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
              <FaXmark />
            </button>
          )}
        </form>

        <div className={styles.popularSearches}>
          <span>Mais buscados:</span>
          {[
            ['Publicar um serviço', 'publish-service'],
            ['Pagamento protegido', 'payment-statuses'],
            ['Contratar freelancer', 'hire-a-service'],
          ].map(([label, articleId]) => (
            <button key={articleId} type="button" onClick={() => openArticle(articleId)}>{label}</button>
          ))}
        </div>
      </header>

      {query ? (
        <section className={styles.searchResults} aria-live="polite">
          <div className={styles.sectionTitle}>
            <div>
              <span className={styles.sectionKicker}>Resultados</span>
              <h2>{searchResults.length} {searchResults.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}</h2>
            </div>
            <button type="button" onClick={() => setQuery('')}>Limpar busca</button>
          </div>

          {searchResults.length ? (
            <div className={styles.resultList}>
              {searchResults.map((article) => (
                <button key={article.id} type="button" onClick={() => openArticle(article.id)}>
                  <span>{article.categoryTitle}</span>
                  <strong>{article.title}</strong>
                  <p>{article.summary}</p>
                  <FaChevronRight />
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <FaMagnifyingGlass />
              <div>
                <strong>Nenhuma resposta encontrada para “{query}”</strong>
                <p>Tente palavras mais curtas ou abra um chamado para falar com a equipe.</p>
              </div>
              <Link to="/support/ticket">Abrir chamado</Link>
            </div>
          )}
        </section>
      ) : (
        <section className={styles.categorySection}>
          <div className={styles.sectionTitle}>
            <div>
              <span className={styles.sectionKicker}>Explore por assunto</span>
              <h2>Encontre respostas por categoria</h2>
            </div>
            <span>{HELP_ARTICLES.length} guias disponíveis</span>
          </div>

          <div className={styles.categoryGrid}>
            {HELP_CATEGORIES.map((category) => (
              <button
                type="button"
                key={category.id}
                className={category.id === activeCategory?.id ? styles.categoryActive : ''}
                onClick={() => openCategory(category)}
              >
                <span className={styles.categoryIcon}>{categoryIcons[category.icon]}</span>
                <div>
                  <strong>{category.title}</strong>
                  <p>{category.description}</p>
                  <small>{category.articles.length} artigos</small>
                </div>
                <FaChevronRight />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={styles.helpWorkspace} ref={articleRef}>
        <aside className={styles.helpNavigation}>
          <div className={styles.navigationHeading}>
            <FaBookOpen />
            <div>
              <span>Guia Hivelancers</span>
              <strong>Navegue pelos tópicos</strong>
            </div>
          </div>

          <nav aria-label="Artigos da Central de Ajuda">
            {HELP_CATEGORIES.map((category) => {
              const isOpen = category.id === activeCategory?.id;
              return (
                <div className={styles.navigationGroup} key={category.id}>
                  <button type="button" className={isOpen ? styles.navigationCategoryActive : ''} onClick={() => openCategory(category)}>
                    <span>{categoryIcons[category.icon]}</span>
                    {category.title}
                    <FaChevronRight />
                  </button>
                  {isOpen && (
                    <div className={styles.navigationArticles}>
                      {category.articles.map((article) => (
                        <button
                          type="button"
                          key={article.id}
                          className={article.id === activeArticle.id ? styles.navigationArticleActive : ''}
                          onClick={() => openArticle(article.id, { clearSearch: false })}
                        >
                          {article.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={styles.navigationSupport}>
            <FaHeadset />
            <strong>Ainda precisa de ajuda?</strong>
            <p>Nossa equipe pode analisar seu caso.</p>
            <Link to="/support/ticket">Abrir chamado <FaArrowRight /></Link>
          </div>
        </aside>

        <article className={styles.articlePanel}>
          <div className={styles.breadcrumbs}>
            <button type="button" onClick={() => openCategory(activeCategory)}>{activeCategory?.title}</button>
            <FaChevronRight />
            <span>{activeArticle.title}</span>
          </div>

          <header className={styles.articleHeader}>
            <span className={styles.articleBadge}>{activeArticle.audience}</span>
            <h2>{activeArticle.title}</h2>
            <p>{activeArticle.summary}</p>
            <div className={styles.articleMeta}>
              <span><FaClock /> Leitura de {activeArticle.readTime}</span>
              <span><FaCircleCheck /> Atualizado em agosto de 2026</span>
            </div>
          </header>

          <div className={styles.articleContent}>
            {activeArticle.sections.map((section, sectionIndex) => (
              <section key={section.title}>
                <span className={styles.sectionNumber}>{String(sectionIndex + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{section.title}</h3>
                  {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets && (
                    <ul>
                      {section.bullets.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                  {section.steps && (
                    <ol>
                      {section.steps.map((item, index) => (
                        <li key={item}><span>{index + 1}</span><p>{item}</p></li>
                      ))}
                    </ol>
                  )}
                  {section.note && (
                    <aside className={styles.articleNote}>
                      <FaShieldHalved />
                      <div><strong>Importante</strong><p>{section.note}</p></div>
                    </aside>
                  )}
                </div>
              </section>
            ))}
          </div>

          <footer className={styles.articleFooter}>
            <div>
              <strong>Este artigo resolveu sua dúvida?</strong>
              <p>Seu retorno ajuda a melhorar nossa Central de Ajuda.</p>
            </div>
            <div className={styles.feedbackActions}>
              <button
                type="button"
                className={feedback === 'yes' ? styles.feedbackSelected : ''}
                onClick={() => setFeedback('yes')}
              >
                <FaCircleCheck /> Sim
              </button>
              <button
                type="button"
                className={feedback === 'no' ? styles.feedbackSelected : ''}
                onClick={() => setFeedback('no')}
              >
                <FaHeadset /> Ainda preciso de ajuda
              </button>
            </div>
            {feedback === 'yes' && <small>Obrigado pelo feedback!</small>}
            {feedback === 'no' && <Link to="/support/ticket">Conte o que aconteceu em um chamado <FaArrowRight /></Link>}
          </footer>
        </article>
      </section>

      <section className={styles.ticketsSection} id="my-tickets">
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.sectionKicker}>Atendimento</span>
            <h2>Seus chamados recentes</h2>
            <p>{ticketStats.active} ativos · {ticketStats.answered} respondidos</p>
          </div>
          <Link className={styles.newTicketButton} to="/support/ticket"><FaTicket /> Novo chamado</Link>
        </div>

        {ticketsLoading ? (
          <div className={styles.emptyTickets}>Carregando chamados...</div>
        ) : tickets.length ? (
          <div className={styles.ticketList}>
            {tickets.map((ticket) => {
              const normalizedStatus = normalizeSupportTicketStatus(ticket.status);
              return (
                <Link to={`/support/tickets/${ticket.id}`} key={ticket.id} className={styles.ticketCard}>
                  <span className={styles.ticketIcon}><FaTicket /></span>
                  <div>
                    <small>{ticket.code || ticket.id}</small>
                    <strong>{ticket.subject}</strong>
                    <p>Atualizado {formatDate(ticket.updatedAt || ticket.createdAt)}</p>
                  </div>
                  <em className={`${styles.badge} ${styles[statusTone[normalizedStatus] || 'neutral']}`}>
                    {SUPPORT_TICKET_STATUS_LABEL[normalizedStatus] || normalizedStatus}
                  </em>
                  <FaChevronRight />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyTickets}>
            <FaInbox />
            <div><strong>Você ainda não abriu nenhum chamado</strong><p>Use os artigos acima ou fale com a equipe quando precisar.</p></div>
          </div>
        )}
      </section>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Support;

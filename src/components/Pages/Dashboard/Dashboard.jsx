import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SERVICE_GRADIENTS } from '../../../data/services';
import { useAuth } from '../../../contexts/AuthContext';
import { listCategories, listMyServices, listPublicServices } from '../../../services/services';
import { listOrders } from '../../../services/orders';
import { listConversations } from '../../../services/messages';
import { getMyFavorites } from '../../../services/users';
import { CategoryIcon } from '../../../utils/categoryIcons';
import { getFeaturedProject } from '../../../utils/profileEnhancements';
import { getRecentActivity } from '../../../utils/clientRecentActivity';
import styles from './Dashboard.module.css';

const STATUS_LABEL = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const formatPriceBRL = (cents) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CLIENT_ORDER_STAGES = [
  { key: 'PENDING', label: 'Pedido criado' },
  { key: 'IN_PROGRESS', label: 'Execucao' },
  { key: 'DELIVERED', label: 'Entrega' },
  { key: 'COMPLETED', label: 'Aprovacao' },
];

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const getFullName = (person) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.username || 'Usuario';

const getOrderStageState = (orderStatus, stageKey) => {
  if (orderStatus === 'REJECTED' || orderStatus === 'CANCELED') {
    return stageKey === 'PENDING' ? 'done' : 'idle';
  }

  const currentIndex = CLIENT_ORDER_STAGES.findIndex((stage) => stage.key === orderStatus);
  const stageIndex = CLIENT_ORDER_STAGES.findIndex((stage) => stage.key === stageKey);

  if (currentIndex === -1) return 'idle';
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  return 'idle';
};

const getRecentTypeLabel = (type) => {
  if (type === 'service') return 'Servico visto';
  if (type === 'profile') return 'Perfil visitado';
  if (type === 'project') return 'Projeto aberto';
  if (type === 'conversation') return 'Conversa ativa';
  return 'Atividade recente';
};

function Dashboard() {
  const { user } = useAuth();
  const isFreelancer = user?.userType !== 'CLIENT';

  return isFreelancer ? <FreelancerDashboard /> : <ClientDashboard />;
}

function FreelancerDashboard() {
  const [myServices, setMyServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    listMyServices()
      .then(setMyServices)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingServices(false));
  }, []);

  const stats = [
    { label: 'Ganhos do mes', value: 'R$ 3.240', change: '+12%', positive: true, color: 'green' },
    { label: 'Pedidos ativos', value: '7', change: '+2 novos', positive: true, color: 'blue' },
    { label: 'Avaliacao media', value: '4.8', sub: 'de 5.0', color: 'amber' },
    { label: 'Nivel atual', value: '3', sub: 'Profissional', color: 'purple' },
  ];

  const orders = [
    { id: '#1042', service: 'Design de Logo Profissional', person: 'Maria Souza', status: 'progress', price: 'R$ 350', date: 'Hoje, 14:30' },
    { id: '#1041', service: 'Landing Page Responsiva', person: 'Carlos Lima', status: 'review', price: 'R$ 890', date: 'Ontem, 09:15' },
    { id: '#1039', service: 'Edicao de Video (60s)', person: 'Ana Torres', status: 'done', price: 'R$ 200', date: '07 Abr, 16:00' },
    { id: '#1037', service: 'Traducao EN-PT (5 paginas)', person: 'Pedro Nunes', status: 'done', price: 'R$ 120', date: '05 Abr, 11:20' },
  ];

  const activities = [
    { text: 'Novo pedido recebido', detail: '#1042 - Design de Logo', time: '2 min', color: 'blue' },
    { text: 'Avaliacao recebida', detail: '5 estrelas de Maria Souza', time: '1h', color: 'amber' },
    { text: 'Pagamento liberado', detail: 'R$ 200,00 - Edicao de Video', time: '3h', color: 'green' },
    { text: 'Nova mensagem', detail: 'Carlos Lima enviou um arquivo', time: '5h', color: 'purple' },
  ];

  const weeklyMissions = [
    {
      title: 'Responder rapido',
      description: 'Mantenha tempo medio de resposta abaixo de 1 hora em 5 conversas.',
      progress: 80,
      reward: '+120 XP',
      accent: 'blue',
    },
    {
      title: 'Entrega premium',
      description: 'Conclua 2 pedidos no prazo com nota 5.0.',
      progress: 50,
      reward: 'Badge Ouro',
      accent: 'amber',
    },
    {
      title: 'Portifolio vivo',
      description: 'Atualize 1 servico com capa nova e FAQ revisado.',
      progress: 100,
      reward: '+80 XP',
      accent: 'green',
    },
  ];

  const achievements = [
    { title: 'Sprint de 7 dias', description: 'Atividade continua durante a semana', icon: 'flame', tone: 'orange', unlocked: true },
    { title: 'Top resposta', description: 'Respostas em menos de 60 min', icon: 'bolt', tone: 'blue', unlocked: true },
    { title: 'Cinco estrelas', description: '10 avaliacoes maximas no mes', icon: 'star', tone: 'amber', unlocked: true },
    { title: 'Mentor da colmeia', description: 'Desbloqueia ao concluir 50 pedidos', icon: 'crown', tone: 'purple', unlocked: false },
  ];

  const insights = [
    { label: 'Taxa de conversao', value: '18%', detail: '+3.2% vs ultimos 30 dias' },
    { label: 'Ticket medio', value: 'R$ 412', detail: '+9% com pacote padrao' },
    { label: 'Perfil visto', value: '1.248', detail: '68 visitas vieram de busca interna' },
  ];

  const nextGoals = [
    { label: 'Proximo nivel', value: '280 XP restantes', color: 'purple' },
    { label: 'Meta de receita', value: 'R$ 1.760 para bater a meta', color: 'green' },
    { label: 'Badge de consistencia', value: '1 entrega 5 estrelas restante', color: 'blue' },
  ];

  const recommendations = [
    'Ative uma versao premium no servico de logo: usuarios com 3 pacotes convertem 23% melhor.',
    'Seu horario mais forte esta entre 10h e 13h. Vale deixar respostas rapidas e ofertas nesse periodo.',
    'Adicionar um estudo de caso ao servico mais vendido pode elevar a taxa de clique da vitrine.',
  ];

  const leaderboard = [
    { name: 'Ana Costa', points: '4.820 XP', position: 1 },
    { name: 'Voce', points: '4.240 XP', position: 2, highlight: true },
    { name: 'Lucas Mendes', points: '4.110 XP', position: 3 },
  ];

  const funnel = [
    { label: 'Leads quentes', value: '14', detail: '9 aguardando proposta', tone: 'blue' },
    { label: 'Propostas enviadas', value: '6', detail: '3 com alto potencial', tone: 'purple' },
    { label: 'Pedidos fechados', value: '4', detail: '2 upsells em aberto', tone: 'green' },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroBadge}>Temporada Hivelancers</div>
          <h1 className={styles.heroTitle}>Seu painel esta crescendo junto com sua reputacao.</h1>
          <p className={styles.heroText}>
            A ideia aqui e te ajudar a vender mais, responder melhor e manter ritmo. Cada entrega boa empurra sua visibilidade, seus desbloqueios e sua chance de recorrencia.
          </p>

          <div className={styles.heroHighlights}>
            <div className={styles.heroHighlight}>
              <span className={styles.heroHighlightLabel}>Sequencia ativa</span>
              <strong>9 dias seguidos</strong>
            </div>
            <div className={styles.heroHighlight}>
              <span className={styles.heroHighlightLabel}>Multiplicador</span>
              <strong>1.3x XP em entregas</strong>
            </div>
            <div className={styles.heroHighlight}>
              <span className={styles.heroHighlightLabel}>Ritmo do mes</span>
              <strong>92% da meta semanal</strong>
            </div>
          </div>
        </div>

        <div className={styles.heroSide}>
          <div className={styles.heroSideCard}>
            <span className={styles.heroSideLabel}>Proximo desbloqueio</span>
            <h2 className={styles.heroSideTitle}>Badge Colmeia Pro</h2>
            <p className={styles.heroSideText}>
              Conclua mais 2 pedidos com nota acima de 4.8 para ganhar prioridade extra na busca.
            </p>
            <div className={styles.heroTrack}>
              <div className={styles.heroTrackFill} style={{ width: '68%' }} />
            </div>
            <span className={styles.heroSideMeta}>68% concluido</span>
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`${styles.stat} ${styles[`stat_${stat.color}`]}`}
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <div className={styles.statHead}>
              <span className={styles.statLabel}>{stat.label}</span>
              {stat.change && (
                <span className={`${styles.statBadge} ${stat.positive ? styles.badgeUp : styles.badgeDown}`}>
                  {stat.change}
                </span>
              )}
            </div>
            <span className={styles.statVal}>{stat.value}</span>
            {stat.sub && <span className={styles.statSub}>{stat.sub}</span>}
          </div>
        ))}
      </section>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <section className={styles.card} style={{ animationDelay: '0.1s' }}>
            <SectionHeader
              title="Meus serviços"
              subtitle="Os serviços que você publicou na plataforma."
              actionLabel="Criar novo"
              actionTo="/services/new"
            />
            <MyServicesList services={myServices} loading={loadingServices} />
          </section>

          <section className={styles.card} style={{ animationDelay: '0.12s' }}>
            <SectionHeader
              title="Pedidos recentes"
              subtitle="Visao rapida do que precisa da sua atencao agora."
              actionLabel="Ver todos"
              actionTo="/orders"
            />
            <OrdersTable orders={orders} secondaryColumnLabel="Cliente" lastColumnLabel="Data" />
          </section>

          <div className={styles.doubleGrid}>
            <section className={styles.card} style={{ animationDelay: '0.18s' }}>
              <SectionHeader
                title="Missoes da semana"
                subtitle="Objetivos curtos para aumentar retencao e recorrencia."
                actionLabel="Ver temporada"
                actionTo="/rewards"
              />
              <MissionList missions={weeklyMissions} />
            </section>

            <section className={styles.card} style={{ animationDelay: '0.22s' }}>
              <SectionHeader
                title="Radar de crescimento"
                subtitle="Sinais que mostram onde sua conta pode escalar mais."
              />
              <InsightList insights={insights} />
              <RecommendationBox
                label="Sugestoes de melhoria"
                items={recommendations}
              />
            </section>
          </div>

          <div className={styles.doubleGrid}>
            <section className={styles.card} style={{ animationDelay: '0.26s' }}>
              <SectionHeader
                title="Funil de pedidos"
                subtitle="Do interesse inicial ate o fechamento do projeto."
              />
              <FunnelGrid items={funnel} />
            </section>

            <section className={styles.card} style={{ animationDelay: '0.3s' }}>
              <SectionHeader
                title="Conquistas desbloqueadas"
                subtitle="Elementos de reputacao que deixam a plataforma mais viva e recompensadora."
              />
              <AchievementGrid items={achievements} />
            </section>
          </div>
        </div>

        <div className={styles.aside}>
          <section className={`${styles.card} ${styles.cardAccent}`} style={{ animationDelay: '0.2s' }}>
            <SectionHeader
              title="Acoes rapidas"
              subtitle="Entradas curtas para manter seu ciclo de uso."
            />
            <QuickActions
              primary={{ label: 'Criar novo servico', to: '/services/new' }}
              secondary={[
                { label: 'Ver pedidos', to: '/orders' },
                { label: 'Editar perfil', to: '/profile' },
              ]}
            />
          </section>

          <section className={styles.card} style={{ animationDelay: '0.24s' }}>
            <SectionHeader
              title="Seu progresso"
              subtitle="XP, nivel e desbloqueios que ajudam a manter o usuario engajado."
              actionLabel="Ver tudo"
              actionTo="/rewards"
            />
            <ProgressCard
              title="Nivel 3 - Profissional"
              subtitle="720 / 1.000 XP"
              progressWidth="72%"
              goals={nextGoals}
            />
          </section>

          <section className={styles.card} style={{ animationDelay: '0.28s' }}>
            <SectionHeader
              title="Ranking da semana"
              subtitle="Uma camada social leve ajuda a manter o retorno do usuario."
            />
            <Leaderboard items={leaderboard} />
          </section>

          <section className={styles.card} style={{ animationDelay: '0.32s' }}>
            <SectionHeader
              title="Atividade recente"
              subtitle="O que mudou agora e o que pode gerar acao imediata."
            />
            <ActivityFeed items={activities} />
          </section>
        </div>
      </div>
    </div>
  );
}

function ClientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [favoriteServices, setFavoriteServices] = useState([]);
  const [favoriteFreelancers, setFavoriteFreelancers] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [marketCategories, setMarketCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getMyFavorites(),
      listOrders({ role: 'buyer', page: 1, pageSize: 12 }),
      listConversations(),
      listCategories(),
      listPublicServices({ page: 1, pageSize: 6, sort: 'newest' }),
    ])
      .then(([favoritesData, ordersData, conversationsData, categoriesData, servicesData]) => {
        if (cancelled) return;
        setFavoriteServices(favoritesData.services || []);
        setFavoriteFreelancers(favoritesData.freelancers || []);
        setBuyerOrders(ordersData.items || []);
        setConversations(conversationsData || []);
        setRecentItems(getRecentActivity(user?.id).slice(0, 4));
        setMarketCategories((categoriesData || []).slice(0, 8));
        setFeaturedServices(servicesData.items || []);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const summaryCards = useMemo(() => {
    const activeOrders = buyerOrders.filter((order) => ['PENDING', 'IN_PROGRESS', 'DELIVERED'].includes(order.status));
    const proposalsWaiting = buyerOrders.filter((order) => order.status === 'PENDING');
    const reviewsWaiting = buyerOrders.filter((order) => order.status === 'DELIVERED');
    const unreadConversations = conversations.filter((conversation) => Number(conversation.unreadCount || 0) > 0);

    return [
      {
        label: 'Pedidos em andamento',
        value: String(activeOrders.length),
        sub: reviewsWaiting.length ? `${reviewsWaiting.length} aguardando revisao` : 'Tudo sob controle',
        color: 'blue',
      },
      {
        label: 'Propostas aguardando resposta',
        value: String(proposalsWaiting.length),
        sub: proposalsWaiting.length ? 'Freelancers ainda precisam aceitar' : 'Nenhuma pendencia agora',
        color: 'amber',
      },
      {
        label: 'Freelancers favoritados',
        value: String(favoriteFreelancers.length),
        sub: favoriteServices.length ? `${favoriteServices.length} servicos salvos tambem` : 'Monte sua shortlist',
        color: 'purple',
      },
      {
        label: 'Conversas com resposta pendente',
        value: String(unreadConversations.length),
        sub: unreadConversations.length ? 'Vale retomar essas conversas' : 'Inbox em dia',
        color: 'green',
      },
    ];
  }, [buyerOrders, conversations, favoriteFreelancers.length, favoriteServices.length]);

  const shortlist = useMemo(
    () =>
      favoriteFreelancers.slice(0, 3).map((freelancer) => ({
        ...freelancer,
        featuredProject: getFeaturedProject(freelancer),
      })),
    [favoriteFreelancers]
  );

  const recentContinuations = useMemo(() => {
    if (recentItems.length > 0) return recentItems;

    const fallback = [];
    if (favoriteServices[0]) {
      fallback.push({
        type: 'service',
        id: favoriteServices[0].id,
        title: favoriteServices[0].title,
        subtitle: favoriteServices[0].owner ? getFullName(favoriteServices[0].owner) : 'Servico salvo',
        href: `/services/${favoriteServices[0].id}`,
      });
    }
    if (favoriteFreelancers[0]) {
      const handle = favoriteFreelancers[0].username || favoriteFreelancers[0].id;
      fallback.push({
        type: 'profile',
        id: favoriteFreelancers[0].id,
        title: getFullName(favoriteFreelancers[0]),
        subtitle: favoriteFreelancers[0].headline || 'Freelancer salvo',
        href: `/profile/${handle}`,
      });
    }
    if (conversations[0]) {
      const other =
        conversations[0].participants?.find((item) => item.id !== user?.id) || conversations[0].otherUser;
      fallback.push({
        type: 'conversation',
        id: conversations[0].id,
        title: getFullName(other),
        subtitle: 'Conversa recente',
        href: `/messages?chat=${conversations[0].id}`,
      });
    }
    return fallback.slice(0, 3);
  }, [recentItems, favoriteServices, favoriteFreelancers, conversations, user?.id]);

  const trackedOrders = useMemo(
    () => buyerOrders.filter((order) => ['PENDING', 'IN_PROGRESS', 'DELIVERED'].includes(order.status)).slice(0, 4),
    [buyerOrders]
  );

  const inboxHighlights = useMemo(
    () =>
      conversations
        .filter((conversation) => Number(conversation.unreadCount || 0) > 0)
        .slice(0, 4)
        .map((conversation) => {
          const other =
            conversation.participants?.find((item) => item.id !== user?.id) || conversation.otherUser;
          const preview = conversation.lastMessage?.deletedAt
            ? 'Mensagem apagada'
            : conversation.lastMessage?.content || 'Nova atualizacao na conversa';

          return {
            id: conversation.id,
            name: getFullName(other),
            handle: other?.username || other?.id,
            preview,
            unreadCount: Number(conversation.unreadCount || 0),
            time: formatRelativeTime(conversation.lastMessage?.createdAt || conversation.updatedAt),
          };
        }),
    [conversations, user?.id]
  );

  const reviewQueue = useMemo(
    () =>
      buyerOrders
        .filter((order) => order.status === 'DELIVERED')
        .slice(0, 3)
        .map((order) => ({
          id: order.id,
          title: order.service?.title || order.planTitle || 'Entrega pendente',
          freelancer: getFullName(order.freelancer),
          href: `/orders?id=${order.id}`,
        })),
    [buyerOrders]
  );

  const categoryChips = useMemo(
    () => marketCategories.filter((item) => item?.slug).slice(0, 8),
    [marketCategories]
  );

  return (
    <div className={styles.page}>
      <section className={styles.clientHero}>
        <div className={styles.clientHeroMain}>
          <div className={styles.heroBadge}>Painel do cliente</div>
          <h1 className={styles.heroTitle}>
            Organize sua shortlist, retome conversas e acompanhe cada contratacao sem perder contexto.
          </h1>
          <p className={styles.heroText}>
            Esse espaco agora prioriza decisao: o que esta em andamento, quem voce quer contratar e onde vale voltar agora.
          </p>

          <div className={styles.clientHeroActions}>
            <Link to="/explore" className={styles.heroPrimaryAction}>
              Explorar servicos
            </Link>
            <Link to="/favorites" className={styles.heroSecondaryAction}>
              Abrir favoritos
            </Link>
          </div>

          <div className={styles.clientSummaryRow}>
            {summaryCards.map((card) => (
              <div key={card.label} className={`${styles.clientSummaryCard} ${styles[`clientSummary_${card.color}`]}`}>
                <span>{card.label}</span>
                <strong>{loading ? '...' : card.value}</strong>
                <small>{card.sub}</small>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.clientHeroPanel}>
          <span className={styles.heroSideLabel}>Pronto para agir</span>
          <h2 className={styles.heroSideTitle}>
            {loading ? 'Carregando seu panorama...' : `${trackedOrders.length} fluxos exigem atencao agora`}
          </h2>
          <p className={styles.heroSideText}>
            {reviewQueue.length > 0
              ? `Voce tem ${reviewQueue.length} entrega${reviewQueue.length > 1 ? 's' : ''} esperando revisao.`
              : 'Seu backlog esta limpo. Vale usar o tempo para explorar novos talentos.'}
          </p>
          <div className={styles.heroTrack}>
            <div
              className={styles.heroTrackFill}
              style={{ width: `${Math.min(100, Math.max(18, trackedOrders.length * 22))}%` }}
            />
          </div>
          <span className={styles.heroSideMeta}>
            {loading ? 'Sincronizando dados...' : `${favoriteFreelancers.length} freelancers e ${favoriteServices.length} servicos salvos`}
          </span>
        </div>
      </section>

      <section className={styles.clientFeaturedSection}>
        <SectionHeader
          title="Servicos para contratar agora"
          subtitle="Uma vitrine viva para o cliente entrar e ja ter opcoes concretas de contratacao em maos."
          actionLabel="Ver catalogo completo"
          actionTo="/explore"
        />

        {categoryChips.length > 0 ? (
          <div className={styles.clientCategoryRow}>
            {categoryChips.map((category) => (
              <Link
                key={category.id}
                to={`/explore?category=${category.slug}`}
                className={styles.clientCategoryChip}
              >
                <CategoryIcon category={category} />
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className={styles.clientEmpty}>Carregando servicos da vitrine...</div>
        ) : featuredServices.length === 0 ? (
          <div className={styles.clientEmpty}>
            <p>Ainda nao ha servicos publicados suficientes para mostrar aqui.</p>
          </div>
        ) : (
          <div className={styles.clientFeaturedGrid}>
            {featuredServices.map((service, index) => {
              const price = service.plans?.[0]?.priceCents ?? service.minPriceCents ?? 0;
              const delivery = service.plans?.[0]?.deliveryDays;
              const seller = service.owner ? getFullName(service.owner) : 'Freelancer';
              return (
                <Link key={service.id} to={`/services/${service.id}`} className={styles.clientFeaturedCard}>
                  <div
                    className={styles.clientFeaturedVisual}
                    style={
                      service.coverUrl
                        ? { background: `url(${service.coverUrl}) center/cover` }
                        : { background: SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length] }
                    }
                  />
                  <div className={styles.clientFeaturedBody}>
                    <span className={styles.clientFeaturedSeller}>{seller}</span>
                    <h3>{service.title}</h3>
                    <div className={styles.clientFeaturedMeta}>
                      <span>{service.category?.name || 'Servico'}</span>
                      {delivery ? <span>{delivery} dias</span> : null}
                    </div>
                    <strong>{formatPriceBRL(price)}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className={styles.clientDashboardGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.card} style={{ animationDelay: '0.14s' }}>
            <SectionHeader
              title="Shortlist de freelancers"
              subtitle="Os perfis que voce salvou para comparar, revisar portfolio e retomar contato."
              actionLabel="Ver favoritos"
              actionTo="/favorites"
            />
            {loading ? (
              <div className={styles.clientEmpty}>Carregando shortlist...</div>
            ) : shortlist.length === 0 ? (
              <div className={styles.clientEmpty}>
                <p>Voce ainda nao salvou freelancers. Visite perfis publicos e monte sua shortlist.</p>
                <Link to="/explore" className={styles.actionPrimary}>Explorar servicos</Link>
              </div>
            ) : (
              <div className={styles.clientShortlistGrid}>
                {shortlist.map((freelancer, index) => {
                  const handle = freelancer.username || freelancer.id;
                  return (
                    <article key={freelancer.id} className={styles.shortlistCard}>
                      <Link to={`/profile/${handle}`} className={styles.shortlistTop}>
                        <div className={styles.shortlistAvatar}>
                          {freelancer.avatarUrl ? (
                            <img src={freelancer.avatarUrl} alt="" className={styles.shortlistAvatarImg} />
                          ) : (
                            getFullName(freelancer).slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className={styles.shortlistIdentity}>
                          <strong>{getFullName(freelancer)}</strong>
                          {freelancer.username ? <span>@{freelancer.username}</span> : null}
                          <p>{freelancer.headline || 'Perfil salvo para comparacao rapida.'}</p>
                        </div>
                      </Link>

                      {freelancer.featuredProject ? (
                        <Link to={`/profile/${handle}/projects/${freelancer.featuredProject.id}`} className={styles.shortlistProject}>
                          {freelancer.featuredProject.coverImageUrl ? (
                            <img
                              src={freelancer.featuredProject.coverImageUrl}
                              alt=""
                              className={styles.shortlistProjectImage}
                            />
                          ) : (
                            <div
                              className={styles.shortlistProjectFallback}
                              style={{ background: SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length] }}
                            />
                          )}
                          <div>
                            <span>Projeto em destaque</span>
                            <strong>{freelancer.featuredProject.title || 'Projeto sem titulo'}</strong>
                          </div>
                        </Link>
                      ) : null}

                      {freelancer.skills?.length > 0 ? (
                        <div className={styles.shortlistSkills}>
                          {freelancer.skills.slice(0, 4).map((skill) => (
                            <span key={skill} className={styles.shortlistSkillChip}>{skill}</span>
                          ))}
                        </div>
                      ) : null}

                      <div className={styles.shortlistActions}>
                        <Link to={`/profile/${handle}`} className={styles.actionSec}>Ver perfil</Link>
                        <Link to={`/messages`} className={styles.actionPrimary}>Abrir mensagens</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className={styles.card} style={{ animationDelay: '0.18s' }}>
            <SectionHeader
              title="Continue de onde parou"
              subtitle="Servicos, perfis, projetos e conversas recentes para retomar sem procurar tudo de novo."
            />
            {loading ? (
              <div className={styles.clientEmpty}>Carregando retomadas...</div>
            ) : recentContinuations.length === 0 ? (
              <div className={styles.clientEmpty}>
                <p>Assim que voce navegar por servicos, perfis e projetos, eles aparecem aqui.</p>
              </div>
            ) : (
              <div className={styles.resumeGrid}>
                {recentContinuations.map((item, index) => (
                  <Link key={`${item.type}_${item.id}`} to={item.href} className={styles.resumeCard}>
                    <div
                      className={styles.resumeAccent}
                      style={{ background: SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length] }}
                    />
                    <div className={styles.resumeBody}>
                      <span>{getRecentTypeLabel(item.type)}</span>
                      <strong>{item.title}</strong>
                      <p>{item.subtitle || 'Retome esse contexto.'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className={styles.doubleGrid}>
            <section className={styles.card} style={{ animationDelay: '0.22s' }}>
              <SectionHeader
                title="Status dos pedidos"
                subtitle="Linha do tempo dos contratos que ainda pedem acompanhamento seu."
                actionLabel="Ver todos"
                actionTo="/orders"
              />
              {loading ? (
                <div className={styles.clientEmpty}>Carregando pedidos...</div>
              ) : trackedOrders.length === 0 ? (
                <div className={styles.clientEmpty}>
                  <p>Voce ainda nao tem pedidos em aberto. Quando contratar, o acompanhamento aparece aqui.</p>
                </div>
              ) : (
                <div className={styles.clientOrderList}>
                  {trackedOrders.map((order) => (
                    <Link key={order.id} to={`/orders?id=${order.id}`} className={styles.clientOrderCard}>
                      <div className={styles.clientOrderHead}>
                        <div>
                          <strong>{order.service?.title || order.planTitle}</strong>
                          <span>{getFullName(order.freelancer)}</span>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[`status${order.status}`]}`}>
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                      </div>
                      <div className={styles.clientOrderMeta}>
                        <span>{formatPriceBRL(order.priceCents || 0)}</span>
                        <span>{formatRelativeTime(order.updatedAt)}</span>
                      </div>
                      <div className={styles.clientTimeline}>
                        {CLIENT_ORDER_STAGES.map((stage) => {
                          const state = getOrderStageState(order.status, stage.key);
                          return (
                            <div key={stage.key} className={styles.clientTimelineStep}>
                              <span className={`${styles.clientTimelineDot} ${styles[`timeline_${state}`]}`} />
                              <small>{stage.label}</small>
                            </div>
                          );
                        })}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.card} style={{ animationDelay: '0.26s' }}>
              <SectionHeader
                title="Fila de revisao"
                subtitle="Entregas recebidas que dependem da sua aprovacao ou de um pedido de revisao."
              />
              {loading ? (
                <div className={styles.clientEmpty}>Carregando revisoes...</div>
              ) : reviewQueue.length === 0 ? (
                <div className={styles.clientEmpty}>
                  <p>Nenhuma entrega aguardando sua aprovacao no momento.</p>
                </div>
              ) : (
                <div className={styles.reviewQueue}>
                  {reviewQueue.map((item) => (
                    <Link key={item.id} to={item.href} className={styles.reviewItem}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.freelancer}</p>
                      </div>
                      <span>Revisar</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <div className={styles.aside}>
          <section className={`${styles.card} ${styles.cardAccent}`} style={{ animationDelay: '0.18s' }}>
            <SectionHeader
              title="Atalhos de compra"
              subtitle="Entradas curtas para explorar, retomar conversa e revisar sua shortlist."
            />
            <QuickActions
              primary={{ label: 'Explorar servicos', to: '/explore' }}
              secondary={[
                { label: 'Ver favoritos', to: '/favorites' },
                { label: 'Abrir pedidos', to: '/orders' },
              ]}
            />
          </section>

          <section className={styles.card} style={{ animationDelay: '0.22s' }}>
            <SectionHeader
              title="Inbox que pede acao"
              subtitle="Conversas com mensagem nova ou que merecem retomada rapida."
            />
            {loading ? (
              <div className={styles.clientEmpty}>Carregando inbox...</div>
            ) : inboxHighlights.length === 0 ? (
              <div className={styles.clientEmpty}>
                <p>Nenhuma conversa com resposta pendente agora.</p>
              </div>
            ) : (
              <div className={styles.clientInboxList}>
                {inboxHighlights.map((item) => (
                  <Link key={item.id} to={`/messages?chat=${item.id}`} className={styles.clientInboxItem}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.preview}</p>
                    </div>
                    <div className={styles.clientInboxMeta}>
                      <span>{item.time}</span>
                      <b>{item.unreadCount}</b>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card} style={{ animationDelay: '0.26s' }}>
            <SectionHeader
              title="Servicos salvos"
              subtitle="Atalhos rapidos para ofertas que ainda estao no seu radar."
            />
            {loading ? (
              <div className={styles.clientEmpty}>Carregando servicos salvos...</div>
            ) : favoriteServices.length === 0 ? (
              <div className={styles.clientEmpty}>
                <p>Salve alguns servicos para comparar depois e voltar com mais velocidade.</p>
              </div>
            ) : (
              <div className={styles.savedServiceList}>
                {favoriteServices.slice(0, 4).map((service) => (
                  <Link key={service.id} to={`/services/${service.id}`} className={styles.savedServiceItem}>
                    <span className={styles.savedServiceCategory}>
                      <CategoryIcon category={service.category} />
                    </span>
                    <div>
                      <strong>{service.title}</strong>
                      <p>{service.owner ? getFullName(service.owner) : service.category?.name}</p>
                    </div>
                    <small>{formatPriceBRL(service.plans?.[0]?.priceCents || service.minPriceCents || 0)}</small>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card} style={{ animationDelay: '0.3s' }}>
            <SectionHeader
              title="Proximos passos sugeridos"
              subtitle="Pequenas acoes que mantem seu fluxo de contratacao andando."
            />
            <RecommendationBox
              label="Agora vale fazer isso"
              items={[
                reviewQueue.length > 0
                  ? 'Revisar entregas pendentes para nao travar o fluxo dos freelancers.'
                  : 'Explorar novos servicos para abastecer sua shortlist.',
                inboxHighlights.length > 0
                  ? 'Responder conversas recentes pode acelerar prazo e alinhamento.'
                  : 'Sua inbox esta em dia. Aproveite para comparar mais perfis.',
                shortlist.length > 0
                  ? 'Abra os projetos em destaque da sua shortlist e refine sua decisao.'
                  : 'Favorite freelancers promissores para montar comparacoes melhores.',
              ]}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, actionLabel, actionTo }) {
  return (
    <div className={styles.cardHead}>
      <div>
        <h2 className={styles.cardTitle}>{title}</h2>
        {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link to={actionTo} className={styles.cardAction}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function MyServicesList({ services, loading }) {
  if (loading) {
    return <div className={styles.myServicesEmpty}>Carregando...</div>;
  }
  if (services.length === 0) {
    return (
      <div className={styles.myServicesEmpty}>
        <p>Você ainda não publicou nenhum serviço.</p>
        <Link to="/services/new" className={styles.actionPrimary}>
          Criar meu primeiro serviço
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.myServicesGrid}>
      {services.map((service) => {
        const minPrice = service.plans?.[0]?.priceCents;
        return (
          <Link
            key={service.id}
            to={`/services/${service.id}`}
            className={styles.myServiceCard}
          >
            <div className={styles.myServiceHead}>
              <span className={styles.myServiceCat}>
                <CategoryIcon category={service.category} /> {service.category?.name}
              </span>
              <span
                className={`${styles.myServiceStatus} ${styles[`status_${service.status}`]}`}
              >
                {STATUS_LABEL[service.status] || service.status}
              </span>
            </div>
            <h3 className={styles.myServiceTitle}>{service.title}</h3>
            <div className={styles.myServiceMeta}>
              <span>{service.plans?.length || 0} plano(s)</span>
              {minPrice !== undefined && (
                <strong>a partir de {formatPriceBRL(minPrice)}</strong>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function OrdersTable({ orders, secondaryColumnLabel, lastColumnLabel }) {
  return (
    <div className={styles.table}>
      <div className={styles.tHead}>
        <span className={styles.tCol1}>Servico</span>
        <span className={styles.tCol2}>{secondaryColumnLabel}</span>
        <span className={styles.tCol3}>Status</span>
        <span className={styles.tCol4}>Valor</span>
        <span className={styles.tCol5}>{lastColumnLabel}</span>
      </div>

      {orders.map((order) => {
        const statusMap = {
          progress: { label: 'Em andamento', cls: 'sProgress' },
          review: { label: 'Em revisao', cls: 'sReview' },
          done: { label: 'Concluido', cls: 'sDone' },
          cancelled: { label: 'Cancelado', cls: 'sCancelled' },
        };
        const status = statusMap[order.status];

        return (
          <div key={order.id} className={styles.tRow}>
            <div className={styles.tCol1}>
              <span className={styles.oName}>{order.service}</span>
              <span className={styles.oId}>{order.id}</span>
            </div>
            <span className={styles.tCol2}>{order.person}</span>
            <span className={`${styles.sBadge} ${styles[status.cls]}`}>{status.label}</span>
            <span className={styles.tCol4}>{order.price}</span>
            <span className={styles.tCol5}>{order.date}</span>
          </div>
        );
      })}
    </div>
  );
}

function MissionList({ missions }) {
  return (
    <div className={styles.missionList}>
      {missions.map((mission) => (
        <div key={mission.title} className={styles.missionCard}>
          <div className={styles.missionTop}>
            <div>
              <h3>{mission.title}</h3>
              <p>{mission.description}</p>
            </div>
            <span className={`${styles.missionReward} ${styles[`reward_${mission.accent}`]}`}>
              {mission.reward}
            </span>
          </div>
          <div className={styles.missionTrack}>
            <div
              className={`${styles.missionFill} ${styles[`fill_${mission.accent}`]}`}
              style={{ width: `${mission.progress}%` }}
            />
          </div>
          <span className={styles.missionMeta}>{mission.progress}% concluido</span>
        </div>
      ))}
    </div>
  );
}

function InsightList({ insights }) {
  return (
    <div className={styles.insightList}>
      {insights.map((insight) => (
        <div key={insight.label} className={styles.insightItem}>
          <div>
            <span className={styles.insightLabel}>{insight.label}</span>
            <strong className={styles.insightValue}>{insight.value}</strong>
          </div>
          <span className={styles.insightDetail}>{insight.detail}</span>
        </div>
      ))}
    </div>
  );
}

function RecommendationBox({ label, items }) {
  return (
    <div className={styles.recommendationBox}>
      <span className={styles.recommendationLabel}>{label}</span>
      <div className={styles.recommendationList}>
        {items.map((item) => (
          <div key={item} className={styles.recommendationItem}>
            <span className={styles.recommendationDot} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelGrid({ items }) {
  return (
    <div className={styles.funnelGrid}>
      {items.map((item) => (
        <div key={item.label} className={`${styles.funnelCard} ${styles[`funnel_${item.tone}`]}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.detail}</small>
        </div>
      ))}
    </div>
  );
}

function AchievementGrid({ items }) {
  return (
    <div className={styles.achievementGrid}>
      {items.map((achievement) => (
        <div
          key={achievement.title}
          className={`${styles.achievementCard} ${!achievement.unlocked ? styles.achievementLocked : ''}`}
        >
          <div className={`${styles.achievementIcon} ${styles[`icon_${achievement.tone}`]}`}>
            {renderAchievementIcon(achievement.icon)}
          </div>
          <div>
            <h3>{achievement.title}</h3>
            <p>{achievement.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActions({ primary, secondary }) {
  return (
    <div className={styles.actions}>
      <Link to={primary.to} className={styles.actionPrimary}>
        {primary.label}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>

      {secondary.map((action) => (
        <Link key={action.label} to={action.to} className={styles.actionSec}>
          {action.label}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

function ProgressCard({ title, subtitle, progressWidth, goals }) {
  return (
    <>
      <div className={styles.level}>
        <div className={styles.levelIcon}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
        </div>
        <div className={styles.levelInfo}>
          <span className={styles.levelName}>{title}</span>
          <span className={styles.levelXp}>{subtitle}</span>
        </div>
      </div>

      <div className={styles.xpTrack}>
        <div className={styles.xpFill} style={{ width: progressWidth }} />
      </div>

      <div className={styles.goalList}>
        {goals.map((goal) => (
          <div key={goal.label} className={styles.goalItem}>
            <span className={styles.goalLabel}>{goal.label}</span>
            <strong className={`${styles.goalValue} ${styles[`goal_${goal.color}`]}`}>{goal.value}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

function Leaderboard({ items }) {
  return (
    <div className={styles.leaderboard}>
      {items.map((person) => (
        <div
          key={person.name}
          className={`${styles.leaderItem} ${person.highlight ? styles.leaderHighlight : ''}`}
        >
          <div className={styles.leaderPosition}>{person.position}</div>
          <div className={styles.leaderInfo}>
            <strong>{person.name}</strong>
            <span>{person.points}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed({ items }) {
  return (
    <div className={styles.feed}>
      {items.map((activity) => (
        <div key={`${activity.text}-${activity.time}`} className={styles.feedItem}>
          <div className={`${styles.feedDot} ${styles[`dot_${activity.color}`]}`} />
          <div className={styles.feedBody}>
            <span className={styles.feedText}>{activity.text}</span>
            <span className={styles.feedDetail}>{activity.detail}</span>
          </div>
          <span className={styles.feedTime}>{activity.time}</span>
        </div>
      ))}
    </div>
  );
}

function renderAchievementIcon(icon) {
  if (icon === 'flame') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A4.5 4.5 0 0013 19a4.5 4.5 0 004.5-4.5c0-4-4.5-6-4-12-2 2-5 5-5 8a3 3 0 00-3 3c0 1.7 1.3 3 3 3z" />
      </svg>
    );
  }

  if (icon === 'bolt') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }

  if (icon === 'star') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7l5 4 5-7 5 7 5-4-2 13H4L2 7z" />
    </svg>
  );
}

export default Dashboard;

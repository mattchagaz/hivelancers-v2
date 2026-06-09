import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaArrowRight,
  FaBriefcase,
  FaCartShopping,
  FaCircleCheck,
  FaComments,
  FaFolderOpen,
  FaHeart,
  FaInbox,
  FaLayerGroup,
  FaMessage,
  FaMoneyBillTransfer,
  FaPenToSquare,
  FaRocket,
  FaShop,
  FaUserCheck,
} from 'react-icons/fa6';
import { SERVICE_GRADIENTS } from '../../../data/services';
import { useAuth } from '../../../contexts/AuthContext';
import { listCategories, listMyServices, listPublicServices } from '../../../services/services';
import { listOrders } from '../../../services/orders';
import { listConversations } from '../../../services/messages';
import { getMyFavorites } from '../../../services/users';
import { CategoryIcon } from '../../../utils/categoryIcons';
import { getFeaturedProject } from '../../../utils/profileEnhancements';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './Dashboard.module.css';

const SERVICE_STATUS_LABEL = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

const ORDER_STATUS_LABEL = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em execução',
  DELIVERED: 'Entregue',
  COMPLETED: 'Concluído',
  REJECTED: 'Recusado',
  CANCELED: 'Cancelado',
};

const ORDER_STAGES = [
  { key: 'PENDING', label: 'Entrada' },
  { key: 'IN_PROGRESS', label: 'Execução' },
  { key: 'DELIVERED', label: 'Entrega' },
  { key: 'COMPLETED', label: 'Aprovação' },
];

const ACTIVE_ORDER_STATUSES = ['PENDING', 'IN_PROGRESS', 'DELIVERED'];

const formatPriceBRL = (cents = 0) =>
  (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatRelativeTime = (value) => {
  if (!value) return 'Sem atualização';
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
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.username || 'Usuário';

const getInitials = (person) =>
  getFullName(person)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();

const getOrderTitle = (order) => order.service?.title || order.planTitle || 'Pedido sem título';

const getOrderPerson = (order, mode) =>
  mode === 'seller' ? getFullName(order.client) : getFullName(order.freelancer);

const getConversationPeer = (conversation, userId) => {
  if (conversation.otherUser) return conversation.otherUser;
  const participants = conversation.participants?.map((item) => item.user || item) || [];
  return participants.find((item) => item.id !== userId);
};

const getStageState = (orderStatus, stageKey) => {
  if (orderStatus === 'REJECTED' || orderStatus === 'CANCELED') {
    return stageKey === 'PENDING' ? 'done' : 'idle';
  }

  const currentIndex = ORDER_STAGES.findIndex((stage) => stage.key === orderStatus);
  const stageIndex = ORDER_STAGES.findIndex((stage) => stage.key === stageKey);

  if (currentIndex === -1) return 'idle';
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'current';
  return 'idle';
};

function Dashboard() {
  const { user } = useAuth();
  const isClient = user?.userType === 'CLIENT';

  return isClient ? <ClientDashboard /> : <FreelancerDashboard />;
}

function FreelancerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myServices, setMyServices] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listMyServices(),
      listOrders({ role: 'seller', page: 1, pageSize: 10 }),
      listConversations(),
    ])
      .then(([servicesData, ordersData, conversationsData]) => {
        if (cancelled) return;
        setMyServices(servicesData || []);
        setSellerOrders(ordersData.items || []);
        setConversations(conversationsData || []);
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
  }, []);

  const activeOrders = useMemo(
    () => sellerOrders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)),
    [sellerOrders]
  );

  const pendingOrders = useMemo(
    () => sellerOrders.filter((order) => order.status === 'PENDING'),
    [sellerOrders]
  );

  const reviewOrders = useMemo(
    () => sellerOrders.filter((order) => order.status === 'DELIVERED'),
    [sellerOrders]
  );

  const completedTotal = useMemo(
    () =>
      sellerOrders
        .filter((order) => order.status === 'COMPLETED')
        .reduce((sum, order) => sum + Number(order.priceCents || 0), 0),
    [sellerOrders]
  );

  const unreadConversations = useMemo(
    () => conversations.filter((conversation) => Number(conversation.unreadCount || 0) > 0),
    [conversations]
  );

  const publishedServices = useMemo(
    () => myServices.filter((service) => service.status === 'PUBLISHED'),
    [myServices]
  );

  const metrics = [
    {
      label: 'Pedidos ativos',
      value: loading ? '...' : activeOrders.length,
      detail: pendingOrders.length ? `${pendingOrders.length} aguardando aceite` : 'Nenhum pedido novo',
      icon: <FaBriefcase />,
      tone: 'blue',
    },
    {
      label: 'Entregas em revisão',
      value: loading ? '...' : reviewOrders.length,
      detail: reviewOrders.length ? 'Acompanhe aprovação do cliente' : 'Fila limpa agora',
      icon: <FaUserCheck />,
      tone: 'green',
    },
    {
      label: 'Serviços publicados',
      value: loading ? '...' : publishedServices.length,
      detail: `${myServices.length} serviços no total`,
      icon: <FaShop />,
      tone: 'purple',
    },
    {
      label: 'Receita concluída',
      value: loading ? '...' : formatPriceBRL(completedTotal),
      detail: 'Pedidos concluídos nesta lista',
      icon: <FaMoneyBillTransfer />,
      tone: 'orange',
    },
  ];

  const priorityOrders = [...pendingOrders, ...activeOrders.filter((order) => order.status !== 'PENDING')].slice(0, 5);
  const servicesPreview = myServices.slice(0, 4);
  const recentConversations = conversations.slice(0, 4);

  const priorities = [
    pendingOrders.length
      ? `${pendingOrders.length} pedido${pendingOrders.length > 1 ? 's' : ''} aguardando aceite.`
      : 'Nenhum pedido pendente de aceite.',
    reviewOrders.length
      ? `${reviewOrders.length} entrega${reviewOrders.length > 1 ? 's' : ''} aguardando aprovação do cliente.`
      : 'Sem entregas travadas em aprovação.',
    unreadConversations.length
      ? `${unreadConversations.length} conversa${unreadConversations.length > 1 ? 's' : ''} com mensagem nova.`
      : 'Inbox sem pendências críticas.',
  ];

  return (
    <div className={styles.page}>
      <DashboardHero
        eyebrow="Painel do freelancer"
        title={`Bom te ver, ${user?.firstName || 'freelancer'}`}
        description="Controle sua operação diária: pedidos que precisam de resposta, serviços publicados, conversas recentes e próximos passos comerciais."
        primaryAction={{ label: 'Criar serviço', to: '/services/new', icon: <FaPenToSquare /> }}
        secondaryAction={{ label: 'Ver pedidos', to: '/orders', icon: <FaBriefcase /> }}
        panel={{
          label: 'Fila de atenção',
          value: loading ? '...' : pendingOrders.length + reviewOrders.length + unreadConversations.length,
          detail: 'Itens que pedem ação hoje',
          actionLabel: 'Abrir pedidos',
          actionTo: '/orders',
        }}
      />

      <StatGrid items={metrics} />

      <div className={styles.workspaceGrid}>
        <main className={styles.mainStack}>
          <Panel
            kicker="Operação"
            title="Fila de pedidos"
            description="Pedidos recentes organizados pelo que mais precisa de atenção."
            actionLabel="Ver todos"
            actionTo="/orders"
          >
            {loading ? (
              <LoadingRows />
            ) : priorityOrders.length ? (
              <OrderStack orders={priorityOrders} mode="seller" />
            ) : (
              <EmptyBlock
                icon={<FaInbox />}
                title="Nenhum pedido ativo por enquanto"
                description="Quando um cliente contratar seus serviços, a fila operacional aparece aqui."
                actionLabel="Revisar serviços"
                actionTo="/services"
              />
            )}
          </Panel>

          <div className={styles.twoColumn}>
            <Panel
              kicker="Catálogo"
              title="Meus serviços"
              description="Resumo rápido dos serviços que estão prontos para vender."
              actionLabel="Novo serviço"
              actionTo="/services/new"
            >
              {loading ? (
                <LoadingRows count={3} />
              ) : servicesPreview.length ? (
                <ServiceStack services={servicesPreview} editable />
              ) : (
                <EmptyBlock
                  icon={<FaFolderOpen />}
                  title="Publique seu primeiro serviço"
                  description="Serviços bem estruturados deixam sua oferta mais fácil de contratar."
                  actionLabel="Criar serviço"
                  actionTo="/services/new"
                />
              )}
            </Panel>

            <Panel
              kicker="Relacionamento"
              title="Conversas recentes"
              description="Últimos alinhamentos com clientes e oportunidades abertas."
              actionLabel="Abrir chat"
              actionTo="/messages"
            >
              {loading ? (
                <LoadingRows count={3} />
              ) : recentConversations.length ? (
                <ConversationStack conversations={recentConversations} userId={user?.id} />
              ) : (
                <EmptyBlock
                  icon={<FaComments />}
                  title="Nenhuma conversa ativa"
                  description="Suas negociações e alinhamentos aparecem aqui quando clientes entrarem em contato."
                />
              )}
            </Panel>
          </div>
        </main>

        <aside className={styles.asideStack}>
          <Panel kicker="Atalhos" title="Ações rápidas">
            <QuickActions
              actions={[
                { label: 'Criar serviço', to: '/services/new', icon: <FaPenToSquare />, primary: true },
                { label: 'Personalizar perfil', to: '/profile/customize', icon: <FaUserCheck /> },
                { label: 'Abrir financeiro', to: '/finances', icon: <FaMoneyBillTransfer /> },
              ]}
            />
          </Panel>

          <Panel kicker="Sinais" title="Saúde da conta">
            <SignalList
              items={[
                { label: 'Serviços publicados', value: loading ? '...' : publishedServices.length, tone: 'success' },
                { label: 'Pedidos em aberto', value: loading ? '...' : activeOrders.length, tone: activeOrders.length ? 'warning' : 'neutral' },
                { label: 'Mensagens novas', value: loading ? '...' : unreadConversations.length, tone: unreadConversations.length ? 'warning' : 'success' },
              ]}
            />
          </Panel>

          <Panel kicker="Prioridades" title="Próximos passos">
            <PriorityList items={priorities} />
          </Panel>
        </aside>
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
  const [marketCategories, setMarketCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getMyFavorites(),
      listOrders({ role: 'buyer', page: 1, pageSize: 10 }),
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
  }, []);

  const activeOrders = useMemo(
    () => buyerOrders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)),
    [buyerOrders]
  );

  const reviewQueue = useMemo(
    () => buyerOrders.filter((order) => order.status === 'DELIVERED'),
    [buyerOrders]
  );

  const unreadConversations = useMemo(
    () => conversations.filter((conversation) => Number(conversation.unreadCount || 0) > 0),
    [conversations]
  );

  const shortlist = useMemo(
    () =>
      favoriteFreelancers.slice(0, 3).map((freelancer) => ({
        ...freelancer,
        featuredProject: getFeaturedProject(freelancer),
      })),
    [favoriteFreelancers]
  );

  const metrics = [
    {
      label: 'Pedidos ativos',
      value: loading ? '...' : activeOrders.length,
      detail: reviewQueue.length ? `${reviewQueue.length} entrega para revisar` : 'Contratações sob controle',
      icon: <FaCartShopping />,
      tone: 'blue',
    },
    {
      label: 'Favoritos salvos',
      value: loading ? '...' : favoriteServices.length + favoriteFreelancers.length,
      detail: `${favoriteFreelancers.length} freelancers na shortlist`,
      icon: <FaHeart />,
      tone: 'purple',
    },
    {
      label: 'Conversas novas',
      value: loading ? '...' : unreadConversations.length,
      detail: unreadConversations.length ? 'Respostas aguardando você' : 'Inbox em dia',
      icon: <FaMessage />,
      tone: 'green',
    },
    {
      label: 'Categorias abertas',
      value: loading ? '...' : marketCategories.length,
      detail: 'Áreas disponíveis para explorar',
      icon: <FaLayerGroup />,
      tone: 'orange',
    },
  ];

  const orderPreview = activeOrders.slice(0, 5);
  const conversationPreview = conversations.slice(0, 4);
  const savedServices = favoriteServices.slice(0, 4);

  const priorities = [
    reviewQueue.length
      ? `${reviewQueue.length} entrega${reviewQueue.length > 1 ? 's' : ''} esperando revisão.`
      : 'Nenhuma entrega pendente de aprovação.',
    unreadConversations.length
      ? `${unreadConversations.length} conversa${unreadConversations.length > 1 ? 's' : ''} com mensagem nova.`
      : 'Conversas sem pendência agora.',
    shortlist.length
      ? 'Compare os freelancers salvos antes da próxima contratação.'
      : 'Monte uma shortlist com freelancers favoritos.',
  ];

  return (
    <div className={styles.page}>
      <DashboardHero
        eyebrow="Painel do cliente"
        title={`Organize suas contratações, ${user?.firstName || 'cliente'}`}
        description="Veja pedidos em andamento, entregas esperando revisão, conversas abertas e atalhos para encontrar novos serviços."
        primaryAction={{ label: 'Explorar serviços', to: '/explore', icon: <FaRocket /> }}
        secondaryAction={{ label: 'Abrir favoritos', to: '/favorites', icon: <FaHeart /> }}
        panel={{
          label: 'Pronto para decidir',
          value: loading ? '...' : reviewQueue.length + unreadConversations.length,
          detail: 'Itens que pedem sua atenção',
          actionLabel: 'Abrir pedidos',
          actionTo: '/orders',
        }}
      />

      <StatGrid items={metrics} />

      <Panel
        kicker="Marketplace"
        title="Serviços para contratar agora"
        description="Opções recentes e categorias para começar uma busca sem perder tempo."
        actionLabel="Ver catálogo"
        actionTo="/explore"
      >
        {marketCategories.length ? <CategoryStrip categories={marketCategories} /> : null}
        {loading ? (
          <LoadingRows count={4} />
        ) : featuredServices.length ? (
          <ServiceShowcase services={featuredServices} />
        ) : (
          <EmptyBlock
            icon={<FaShop />}
            title="Sem serviços publicados no momento"
            description="Quando freelancers publicarem novas ofertas, elas aparecem nessa vitrine."
          />
        )}
      </Panel>

      <div className={styles.workspaceGrid}>
        <main className={styles.mainStack}>
          <Panel
            kicker="Contratações"
            title="Acompanhamento de pedidos"
            description="Pedidos em aberto com status, valor e linha do tempo de execução."
            actionLabel="Ver todos"
            actionTo="/orders"
          >
            {loading ? (
              <LoadingRows />
            ) : orderPreview.length ? (
              <OrderStack orders={orderPreview} mode="buyer" />
            ) : (
              <EmptyBlock
                icon={<FaCartShopping />}
                title="Nenhum pedido em andamento"
                description="Ao contratar um serviço, o acompanhamento completo aparece aqui."
                actionLabel="Explorar serviços"
                actionTo="/explore"
              />
            )}
          </Panel>

          <div className={styles.twoColumn}>
            <Panel
              kicker="Shortlist"
              title="Freelancers favoritos"
              description="Perfis salvos para comparar e chamar quando surgir o próximo projeto."
              actionLabel="Ver favoritos"
              actionTo="/favorites"
            >
              {loading ? (
                <LoadingRows count={3} />
              ) : shortlist.length ? (
                <FreelancerShortlist freelancers={shortlist} />
              ) : (
                <EmptyBlock
                  icon={<FaUserCheck />}
                  title="Sua shortlist ainda está vazia"
                  description="Favorite freelancers promissores para voltar neles sem procurar de novo."
                  actionLabel="Explorar serviços"
                  actionTo="/explore"
                />
              )}
            </Panel>

            <Panel
              kicker="Salvos"
              title="Serviços favoritados"
              description="Ofertas que ainda estão no radar para contratação."
              actionLabel="Abrir favoritos"
              actionTo="/favorites"
            >
              {loading ? (
                <LoadingRows count={3} />
              ) : savedServices.length ? (
                <SavedServices services={savedServices} />
              ) : (
                <EmptyBlock
                  icon={<FaHeart />}
                  title="Nenhum serviço salvo"
                  description="Salve serviços para comparar preço, prazo e escopo depois."
                />
              )}
            </Panel>
          </div>
        </main>

        <aside className={styles.asideStack}>
          <Panel kicker="Atalhos" title="Ações rápidas">
            <QuickActions
              actions={[
                { label: 'Explorar serviços', to: '/explore', icon: <FaRocket />, primary: true },
                { label: 'Abrir mensagens', to: '/messages', icon: <FaComments /> },
                { label: 'Ver pedidos', to: '/orders', icon: <FaBriefcase /> },
              ]}
            />
          </Panel>

          <Panel kicker="Inbox" title="Conversas recentes">
            {loading ? (
              <LoadingRows count={3} />
            ) : conversationPreview.length ? (
              <ConversationStack conversations={conversationPreview} userId={user?.id} />
            ) : (
              <EmptyBlock
                icon={<FaComments />}
                title="Nenhuma conversa ainda"
                description="Quando você falar com freelancers, os últimos contatos aparecem aqui."
              />
            )}
          </Panel>

          <Panel kicker="Prioridades" title="Próximos passos">
            <PriorityList items={priorities} />
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function DashboardHero({ eyebrow, title, description, primaryAction, secondaryAction, panel }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>

        <div className={styles.heroActions}>
          <IconLink action={primaryAction} variant="primary" />
          <IconLink action={secondaryAction} variant="secondary" />
        </div>
      </div>

      <div className={styles.commandCard}>
        <span>{panel.label}</span>
        <strong>{panel.value}</strong>
        <p>{panel.detail}</p>
        <Link to={panel.actionTo}>
          {panel.actionLabel}
          <FaArrowRight />
        </Link>
      </div>
    </section>
  );
}

function StatGrid({ items }) {
  return (
    <section className={styles.statGrid}>
      {items.map((item) => (
        <SpotlightCard key={item.label} className={`${styles.statCard} ${styles[item.tone]}`}>
          <div className={styles.statIcon}>{item.icon}</div>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.detail}</p>
        </SpotlightCard>
      ))}
    </section>
  );
}

function Panel({ kicker, title, description, actionLabel, actionTo, children }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          {kicker ? <span className={styles.sectionKicker}>{kicker}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actionLabel && actionTo ? (
          <Link to={actionTo} className={styles.panelAction}>
            {actionLabel}
            <FaArrowRight />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function IconLink({ action, variant }) {
  if (!action) return null;
  return (
    <Link to={action.to} className={`${styles.heroAction} ${styles[variant]}`}>
      {action.icon}
      {action.label}
    </Link>
  );
}

function QuickActions({ actions }) {
  return (
    <div className={styles.quickActions}>
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className={`${styles.quickAction} ${action.primary ? styles.quickActionPrimary : ''}`}
        >
          <span>{action.icon}</span>
          <strong>{action.label}</strong>
          <FaArrowRight />
        </Link>
      ))}
    </div>
  );
}

function OrderStack({ orders, mode }) {
  return (
    <div className={styles.orderStack}>
      {orders.map((order) => (
        <Link key={order.id} to={`/orders?id=${order.id}`} className={styles.orderCard}>
          <div className={styles.orderTop}>
            <div className={styles.orderTitleBlock}>
              <strong>{getOrderTitle(order)}</strong>
              <span>{mode === 'seller' ? 'Cliente' : 'Freelancer'}: {getOrderPerson(order, mode)}</span>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className={styles.orderMeta}>
            <span>{formatPriceBRL(order.priceCents)}</span>
            <span>{formatRelativeTime(order.updatedAt)}</span>
            <span>{order.deliveryDays || 1} dia{Number(order.deliveryDays || 1) > 1 ? 's' : ''}</span>
          </div>

          <div className={styles.timeline}>
            {ORDER_STAGES.map((stage) => {
              const state = getStageState(order.status, stage.key);
              return (
                <div key={stage.key} className={styles.timelineStep}>
                  <span className={`${styles.timelineBar} ${styles[`timeline_${state}`]}`} />
                  <small>{stage.label}</small>
                </div>
              );
            })}
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status_${status}`] || ''}`}>
      {ORDER_STATUS_LABEL[status] || status}
    </span>
  );
}

function ServiceStack({ services, editable = false }) {
  return (
    <div className={styles.serviceStack}>
      {services.map((service) => {
        const price = service.plans?.[0]?.priceCents ?? service.minPriceCents ?? 0;
        const href = editable ? `/services/${service.id}/edit` : `/services/${service.id}`;
        return (
          <Link key={service.id} to={href} className={styles.serviceRow}>
            <div className={styles.serviceIcon}>
              <CategoryIcon category={service.category} />
            </div>
            <div>
              <strong>{service.title}</strong>
              <p>{service.category?.name || 'Serviço'} • {service.plans?.length || 0} plano(s)</p>
            </div>
            <div className={styles.serviceRowMeta}>
              <span className={`${styles.serviceStatus} ${styles[`service_${service.status}`]}`}>
                {SERVICE_STATUS_LABEL[service.status] || service.status}
              </span>
              <small>{formatPriceBRL(price)}</small>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ConversationStack({ conversations, userId }) {
  return (
    <div className={styles.conversationStack}>
      {conversations.map((conversation) => {
        const peer = getConversationPeer(conversation, userId);
        const preview = conversation.lastMessage?.content || 'Conversa iniciada';
        return (
          <Link key={conversation.id} to={`/messages?chat=${conversation.id}`} className={styles.conversationRow}>
            <div className={styles.avatar}>
              {peer?.avatarUrl ? <img src={peer.avatarUrl} alt="" /> : getInitials(peer)}
            </div>
            <div>
              <strong>{getFullName(peer)}</strong>
              <p>{preview}</p>
            </div>
            <div className={styles.conversationMeta}>
              <span>{formatRelativeTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</span>
              {Number(conversation.unreadCount || 0) ? <b>{conversation.unreadCount}</b> : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ServiceShowcase({ services }) {
  return (
    <div className={styles.showcaseGrid}>
      {services.map((service, index) => {
        const price = service.plans?.[0]?.priceCents ?? service.minPriceCents ?? 0;
        const seller = service.owner ? getFullName(service.owner) : 'Freelancer';
        return (
          <Link key={service.id} to={`/services/${service.id}`} className={styles.showcaseCard}>
            <div
              className={styles.showcaseVisual}
              style={
                service.coverUrl
                  ? { background: `url(${service.coverUrl}) center/cover` }
                  : { background: SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length] }
              }
            />
            <div className={styles.showcaseBody}>
              <span>{seller}</span>
              <strong>{service.title}</strong>
              <p>{service.category?.name || 'Serviço'} • a partir de {formatPriceBRL(price)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CategoryStrip({ categories }) {
  return (
    <div className={styles.categoryStrip}>
      {categories.map((category) => (
        <Link key={category.id} to={`/explore?category=${category.slug}`} className={styles.categoryChip}>
          <CategoryIcon category={category} />
          <span>{category.name}</span>
        </Link>
      ))}
    </div>
  );
}

function FreelancerShortlist({ freelancers }) {
  return (
    <div className={styles.shortlistStack}>
      {freelancers.map((freelancer) => {
        const handle = freelancer.username || freelancer.id;
        return (
          <Link key={freelancer.id} to={`/profile/${handle}`} className={styles.freelancerRow}>
            <div className={styles.avatar}>
              {freelancer.avatarUrl ? <img src={freelancer.avatarUrl} alt="" /> : getInitials(freelancer)}
            </div>
            <div>
              <strong>{getFullName(freelancer)}</strong>
              <p>{freelancer.featuredProject?.title || freelancer.headline || 'Perfil salvo para comparar'}</p>
            </div>
            <FaArrowRight />
          </Link>
        );
      })}
    </div>
  );
}

function SavedServices({ services }) {
  return (
    <div className={styles.savedStack}>
      {services.map((service) => {
        const price = service.plans?.[0]?.priceCents ?? service.minPriceCents ?? 0;
        return (
          <Link key={service.id} to={`/services/${service.id}`} className={styles.savedRow}>
            <div className={styles.serviceIcon}>
              <CategoryIcon category={service.category} />
            </div>
            <div>
              <strong>{service.title}</strong>
              <p>{service.owner ? getFullName(service.owner) : service.category?.name || 'Serviço salvo'}</p>
            </div>
            <small>{formatPriceBRL(price)}</small>
          </Link>
        );
      })}
    </div>
  );
}

function SignalList({ items }) {
  return (
    <div className={styles.signalList}>
      {items.map((item) => (
        <div key={item.label} className={styles.signalItem}>
          <span>{item.label}</span>
          <strong className={styles[`signal_${item.tone}`]}>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function PriorityList({ items }) {
  return (
    <div className={styles.priorityList}>
      {items.map((item) => (
        <div key={item} className={styles.priorityItem}>
          <FaCircleCheck />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyBlock({ icon, title, description, actionLabel, actionTo }) {
  return (
    <div className={styles.emptyBlock}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className={styles.emptyAction}>
          {actionLabel}
          <FaArrowRight />
        </Link>
      ) : null}
    </div>
  );
}

function LoadingRows({ count = 4 }) {
  return (
    <div className={styles.loadingRows}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.loadingRow}>
          <span />
          <div>
            <b />
            <small />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;

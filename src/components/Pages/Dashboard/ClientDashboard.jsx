import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FaBriefcase, FaCartShopping, FaComments, FaHeart, FaLayerGroup, FaMessage, FaRocket, FaShop, FaUserCheck } from 'react-icons/fa6';
import { useAuth } from '../../../contexts/authContextStore';
import { listCategories, listPublicServices } from '../../../services/services';
import { listOrders } from '../../../services/orders';
import { listConversations } from '../../../services/messages';
import { getMyFavorites } from '../../../services/users';
import { getFeaturedProject } from '../../../utils/profileEnhancements';
import styles from './Dashboard.module.css';
import { ACTIVE_ORDER_STATUSES } from './Dashboard.helpers';
import { CategoryStrip, ConversationStack, DashboardHero, EmptyBlock, FreelancerShortlist, LoadingRows, OrderStack, Panel, PriorityList, QuickActions, SavedServices, ServiceShowcase, StatGrid } from './Dashboard.ui';

export default function ClientDashboard() {
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
      listPublicServices({ page: 1, pageSize: 9, sort: 'newest' }),
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

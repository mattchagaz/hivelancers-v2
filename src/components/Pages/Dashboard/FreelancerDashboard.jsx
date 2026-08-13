import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FaBriefcase, FaComments, FaFolderOpen, FaInbox, FaMoneyBillTransfer, FaPenToSquare, FaShop, FaUserCheck } from 'react-icons/fa6';
import { useAuth } from '../../../contexts/authContextStore';
import { listMyServices } from '../../../services/services';
import { listOrders } from '../../../services/orders';
import { listConversations } from '../../../services/messages';
import styles from './Dashboard.module.css';
import { ACTIVE_ORDER_STATUSES, formatPriceBRL, getFullName, getOrderTitle } from './Dashboard.helpers';
import { ConversationStack, DashboardHero, EmptyBlock, LoadingRows, MobileAlertCard, MobileGreeting, MobileServiceList, MobileStatRow, OrderStack, Panel, PriorityList, QuickActions, RoleModeToggle, ServiceStack, SignalList, StatGrid } from './Dashboard.ui';

export default function FreelancerDashboard() {
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

  const receivableTotal = useMemo(
    () => activeOrders.reduce((sum, order) => sum + Number(order.priceCents || 0), 0),
    [activeOrders]
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
      <div className={styles.mobileHome}>
        <MobileGreeting name={user?.firstName || 'freelancer'} />
        <RoleModeToggle userRole="freelancer" />

        <MobileStatRow
          items={[
            { label: 'A receber', value: loading ? '...' : formatPriceBRL(receivableTotal), detail: `${activeOrders.length} pedido${activeOrders.length !== 1 ? 's' : ''} ativo${activeOrders.length !== 1 ? 's' : ''}` },
            { label: 'Em revisão', value: loading ? '...' : reviewOrders.length, detail: reviewOrders.length ? 'aguardando aprovação' : 'fila limpa' },
          ]}
        />

        {!loading && pendingOrders.length ? (
          <MobileAlertCard
            eyebrow="Novo pedido"
            title={`${getFullName(pendingOrders[0].client)} fez um pedido: ${getOrderTitle(pendingOrders[0])}`}
            actionLabel="Responder"
            actionTo={`/orders?id=${pendingOrders[0].id}`}
          />
        ) : null}

        <Panel title="Seus serviços publicados" actionLabel="Ver tudo" actionTo="/services">
          {loading ? (
            <LoadingRows count={3} />
          ) : myServices.length ? (
            <MobileServiceList services={myServices.slice(0, 5)} editable />
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
      </div>

      <div className={styles.desktopHome}>
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
    </div>
  );
}

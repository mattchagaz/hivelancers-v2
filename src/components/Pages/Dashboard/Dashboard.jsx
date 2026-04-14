import { Link } from 'react-router-dom';
import { CATEGORIES, SERVICE_GRADIENTS, SERVICES } from '../../../data/services';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Dashboard.module.css';

function Dashboard() {
  const { user } = useAuth();
  const isFreelancer = user?.userType !== 'CLIENT';

  return isFreelancer ? <FreelancerDashboard /> : <ClientDashboard />;
}

function FreelancerDashboard() {
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
  const spotlightService = SERVICES[1];
  const featuredServices = [...SERVICES]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 4);
  const popularServices = [...SERVICES].sort((a, b) => b.reviews - a.reviews).slice(0, 6);
  const activeProjects = [
    { id: '#2038', service: 'Landing Page para campanha de maio', person: 'Lucas Mendes', status: 'progress', price: 'R$ 790', date: 'Entrega em 2 dias' },
    { id: '#2032', service: 'Nova identidade visual para produto SaaS', person: 'Ana Costa', status: 'review', price: 'R$ 420', date: 'Em revisao' },
    { id: '#2027', service: 'Gestao de redes sociais para lancamento', person: 'Julia Rocha', status: 'progress', price: 'R$ 1.300', date: 'Kickoff amanha' },
  ];
  const activities = [
    { text: 'Entrega recebida', detail: 'Lucas Mendes enviou a primeira versao da landing page', time: '18 min', color: 'blue' },
    { text: 'Freelancer recomendado', detail: '3 novos servicos combinam com sua lista salva', time: '1h', color: 'purple' },
    { text: 'Pontos adicionados', detail: '+40 XP por concluir um pedido com feedback', time: '3h', color: 'green' },
    { text: 'Projeto em revisao', detail: 'Ana Costa respondeu suas observacoes do pedido #2032', time: '6h', color: 'amber' },
  ];
  const clientMissions = [
    {
      title: 'Descoberta inteligente',
      description: 'Salve 3 servicos em categorias diferentes para melhorar sua curadoria.',
      progress: 66,
      reward: '+90 XP',
      accent: 'blue',
    },
    {
      title: 'Cliente confiavel',
      description: 'Conclua 1 pedido com briefing completo e feedback final.',
      progress: 50,
      reward: 'Selo Cliente Pro',
      accent: 'amber',
    },
  ];
  const curatedBoards = [
    { title: 'Lançar produto digital', text: 'Landing pages, design de marca, social media e ads para colocar uma oferta no ar mais rapido.', to: '/explore' },
    { title: 'Organizar time enxuto', text: 'Perfis para sites, conteudo, automacao e materiais comerciais sem contratar equipe fixa.', to: '/explore' },
    { title: 'Escalar autoridade', text: 'Pacotes voltados para creators, consultores e negocios de servico que precisam aparecer melhor.', to: '/explore' },
  ];
  const categoryHighlights = CATEGORIES.filter((item) => item.id !== 'all').slice(0, 5);
  const progressGoals = [
    { label: 'Proximo nivel', value: '160 XP restantes', color: 'purple' },
    { label: 'Curadoria premium', value: '1 pedido para desbloquear', color: 'green' },
    { label: 'Recompensa mensal', value: 'Avalie 2 projetos restantes', color: 'blue' },
  ];
  const statusHighlights = [
    { name: 'Voce', points: 'Nivel 2 · 1.240 XP', position: 1, highlight: true },
    { name: 'Lista salva', points: '12 servicos acompanhados', position: 2 },
    { name: 'Projetos no mes', points: '3 contratos ativos', position: 3 },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.clientHero}>
        <div className={styles.clientHeroMain}>
          <div className={styles.heroBadge}>Descubra e contrate</div>
          <h1 className={styles.heroTitle}>
            Servicos prontos para voce contratar agora, sem sair da dashboard.
          </h1>
          <p className={styles.heroText}>
            A experiencia do cliente aqui precisa vender. Por isso a dashboard agora prioriza descoberta, shortlist e caminhos de compra antes de mostrar blocos administrativos.
          </p>

          <div className={styles.clientHeroActions}>
            <Link to="/explore" className={styles.heroPrimaryAction}>
              Explorar todos os servicos
            </Link>
            <Link to={`/services/${spotlightService.id}`} className={styles.heroSecondaryAction}>
              Ver servico em destaque
            </Link>
          </div>

          <div className={styles.clientCategoryRow}>
            {categoryHighlights.map((category) => (
              <Link key={category.id} to="/explore" className={styles.clientCategoryChip}>
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <Link to={`/services/${spotlightService.id}`} className={styles.spotlightCard}>
          <div
            className={styles.spotlightVisual}
            style={{ background: SERVICE_GRADIENTS[spotlightService.id % SERVICE_GRADIENTS.length] }}
          />
          <div className={styles.spotlightBody}>
            <span className={styles.spotlightBadge}>Destaque da semana</span>
            <h2>{spotlightService.title}</h2>
            <p>{spotlightService.summary}</p>
            <div className={styles.spotlightMeta}>
              <span>{spotlightService.seller.name}</span>
              <span>{spotlightService.rating.toFixed(1)} estrelas</span>
              <span>{spotlightService.delivery} dias</span>
            </div>
            <strong>R$ {spotlightService.price}</strong>
          </div>
        </Link>
      </section>

      <section className={styles.clientFeaturedSection}>
        <SectionHeader
          title="Projetos para contratar agora"
          subtitle="Os servicos mais fortes da plataforma ja aparecem logo de cara para acelerar sua decisao."
          actionLabel="Ver catalogo completo"
          actionTo="/explore"
        />

        <div className={styles.clientFeaturedGrid}>
          {featuredServices.map((service, index) => (
            <Link key={service.id} to={`/services/${service.id}`} className={styles.clientFeaturedCard}>
              <div
                className={styles.clientFeaturedVisual}
                style={{ background: SERVICE_GRADIENTS[(service.id + index) % SERVICE_GRADIENTS.length] }}
              />
              <div className={styles.clientFeaturedBody}>
                <span className={styles.clientFeaturedSeller}>{service.seller.name}</span>
                <h3>{service.title}</h3>
                <div className={styles.clientFeaturedMeta}>
                  <span>{service.rating.toFixed(1)} estrelas</span>
                  <span>{service.delivery} dias</span>
                </div>
                <strong>R$ {service.price}</strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.clientDashboardGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.card} style={{ animationDelay: '0.14s' }}>
            <SectionHeader
              title="Colecoes para contratar melhor"
              subtitle="Agrupamentos pensados para momentos reais do cliente, nao apenas por categoria tecnica."
            />

            <div className={styles.boardGrid}>
              {curatedBoards.map((board, index) => (
                <Link key={board.title} to={board.to} className={styles.boardCard}>
                  <div
                    className={styles.boardAccent}
                    style={{ background: SERVICE_GRADIENTS[(index + 4) % SERVICE_GRADIENTS.length] }}
                  />
                  <div className={styles.boardBody}>
                    <h3>{board.title}</h3>
                    <p>{board.text}</p>
                    <span>Explorar combinacao</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.card} style={{ animationDelay: '0.18s' }}>
            <SectionHeader
              title="Servicos populares da plataforma"
              subtitle="Mais prova social, mais contexto e mais coisas para contratar sem depender da busca."
            />

            <div className={styles.clientPopularGrid}>
              {popularServices.map((service, index) => (
                <Link key={service.id} to={`/services/${service.id}`} className={styles.popularCard}>
                  <div
                    className={styles.popularVisual}
                    style={{ background: SERVICE_GRADIENTS[(service.id + index + 2) % SERVICE_GRADIENTS.length] }}
                  />
                  <div className={styles.popularBody}>
                    <h3>{service.title}</h3>
                    <span className={styles.popularSeller}>{service.seller.name}</span>
                    <div className={styles.popularMeta}>
                      <span>{service.reviews} avaliacoes</span>
                      <span>{service.delivery} dias</span>
                    </div>
                    <strong>R$ {service.price}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className={styles.doubleGrid}>
            <section className={styles.card} style={{ animationDelay: '0.22s' }}>
              <SectionHeader
                title="Projetos em andamento"
                subtitle="Tudo que voce ja contratou continua visivel, mas sem roubar o protagonismo da descoberta."
                actionLabel="Ver todos"
                actionTo="/orders"
              />
              <OrdersTable orders={activeProjects} secondaryColumnLabel="Freelancer" lastColumnLabel="Proximo passo" />
            </section>

            <section className={styles.card} style={{ animationDelay: '0.26s' }}>
              <SectionHeader
                title="Missoes do cliente"
                subtitle="Gamificacao leve para estimular contratacao, feedback e exploracao recorrente."
                actionLabel="Ver recompensas"
                actionTo="/rewards"
              />
              <MissionList missions={clientMissions} />
            </section>
          </div>
        </div>

        <div className={styles.aside}>
          <section className={`${styles.card} ${styles.cardAccent}`} style={{ animationDelay: '0.18s' }}>
            <SectionHeader
              title="Atalhos de compra"
              subtitle="Acoes mais proximas de contratacao para o cliente voltar sempre."
            />
            <QuickActions
              primary={{ label: 'Explorar servicos', to: '/explore' }}
              secondary={[
                { label: 'Abrir destaque da semana', to: `/services/${spotlightService.id}` },
                { label: 'Ver favoritos', to: '/favorites' },
              ]}
            />
          </section>

          <section className={styles.card} style={{ animationDelay: '0.22s' }}>
            <SectionHeader
              title="Seu progresso como cliente"
              subtitle="Pontos, niveis e beneficios para manter descoberta e compra recorrente."
              actionLabel="Ver tudo"
              actionTo="/rewards"
            />
            <ProgressCard
              title="Nivel 2 - Cliente explorador"
              subtitle="540 / 700 XP"
              progressWidth="77%"
              goals={progressGoals}
            />
          </section>

          <section className={styles.card} style={{ animationDelay: '0.26s' }}>
            <SectionHeader
              title="Seu status na plataforma"
              subtitle="Resumo rapido do quanto voce esta usando a Hivelancers de forma inteligente."
            />
            <Leaderboard items={statusHighlights} />
          </section>

          <section className={styles.card} style={{ animationDelay: '0.3s' }}>
            <SectionHeader
              title="Atividade recente"
              subtitle="O que aconteceu nos seus pedidos e no seu radar de descoberta."
            />
            <ActivityFeed items={activities} />
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

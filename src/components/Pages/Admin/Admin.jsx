import { useMemo, useState } from 'react';
import {
  FaArrowTrendUp,
  FaBan,
  FaBell,
  FaBolt,
  FaChartLine,
  FaCircleCheck,
  FaClock,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaFlag,
  FaMagnifyingGlass,
  FaMoneyBillTransfer,
  FaShieldHalved,
  FaTriangleExclamation,
  FaUserCheck,
  FaUsers,
} from 'react-icons/fa6';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './Admin.module.css';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const stats = [
  {
    label: 'GMV no mês',
    value: formatCurrency(42890),
    detail: '+18,4% vs mês anterior',
    icon: <FaChartLine />,
    tone: 'blue',
  },
  {
    label: 'Receita da plataforma',
    value: formatCurrency(6433),
    detail: 'Take rate médio de 15%',
    icon: <FaArrowTrendUp />,
    tone: 'green',
  },
  {
    label: 'Escrow em aberto',
    value: formatCurrency(18720),
    detail: '32 pedidos com saldo retido',
    icon: <FaShieldHalved />,
    tone: 'purple',
  },
  {
    label: 'Alertas críticos',
    value: '7',
    detail: '3 disputas, 4 verificações',
    icon: <FaTriangleExclamation />,
    tone: 'orange',
  },
];

const healthSignals = [
  { label: 'Pagamentos aprovados', value: '96,8%', status: 'Saudável', tone: 'success' },
  { label: 'Tempo médio de resposta', value: '42min', status: 'Dentro do alvo', tone: 'success' },
  { label: 'Pedidos atrasados', value: '8', status: 'Atenção', tone: 'warning' },
  { label: 'Chargebacks', value: '0,7%', status: 'Monitorar', tone: 'warning' },
];

const users = [
  { name: 'Matheus Chagas', email: 'matheus@hivelancers.com', type: 'Freelancer', status: 'Ativo', volume: 12400, risk: 'Baixo', joined: '09 jun' },
  { name: 'Test Teste', email: 'cliente@teste.com', type: 'Cliente', status: 'Ativo', volume: 2180, risk: 'Baixo', joined: '08 jun' },
  { name: 'Ana Prado', email: 'ana.prado@mail.com', type: 'Freelancer', status: 'Verificação', volume: 980, risk: 'Médio', joined: '06 jun' },
  { name: 'Studio Orbit', email: 'finance@orbit.co', type: 'Cliente', status: 'Bloqueio parcial', volume: 6400, risk: 'Alto', joined: '02 jun' },
];

const financeRows = [
  { id: '#FIN-9021', label: 'Repasse aprovado', user: 'Matheus Chagas', amount: 1420, status: 'Liberado', date: 'Hoje, 10:45' },
  { id: '#FIN-9018', label: 'Pagamento em escrow', user: 'Test Teste', amount: 780, status: 'Retido', date: 'Hoje, 09:12' },
  { id: '#FIN-8991', label: 'Taxa da plataforma', user: 'Pedido #9IZCO4AX', amount: 117, status: 'Capturado', date: 'Ontem, 18:22' },
  { id: '#FIN-8970', label: 'Reembolso solicitado', user: 'Studio Orbit', amount: 390, status: 'Revisão', date: 'Ontem, 15:08' },
];

const orders = [
  { id: '#9IZCO4AX', title: 'Landing page para campanha', client: 'Test Teste', freelancer: 'Matheus Chagas', amount: 200, status: 'Concluído', sla: 'No prazo' },
  { id: '#8LLP21BR', title: 'Identidade visual SaaS', client: 'Studio Orbit', freelancer: 'Ana Prado', amount: 1800, status: 'Em revisão', sla: 'Atenção' },
  { id: '#7QAZ10MN', title: 'API para checkout', client: 'Nexa Labs', freelancer: 'Rafael Lima', amount: 3200, status: 'Em execução', sla: 'No prazo' },
  { id: '#6PVV88DA', title: 'Motion para lançamento', client: 'Dobra Co.', freelancer: 'Lia Castro', amount: 940, status: 'Atrasado', sla: 'Crítico' },
];

const moderationItems = [
  { title: 'Perfil com documentos pendentes', owner: 'Ana Prado', type: 'KYC', priority: 'Alta', icon: <FaUserCheck /> },
  { title: 'Pedido com entrega contestada', owner: 'Studio Orbit', type: 'Disputa', priority: 'Alta', icon: <FaFlag /> },
  { title: 'Mensagem reportada no chat', owner: 'Cliente #1042', type: 'Moderação', priority: 'Média', icon: <FaBell /> },
  { title: 'Serviço aguardando revisão', owner: 'Rafael Lima', type: 'Marketplace', priority: 'Baixa', icon: <FaCircleCheck /> },
];

const tabs = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'users', label: 'Usuários' },
  { id: 'finance', label: 'Financeiro' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'moderation', label: 'Moderação' },
];

const getStatusTone = (status) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('ativo') || normalized.includes('liberado') || normalized.includes('concluído') || normalized.includes('capturado')) return 'success';
  if (normalized.includes('atenção') || normalized.includes('revisão') || normalized.includes('verificação') || normalized.includes('retido')) return 'warning';
  if (normalized.includes('alto') || normalized.includes('bloqueio') || normalized.includes('atrasado') || normalized.includes('crítico')) return 'danger';
  return 'neutral';
};

function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return users;
    return users.filter((user) =>
      `${user.name} ${user.email} ${user.type} ${user.status}`.toLowerCase().includes(value)
    );
  }, [search]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Admin</span>
          <h1>Central de operação Hivelancers</h1>
          <p>
            Acompanhe usuários, pedidos, repasses, disputas e saúde da plataforma em uma única área de decisão.
          </p>
        </div>

        <div className={styles.commandCard}>
          <span>Fila operacional</span>
          <strong>14 itens</strong>
          <p>7 precisam de análise hoje</p>
          <button type="button">Abrir fila crítica</button>
        </div>
      </section>

      <div className={styles.statGrid}>
        {stats.map((item) => (
          <SpotlightCard key={item.label} className={`${styles.statCard} ${styles[item.tone]}`}>
            <div className={styles.statIcon}>{item.icon}</div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </SpotlightCard>
        ))}
      </div>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <span className={styles.sectionKicker}>Controle</span>
            <h2>Gestão administrativa</h2>
          </div>

          <div className={styles.searchWrap}>
            <FaMagnifyingGlass />
            <input
              type="text"
              placeholder="Buscar usuário, pedido ou transação..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span className={styles.sectionKicker}>Saúde</span>
                  <h3>Sinais da plataforma</h3>
                </div>
                <button type="button" className={styles.ghostButton}>Ver relatório</button>
              </div>

              <div className={styles.signalGrid}>
                {healthSignals.map((signal) => (
                  <div key={signal.label} className={styles.signalCard}>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                    <em className={`${styles.badge} ${styles[signal.tone]}`}>{signal.status}</em>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span className={styles.sectionKicker}>Prioridades</span>
                  <h3>Fila de ação</h3>
                </div>
                <button type="button" className={styles.primaryButton}>Resolver agora</button>
              </div>

              <div className={styles.actionList}>
                {moderationItems.slice(0, 3).map((item) => (
                  <article key={item.title} className={styles.actionItem}>
                    <div className={styles.actionIcon}>{item.icon}</div>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.owner} · {item.type}</span>
                    </div>
                    <em className={`${styles.badge} ${getStatusTone(item.priority)}`}>{item.priority}</em>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Usuários</span>
                <h3>Contas e risco</h3>
              </div>
              <button type="button" className={styles.primaryButton}>Exportar usuários</button>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Volume</th>
                    <th>Risco</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.email}>
                      <td>
                        <strong>{user.name}</strong>
                        <span>{user.email} · {user.joined}</span>
                      </td>
                      <td>{user.type}</td>
                      <td><em className={`${styles.badge} ${getStatusTone(user.status)}`}>{user.status}</em></td>
                      <td>{formatCurrency(user.volume)}</td>
                      <td><em className={`${styles.badge} ${getStatusTone(user.risk)}`}>{user.risk}</em></td>
                      <td>
                        <div className={styles.rowActions}>
                          <button type="button">Ver</button>
                          <button type="button">Ajustar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'finance' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Financeiro</span>
                <h3>Repasses, escrow e ajustes</h3>
              </div>
              <div className={styles.buttonGroup}>
                <button type="button" className={styles.ghostButton}>Conciliar</button>
                <button type="button" className={styles.primaryButton}>Novo ajuste</button>
              </div>
            </div>

            <div className={styles.financeGrid}>
              <div className={styles.financeCard}>
                <FaMoneyBillTransfer />
                <span>Repasses pendentes</span>
                <strong>{formatCurrency(8240)}</strong>
              </div>
              <div className={styles.financeCard}>
                <FaCreditCard />
                <span>Pagamentos em análise</span>
                <strong>{formatCurrency(1730)}</strong>
              </div>
              <div className={styles.financeCard}>
                <FaFileInvoiceDollar />
                <span>Taxas capturadas</span>
                <strong>{formatCurrency(6433)}</strong>
              </div>
            </div>

            <div className={styles.ledger}>
              {financeRows.map((row) => (
                <article key={row.id} className={styles.ledgerRow}>
                  <div>
                    <span>{row.id}</span>
                    <strong>{row.label}</strong>
                    <p>{row.user} · {row.date}</p>
                  </div>
                  <strong>{formatCurrency(row.amount)}</strong>
                  <em className={`${styles.badge} ${getStatusTone(row.status)}`}>{row.status}</em>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Pedidos</span>
                <h3>Operação comercial</h3>
              </div>
              <button type="button" className={styles.primaryButton}>Baixar relatório</button>
            </div>

            <div className={styles.orderList}>
              {orders.map((order) => (
                <article key={order.id} className={styles.orderItem}>
                  <div className={styles.orderMain}>
                    <span>{order.id}</span>
                    <strong>{order.title}</strong>
                    <p>{order.client} contratou {order.freelancer}</p>
                  </div>
                  <strong>{formatCurrency(order.amount)}</strong>
                  <em className={`${styles.badge} ${getStatusTone(order.status)}`}>{order.status}</em>
                  <em className={`${styles.badge} ${getStatusTone(order.sla)}`}>{order.sla}</em>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'moderation' && (
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <span className={styles.sectionKicker}>Trust & safety</span>
                <h3>Moderação e risco</h3>
              </div>
              <button type="button" className={styles.primaryButton}>Revisar fila</button>
            </div>

            <div className={styles.moderationGrid}>
              {moderationItems.map((item) => (
                <SpotlightCard key={item.title} className={styles.moderationCard}>
                  <div className={styles.actionIcon}>{item.icon}</div>
                  <span>{item.type}</span>
                  <strong>{item.title}</strong>
                  <p>{item.owner}</p>
                  <div className={styles.cardFooter}>
                    <em className={`${styles.badge} ${getStatusTone(item.priority)}`}>{item.priority}</em>
                    <button type="button">Analisar</button>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </section>
        )}
      </section>

      <section className={styles.bottomGrid}>
        <SpotlightCard className={styles.securityCard}>
          <FaShieldHalved />
          <div>
            <span>Compliance</span>
            <strong>Políticas de risco ativas</strong>
            <p>KYC, disputas, repasses e denúncias com acompanhamento diário.</p>
          </div>
        </SpotlightCard>

        <SpotlightCard className={styles.securityCard}>
          <FaBolt />
          <div>
            <span>Automação</span>
            <strong>4 regras recomendadas</strong>
            <p>Bloqueio preventivo, revisão de saque, alerta de SLA e triagem de reports.</p>
          </div>
        </SpotlightCard>

        <SpotlightCard className={styles.securityCard}>
          <FaBan />
          <div>
            <span>Risco</span>
            <strong>2 contas exigem ação</strong>
            <p>Limites temporários e verificação documental pendentes.</p>
          </div>
        </SpotlightCard>
      </section>
    </div>
  );
}

export default Admin;

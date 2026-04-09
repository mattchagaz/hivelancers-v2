import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';

function Dashboard() {
  const userRole = 'freelancer';
  const isFreelancer = userRole === 'freelancer';

  const stats = isFreelancer
    ? [
        { label: 'Ganhos do mês', value: 'R$ 3.240', change: '+12%', positive: true, color: 'green' },
        { label: 'Pedidos ativos', value: '7', change: '+2 novos', positive: true, color: 'blue' },
        { label: 'Avaliação média', value: '4.8', sub: 'de 5.0', color: 'amber' },
        { label: 'Nível atual', value: '3', sub: 'Profissional', color: 'purple' },
      ]
    : [
        { label: 'Pedidos ativos', value: '3', color: 'blue' },
        { label: 'Total investido', value: 'R$ 1.890', color: 'green' },
        { label: 'Favoritos salvos', value: '12', color: 'amber' },
        { label: 'Avaliações feitas', value: '8', color: 'purple' },
      ];

  const orders = [
    { id: '#1042', service: 'Design de Logo Profissional', person: 'Maria Souza', status: 'progress', price: 'R$ 350', date: 'Hoje, 14:30' },
    { id: '#1041', service: 'Landing Page Responsiva', person: 'Carlos Lima', status: 'review', price: 'R$ 890', date: 'Ontem, 09:15' },
    { id: '#1039', service: 'Edição de Vídeo (60s)', person: 'Ana Torres', status: 'done', price: 'R$ 200', date: '07 Abr, 16:00' },
    { id: '#1037', service: 'Tradução EN→PT (5 páginas)', person: 'Pedro Nunes', status: 'done', price: 'R$ 120', date: '05 Abr, 11:20' },
  ];

  const statusMap = {
    progress: { label: 'Em andamento', cls: 'sProgress' },
    review: { label: 'Em revisão', cls: 'sReview' },
    done: { label: 'Concluído', cls: 'sDone' },
    cancelled: { label: 'Cancelado', cls: 'sCancelled' },
  };

  const activities = [
    { text: 'Novo pedido recebido', detail: '#1042 — Design de Logo', time: '2 min', color: 'blue' },
    { text: 'Avaliação recebida', detail: '5 estrelas de Maria Souza', time: '1h', color: 'amber' },
    { text: 'Pagamento liberado', detail: 'R$ 200,00 — Edição de Vídeo', time: '3h', color: 'green' },
    { text: 'Nova mensagem', detail: 'Carlos Lima enviou um arquivo', time: '5h', color: 'purple' },
  ];

  return (
    <div className={styles.page}>
      {/* ===== Stats ===== */}
      <section className={styles.stats}>
        {stats.map((s, i) => (
          <div key={i} className={`${styles.stat} ${styles[`stat_${s.color}`]}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className={styles.statHead}>
              <span className={styles.statLabel}>{s.label}</span>
              {s.change && (
                <span className={`${styles.statBadge} ${s.positive ? styles.badgeUp : styles.badgeDown}`}>
                  {s.change}
                </span>
              )}
            </div>
            <span className={styles.statVal}>{s.value}</span>
            {s.sub && <span className={styles.statSub}>{s.sub}</span>}
          </div>
        ))}
      </section>

      {/* ===== Grid: orders + sidebar ===== */}
      <div className={styles.grid}>
        {/* Orders table */}
        <section className={styles.card} style={{ animationDelay: '0.15s' }}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Pedidos recentes</h2>
            <Link to="/orders" className={styles.cardAction}>Ver todos</Link>
          </div>

          <div className={styles.table}>
            <div className={styles.tHead}>
              <span className={styles.tCol1}>Serviço</span>
              <span className={styles.tCol2}>{isFreelancer ? 'Cliente' : 'Freelancer'}</span>
              <span className={styles.tCol3}>Status</span>
              <span className={styles.tCol4}>Valor</span>
              <span className={styles.tCol5}>Data</span>
            </div>

            {orders.map((o) => {
              const st = statusMap[o.status];
              return (
                <div key={o.id} className={styles.tRow}>
                  <div className={styles.tCol1}>
                    <span className={styles.oName}>{o.service}</span>
                    <span className={styles.oId}>{o.id}</span>
                  </div>
                  <span className={styles.tCol2}>{o.person}</span>
                  <span className={`${styles.sBadge} ${styles[st.cls]}`}>{st.label}</span>
                  <span className={styles.tCol4}>{o.price}</span>
                  <span className={styles.tCol5}>{o.date}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right sidebar */}
        <div className={styles.aside}>
          {/* Quick actions */}
          <section className={styles.card} style={{ animationDelay: '0.2s' }}>
            <h2 className={styles.cardTitle}>Ações rápidas</h2>
            <div className={styles.actions}>
              <Link to={isFreelancer ? '/services/new' : '/explore'} className={styles.actionPrimary}>
                {isFreelancer ? 'Criar novo serviço' : 'Explorar serviços'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </Link>
              <Link to="/orders" className={styles.actionSec}>
                Ver pedidos
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
              <Link to="/profile" className={styles.actionSec}>
                Editar perfil
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            </div>
          </section>

          {/* Progress */}
          <section className={styles.card} style={{ animationDelay: '0.25s' }}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Seu progresso</h2>
              <Link to="/rewards" className={styles.cardAction}>Ver tudo</Link>
            </div>
            <div className={styles.level}>
              <div className={styles.levelIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
              <div className={styles.levelInfo}>
                <span className={styles.levelName}>Nível 3 — Profissional</span>
                <span className={styles.levelXp}>720 / 1.000 XP</span>
              </div>
            </div>
            <div className={styles.xpTrack}>
              <div className={styles.xpFill} style={{ width: '72%' }} />
            </div>
            <div className={styles.badges}>
              <span className={styles.badgesLabel}>Conquistas</span>
              <div className={styles.badgeRow}>
                {['check', 'star', 'heart', 'lock'].map((b, i) => (
                  <div key={i} className={`${styles.badgeCircle} ${b === 'lock' ? styles.locked : ''}`}>
                    {b === 'check' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    {b === 'star' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                    {b === 'heart' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>}
                    {b === 'lock' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Activity */}
          <section className={styles.card} style={{ animationDelay: '0.3s' }}>
            <h2 className={styles.cardTitle}>Atividade recente</h2>
            <div className={styles.feed}>
              {activities.map((a, i) => (
                <div key={i} className={styles.feedItem}>
                  <div className={`${styles.feedDot} ${styles[`dot_${a.color}`]}`} />
                  <div className={styles.feedBody}>
                    <span className={styles.feedText}>{a.text}</span>
                    <span className={styles.feedDetail}>{a.detail}</span>
                  </div>
                  <span className={styles.feedTime}>{a.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
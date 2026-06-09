import styles from './ComingSoon.module.css';

const COPY = {
  finances: {
    eyebrow: 'Financeiro',
    title: 'Central financeira em preparacao',
    text: 'Esta area vai concentrar saldos, repasses e historico financeiro da conta.',
    metricLabel: 'Status',
    metricValue: 'Em breve',
  },
  rewards: {
    eyebrow: 'Recompensas',
    title: 'Recompensas em preparacao',
    text: 'Esta area vai reunir conquistas, progresso e beneficios liberados dentro da Hivelancers.',
    metricLabel: 'Status',
    metricValue: 'Em breve',
  },
};

function ComingSoon({ variant = 'finances' }) {
  const content = COPY[variant] || COPY.finances;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.text}</p>
        </div>

        <div className={styles.statusCard}>
          <span>{content.metricLabel}</span>
          <strong>{content.metricValue}</strong>
        </div>
      </section>
    </div>
  );
}

export default ComingSoon;

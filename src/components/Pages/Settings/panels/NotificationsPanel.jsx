import styles from '../Settings.module.css';
import { IN_APP_NOTIFICATION_OPTIONS, PUSH_NOTIFICATION_OPTIONS } from '../Settings.helpers';
import { SectionHeader, ToggleRow } from '../Settings.ui';

export default function NotificationsPanel({ notifications, toggleNotification }) {
  return (
    <>
      <section className={styles.card}>
        <SectionHeader
          title="Alertas dentro da plataforma"
          subtitle="Escolha quais eventos geram aviso visual e sonoro. Eventos críticos continuam no histórico."
        />
        {IN_APP_NOTIFICATION_OPTIONS.map((option) => (
          <ToggleRow
            key={option.field}
            title={option.title}
            description={option.description}
            checked={notifications[option.field]}
            onChange={() => toggleNotification(option.field)}
          />
        ))}
      </section>

      <section className={styles.card}>
        <SectionHeader
          title="Notificações do navegador"
          subtitle="Avisos do sistema operacional enquanto a Hivelancers estiver aberta."
        />
        {PUSH_NOTIFICATION_OPTIONS.map((option) => (
          <ToggleRow
            key={option.field}
            title={option.title}
            description={option.description}
            checked={notifications[option.field]}
            onChange={() => toggleNotification(option.field)}
          />
        ))}
      </section>
    </>
  );
}

import { Link } from 'react-router-dom';
import styles from '../Settings.module.css';
import { SectionHeader, ToggleRow } from '../Settings.ui';

export default function PrivacyPanel({ privacy, togglePrivacy }) {
  return (
    <>
      <section className={styles.card}>
        <SectionHeader title="Visibilidade do perfil" subtitle="Controle como outras pessoas encontram você." />
        <ToggleRow title="Perfil público" description="Permite aparecer nas buscas e em links compartilhados." checked={privacy.profilePublic} onChange={() => togglePrivacy('profilePublic')} />
        <ToggleRow title="Mostrar status online" description="Mostra quando você está ativo na plataforma." checked={privacy.showOnline} onChange={() => togglePrivacy('showOnline')} />
        <ToggleRow title="Mostrar ganhos totais" description="Exibe seu faturamento acumulado como prova social." checked={privacy.showEarnings} onChange={() => togglePrivacy('showEarnings')} />
      </section>
      <section className={styles.card}>
        <SectionHeader title="Transparência e seus dados" subtitle="Leia os documentos ou exerça seus direitos de titular." />
        <div className={styles.legalDocumentGrid}>
          <Link to="/privacy">Aviso de Privacidade</Link>
          <Link to="/terms">Termos de Uso</Link>
          <Link to="/cookies">Cookies e armazenamento</Link>
          <Link to="/lgpd">Seus direitos na LGPD</Link>
        </div>
      </section>
    </>
  );
}

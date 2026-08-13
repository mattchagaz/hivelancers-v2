import styles from '../Settings.module.css';
import { SectionHeader } from '../Settings.ui';

export default function AppearancePanel({ appearance, setAppearance }) {
  return (
    <section className={styles.card}>
      <SectionHeader title="Aparência da interface" subtitle="Escolha o visual que fica mais confortável para você." />
      <div className={styles.themeGrid}>
        {[{id: 'light', lbl: 'Claro'}, {id: 'dark', lbl: 'Escuro'}, {id: 'system', lbl: 'Automático'}].map(t => (
          <button key={t.id} type="button" className={`${styles.themeCard} ${appearance.theme === t.id ? styles.themeActive : ''}`} onClick={() => setAppearance(prev => ({ ...prev, theme: t.id }))}>
            <div className={`${styles.themePreview} ${styles[`theme_${t.id}`]}`}>
              <div className={styles.themeSidebar} />
              <div className={styles.themeBody}><div className={styles.themeLine}/><div className={styles.themeLineShort}/></div>
            </div>
            <strong>{t.lbl}</strong>
          </button>
        ))}
      </div>

      <div className={styles.divider} />
      <SectionHeader title="Cor de destaque" subtitle="Personalize botões e indicadores da plataforma." />
      <div className={styles.accentRow}>
        {[{id:'blue',c:'#3b82f6'},{id:'green',c:'#10b981'},{id:'amber',c:'#f59e0b'},{id:'purple',c:'#8b5cf6'}].map(a => (
          <button key={a.id} type="button" className={`${styles.accentDot} ${appearance.accent === a.id ? styles.accentActive : ''}`} style={{ background: a.c }} onClick={() => setAppearance(p => ({ ...p, accent: a.id }))} />
        ))}
        <label
          className={`${styles.accentDot} ${styles.accentCustom} ${appearance.accent === 'custom' ? styles.accentActive : ''}`}
          title="Cor personalizada"
        >
          <input
            type="color"
            className={styles.accentCustomInput}
            value={appearance.customAccent || '#6366f1'}
            onChange={(e) => setAppearance(p => ({ ...p, accent: 'custom', customAccent: e.target.value }))}
          />
        </label>
      </div>
    </section>
  );
}

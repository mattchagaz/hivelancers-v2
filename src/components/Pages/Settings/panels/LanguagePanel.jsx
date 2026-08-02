import styles from '../Settings.module.css';
import { Field, SectionHeader } from '../Settings.ui';

export default function LanguagePanel({ language, setLanguage }) {
  return (
    <section className={styles.card}>
      <SectionHeader title="Região e Moeda" subtitle="Afeta formatos de data e exibição de preços." />
      <div className={styles.formGrid}>
        <Field label="País"><select className={styles.input} value={language.region} onChange={(e) => setLanguage(p => ({...p, region: e.target.value}))}><option value="BR">Brasil</option></select></Field>
        <Field label="Moeda Base"><select className={styles.input} value={language.currency} onChange={(e) => setLanguage(p => ({...p, currency: e.target.value}))}><option value="BRL">Real (R$)</option></select></Field>
      </div>
    </section>
  );
}

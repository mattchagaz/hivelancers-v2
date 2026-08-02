import styles from './Settings.module.css';

// Primitivas de UI compartilhadas entre os painéis de configuração.

export function SectionHeader({ title, subtitle, extra }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {extra && <div>{extra}</div>}
    </div>
  );
}

export function Field({ label, hint, children, full = false }) {
  return (
    <label className={`${styles.field} ${full ? styles.fieldFull : ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <button type="button" className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`} onClick={onChange} aria-pressed={checked}>
      <span className={styles.toggleDot} />
    </button>
  );
}

export function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleText}>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export function FormActions({ primaryLabel = 'Salvar alterações', onSave, onCancel, isSaving = false, disabled = false }) {
  return (
    <div className={styles.formActions}>
      {onCancel && (
        <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={isSaving}>Cancelar</button>
      )}
      <button type="button" className={styles.btnPrimary} onClick={onSave} disabled={isSaving || disabled}>
        {isSaving ? 'Salvando...' : primaryLabel}
      </button>
    </div>
  );
}

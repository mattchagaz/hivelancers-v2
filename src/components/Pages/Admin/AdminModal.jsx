import { useEffect, useId } from 'react';
import { FaXmark } from 'react-icons/fa6';
import styles from './Admin.module.css';

export default function AdminModal({
  open,
  onClose,
  kicker = 'Editor',
  title,
  description,
  icon,
  busy = false,
  children,
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div className={styles.reviewModalOverlay} onClick={busy ? undefined : onClose}>
      <section
        className={`${styles.reviewModal} ${styles.adminEditorModal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.reviewModalHeader}>
          <div className={styles.adminModalHeading}>
            {icon && <div className={styles.userAvatar}>{icon}</div>}
            <div>
              <span className={styles.sectionKicker}>{kicker}</span>
              <h3 id={titleId}>{title}</h3>
              {description && <p>{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar editor" disabled={busy}>
            <FaXmark />
          </button>
        </header>

        <div className={styles.adminModalContent}>{children}</div>
      </section>
    </div>
  );
}

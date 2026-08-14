import { useEffect, useId } from 'react';
import { FaXmark } from 'react-icons/fa6';
import styles from './Admin.module.css';
import { useLockBodyScroll } from '../../../hooks/useLockBodyScroll';
import { useAdminModalSignal } from '../../../hooks/useAdminModalSignal';

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

  useLockBodyScroll(open);
  useAdminModalSignal(open);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

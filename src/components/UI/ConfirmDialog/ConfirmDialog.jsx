import { useEffect } from 'react';
import { FaTriangleExclamation } from 'react-icons/fa6';
import styles from './ConfirmDialog.module.css';

function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  hideCancel = false,
  variant = 'default',
  eyebrow,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) onCancel?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={isLoading ? undefined : onCancel}>
      <div
        className={`${styles.dialog} ${variant === 'danger' ? styles.dangerDialog : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          {variant === 'danger' && (
            <div className={styles.dangerIcon} aria-hidden="true">
              <FaTriangleExclamation />
            </div>
          )}
          <div>
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
            <h3 id="confirm-dialog-title">{title}</h3>
          </div>
        </div>

        <div id="confirm-dialog-description" className={styles.description}>
          {description}
        </div>

        <div className={styles.actions}>
          {!hideCancel && (
            <button
              type="button"
              className={`${styles.cancelButton} ${variant === 'danger' ? styles.dangerCancelButton : ''}`}
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={`${styles.confirmButton} ${variant === 'danger' ? styles.dangerConfirmButton : ''}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

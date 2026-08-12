import { useId } from 'react';
import { FaCircleInfo } from 'react-icons/fa6';
import styles from './Checkout.module.css';

export default function FeeInfoButton() {
  const tooltipId = useId();

  return (
    <span className={styles.feeInfo}>
      <button
        type="button"
        className={styles.feeInfoButton}
        aria-label="Saiba por que cobramos a taxa de serviço"
        aria-describedby={tooltipId}
      >
        <FaCircleInfo aria-hidden="true" />
      </button>
      <span id={tooltipId} className={styles.feeTooltip} role="tooltip">
        Esta taxa ajuda a manter a plataforma ativa, os pagamentos protegidos e o suporte durante todo o projeto.
      </span>
    </span>
  );
}

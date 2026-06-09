import { Link } from 'react-router-dom';
import SpotlightCard from '../SpotlightCard/SpotlightCard';
import styles from './EmptyState.module.css';

function Action({ label, to, onClick, variant = 'primary' }) {
  if (!label) return null;

  const className = variant === 'secondary' ? styles.secondaryAction : styles.primaryAction;

  if (to) {
    return (
      <Link to={to} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}

function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  actionOnClick,
  secondaryActionLabel,
  secondaryActionTo,
  secondaryActionOnClick,
  compact = false,
  className = '',
}) {
  return (
    <SpotlightCard
      className={`${styles.emptyState} ${compact ? styles.compact : ''} ${className}`}
      spotlightColor="rgba(62, 115, 230, 0.14)"
    >
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {(actionLabel || secondaryActionLabel) && (
        <div className={styles.actions}>
          <Action label={actionLabel} to={actionTo} onClick={actionOnClick} />
          <Action
            label={secondaryActionLabel}
            to={secondaryActionTo}
            onClick={secondaryActionOnClick}
            variant="secondary"
          />
        </div>
      )}
    </SpotlightCard>
  );
}

export default EmptyState;

import styles from './SpotlightCard.module.css';

function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(62, 115, 230, 0.16)',
  intensity = 'soft',
}) {
  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
  };

  return (
    <div
      className={`${styles.card} ${styles[intensity] || styles.soft} ${className}`}
      style={{ '--spotlight-color': spotlightColor }}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
}

export default SpotlightCard;

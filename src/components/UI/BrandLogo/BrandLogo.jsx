import styles from './BrandLogo.module.css';

export default function BrandLogo({ className = '', label = '' }) {
  return (
    <span
      className={`${styles.logo} ${className}`.trim()}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  );
}

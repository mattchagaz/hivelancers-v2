import { Link } from 'react-router-dom';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { CategoryIcon } from '../../../utils/categoryIcons';
import { getCategoryImageUrl } from '../../../utils/categoryVisuals';
import styles from './CategoryCarousel.module.css';

const options = {
  type: 'loop',
  pagination: false,
  arrows: true,
  drag: 'free',
  snap: true,
  autoWidth: true,
  gap: '14px',
  trimSpace: false,
  waitForTransition: false,
  breakpoints: {
    768: {
      arrows: false,
      gap: '10px',
    },
  },
};

function CategoryCard({ category, active, onSelect, getHref, compact }) {
  const cardClass = [
    styles.card,
    active ? styles.active : '',
    compact ? styles.compactCard : '',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <img className={styles.image} src={getCategoryImageUrl(category)} alt="" loading="lazy" />
      <span className={styles.overlay} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.icon}>
          <CategoryIcon category={category} />
        </span>
        <span>
          <strong>{category.name}</strong>
          <small>{active ? 'Selecionada' : getHref ? 'Ver serviços' : 'Filtrar serviços'}</small>
        </span>
      </span>
    </>
  );

  if (getHref) {
    return (
      <Link className={cardClass} to={getHref(category)} aria-label={`Ver serviços de ${category.name}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cardClass}
      aria-pressed={active}
      onClick={() => onSelect?.(category)}
    >
      {content}
    </button>
  );
}

function CategoryCarousel({ categories, activeSlug, onSelect, getHref, compact = false }) {
  if (!categories?.length) return null;

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`}>
      <Splide options={options} aria-label="Categorias de serviços" className={styles.carousel}>
        {categories.map((category) => (
          <SplideSlide className={styles.slide} key={category.id || category.slug || category.name}>
            <CategoryCard
              category={category}
              active={activeSlug === category.slug}
              onSelect={onSelect}
              getHref={getHref}
              compact={compact}
            />
          </SplideSlide>
        ))}
      </Splide>
    </div>
  );
}

export default CategoryCarousel;

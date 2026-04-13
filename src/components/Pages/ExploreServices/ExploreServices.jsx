import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  CATEGORIES,
  SERVICE_GRADIENTS,
  SERVICES,
  SORT_OPTIONS,
} from '../../../data/services';
import styles from './ExploreServices.module.css';

function ExploreServices() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevant');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [deliveryMax, setDeliveryMax] = useState(30);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filtered = useMemo(() => {
    let result = [...SERVICES];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          service.seller.name.toLowerCase().includes(query)
      );
    }

    if (activeCategory !== 'all') {
      result = result.filter((service) => service.category === activeCategory);
    }

    result = result.filter(
      (service) =>
        service.price >= priceRange[0] &&
        service.price <= priceRange[1] &&
        service.delivery <= deliveryMax &&
        service.rating >= minRating
    );

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => b.id - a.id);
        break;
      default:
        result.sort((a, b) => b.reviews - a.reviews);
    }

    return result;
  }, [search, activeCategory, sortBy, priceRange, minRating, deliveryMax]);

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setSortBy('relevant');
    setPriceRange([0, 2000]);
    setMinRating(0);
    setDeliveryMax(30);
  };

  const hasActiveFilters =
    activeCategory !== 'all' ||
    minRating > 0 ||
    deliveryMax < 30 ||
    priceRange[0] > 0 ||
    priceRange[1] < 2000;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Explorar servicos</h1>
          <p className={styles.subtitle}>
            Descubra profissionais incriveis para seu proximo projeto.
          </p>
        </div>
      </div>

      <div className={styles.catBar}>
        <div className={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catChip} ${activeCategory === cat.id ? styles.catChipActive : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className={styles.catIcon}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIco} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por servico, habilidade ou freelancer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
              <circle cx="6" cy="12" r="2" fill="currentColor" />
              <circle cx="10" cy="18" r="2" fill="currentColor" />
              <circle cx="18" cy="6" r="2" fill="currentColor" />
            </svg>
            Filtros
            {hasActiveFilters && <span className={styles.filterDot} />}
          </button>

          <select className={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="Lista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" />
                <circle cx="4" cy="12" r="1" fill="currentColor" />
                <circle cx="4" cy="18" r="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ''}`}>
          <div className={styles.filtersHead}>
            <h3 className={styles.filtersTitle}>Filtros</h3>
            {hasActiveFilters && (
              <button className={styles.clearBtn} onClick={clearFilters}>
                Limpar
              </button>
            )}
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Faixa de preco</label>
            <div className={styles.priceInputs}>
              <div className={styles.priceField}>
                <span className={styles.pricePrefix}>R$</span>
                <input
                  className={styles.priceInputNum}
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  placeholder="Min"
                />
              </div>
              <span className={styles.priceSep}>-</span>
              <div className={styles.priceField}>
                <span className={styles.pricePrefix}>R$</span>
                <input
                  className={styles.priceInputNum}
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Avaliacao minima</label>
            <div className={styles.ratingBtns}>
              {[0, 4, 4.5, 4.8].map((rating) => (
                <button
                  key={rating}
                  className={`${styles.ratingBtn} ${minRating === rating ? styles.ratingBtnActive : ''}`}
                  onClick={() => setMinRating(rating)}
                >
                  {rating === 0 ? (
                    'Todas'
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {rating}+
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Prazo maximo de entrega</label>
            <div className={styles.deliveryBtns}>
              {[
                { value: 1, label: '24h' },
                { value: 3, label: '3 dias' },
                { value: 7, label: '7 dias' },
                { value: 14, label: '14 dias' },
                { value: 30, label: 'Qualquer' },
              ].map((item) => (
                <button
                  key={item.value}
                  className={`${styles.deliveryBtn} ${deliveryMax === item.value ? styles.deliveryBtnActive : ''}`}
                  onClick={() => setDeliveryMax(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button className={styles.filtersClose} onClick={() => setShowFilters(false)}>
            Aplicar filtros ({filtered.length} resultados)
          </button>
        </aside>

        {showFilters && <div className={styles.filtersOverlay} onClick={() => setShowFilters(false)} />}

        <div className={styles.content}>
          <div className={styles.resultsBar}>
            <span className={styles.resultsCount}>
              {filtered.length} {filtered.length === 1 ? 'servico encontrado' : 'servicos encontrados'}
            </span>
            {hasActiveFilters && (
              <button className={styles.clearInline} onClick={clearFilters}>
                Limpar filtros ×
              </button>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className={viewMode === 'grid' ? styles.grid : styles.list}>
              {filtered.map((service, index) => (
                <Link
                  to={`/services/${service.id}`}
                  key={service.id}
                  className={viewMode === 'grid' ? styles.card : styles.listCard}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <div
                    className={viewMode === 'grid' ? styles.cardImg : styles.listCardImg}
                    style={{
                      background: service.image || SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length],
                    }}
                  >
                    {service.featured && <span className={styles.featuredBadge}>Destaque</span>}
                    <button
                      className={`${styles.favBtn} ${favorites.includes(service.id) ? styles.favBtnActive : ''}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleFavorite(service.id);
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={favorites.includes(service.id) ? '#ef4444' : 'none'}
                        stroke={favorites.includes(service.id) ? '#ef4444' : '#fff'}
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>

                  <div className={viewMode === 'grid' ? styles.cardBody : styles.listCardBody}>
                    <div className={styles.sellerRow}>
                      <div className={styles.sellerAvatar}>{service.seller.avatar}</div>
                      <div className={styles.sellerInfo}>
                        <span className={styles.sellerName}>{service.seller.name}</span>
                        <span className={styles.sellerLevel}>{service.seller.level}</span>
                      </div>
                    </div>

                    <h3 className={styles.cardTitle}>{service.title}</h3>

                    <div className={styles.ratingRow}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className={styles.ratingVal}>{service.rating}</span>
                      <span className={styles.ratingCount}>({service.reviews})</span>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.deliveryTag}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {service.delivery} {service.delivery === 1 ? 'dia' : 'dias'}
                      </span>
                      <div className={styles.priceArea}>
                        <span className={styles.priceLabel}>a partir de</span>
                        <span className={styles.priceVal}>R$ {service.price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>Nenhum servico encontrado</h3>
              <p className={styles.emptySub}>Tente ajustar os filtros ou buscar por outro termo.</p>
              <button className={styles.emptyBtn} onClick={clearFilters}>
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default ExploreServices;

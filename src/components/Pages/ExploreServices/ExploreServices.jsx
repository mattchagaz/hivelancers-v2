import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './ExploreServices.module.css';

/* ===== Mock Data ===== */
const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '🔥' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'dev', label: 'Desenvolvimento', icon: '💻' },
  { id: 'video', label: 'Vídeo', icon: '🎬' },
  { id: 'writing', label: 'Redação', icon: '✍️' },
  { id: 'marketing', label: 'Marketing', icon: '📈' },
  { id: 'audio', label: 'Áudio', icon: '🎵' },
];

const MOCK_SERVICES = [
  {
    id: 1, title: 'Design de Logo Profissional e Identidade Visual Completa', category: 'design',
    price: 150, rating: 4.9, reviews: 127, delivery: 3, image: null,
    seller: { name: 'Ana Costa', level: 'Top Rated', avatar: 'AC' },
    tags: ['logo', 'branding'], featured: true,
  },
  {
    id: 2, title: 'Desenvolvimento de Landing Page Responsiva e Otimizada', category: 'dev',
    price: 490, rating: 5.0, reviews: 84, delivery: 5, image: null,
    seller: { name: 'Lucas Mendes', level: 'Nível 4', avatar: 'LM' },
    tags: ['website', 'landing page'], featured: true,
  },
  {
    id: 3, title: 'Edição de Vídeo Profissional para YouTube e Redes Sociais', category: 'video',
    price: 200, rating: 4.8, reviews: 63, delivery: 2, image: null,
    seller: { name: 'Maria Silva', level: 'Nível 3', avatar: 'MS' },
    tags: ['vídeo', 'youtube'], featured: false,
  },
  {
    id: 4, title: 'Redação SEO: Artigos de Blog Otimizados para Google', category: 'writing',
    price: 80, rating: 4.7, reviews: 201, delivery: 1, image: null,
    seller: { name: 'Pedro Alves', level: 'Top Rated', avatar: 'PA' },
    tags: ['seo', 'blog'], featured: false,
  },
  {
    id: 5, title: 'Gestão Completa de Redes Sociais + Criação de Conteúdo', category: 'marketing',
    price: 890, rating: 4.9, reviews: 56, delivery: 7, image: null,
    seller: { name: 'Julia Rocha', level: 'Nível 5', avatar: 'JR' },
    tags: ['social media', 'marketing'], featured: true,
  },
  {
    id: 6, title: 'Locução Profissional para Vídeos, Podcasts e Comerciais', category: 'audio',
    price: 120, rating: 4.6, reviews: 38, delivery: 2, image: null,
    seller: { name: 'Carlos Neto', level: 'Nível 2', avatar: 'CN' },
    tags: ['locução', 'áudio'], featured: false,
  },
  {
    id: 7, title: 'UI/UX Design Completo para Aplicativos Mobile', category: 'design',
    price: 1200, rating: 5.0, reviews: 42, delivery: 10, image: null,
    seller: { name: 'Fernanda Lima', level: 'Top Rated', avatar: 'FL' },
    tags: ['ui/ux', 'mobile'], featured: true,
  },
  {
    id: 8, title: 'Desenvolvimento de API RESTful com Node.js e PostgreSQL', category: 'dev',
    price: 750, rating: 4.8, reviews: 31, delivery: 7, image: null,
    seller: { name: 'Rafael Torres', level: 'Nível 4', avatar: 'RT' },
    tags: ['api', 'backend'], featured: false,
  },
  {
    id: 9, title: 'Motion Graphics e Animação 2D para Redes Sociais', category: 'video',
    price: 350, rating: 4.7, reviews: 19, delivery: 4, image: null,
    seller: { name: 'Bruna Dias', level: 'Nível 3', avatar: 'BD' },
    tags: ['motion', 'animação'], featured: false,
  },
  {
    id: 10, title: 'Tradução Profissional Inglês-Português com Revisão', category: 'writing',
    price: 60, rating: 4.9, reviews: 145, delivery: 1, image: null,
    seller: { name: 'Diego Martins', level: 'Nível 5', avatar: 'DM' },
    tags: ['tradução', 'inglês'], featured: false,
  },
  {
    id: 11, title: 'Criação de E-commerce Completo com Shopify ou WooCommerce', category: 'dev',
    price: 1500, rating: 4.9, reviews: 27, delivery: 14, image: null,
    seller: { name: 'Thiago Souza', level: 'Top Rated', avatar: 'TS' },
    tags: ['e-commerce', 'shopify'], featured: true,
  },
  {
    id: 12, title: 'Produção Musical e Jingles para Marcas e Comerciais', category: 'audio',
    price: 500, rating: 4.8, reviews: 15, delivery: 5, image: null,
    seller: { name: 'Camila Ferreira', level: 'Nível 3', avatar: 'CF' },
    tags: ['música', 'jingle'], featured: false,
  },
];

const SORT_OPTIONS = [
  { id: 'relevant', label: 'Mais relevantes' },
  { id: 'newest', label: 'Mais recentes' },
  { id: 'rating', label: 'Melhor avaliados' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
];

/* ===== Placeholder gradient colors for cards without images ===== */
const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5576c 0%, #ff6f91 100%)',
  'linear-gradient(135deg, #0acffe 0%, #495aff 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
];

function ExploreServices() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevant');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [deliveryMax, setDeliveryMax] = useState(30);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  /* ===== Filtering & Sorting ===== */
  const filtered = useMemo(() => {
    let result = [...MOCK_SERVICES];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)) ||
          s.seller.name.toLowerCase().includes(q)
      );
    }

    // Category
    if (activeCategory !== 'all') {
      result = result.filter((s) => s.category === activeCategory);
    }

    // Price
    result = result.filter((s) => s.price >= priceRange[0] && s.price <= priceRange[1]);

    // Rating
    if (minRating > 0) {
      result = result.filter((s) => s.rating >= minRating);
    }

    // Delivery
    result = result.filter((s) => s.delivery <= deliveryMax);

    // Sort
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

  const hasActiveFilters = activeCategory !== 'all' || minRating > 0 || deliveryMax < 30 || priceRange[0] > 0 || priceRange[1] < 2000;

  return (
    <div className={styles.page}>
      {/* ===== Header ===== */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Explorar serviços</h1>
          <p className={styles.subtitle}>Descubra profissionais incríveis para seu próximo projeto.</p>
        </div>
      </div>

      {/* ===== Categories ===== */}
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

      {/* ===== Toolbar: search + sort + view ===== */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIco} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por serviço, habilidade ou freelancer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>×</button>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
              <circle cx="6" cy="12" r="2" fill="currentColor" /><circle cx="10" cy="18" r="2" fill="currentColor" /><circle cx="18" cy="6" r="2" fill="currentColor" />
            </svg>
            Filtros
            {hasActiveFilters && <span className={styles.filterDot} />}
          </button>

          <select className={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="Lista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Main area ===== */}
      <div className={styles.main}>
        {/* Filters sidebar */}
        <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ''}`}>
          <div className={styles.filtersHead}>
            <h3 className={styles.filtersTitle}>Filtros</h3>
            {hasActiveFilters && (
              <button className={styles.clearBtn} onClick={clearFilters}>Limpar</button>
            )}
          </div>

          {/* Price */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Faixa de preço</label>
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
              <span className={styles.priceSep}>—</span>
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

          {/* Rating */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Avaliação mínima</label>
            <div className={styles.ratingBtns}>
              {[0, 4, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  className={`${styles.ratingBtn} ${minRating === r ? styles.ratingBtnActive : ''}`}
                  onClick={() => setMinRating(r)}
                >
                  {r === 0 ? 'Todas' : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      {r}+
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Prazo máximo de entrega</label>
            <div className={styles.deliveryBtns}>
              {[{ v: 1, l: '24h' }, { v: 3, l: '3 dias' }, { v: 7, l: '7 dias' }, { v: 14, l: '14 dias' }, { v: 30, l: 'Qualquer' }].map((d) => (
                <button
                  key={d.v}
                  className={`${styles.deliveryBtn} ${deliveryMax === d.v ? styles.deliveryBtnActive : ''}`}
                  onClick={() => setDeliveryMax(d.v)}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile close */}
          <button className={styles.filtersClose} onClick={() => setShowFilters(false)}>
            Aplicar filtros ({filtered.length} resultados)
          </button>
        </aside>

        {/* Overlay mobile */}
        {showFilters && <div className={styles.filtersOverlay} onClick={() => setShowFilters(false)} />}

        {/* Content */}
        <div className={styles.content}>
          {/* Results count */}
          <div className={styles.resultsBar}>
            <span className={styles.resultsCount}>
              {filtered.length} {filtered.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
            </span>
            {hasActiveFilters && (
              <button className={styles.clearInline} onClick={clearFilters}>
                Limpar filtros ×
              </button>
            )}
          </div>

          {/* Cards grid or list */}
          {filtered.length > 0 ? (
            <div className={viewMode === 'grid' ? styles.grid : styles.list}>
              {filtered.map((service, i) => (
                <Link
                  to={`/services/${service.id}`}
                  key={service.id}
                  className={viewMode === 'grid' ? styles.card : styles.listCard}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {/* Image / Gradient placeholder */}
                  <div
                    className={viewMode === 'grid' ? styles.cardImg : styles.listCardImg}
                    style={{ background: service.image ? `url(${service.image}) center/cover` : GRADIENTS[i % GRADIENTS.length] }}
                  >
                    {service.featured && <span className={styles.featuredBadge}>Destaque</span>}
                    <button
                      className={`${styles.favBtn} ${favorites.includes(service.id) ? styles.favBtnActive : ''}`}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(service.id); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.includes(service.id) ? '#ef4444' : 'none'} stroke={favorites.includes(service.id) ? '#ef4444' : '#fff'} strokeWidth="2" strokeLinecap="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div className={viewMode === 'grid' ? styles.cardBody : styles.listCardBody}>
                    {/* Seller row */}
                    <div className={styles.sellerRow}>
                      <div className={styles.sellerAvatar}>{service.seller.avatar}</div>
                      <div className={styles.sellerInfo}>
                        <span className={styles.sellerName}>{service.seller.name}</span>
                        <span className={styles.sellerLevel}>{service.seller.level}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={styles.cardTitle}>{service.title}</h3>

                    {/* Rating */}
                    <div className={styles.ratingRow}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className={styles.ratingVal}>{service.rating}</span>
                      <span className={styles.ratingCount}>({service.reviews})</span>
                    </div>

                    {/* Footer: price + delivery */}
                    <div className={styles.cardFooter}>
                      <span className={styles.deliveryTag}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
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
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>Nenhum serviço encontrado</h3>
              <p className={styles.emptySub}>Tente ajustar os filtros ou buscar por outro termo.</p>
              <button className={styles.emptyBtn} onClick={clearFilters}>Limpar filtros</button>
            </div>
          )}
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

/* Need to import Toaster */
import { Toaster } from 'sonner';

export default ExploreServices;
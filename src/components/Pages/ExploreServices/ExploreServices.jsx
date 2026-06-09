import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import {
  FaMagnifyingGlass,
  FaSliders,
} from 'react-icons/fa6';
import { SERVICE_GRADIENTS } from '../../../data/services';
import { listCategories, listPublicServices } from '../../../services/services';
import { addFavoriteService, getMyFavorites, removeFavoriteService } from '../../../services/users';
import { CategoryIcon } from '../../../utils/categoryIcons';
import EmptyState from '../../UI/EmptyState/EmptyState';
import styles from './ExploreServices.module.css';

const formatPrice = (cents) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents || 0) / 100);

const normalizeSubcategories = (category) =>
  Array.isArray(category?.subcategories) ? category.subcategories : [];

function ExploreServices() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');
  const [activeSubcategorySlug, setActiveSubcategorySlug] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [debouncedPrice, setDebouncedPrice] = useState([0, 10000]);
  const [deliveryMax, setDeliveryMax] = useState(0);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState([]);

  const pageSize = 12;

  const toggleFavorite = (id) => {
    const alreadyFavorite = favorites.includes(id);
    setFavorites((prev) =>
      alreadyFavorite ? prev.filter((item) => item !== id) : [...prev, id]
    );

    const action = alreadyFavorite ? removeFavoriteService(id) : addFavoriteService(id);
    action
      .then(() => {
        toast.success(alreadyFavorite ? 'Serviço removido dos favoritos.' : 'Serviço salvo nos favoritos.');
      })
      .catch((err) => {
        setFavorites((prev) =>
          alreadyFavorite ? [...prev, id] : prev.filter((item) => item !== id)
        );
        toast.error(err.message);
      });
  };

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((err) => toast.error(err.message));
  }, []);

  useEffect(() => {
    getMyFavorites()
      .then((data) => setFavorites(data.serviceIds || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const subcategoryFromUrl = searchParams.get('subcategory');
    const queryFromUrl = searchParams.get('q');
    if (categoryFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCategorySlug(categoryFromUrl);
    }
    if (subcategoryFromUrl) {
      setActiveSubcategorySlug(subcategoryFromUrl);
    }
    if (queryFromUrl) {
      const timer = setTimeout(() => setSearch(queryFromUrl), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPrice(priceRange), 400);
    return () => clearTimeout(t);
  }, [priceRange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [debouncedSearch, activeCategorySlug, activeSubcategorySlug, debouncedPrice, deliveryMax, sort]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const params = { page, pageSize, sort };
    if (debouncedSearch) params.q = debouncedSearch;
    if (activeCategorySlug !== 'all') params.category = activeCategorySlug;
    if (activeSubcategorySlug) params.subcategory = activeSubcategorySlug;
    if (debouncedPrice[0] > 0) params.minPrice = debouncedPrice[0] * 100;
    if (debouncedPrice[1] < 10000) params.maxPrice = debouncedPrice[1] * 100;
    if (deliveryMax > 0) params.deliveryMax = deliveryMax;

    listPublicServices(params)
      .then((data) => {
        if (cancelled) return;
        setServices(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, debouncedSearch, activeCategorySlug, activeSubcategorySlug, debouncedPrice, deliveryMax, sort]);

  const clearFilters = () => {
    setSearch('');
    setActiveCategorySlug('all');
    setActiveSubcategorySlug('');
    setPriceRange([0, 10000]);
    setDeliveryMax(0);
    setSort('newest');
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    activeCategorySlug !== 'all' ||
    Boolean(activeSubcategorySlug) ||
    priceRange[0] > 0 ||
    priceRange[1] < 10000 ||
    deliveryMax > 0 ||
    sort !== 'newest';

  const categoryChips = useMemo(
    () => [{ id: 'all', slug: 'all', name: 'Todas', iconKey: 'globe' }, ...categories],
    [categories]
  );

  const activeCategory = useMemo(
    () => categoryChips.find((cat) => cat.slug === activeCategorySlug) || categoryChips[0],
    [activeCategorySlug, categoryChips]
  );

  const subcategoryChips = useMemo(
    () => normalizeSubcategories(activeCategory),
    [activeCategory]
  );

  const activeSubcategory = useMemo(
    () => subcategoryChips.find((item) => item.slug === activeSubcategorySlug),
    [activeSubcategorySlug, subcategoryChips]
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (search.trim()) chips.push({ key: 'search', label: `Busca: ${search.trim()}` });
    if (activeCategorySlug !== 'all') chips.push({ key: 'category', label: activeCategory?.name || 'Categoria' });
    if (activeSubcategorySlug) chips.push({ key: 'subcategory', label: activeSubcategory?.name || 'Subcategoria' });
    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      chips.push({ key: 'price', label: `${formatPrice(priceRange[0] * 100)} - ${formatPrice(priceRange[1] * 100)}` });
    }
    if (deliveryMax > 0) chips.push({ key: 'delivery', label: `Até ${deliveryMax} ${deliveryMax === 1 ? 'dia' : 'dias'}` });
    if (sort !== 'newest') chips.push({ key: 'sort', label: sort === 'price_asc' ? 'Menor preço' : 'Maior preço' });
    return chips;
  }, [activeCategory?.name, activeCategorySlug, activeSubcategory?.name, activeSubcategorySlug, deliveryMax, priceRange, search, sort]);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <span className={styles.eyebrow}>Marketplace Hivelancers</span>
          <h1 className={styles.title}>Encontre o serviço certo com filtros claros e comparação rápida.</h1>
          <p className={styles.subtitle}>
            Explore categorias, compare preço e prazo, salve favoritos e avance para contratação com mais confiança.
          </p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryAction} onClick={() => setShowFilters(true)}>
              <FaSliders /> Ajustar filtros
            </button>
            <button type="button" className={styles.secondaryAction} onClick={clearFilters}>
              Ver todos
            </button>
          </div>
        </div>
        <div className={styles.heroSearchCard}>
          <span>Busca assistida</span>
          <strong>{activeCategorySlug === 'all' ? 'Todas as categorias' : activeCategory?.name}</strong>
          <p>
            {hasActiveFilters
              ? 'Filtros ativos refinam os resultados em tempo real.'
              : 'Comece por uma categoria ou termo para montar uma shortlist.'}
          </p>
        </div>
      </section>

      <div className={styles.catBar}>
        <div className={styles.catBarHeader}>
          <div>
            <span className={styles.sectionKicker}>Categorias</span>
            <h2>Escolha uma área</h2>
          </div>
          <span className={styles.catCount}>{categories.length} categorias</span>
        </div>
        <div className={styles.catScroll}>
          {categoryChips.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.catChip} ${activeCategorySlug === cat.slug ? styles.catChipActive : ''}`}
              onClick={() => {
                setActiveCategorySlug(cat.slug);
                setActiveSubcategorySlug('');
              }}
            >
              <span className={styles.catIcon}>
                <CategoryIcon category={cat} />
              </span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {activeCategorySlug !== 'all' && subcategoryChips.length > 0 && (
        <div className={styles.subcategoryBar}>
          <div className={styles.catBarHeader}>
            <div>
              <span className={styles.sectionKicker}>Subcategorias</span>
              <h2>{activeCategory?.name}</h2>
            </div>
            <button
              type="button"
              className={styles.clearInline}
              onClick={() => setActiveSubcategorySlug('')}
            >
              Todas
            </button>
          </div>
          <div className={styles.catScroll}>
            {subcategoryChips.map((item) => (
              <button
                key={item.slug}
                type="button"
                className={`${styles.catChip} ${activeSubcategorySlug === item.slug ? styles.catChipActive : ''}`}
                onClick={() => setActiveSubcategorySlug(item.slug)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIco} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por título ou descrição..."
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
            <FaSliders />
            Filtros
            {hasActiveFilters && <span className={styles.filterDot} />}
          </button>

          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Mais recentes</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
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
            <label className={styles.filterLabel}>Faixa de preço (R$)</label>
            <div className={styles.priceInputs}>
              <div className={styles.priceField}>
                <span className={styles.pricePrefix}>R$</span>
                <input
                  className={styles.priceInputNum}
                  type="number"
                  min="0"
                  value={priceRange[0] === 0 ? '' : priceRange[0]}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPriceRange([v === '' ? 0 : Number(v), priceRange[1]]);
                  }}
                  placeholder="Min"
                />
              </div>
              <span className={styles.priceSep}>-</span>
              <div className={styles.priceField}>
                <span className={styles.pricePrefix}>R$</span>
                <input
                  className={styles.priceInputNum}
                  type="number"
                  min="0"
                  value={priceRange[1] === 10000 ? '' : priceRange[1]}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPriceRange([priceRange[0], v === '' ? 10000 : Number(v)]);
                  }}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Prazo máximo de entrega</label>
            <div className={styles.deliveryBtns}>
              {[
                { value: 0, label: 'Qualquer' },
                { value: 1, label: '24h' },
                { value: 3, label: '3 dias' },
                { value: 7, label: '7 dias' },
                { value: 14, label: '14 dias' },
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
            Aplicar ({total} resultados)
          </button>
        </aside>

        {showFilters && <div className={styles.filtersOverlay} onClick={() => setShowFilters(false)} />}

        <div className={styles.content}>
          <div className={styles.resultsBar}>
            <div>
              <span className={styles.resultsCount}>
                {loading ? 'Buscando...' : `${total} ${total === 1 ? 'serviço encontrado' : 'serviços encontrados'}`}
              </span>
              <p className={styles.resultsHint}>
                {activeSubcategory?.name
                  ? `${activeCategory?.name} / ${activeSubcategory.name}`
                  : activeCategorySlug === 'all'
                  ? 'Todos os serviços publicados'
                  : `Categoria: ${activeCategory?.name}`}
              </p>
            </div>
            {hasActiveFilters && (
              <button className={styles.clearInline} onClick={clearFilters}>
                Limpar filtros ×
              </button>
            )}
          </div>

          {activeFilterChips.length > 0 && (
            <div className={styles.activeFilters}>
              {activeFilterChips.map((chip) => (
                <span key={chip.key} className={styles.activeChip}>{chip.label}</span>
              ))}
            </div>
          )}

          {!loading && services.length === 0 ? (
            <EmptyState
              icon={<FaMagnifyingGlass />}
              eyebrow="Busca sem resultado"
              title="Nenhum serviço encontrado"
              description="Ajuste filtros, faixa de preço ou termo de busca para ampliar as opções disponíveis."
              actionLabel={hasActiveFilters ? 'Limpar filtros' : undefined}
              actionOnClick={hasActiveFilters ? clearFilters : undefined}
              secondaryActionLabel={hasActiveFilters ? 'Ver todos' : undefined}
              secondaryActionTo={hasActiveFilters ? '/explore' : undefined}
            />
          ) : (
            <>
              <div className={viewMode === 'grid' ? styles.grid : styles.list}>
                {services.map((service, index) => {
                  const minPrice = service.plans?.[0]?.priceCents;
                  const minDelivery = service.plans?.reduce(
                    (acc, p) => (p.deliveryDays < acc ? p.deliveryDays : acc),
                    service.plans[0]?.deliveryDays || 0
                  );
                  const sellerName = `${service.owner?.firstName || ''} ${service.owner?.lastName || ''}`.trim() || 'Vendedor';
                  const sellerInitial = (sellerName[0] || '?').toUpperCase();

                  return (
                    <Link
                      to={`/services/${service.id}`}
                      key={service.id}
                      className={viewMode === 'grid' ? styles.card : styles.listCard}
                      style={{ animationDelay: `${index * 0.04}s` }}
                    >
                      <div
                        className={viewMode === 'grid' ? styles.cardImg : styles.listCardImg}
                        style={{
                          background: service.coverUrl
                            ? `url(${service.coverUrl}) center/cover`
                            : SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length],
                        }}
                      >
                        {service.category?.name && (
                          <span className={styles.categoryBadge}>
                            <CategoryIcon category={service.category} />
                            {service.subcategoryName || service.category.name}
                          </span>
                        )}
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
                          <div className={styles.sellerAvatar}>{sellerInitial}</div>
                          <div className={styles.sellerInfo}>
                            <span className={styles.sellerName}>{sellerName}</span>
                            {service.owner?.headline && (
                              <span className={styles.sellerLevel}>{service.owner.headline}</span>
                            )}
                          </div>
                        </div>

                        <h3 className={styles.cardTitle}>{service.title}</h3>
                        {service.description && (
                          <p className={styles.cardDescription}>{service.description}</p>
                        )}

                        <div className={styles.cardFooter}>
                          {minDelivery !== undefined && (
                            <span className={styles.deliveryTag}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {minDelivery} {minDelivery === 1 ? 'dia' : 'dias'}
                            </span>
                          )}
                          <div className={styles.priceArea}>
                            <span className={styles.priceLabel}>a partir de</span>
                            <span className={styles.priceVal}>{formatPrice(minPrice)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Anterior
                  </button>
                  <span className={styles.pageInfo}>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    className={styles.pageBtn}
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default ExploreServices;

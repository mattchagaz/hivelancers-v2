import { FaPlus, FaLayerGroup, FaTags, FaBolt, FaUsers, FaTrash, FaFloppyDisk } from 'react-icons/fa6';
import styles from '../Admin.module.css';
import { CategoryIcon } from '../../../../utils/categoryIcons';
import { slugify, parseTags } from '../Admin.helpers';
import { useAdmin } from '../AdminContext';

export default function TaxonomyTab() {
  const {
    loadCategories,
    categoriesLoading,
    startNewCategory,
    categories,
    taxonomyStats,
    selectedCategoryId,
    setSelectedCategoryId,
    categoryDraft,
    updateDraft,
    selectedCategory,
    removeCategory,
    categorySaving,
    saveCategory,
    addSubcategory,
    removeSubcategory,
    updateSubcategory,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Marketplace</span>
          <h3>Categorias, subcategorias e tags</h3>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.ghostButton} onClick={loadCategories} disabled={categoriesLoading}>
            Atualizar
          </button>
          <button type="button" className={styles.primaryButton} onClick={startNewCategory}>
            <FaPlus /> Nova categoria
          </button>
        </div>
      </div>

      <div className={styles.taxonomyStats}>
        <div className={styles.taxonomyStat}>
          <FaLayerGroup />
          <span>Categorias</span>
          <strong>{categories.length}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaTags />
          <span>Subcategorias</span>
          <strong>{taxonomyStats.subcategoryCount}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaBolt />
          <span>Tags mapeadas</span>
          <strong>{taxonomyStats.tagCount}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaUsers />
          <span>Serviços vinculados</span>
          <strong>{taxonomyStats.serviceCount}</strong>
        </div>
      </div>

      <div className={styles.taxonomyLayout}>
        <aside className={styles.categoryRail}>
          {categoriesLoading ? (
            <div className={styles.taxonomyEmpty}>Carregando taxonomia...</div>
          ) : categories.length === 0 ? (
            <div className={styles.taxonomyEmpty}>Nenhuma categoria cadastrada.</div>
          ) : (
            categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.categoryRailItem} ${selectedCategoryId === category.id ? styles.categoryRailActive : ''}`}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                <span className={styles.categoryRailIcon}>
                  <CategoryIcon category={category} />
                </span>
                <span>
                  <strong>{category.name}</strong>
                  <small>
                    {(category.subcategories || []).length} subcategorias · {category.servicesCount || 0} serviços
                  </small>
                </span>
              </button>
            ))
          )}
        </aside>

        <div className={styles.taxonomyEditor}>
          <div className={styles.editorHeader}>
            <div>
              <span className={styles.sectionKicker}>
                {selectedCategoryId === 'new' ? 'Nova categoria' : 'Editor'}
              </span>
              <h4>{categoryDraft.name || 'Defina a categoria'}</h4>
              <p>Use slugs estáveis: eles aparecem em filtros, links e buscas do marketplace.</p>
            </div>
            <div className={styles.editorActions}>
              {selectedCategory && (
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={removeCategory}
                  disabled={categorySaving || (selectedCategory.servicesCount || 0) > 0}
                  title={(selectedCategory.servicesCount || 0) > 0 ? 'Categorias com serviços não podem ser excluídas' : 'Excluir categoria'}
                >
                  <FaTrash /> Excluir
                </button>
              )}
              <button type="button" className={styles.primaryButton} onClick={saveCategory} disabled={categorySaving}>
                <FaFloppyDisk /> {categorySaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span>Nome</span>
              <input
                type="text"
                value={categoryDraft.name}
                onChange={(event) => updateDraft('name', event.target.value)}
                placeholder="Ex: Desenvolvimento"
              />
            </label>
            <label className={styles.formField}>
              <span>Slug</span>
              <input
                type="text"
                value={categoryDraft.slug}
                onChange={(event) => updateDraft('slug', slugify(event.target.value))}
                placeholder="desenvolvimento"
              />
            </label>
            <label className={styles.formField}>
              <span>Ícone</span>
              <input
                type="text"
                value={categoryDraft.icon}
                onChange={(event) => updateDraft('icon', event.target.value)}
                placeholder="code, palette, robot..."
              />
            </label>
            <label className={styles.formField}>
              <span>Ordem</span>
              <input
                type="number"
                value={categoryDraft.position}
                onChange={(event) => updateDraft('position', event.target.value)}
                min="0"
              />
            </label>
          </div>

          <div className={styles.subcategoryHeader}>
            <div>
              <h4>Subcategorias</h4>
              <p>Tags são separadas por vírgula e aparecem como sugestões ao criar serviços.</p>
            </div>
            <button type="button" className={styles.ghostButton} onClick={addSubcategory}>
              <FaPlus /> Adicionar subcategoria
            </button>
          </div>

          <div className={styles.subcategoryEditorList}>
            {categoryDraft.subcategories.length === 0 ? (
              <div className={styles.taxonomyEmpty}>
                Adicione subcategorias para orientar melhor a criação de serviços.
              </div>
            ) : (
              categoryDraft.subcategories.map((item, index) => (
                <article key={`${item.slug}-${index}`} className={styles.subcategoryEditor}>
                  <div className={styles.subcategoryEditorTop}>
                    <strong>Subcategoria {index + 1}</strong>
                    <button type="button" onClick={() => removeSubcategory(index)}>
                      <FaTrash /> Remover
                    </button>
                  </div>
                  <div className={styles.formGrid}>
                    <label className={styles.formField}>
                      <span>Nome</span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(event) => updateSubcategory(index, 'name', event.target.value)}
                        placeholder="Ex: Web"
                      />
                    </label>
                    <label className={styles.formField}>
                      <span>Slug</span>
                      <input
                        type="text"
                        value={item.slug}
                        onChange={(event) => updateSubcategory(index, 'slug', slugify(event.target.value))}
                        placeholder="web"
                      />
                    </label>
                  </div>
                  <label className={`${styles.formField} ${styles.formFieldFull}`}>
                    <span>Tags</span>
                    <textarea
                      rows={2}
                      value={(item.tags || []).join(', ')}
                      onChange={(event) => updateSubcategory(index, 'tags', parseTags(event.target.value))}
                      placeholder="sites, landing pages, react, next.js"
                    />
                  </label>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { FaFloppyDisk, FaLayerGroup, FaCircleCheck, FaClock, FaBan } from 'react-icons/fa6';
import styles from '../Admin.module.css';
import { CategoryIcon } from '../../../../utils/categoryIcons';
import {
  summaryValue,
  toUserName,
  getStatusTone,
  SERVICE_STATUS_LABEL,
  formatDate,
  formatCents,
} from '../Admin.helpers';
import { useAdmin } from '../AdminContext';
import AdminModal from '../AdminModal';

export default function ServicesTab() {
  const [editorOpen, setEditorOpen] = useState(false);
  const {
    loadAdminServices,
    servicesLoading,
    saveAdminService,
    selectedService,
    serviceSaving,
    adminServicesTotal,
    adminServicesSummary,
    serviceStatusFilter,
    setServiceStatusFilter,
    serviceCategoryFilter,
    setServiceCategoryFilter,
    categories,
    adminServices,
    selectedServiceId,
    setSelectedServiceId,
    archiveAdminService,
    permanentlyDeleteAdminService,
    serviceDraft,
    updateServiceDraft,
    selectedServiceSubcategories,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Marketplace</span>
          <h3>Serviços publicados e rascunhos</h3>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.ghostButton} onClick={loadAdminServices} disabled={servicesLoading}>
            {servicesLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className={styles.userStats}>
        <div className={styles.taxonomyStat}>
          <FaLayerGroup />
          <span>Total filtrado</span>
          <strong>{adminServicesTotal}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaCircleCheck />
          <span>Publicados</span>
          <strong>{summaryValue(adminServicesSummary, 'PUBLISHED')}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaClock />
          <span>Rascunhos</span>
          <strong>{summaryValue(adminServicesSummary, 'DRAFT')}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaBan />
          <span>Arquivados</span>
          <strong>{summaryValue(adminServicesSummary, 'ARCHIVED')}</strong>
        </div>
      </div>

      <div className={styles.userFilters}>
        <select value={serviceStatusFilter} onChange={(event) => setServiceStatusFilter(event.target.value)}>
          <option value="all">Todos os status</option>
          <option value="PUBLISHED">Publicados</option>
          <option value="DRAFT">Rascunhos</option>
          <option value="ARCHIVED">Arquivados</option>
        </select>
        <select value={serviceCategoryFilter} onChange={(event) => setServiceCategoryFilter(event.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Freelancer</th>
                <th>Status</th>
                <th>Sinais</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicesLoading ? (
                <tr>
                  <td colSpan="5">Carregando serviços...</td>
                </tr>
              ) : adminServices.length === 0 ? (
                <tr>
                  <td colSpan="5">Nenhum serviço encontrado.</td>
                </tr>
              ) : (
                adminServices.map((service) => (
                  <tr key={service.id} className={selectedServiceId === service.id ? styles.tableRowActive : ''}>
                    <td>
                      <strong>{service.title}</strong>
                      <span>{service.category?.name || 'Sem categoria'} · {service.subcategoryName || 'Sem subcategoria'}</span>
                      <span>ID: {service.id}</span>
                    </td>
                    <td>
                      <strong>{toUserName(service.owner)}</strong>
                      <span>@{service.owner?.username || 'sem username'}</span>
                    </td>
                    <td>
                      <em className={`${styles.badge} ${styles[getStatusTone(SERVICE_STATUS_LABEL[service.status] || service.status)]}`}>
                        {SERVICE_STATUS_LABEL[service.status] || service.status}
                      </em>
                      <span>Atualizado: {formatDate(service.updatedAt)}</span>
                    </td>
                    <td>
                      <strong>{formatCents(service.minPriceCents)} inicial</strong>
                      <span>{service.counts?.orders || 0} pedidos · {service.counts?.favorites || 0} favoritos</span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" onClick={() => {
                          setSelectedServiceId(service.id);
                          setEditorOpen(true);
                        }}>Editar</button>
                        <button type="button" onClick={() => archiveAdminService(service)} disabled={serviceSaving || service.status === 'ARCHIVED'}>
                          Arquivar
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentlyDeleteAdminService(service)}
                          disabled={serviceSaving || (service.counts?.orders || 0) > 0 || (service.counts?.payments || 0) > 0}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      <AdminModal
        open={editorOpen && Boolean(selectedService)}
        onClose={() => setEditorOpen(false)}
        kicker="Editor de serviço"
        title={selectedService?.title || 'Serviço'}
        description={selectedService ? `${toUserName(selectedService.owner)} · ${selectedService.category?.name || 'Sem categoria'}` : ''}
        icon={selectedService ? <CategoryIcon category={selectedService.category} /> : <FaLayerGroup />}
        busy={serviceSaving}
      >
        {selectedService && (
          <>
              <div className={styles.formGrid}>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Título</span>
                  <input value={serviceDraft.title} onChange={(event) => updateServiceDraft('title', event.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>Status</span>
                  <select value={serviceDraft.status} onChange={(event) => updateServiceDraft('status', event.target.value)}>
                    <option value="DRAFT">Rascunho</option>
                    <option value="PUBLISHED">Publicado</option>
                    <option value="ARCHIVED">Arquivado</option>
                  </select>
                </label>
                <label className={styles.formField}>
                  <span>Categoria</span>
                  <select
                    value={serviceDraft.categoryId}
                    onChange={(event) => {
                      updateServiceDraft('categoryId', event.target.value);
                      updateServiceDraft('subcategorySlug', '');
                    }}
                  >
                    <option value="">Selecione</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.formField}>
                  <span>Subcategoria</span>
                  <select value={serviceDraft.subcategorySlug} onChange={(event) => updateServiceDraft('subcategorySlug', event.target.value)}>
                    <option value="">Sem subcategoria</option>
                    {selectedServiceSubcategories.map((subcategory) => (
                      <option key={subcategory.slug} value={subcategory.slug}>{subcategory.name}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.formField}>
                  <span>URL da capa</span>
                  <input value={serviceDraft.coverUrl} onChange={(event) => updateServiceDraft('coverUrl', event.target.value)} />
                </label>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Tags</span>
                  <input value={serviceDraft.tags} onChange={(event) => updateServiceDraft('tags', event.target.value)} placeholder="landing pages, react, sites" />
                </label>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Descrição</span>
                  <textarea rows={6} value={serviceDraft.description} onChange={(event) => updateServiceDraft('description', event.target.value)} />
                </label>
              </div>

              <button type="button" className={styles.primaryButton} onClick={saveAdminService} disabled={serviceSaving}>
                <FaFloppyDisk /> {serviceSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
          </>
        )}
      </AdminModal>
    </section>
  );
}

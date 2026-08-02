import { FaPlus, FaGift, FaCircleCheck, FaClock, FaBan, FaTrash, FaFloppyDisk } from 'react-icons/fa6';
import styles from '../Admin.module.css';
import { formatCents, getStatusTone, COUPON_STATUS_LABEL } from '../Admin.helpers';
import { useAdmin } from '../AdminContext';

export default function PromotionsTab() {
  const {
    loadCoupons,
    couponsLoading,
    startNewCoupon,
    couponsTotal,
    couponsSummary,
    couponStatusFilter,
    setCouponStatusFilter,
    coupons,
    selectedCouponId,
    setSelectedCouponId,
    couponDraft,
    updateCouponDraft,
    selectedCoupon,
    removeCoupon,
    couponSaving,
    saveCoupon,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Crescimento</span>
          <h3>Cupons e promoções</h3>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.ghostButton} onClick={loadCoupons} disabled={couponsLoading}>
            {couponsLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <button type="button" className={styles.primaryButton} onClick={startNewCoupon}>
            <FaPlus /> Novo cupom
          </button>
        </div>
      </div>

      <div className={styles.userStats}>
        <div className={styles.taxonomyStat}>
          <FaGift />
          <span>Total filtrado</span>
          <strong>{couponsTotal}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaCircleCheck />
          <span>Ativos</span>
          <strong>{couponsSummary.active || 0}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaClock />
          <span>Agendados</span>
          <strong>{couponsSummary.scheduled || 0}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaBan />
          <span>Expirados/inativos</span>
          <strong>{(couponsSummary.expired || 0) + (couponsSummary.inactive || 0)}</strong>
        </div>
      </div>

      <div className={styles.userFilters}>
        <select value={couponStatusFilter} onChange={(event) => setCouponStatusFilter(event.target.value)}>
          <option value="all">Todos os cupons</option>
          <option value="active">Ativos</option>
          <option value="scheduled">Agendados</option>
          <option value="expired">Expirados</option>
          <option value="inactive">Inativos</option>
          <option value="limit_reached">Limite atingido</option>
        </select>
      </div>

      <div className={styles.userManagementGrid}>
        <div className={styles.couponGrid}>
          {couponsLoading ? (
            <div className={styles.taxonomyEmpty}>Carregando cupons...</div>
          ) : coupons.length === 0 ? (
            <div className={styles.taxonomyEmpty}>Nenhum cupom encontrado.</div>
          ) : (
            coupons.map((coupon) => (
              <button
                key={coupon.id}
                type="button"
                className={`${styles.promoCard} ${selectedCouponId === coupon.id ? styles.promoCardActive : ''}`}
                onClick={() => setSelectedCouponId(coupon.id)}
              >
                <span className={styles.promoCode}>{coupon.code}</span>
                <strong>{coupon.name}</strong>
                <small>
                  {coupon.discountType === 'PERCENTAGE'
                    ? `${coupon.discountValue}% de desconto`
                    : `${formatCents(coupon.discountValue)} de desconto`}
                </small>
                <em className={`${styles.badge} ${styles[getStatusTone(COUPON_STATUS_LABEL[coupon.operationalStatus] || coupon.operationalStatus)]}`}>
                  {COUPON_STATUS_LABEL[coupon.operationalStatus] || coupon.operationalStatus}
                </em>
              </button>
            ))
          )}
        </div>

        <aside className={styles.userEditor}>
          <div className={styles.userEditorHeader}>
            <div className={styles.userAvatar}><FaGift /></div>
            <div>
              <span className={styles.sectionKicker}>{selectedCouponId === 'new' ? 'Novo cupom' : 'Editor'}</span>
              <h4>{couponDraft.code || 'Cupom promocional'}</h4>
              <p>Controle campanha, janela, limite e desconto.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span>Código</span>
              <input value={couponDraft.code} onChange={(event) => updateCouponDraft('code', event.target.value.toUpperCase())} placeholder="BEMVINDO10" />
            </label>
            <label className={styles.formField}>
              <span>Tipo</span>
              <select value={couponDraft.discountType} onChange={(event) => updateCouponDraft('discountType', event.target.value)}>
                <option value="PERCENTAGE">Percentual</option>
                <option value="FIXED_AMOUNT">Valor fixo</option>
              </select>
            </label>
            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span>Nome da campanha</span>
              <input value={couponDraft.name} onChange={(event) => updateCouponDraft('name', event.target.value)} placeholder="Boas-vindas" />
            </label>
            <label className={styles.formField}>
              <span>{couponDraft.discountType === 'PERCENTAGE' ? 'Desconto (%)' : 'Desconto (R$)'}</span>
              <input value={couponDraft.discountValue} onChange={(event) => updateCouponDraft('discountValue', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Desconto máximo (R$)</span>
              <input value={couponDraft.maxDiscountCents} onChange={(event) => updateCouponDraft('maxDiscountCents', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Pedido mínimo (R$)</span>
              <input value={couponDraft.minSubtotalCents} onChange={(event) => updateCouponDraft('minSubtotalCents', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Limite de usos</span>
              <input type="number" min="1" value={couponDraft.usageLimit} onChange={(event) => updateCouponDraft('usageLimit', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Início</span>
              <input type="datetime-local" value={couponDraft.startsAt} onChange={(event) => updateCouponDraft('startsAt', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Fim</span>
              <input type="datetime-local" value={couponDraft.endsAt} onChange={(event) => updateCouponDraft('endsAt', event.target.value)} />
            </label>
            <label className={`${styles.formField} ${styles.formFieldFull}`}>
              <span>Descrição interna</span>
              <textarea rows={3} value={couponDraft.description} onChange={(event) => updateCouponDraft('description', event.target.value)} />
            </label>
          </div>

          <div className={styles.userSwitches}>
            <label>
              <input type="checkbox" checked={couponDraft.isActive} onChange={(event) => updateCouponDraft('isActive', event.target.checked)} />
              <span>Cupom ativo</span>
            </label>
          </div>

          <div className={styles.editorActions}>
            {selectedCoupon && (
              <button type="button" className={styles.dangerButton} onClick={removeCoupon} disabled={couponSaving}>
                <FaTrash /> Excluir
              </button>
            )}
            <button type="button" className={styles.primaryButton} onClick={saveCoupon} disabled={couponSaving}>
              <FaFloppyDisk /> {couponSaving ? 'Salvando...' : 'Salvar cupom'}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

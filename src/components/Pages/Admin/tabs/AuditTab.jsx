import styles from '../Admin.module.css';
import { toUserName, formatDate, humanizeAuditAction } from '../Admin.helpers';
import { useAdmin } from '../AdminContext';
import AdminPagination from '../AdminPagination';

export default function AuditTab() {
  const {
    loadAuditLogs,
    auditLoading,
    auditActionFilter,
    setAuditActionFilter,
    auditLogsTotal,
    auditLogs,
    auditPage,
    setAuditPage,
    auditTotalPages,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Rastreabilidade</span>
          <h3>Auditoria de ações administrativas e acessos sensíveis</h3>
        </div>
        <button type="button" className={styles.ghostButton} onClick={loadAuditLogs} disabled={auditLoading}>
          {auditLoading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <label className={`${styles.formField} ${styles.auditFilter}`}>
        <span>Filtrar por ação</span>
        <input
          value={auditActionFilter}
          onChange={(event) => setAuditActionFilter(event.target.value)}
          placeholder="Ex.: VERIFICATION, DISPUTE ou PATCH"
        />
      </label>

      <div className={styles.auditHeader}>
        <span>{auditLogsTotal} registros encontrados</span>
        <p>Os metadados registram contexto operacional sem armazenar senhas ou conteúdo de documentos.</p>
      </div>

      <div className={styles.auditList}>
        {auditLoading ? (
          <div className={styles.taxonomyEmpty}>Carregando auditoria...</div>
        ) : auditLogs.length === 0 ? (
          <div className={styles.taxonomyEmpty}>Nenhum evento encontrado neste filtro.</div>
        ) : (
          auditLogs.map((log) => (
            <article key={log.id} className={styles.auditRow}>
              <span className={styles.auditDot} />
              <div className={styles.auditRowBody}>
                <strong>
                  {humanizeAuditAction(log.action)}
                  {log.entityType ? ` · ${log.entityType}` : ''}
                  {log.entityId ? ` #${log.entityId.slice(-6)}` : ''}
                </strong>
                <p>
                  {formatDate(log.createdAt)} · {log.actor ? `${toUserName(log.actor)} (${log.actor.email})` : 'sistema'}
                  {log.ipAddress ? ` · ${log.ipAddress}` : ''}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      <AdminPagination
        currentPage={auditPage}
        totalPages={auditTotalPages}
        totalItems={auditLogsTotal}
        onPageChange={setAuditPage}
      />
    </section>
  );
}

import styles from '../Admin.module.css';
import { toUserName, formatDate } from '../Admin.helpers';
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
              <div>
                <span className={styles.supportTicketCode}>{log.entityType}</span>
                <strong>{log.action}</strong>
                <p>
                  {log.actor ? `${toUserName(log.actor)} · ${log.actor.email}` : 'Ação de sistema'}
                </p>
              </div>
              <div>
                <span>Entidade</span>
                <strong>{log.entityId || 'Sem identificador'}</strong>
              </div>
              <div>
                <span>Origem</span>
                <strong>{log.ipAddress || 'IP não informado'}</strong>
              </div>
              <div>
                <span>Data</span>
                <strong>{formatDate(log.createdAt)}</strong>
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

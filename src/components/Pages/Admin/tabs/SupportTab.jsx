import { useState } from 'react';
import {
  FaFloppyDisk,
  FaTicket,
  FaHeadset,
  FaTriangleExclamation,
  FaCircleCheck,
  FaPaperclip,
  FaLifeRing,
  FaArrowUpRightFromSquare,
  FaPen,
} from 'react-icons/fa6';
import styles from '../Admin.module.css';
import {
  normalizeSupportTicketStatus,
  SUPPORT_TICKET_CATEGORY_LABEL,
  SUPPORT_TICKET_PRIORITY_LABEL,
  SUPPORT_TICKET_STATUS_LABEL,
} from '../../../../services/tickets';
import {
  TICKET_STATUS_TONE,
  TICKET_PRIORITY_TONE,
  toTicketDraft,
  toRequesterName,
  getTicketReference,
  formatDate,
} from '../Admin.helpers';
import { useAdmin } from '../AdminContext';
import AdminModal from '../AdminModal';

export default function SupportTab() {
  const [editorOpen, setEditorOpen] = useState(false);
  const {
    loadAdminTickets,
    ticketsLoading,
    saveTicket,
    selectedTicket,
    ticketSaving,
    adminTicketsTotal,
    ticketStats,
    ticketStatusFilter,
    setTicketStatusFilter,
    ticketPriorityFilter,
    setTicketPriorityFilter,
    adminTickets,
    selectedTicketId,
    setSelectedTicketId,
    setTicketDraft,
    activeTicketDraft,
    updateTicketDraft,
  } = useAdmin();

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.sectionKicker}>Suporte</span>
          <h3>Tickets enviados por clientes e freelancers</h3>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" className={styles.ghostButton} onClick={loadAdminTickets} disabled={ticketsLoading}>
            {ticketsLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className={styles.userStats}>
        <div className={styles.taxonomyStat}>
          <FaTicket />
          <span>Total filtrado</span>
          <strong>{adminTicketsTotal}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaHeadset />
          <span>Em atendimento</span>
          <strong>{ticketStats.open}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaTriangleExclamation />
          <span>Sem resposta</span>
          <strong>{ticketStats.unanswered}</strong>
        </div>
        <div className={styles.taxonomyStat}>
          <FaCircleCheck />
          <span>Respondidos</span>
          <strong>{ticketStats.answered}</strong>
        </div>
      </div>

      <div className={styles.userFilters}>
        <select value={ticketStatusFilter} onChange={(event) => setTicketStatusFilter(event.target.value)}>
          <option value="all">Todos os status</option>
          {Object.entries(SUPPORT_TICKET_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={ticketPriorityFilter} onChange={(event) => setTicketPriorityFilter(event.target.value)}>
          <option value="all">Todas as prioridades</option>
          {Object.entries(SUPPORT_TICKET_PRIORITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className={styles.supportQueue}>
          {ticketsLoading ? (
            <div className={styles.taxonomyEmpty}>Carregando tickets...</div>
          ) : adminTickets.length === 0 ? (
            <div className={styles.taxonomyEmpty}>Nenhum ticket encontrado neste filtro.</div>
          ) : (
            adminTickets.map((ticket) => {
              const normalizedStatus = normalizeSupportTicketStatus(ticket.status);
              return (
                <article
                  key={ticket.id}
                  className={`${styles.supportTicketCard} ${selectedTicketId === ticket.id ? styles.supportTicketCardActive : ''}`}
                >
                  <span className={styles.supportTicketCode}>{ticket.code || ticket.id}</span>
                  <strong>{ticket.subject}</strong>
                  <p>{ticket.description}</p>
                  <div className={styles.supportTicketBadges}>
                    <em className={`${styles.badge} ${styles[TICKET_STATUS_TONE[normalizedStatus] || 'neutral']}`}>
                      {SUPPORT_TICKET_STATUS_LABEL[normalizedStatus] || normalizedStatus}
                    </em>
                    <em className={`${styles.badge} ${styles[TICKET_PRIORITY_TONE[ticket.priority] || 'neutral']}`}>
                      {SUPPORT_TICKET_PRIORITY_LABEL[ticket.priority] || ticket.priority}
                    </em>
                    {ticket.attachment?.url && (
                      <em className={`${styles.badge} ${styles.neutral}`}>
                        <FaPaperclip /> Anexo
                      </em>
                    )}
                    {ticket.publicReply && (
                      <em className={`${styles.badge} ${styles.success}`}>
                        <FaCircleCheck /> Respondido
                      </em>
                    )}
                  </div>
                  <div className={styles.supportCardFooter}>
                    <div className={styles.supportTicketMeta}>
                      <span>{toRequesterName(ticket)}</span>
                      <span>{SUPPORT_TICKET_CATEGORY_LABEL[ticket.category] || ticket.category || 'Suporte'}</span>
                      <span>{formatDate(ticket.updatedAt || ticket.createdAt)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.cardEditButton}
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        setTicketDraft(toTicketDraft(ticket));
                        setEditorOpen(true);
                      }}
                    >
                      <FaPen /> Editar ticket
                    </button>
                  </div>
                </article>
              );
            })
          )}
      </div>

      <AdminModal
        open={editorOpen && Boolean(selectedTicket)}
        onClose={() => setEditorOpen(false)}
        kicker="Atendimento"
        title={selectedTicket?.subject || 'Ticket de suporte'}
        description={selectedTicket ? `${toRequesterName(selectedTicket)} · ${selectedTicket.requester?.email || 'sem email'} · ${selectedTicket.code || selectedTicket.id}` : ''}
        icon={<FaLifeRing />}
        busy={ticketSaving}
      >
        {selectedTicket && (
          <>
              <div className={styles.ticketDetailBlock}>
                <span>Descrição enviada</span>
                <p>{selectedTicket.description}</p>
              </div>

              {selectedTicket.attachment?.url && (
                <div className={styles.ticketAttachmentBlock}>
                  <div>
                    <span>Evidência anexada</span>
                    <strong>{selectedTicket.attachment.name || 'Imagem enviada pelo usuário'}</strong>
                  </div>
                  <img src={selectedTicket.attachment.url} alt="Evidência anexada ao ticket" />
                  <a href={selectedTicket.attachment.url} target="_blank" rel="noreferrer">
                    <FaArrowUpRightFromSquare /> Abrir imagem
                  </a>
                </div>
              )}

              <div className={styles.supportMetaGrid}>
                <div>
                  <span>Categoria</span>
                  <strong>{SUPPORT_TICKET_CATEGORY_LABEL[selectedTicket.category] || selectedTicket.category || 'Suporte'}</strong>
                </div>
                <div>
                  <span>Referência</span>
                  <strong>{getTicketReference(selectedTicket)}</strong>
                </div>
                <div>
                  <span>Criado em</span>
                  <strong>{formatDate(selectedTicket.createdAt)}</strong>
                </div>
                <div>
                  <span>Contato</span>
                  <strong>{selectedTicket.contactPreference || 'EMAIL'}</strong>
                </div>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>Status</span>
                  <select value={activeTicketDraft.status} onChange={(event) => updateTicketDraft('status', event.target.value)}>
                    {Object.entries(SUPPORT_TICKET_STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.formField}>
                  <span>Prioridade</span>
                  <select value={activeTicketDraft.priority} onChange={(event) => updateTicketDraft('priority', event.target.value)}>
                    {Object.entries(SUPPORT_TICKET_PRIORITY_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Resposta ao usuário</span>
                  <textarea
                    rows={5}
                    value={activeTicketDraft.publicReply}
                    onChange={(event) => updateTicketDraft('publicReply', event.target.value)}
                    placeholder="Escreva a resposta que será exibida para o usuário no acompanhamento do ticket."
                  />
                </label>
                <label className={`${styles.formField} ${styles.formFieldFull}`}>
                  <span>Nota interna</span>
                  <textarea
                    rows={5}
                    value={activeTicketDraft.adminNote}
                    onChange={(event) => updateTicketDraft('adminNote', event.target.value)}
                    placeholder="Observação operacional apenas para o time admin."
                  />
                </label>
              </div>

              <button type="button" className={styles.primaryButton} onClick={saveTicket} disabled={ticketSaving}>
                <FaFloppyDisk /> {ticketSaving ? 'Salvando...' : 'Salvar atendimento'}
              </button>
          </>
        )}
      </AdminModal>
    </section>
  );
}

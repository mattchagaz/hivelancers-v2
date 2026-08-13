import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FaInbox } from 'react-icons/fa6';
import styles from '../Orders.module.css';
import UserAvatar from '../UserAvatar';
import { getPublicProfilePath } from '../../../../utils/profileEnhancements';
import {
  acceptOrder,
  approveOrder,
  cancelOrder,
  deliverOrder,
  openOrderDispute,
  rejectOrder,
  requestOrderRevision,
} from '../../../../services/orders';
import {
  DISPUTE_REASON_LABEL,
  EVENT_LABEL,
  MOBILE_STAGE_LABELS,
  ORDER_STAGES,
  STATUS_LABEL,
  formatDateTime,
  formatPrice,
  formatRelativeDate,
  getEventDescription,
  getName,
  getNextActionCopy,
  getOrderStageState,
  parseDeliveryAssets,
} from '../Orders.helpers';
import { useOrders } from '../OrdersContext';

export default function OrderDetail() {
  const {
    loadingOrder,
    selectedOrder,
    selectedTone,
    isNewSellerPending,
    selectedStageLabel,
    selectedProgress,
    actionNote,
    setActionNote,
    actionLoading,
    runAction,
    counterparty,
    isSeller,
    isBuyer,
    user,
    cancelReason,
    setCancelReason,
    disputeReason,
    setDisputeReason,
    disputeDescription,
    setDisputeDescription,
    deliveryNote,
    setDeliveryNote,
    deliveryAssets,
    setDeliveryAssets,
    revisionNote,
    setRevisionNote,
    reviewRating,
    setReviewRating,
    reviewComment,
    setReviewComment,
    submitReview,
  } = useOrders();

  return (
    <section className={styles.modalBody}>
      {loadingOrder ? (
        <div className={styles.emptyStateLarge}>Carregando pedido...</div>
      ) : !selectedOrder ? (
        <div className={styles.emptyStateLarge}>
          <div className={styles.emptyIcon}><FaInbox /></div>
          <strong>Pedido indisponível</strong>
          <p>Não foi possível carregar este pedido agora. Atualize a fila e tente novamente.</p>
        </div>
      ) : (
        <>
          <div className={`${styles.detailHero} ${styles[`detailHero${selectedTone}`]} ${isNewSellerPending ? styles.detailHeroNewOrder : ''}`}>
            <div className={styles.detailHeroMain}>
              <div className={styles.detailEyebrow}>
                <span className={`${styles.statusBadge} ${styles[`status${selectedOrder.status}`]}`}>
                  {isNewSellerPending ? 'Novo pedido recebido' : STATUS_LABEL[selectedOrder.status] || selectedOrder.status}
                </span>
                <span className={styles.detailId}>#{selectedOrder.id.slice(-8).toUpperCase()}</span>
              </div>

              <h2>{isNewSellerPending ? 'Revise o pedido antes de iniciar' : selectedOrder.service?.title || selectedOrder.planTitle}</h2>
              <p className={styles.detailLead}>
                {isNewSellerPending
                  ? `${getName(selectedOrder.client)} contratou ${selectedOrder.service?.title || selectedOrder.planTitle}. Confirme se o escopo, prazo e briefing estão claros antes de aceitar.`
                  : (
                    <>
                      Plano {selectedOrder.planTitle} · {formatPrice(selectedOrder.priceCents)} ·{' '}
                      {selectedOrder.deliveryDays} {selectedOrder.deliveryDays === 1 ? 'dia' : 'dias'} para entrega
                    </>
                  )}
              </p>

              <div className={styles.flowMeter}>
                <div className={styles.flowMeterHeader}>
                  <span>{selectedStageLabel}</span>
                  <strong>{selectedProgress}%</strong>
                </div>
                <div className={styles.flowRail}>
                  <span style={{ width: `${selectedProgress}%` }} />
                </div>
              </div>

              <div className={styles.progressTrack}>
                {ORDER_STAGES.map((stage) => {
                  const state = getOrderStageState(selectedOrder.status, stage.key);

                  return (
                    <div key={stage.key} className={styles.progressStep}>
                      <div className={`${styles.progressDot} ${styles[`progress${state}`]}`} />
                      <span className={`${styles.progressLabel} ${styles[`progressLabel${state}`]}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className={styles.mobileStepper}>
                {ORDER_STAGES.map((stage, index) => {
                  const state = getOrderStageState(selectedOrder.status, stage.key);

                  return (
                    <div key={stage.key} className={styles.mobileStep}>
                      <div className={styles.mobileStepLine}>
                        <span className={`${styles.mobileStepDot} ${styles[`mobileStepDot${state}`]}`} />
                        {index < ORDER_STAGES.length - 1 && (
                          <span className={`${styles.mobileStepConnector} ${styles[`mobileStepConnector${state}`]}`} />
                        )}
                      </div>
                      <span className={`${styles.mobileStepLabel} ${styles[`mobileStepLabel${state}`]}`}>
                        {MOBILE_STAGE_LABELS[stage.key]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.detailHeroSide}>
              {isNewSellerPending ? (
                <div className={styles.decisionCard}>
                  <Link
                    to={getPublicProfilePath(selectedOrder.client)}
                    className={styles.personCard}
                  >
                    <UserAvatar
                      person={selectedOrder.client}
                      className={`${styles.personAvatar} ${styles[`avatar${selectedTone}`]}`}
                    />
                    <div>
                      <span className={styles.personLabel}>Cliente deste pedido</span>
                      <strong>{getName(selectedOrder.client)}</strong>
                      <p>{selectedOrder.client?.username ? `@${selectedOrder.client.username}` : 'Perfil ainda sem username'}</p>
                    </div>
                  </Link>

                  <div className={styles.decisionMetrics}>
                    <div>
                      <span>Valor protegido</span>
                      <strong>{formatPrice(selectedOrder.priceCents)}</strong>
                    </div>
                    <div>
                      <span>Prazo contratado</span>
                      <strong>{selectedOrder.deliveryDays} {selectedOrder.deliveryDays === 1 ? 'dia' : 'dias'}</strong>
                    </div>
                  </div>

                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={actionNote}
                    onChange={(event) => setActionNote(event.target.value)}
                    placeholder="Nota opcional para o cliente antes de aceitar ou recusar."
                  />

                  <div className={styles.decisionActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={actionLoading === 'accept'}
                      onClick={() =>
                        runAction(
                          'accept',
                          () => acceptOrder(selectedOrder.id, actionNote.trim() ? { note: actionNote.trim() } : {}),
                          'Pedido aceito.'
                        )
                      }
                    >
                      {actionLoading === 'accept' ? 'Aceitando...' : 'Aceitar pedido'}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={actionLoading === 'reject'}
                      onClick={() =>
                        runAction(
                          'reject',
                          () => rejectOrder(selectedOrder.id, actionNote.trim() ? { note: actionNote.trim() } : {}),
                          'Pedido recusado.'
                        )
                      }
                    >
                      {actionLoading === 'reject' ? 'Recusando...' : 'Recusar'}
                    </button>
                  </div>

                  {selectedOrder.conversationId && (
                    <Link to={`/messages?chat=${selectedOrder.conversationId}`} className={styles.primaryLink}>
                      Abrir conversa
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to={getPublicProfilePath(counterparty)}
                    className={styles.personCard}
                  >
                    <UserAvatar
                      person={counterparty}
                      className={`${styles.personAvatar} ${styles[`avatar${selectedTone}`]}`}
                    />
                    <div>
                      <span className={styles.personLabel}>
                        {isSeller ? 'Cliente deste pedido' : 'Freelancer deste pedido'}
                      </span>
                      <strong>{getName(counterparty)}</strong>
                      <p>{counterparty?.username ? `@${counterparty.username}` : 'Perfil ainda sem username'}</p>
                    </div>
                  </Link>

                  <div className={styles.nextActionCard}>
                    <span>Próximo passo</span>
                    <p className={styles.nextActionCopy}>
                      {getNextActionCopy(selectedOrder, user?.id)}
                    </p>
                  </div>

                  {selectedOrder.conversationId && (
                    <Link to={`/messages?chat=${selectedOrder.conversationId}`} className={styles.primaryLink}>
                      Abrir conversa
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailMain}>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>Cliente</span>
                  <Link to={getPublicProfilePath(selectedOrder.client)} className={styles.infoCardLink}>
                    <strong>{getName(selectedOrder.client)}</strong>
                  </Link>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>Freelancer</span>
                  <Link to={getPublicProfilePath(selectedOrder.freelancer)} className={styles.infoCardLink}>
                    <strong>{getName(selectedOrder.freelancer)}</strong>
                  </Link>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>Revisões</span>
                  <strong>{selectedOrder.revisionsUsed} / {selectedOrder.revisionsAllowed}</strong>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoLabel}>Atualizado em</span>
                  <strong>{formatDateTime(selectedOrder.updatedAt)}</strong>
                </div>
              </div>

              <div className={styles.detailContentGrid}>
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionKicker}>Escopo</span>
                      <h3>Briefing e requisitos</h3>
                      <p className={styles.sectionText}>
                        Combinado inicial do pedido, salvo para consulta rápida durante a execução.
                      </p>
                    </div>
                  </div>
                  <p className={styles.longText}>
                    {selectedOrder.requirements || 'Nenhum requisito adicional informado.'}
                  </p>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <span className={styles.sectionKicker}>Entrega</span>
                      <h3>Entrega atual</h3>
                      <p className={styles.sectionText}>
                        Material enviado pelo freelancer e links registrados na entrega formal.
                      </p>
                    </div>
                  </div>
                  <p className={styles.longText}>
                    {selectedOrder.deliveryNote || 'Nenhuma entrega registrada ainda.'}
                  </p>
                  {selectedOrder.deliveryAssets?.length > 0 && (
                    <div className={styles.assetGrid}>
                      {selectedOrder.deliveryAssets.map((asset) => (
                        <a
                          key={asset.id}
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.assetCard}
                        >
                          <span className={styles.assetLabel}>{asset.label || 'Arquivo entregue'}</span>
                          <strong className={styles.assetUrl}>{asset.url}</strong>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.sectionKicker}>Histórico</span>
                    <h3>Histórico do pedido</h3>
                    <p className={styles.sectionText}>
                      Cada mudança relevante no fluxo fica registrada com ator, contexto e horário.
                    </p>
                  </div>
                </div>
                <div className={styles.timeline}>
                  {(selectedOrder.events || []).map((event) => (
                    <div key={event.id} className={styles.timelineItem}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineBody}>
                        <strong>{EVENT_LABEL[event.type] || event.type}</strong>
                        <p>{getEventDescription(event)}</p>
                        <span>
                          {event.actor?.firstName ? `${event.actor.firstName} ${event.actor.lastName || ''} · ` : ''}
                          {formatDateTime(event.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className={styles.detailSide}>
              <div className={styles.sideCard}>
                <span className={styles.sideCardLabel}>Resumo operacional</span>
                <div className={styles.sideMetric}>
                  <span>Valor do pedido</span>
                  <strong>{formatPrice(selectedOrder.priceCents)}</strong>
                </div>
                <div className={styles.sideMetric}>
                  <span>Prazo prometido</span>
                  <strong>{selectedOrder.deliveryDays} {selectedOrder.deliveryDays === 1 ? 'dia' : 'dias'}</strong>
                </div>
                <div className={styles.sideMetric}>
                  <span>Ultima atualizacao</span>
                  <strong>{formatRelativeDate(selectedOrder.updatedAt)}</strong>
                </div>
              </div>

              {selectedOrder.dispute && (
                <div className={`${styles.sideCard} ${styles.disputeCard}`}>
                  <span className={styles.sideCardLabel}>
                    {selectedOrder.dispute.status === 'OPEN' ? 'Disputa em análise' : 'Decisão da disputa'}
                  </span>
                  <div className={styles.disputeSummary}>
                    <strong>
                      {DISPUTE_REASON_LABEL[selectedOrder.dispute.reason] || selectedOrder.dispute.reason}
                    </strong>
                    <p>{selectedOrder.dispute.description}</p>
                    <span>
                      Aberta por {getName(selectedOrder.dispute.openedBy)} em{' '}
                      {formatDateTime(selectedOrder.dispute.createdAt)}
                    </span>
                  </div>
                  {selectedOrder.dispute.resolutionNote && (
                    <div className={styles.resolutionBox}>
                      <strong>
                        {selectedOrder.dispute.status === 'RESOLVED_CLIENT'
                          ? 'Reembolso decidido para o cliente'
                          : 'Pagamento liberado ao freelancer'}
                      </strong>
                      <p>{selectedOrder.dispute.resolutionNote}</p>
                      <span>{formatDateTime(selectedOrder.dispute.resolvedAt)}</span>
                    </div>
                  )}
                </div>
              )}

              {isBuyer && selectedOrder.status === 'PENDING' && (
                <div className={styles.sideCard}>
                  <span className={styles.sideCardLabel}>Cancelar antes do início</span>
                  <p className={styles.sideHelp}>
                    O cancelamento só é permitido enquanto o freelancer ainda não aceitou.
                  </p>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    placeholder="Explique o motivo do cancelamento (mínimo de 10 caracteres)."
                  />
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={actionLoading === 'cancel'}
                    onClick={() => {
                      if (cancelReason.trim().length < 10) {
                        toast.error('Explique o cancelamento com pelo menos 10 caracteres.');
                        return;
                      }
                      runAction(
                        'cancel',
                        () => cancelOrder(selectedOrder.id, { reason: cancelReason.trim() }),
                        'Pedido cancelado e pagamento devolvido quando aplicável.'
                      );
                    }}
                  >
                    {actionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar pedido'}
                  </button>
                </div>
              )}

              {(isBuyer || isSeller) && ['IN_PROGRESS', 'DELIVERED'].includes(selectedOrder.status) && (
                <div className={`${styles.sideCard} ${styles.disputeCard}`}>
                  <span className={styles.sideCardLabel}>Precisa de mediação?</span>
                  <p className={styles.sideHelp}>
                    Abrir uma disputa pausa o fluxo do pedido até uma decisão administrativa.
                  </p>
                  <select
                    className={`${styles.select} ${styles.sideSelect}`}
                    value={disputeReason}
                    onChange={(event) => setDisputeReason(event.target.value)}
                  >
                    {Object.entries(DISPUTE_REASON_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={disputeDescription}
                    onChange={(event) => setDisputeDescription(event.target.value)}
                    placeholder="Descreva o ocorrido com datas e fatos relevantes (mínimo de 20 caracteres)."
                  />
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={actionLoading === 'dispute'}
                    onClick={() => {
                      if (disputeDescription.trim().length < 20) {
                        toast.error('Descreva o problema com pelo menos 20 caracteres.');
                        return;
                      }
                      runAction(
                        'dispute',
                        () => openOrderDispute(selectedOrder.id, {
                          reason: disputeReason,
                          description: disputeDescription.trim(),
                        }),
                        'Disputa aberta. O pedido foi pausado para análise.'
                      );
                    }}
                  >
                    {actionLoading === 'dispute' ? 'Abrindo disputa...' : 'Abrir disputa'}
                  </button>
                </div>
              )}

              {isSeller && selectedOrder.status === 'PENDING' && !isNewSellerPending && (
                <div className={styles.sideCard}>
                  <span className={styles.sideCardLabel}>Responder ao pedido</span>
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={actionNote}
                    onChange={(event) => setActionNote(event.target.value)}
                    placeholder="Escreva uma nota opcional para aceitar ou recusar."
                  />
                  <div className={styles.actionStack}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={actionLoading === 'accept'}
                      onClick={() =>
                        runAction(
                          'accept',
                          () => acceptOrder(selectedOrder.id, actionNote.trim() ? { note: actionNote.trim() } : {}),
                          'Pedido aceito.'
                        )
                      }
                    >
                      {actionLoading === 'accept' ? 'Aceitando...' : 'Aceitar pedido'}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={actionLoading === 'reject'}
                      onClick={() =>
                        runAction(
                          'reject',
                          () => rejectOrder(selectedOrder.id, actionNote.trim() ? { note: actionNote.trim() } : {}),
                          'Pedido recusado.'
                        )
                      }
                    >
                      {actionLoading === 'reject' ? 'Recusando...' : 'Recusar pedido'}
                    </button>
                  </div>
                </div>
              )}

              {isSeller && selectedOrder.status === 'IN_PROGRESS' && (
                <div className={styles.sideCard}>
                  <span className={styles.sideCardLabel}>Registrar entrega</span>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={deliveryNote}
                    onChange={(event) => setDeliveryNote(event.target.value)}
                    placeholder="Descreva o que está sendo entregue."
                  />
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={deliveryAssets}
                    onChange={(event) => setDeliveryAssets(event.target.value)}
                    placeholder={'Uma URL por linha ou "Label | https://arquivo.com"'}
                  />
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={actionLoading === 'deliver'}
                    onClick={() =>
                      runAction(
                        'deliver',
                        () =>
                          deliverOrder(selectedOrder.id, {
                            ...(deliveryNote.trim() ? { note: deliveryNote.trim() } : {}),
                            assets: parseDeliveryAssets(deliveryAssets),
                          }),
                        'Entrega registrada.'
                      )
                    }
                  >
                    {actionLoading === 'deliver' ? 'Enviando entrega...' : 'Enviar entrega'}
                  </button>
                </div>
              )}

              {isBuyer && selectedOrder.status === 'DELIVERED' && (
                <div className={styles.sideCard}>
                  <span className={styles.sideCardLabel}>Responder a entrega</span>
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={revisionNote}
                    onChange={(event) => setRevisionNote(event.target.value)}
                    placeholder="Escreva uma observação para aprovar ou solicitar revisão."
                  />
                  <div className={styles.actionStack}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={actionLoading === 'approve'}
                      onClick={() =>
                        runAction(
                          'approve',
                          () => approveOrder(selectedOrder.id, revisionNote.trim() ? { note: revisionNote.trim() } : {}),
                          'Pedido aprovado.'
                        )
                      }
                    >
                      {actionLoading === 'approve' ? 'Aprovando...' : 'Aprovar entrega'}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={actionLoading === 'revision'}
                      onClick={() => {
                        if (!revisionNote.trim()) {
                          toast.error('Explique o que precisa ser ajustado.');
                          return;
                        }

                        runAction(
                          'revision',
                          () => requestOrderRevision(selectedOrder.id, { note: revisionNote.trim() }),
                          'Revisão solicitada.'
                        );
                      }}
                    >
                      {actionLoading === 'revision' ? 'Solicitando...' : 'Pedir revisão'}
                    </button>
                  </div>
                </div>
              )}

              {counterparty?.username && (
                <div className={styles.sideCard}>
                  <span className={styles.sideCardLabel}>Perfil relacionado</span>
                  <Link to={`/profile/${counterparty.username}`} className={styles.profileLink}>
                    Ver perfil de @{counterparty.username}
                  </Link>
                </div>
              )}

              {isBuyer && selectedOrder.status === 'COMPLETED' && (
                <div className={styles.sideCard}>
                  <span className={styles.sideCardLabel}>Avaliação</span>
                  {selectedOrder.review ? (
                    <div className={styles.reviewResult}>
                      <strong>{'★'.repeat(selectedOrder.review.rating)}{'☆'.repeat(5 - selectedOrder.review.rating)}</strong>
                      <p>{selectedOrder.review.comment || 'Pedido avaliado sem comentário.'}</p>
                      <span>{formatDateTime(selectedOrder.review.createdAt)}</span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.ratingPicker}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={value <= reviewRating ? styles.starActive : styles.starButton}
                            onClick={() => setReviewRating(value)}
                            aria-label={`${value} estrelas`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        className={styles.textarea}
                        rows={4}
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
                        placeholder="Conte como foi trabalhar com este freelancer."
                      />
                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={actionLoading === 'review'}
                        onClick={submitReview}
                      >
                        {actionLoading === 'review' ? 'Enviando...' : 'Enviar avaliação'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

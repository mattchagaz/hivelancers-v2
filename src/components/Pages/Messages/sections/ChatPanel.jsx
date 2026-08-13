import { Link } from 'react-router-dom';
import { FaCircle, FaClock, FaComments, FaPaperPlane } from 'react-icons/fa';
import { FaFileInvoiceDollar } from 'react-icons/fa6';
import styles from '../Messages.module.css';
import EmptyState from '../../../UI/EmptyState/EmptyState';
import { formatFullTime, formatTime, getSenderId, toId } from '../Messages.helpers';
import { useMessages } from '../MessagesContext';

const formatPrice = (cents = 0) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(cents / 100);

const PROPOSAL_STATUS_LABEL = {
  PENDING: 'Aguardando resposta',
  PAYMENT_PENDING: 'Pagamento em processamento',
  ACCEPTED: 'Aceita',
  DECLINED: 'Recusada',
  EXPIRED: 'Expirada',
};

function ProposalCard({ proposal, isMine, onAccept, onNegotiate }) {
  const canRespond = !isMine && proposal.status === 'PENDING';
  return (
    <div className={styles.proposalCard}>
      <span className={styles.proposalKicker}><FaFileInvoiceDollar /> Proposta</span>
      <strong className={styles.proposalTitle}>{proposal.title}</strong>
      {proposal.description && <p className={styles.proposalDescription}>{proposal.description}</p>}
      <div className={styles.proposalMeta}>
        <span>{formatPrice(proposal.priceCents)}</span>
        <span>{proposal.deliveryDays} dias</span>
      </div>
      {canRespond ? (
        <div className={styles.proposalActions}>
          <button type="button" className={styles.proposalAccept} onClick={() => onAccept(proposal)}>Aceitar</button>
          <button type="button" className={styles.proposalNegotiate} onClick={onNegotiate}>Negociar</button>
        </div>
      ) : (
        <span className={`${styles.proposalStatus} ${styles[`proposalStatus${proposal.status}`] || ''}`}>
          {PROPOSAL_STATUS_LABEL[proposal.status] || proposal.status}
        </span>
      )}
    </div>
  );
}

export default function ChatPanel() {
  const {
    mobileShowChat,
    activeId,
    conversations,
    setConversationFilter,
    handleBack,
    otherUser,
    otherProfileHandle,
    otherName,
    isOtherTyping,
    activeConversation,
    setDeleteConfirm,
    loadingMsgs,
    messages,
    inputRef,
    groupedMessages,
    user,
    setReplyingTo,
    setDeleteMsgConfirm,
    findSenderName,
    setLightboxUrl,
    messagesEndRef,
    messagesAreaRef,
    replyingTo,
    imagePreview,
    setImagePreview,
    handleSend,
    fileInputRef,
    handleFileSelect,
    uploading,
    text,
    setText,
    handleTextChange,
    sending,
    showProposalForm,
    setShowProposalForm,
    proposalForm,
    updateProposalForm,
    sendingProposal,
    handleSendProposal,
    openAcceptModal,
  } = useMessages();

  const isOtherOnline = Boolean(activeConversation?.online || otherUser?.online);
  const canSendProposal = user?.userType === 'FREELANCER';

  const handleNegotiate = () => {
    setText((current) => current || `Sobre a proposta: `);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  return (
    <div className={`${styles.chat} ${mobileShowChat ? styles.chatVisible : ''}`}>
      {!activeId ? (
        <div className={styles.noChat}>
          <EmptyState
            className={styles.noChatCard}
            icon={<FaComments />}
            eyebrow="Central de conversas"
            title="Selecione uma conversa"
            description="Abra uma conversa da inbox para continuar o alinhamento com cliente ou freelancer."
            actionLabel={conversations.length ? 'Ver não lidas' : 'Explorar serviços'}
            actionOnClick={conversations.length ? () => setConversationFilter('unread') : undefined}
            actionTo={!conversations.length ? '/explore' : undefined}
          />
        </div>
      ) : (
        <>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <button className={styles.backBtn} onClick={handleBack}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className={styles.chatAvatar}>
              {otherUser?.avatarUrl ? <img src={otherUser.avatarUrl} alt="" className={styles.chatAvatarImg} /> : (otherUser?.firstName?.[0] || 'U').toUpperCase()}
            </div>

            <div className={styles.chatUserInfo}>
              {otherProfileHandle ? (
                <Link to={`/profile/${otherProfileHandle}`} className={styles.chatUserName}>{otherName || 'Usuário'}</Link>
              ) : (
                <span className={styles.chatUserName}>{otherName || 'Usuário'}</span>
              )}
              <div className={styles.chatHeaderMeta}>
                <span className={`${styles.chatUserStatus} ${isOtherOnline ? styles.chatUserOnline : ''} ${isOtherTyping ? styles.chatUserTyping : ''}`}>
                  <FaCircle />
                  {isOtherTyping ? 'Digitando...' : isOtherOnline ? 'Online' : 'Offline'}
                </span>
                {activeConversation?.updatedAt ? (
                  <span className={styles.chatUpdatedAt}>
                    <FaClock />
                    {formatTime(activeConversation.updatedAt)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className={styles.chatActions}>
              {otherProfileHandle && (
                <Link to={`/profile/${otherProfileHandle}`} className={`${styles.chatActionBtn} ${styles.profileActionBtn}`} title="Ver perfil">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Perfil</span>
                </Link>
              )}
              <button className={`${styles.chatActionBtn} ${styles.deleteConvBtn}`} title="Excluir conversa" onClick={() => setDeleteConfirm(activeId)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messagesArea} ref={messagesAreaRef}>
            {loadingMsgs ? (
              <div className={styles.loadingState}>Carregando mensagens...</div>
            ) : messages.length === 0 ? (
              <EmptyState
                compact
                className={styles.emptyMessages}
                icon={<FaPaperPlane />}
                title="Conversa pronta"
                description={`Envie a primeira mensagem para ${otherName || 'este contato'}.`}
                actionLabel="Escrever mensagem"
                actionOnClick={() => inputRef.current?.focus({ preventScroll: true })}
              />
            ) : (
              groupedMessages.map((group) => (
                <div key={group.date}>
                  <div className={styles.dateSeparator}><span>{group.dateLabel}</span></div>
                  {group.items.map((msg) => {
                    const isMine = toId(getSenderId(msg)) === toId(user?.id);
                    const isDeleted = !!msg.deletedAt;
                    return (
                      <div key={msg.id} className={`${styles.message} ${isMine ? styles.messageMine : styles.messageTheirs}`}>
                        <div className={`${styles.bubbleWrap} ${isMine ? styles.bubbleWrapMine : ''}`}>
                          {/* Action buttons */}
                          {!isDeleted && (
                            <div className={`${styles.msgActions} ${isMine ? styles.msgActionsMine : ''}`}>
                              <button className={styles.msgActionBtn} title="Responder" onClick={() => { setReplyingTo(msg); setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 17 4 12 9 7" />
                                  <path d="M20 18v-2a4 4 0 00-4-4H4" />
                                </svg>
                              </button>
                              {isMine && (
                                <button className={styles.msgActionBtn} title="Apagar" onClick={() => setDeleteMsgConfirm(msg)}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                          {msg.proposal && !isDeleted ? (
                            <ProposalCard
                              proposal={msg.proposal}
                              isMine={isMine}
                              onAccept={openAcceptModal}
                              onNegotiate={handleNegotiate}
                            />
                          ) : (
                          <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs} ${isDeleted ? styles.bubbleDeleted : ''}`}>
                            {/* Reply quote */}
                            {msg.replyTo && (
                              <div className={`${styles.replyQuote} ${isMine ? styles.replyQuoteMine : ''}`}>
                                <span className={styles.replyQuoteName}>{findSenderName(msg.replyTo.senderId)}</span>
                                <span className={styles.replyQuoteText}>
                                  {msg.replyTo.deletedAt
                                    ? 'Mensagem apagada'
                                    : msg.replyTo.imageUrl && !msg.replyTo.content
                                      ? 'Imagem'
                                      : msg.replyTo.content}
                                </span>
                              </div>
                            )}
                            {/* Image */}
                            {msg.imageUrl && !isDeleted && (
                              <img
                                src={msg.imageUrl}
                                alt="Anexo"
                                className={styles.bubbleImage}
                                onClick={() => setLightboxUrl(msg.imageUrl)}
                              />
                            )}
                            {/* Text */}
                            {msg.content && (
                              <p className={`${styles.bubbleText} ${isDeleted ? styles.bubbleTextDeleted : ''}`}>
                                {isDeleted ? 'Mensagem apagada' : msg.content}
                              </p>
                            )}
                            {!msg.content && !isDeleted && !msg.imageUrl && (
                              <p className={styles.bubbleText}>&nbsp;</p>
                            )}
                            <span className={styles.bubbleTime}>{formatFullTime(msg.createdAt)}</span>
                          </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            {isOtherTyping && !loadingMsgs && (
              <div className={`${styles.message} ${styles.messageTheirs}`}>
                <div className={`${styles.bubble} ${styles.bubbleTheirs} ${styles.typingBubble}`}>
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply / Image preview strip */}
          {(replyingTo || imagePreview) && (
            <div className={styles.previewStrip}>
              {replyingTo && (
                <div className={styles.replyPreview}>
                  <div className={styles.replyPreviewContent}>
                    <span className={styles.replyPreviewLabel}>Respondendo a {findSenderName(replyingTo.senderId)}</span>
                    <span className={styles.replyPreviewText}>
                      {replyingTo.imageUrl && !replyingTo.content ? 'Imagem' : replyingTo.content}
                    </span>
                  </div>
                  <button className={styles.previewClose} onClick={() => setReplyingTo(null)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              {imagePreview && (
                <div className={styles.imagePreview}>
                  <img src={imagePreview} alt="Preview" className={styles.imagePreviewImg} />
                  <button className={styles.previewClose} onClick={() => setImagePreview(null)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <form className={styles.inputBar} onSubmit={handleSend}>
            <input ref={fileInputRef} type="file" accept="image/*" className={styles.hiddenFileInput} onChange={handleFileSelect} />
            <button type="button" className={styles.attachBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Anexar imagem">
              {uploading ? (
                <div className={styles.uploadSpinner} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              )}
            </button>
            {canSendProposal && (
              <button type="button" className={styles.attachBtn} onClick={() => setShowProposalForm(true)} title="Enviar proposta">
                <FaFileInvoiceDollar />
              </button>
            )}
            <input
              ref={inputRef}
              className={styles.messageInput}
              type="text"
              placeholder="Digite uma mensagem..."
              value={text}
              onChange={handleTextChange}
              disabled={sending}
              autoFocus
            />
            <button className={styles.sendBtn} type="submit" disabled={(!text.trim() && !imagePreview) || sending}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </>
      )}

      {showProposalForm && (
        <div className={styles.modalOverlay} onClick={() => !sendingProposal && setShowProposalForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Nova proposta</h3>
            <div className={styles.proposalFormField}>
              <label htmlFor="proposal-title">Título</label>
              <input
                id="proposal-title"
                type="text"
                value={proposalForm.title}
                onChange={(e) => updateProposalForm('title', e.target.value)}
                placeholder="Ex: Landing page + integração de formulário"
                disabled={sendingProposal}
              />
            </div>
            <div className={styles.proposalFormField}>
              <label htmlFor="proposal-description">Escopo</label>
              <textarea
                id="proposal-description"
                rows={3}
                value={proposalForm.description}
                onChange={(e) => updateProposalForm('description', e.target.value)}
                placeholder="O que está incluído nessa proposta?"
                disabled={sendingProposal}
              />
            </div>
            <div className={styles.proposalFormRow}>
              <div className={styles.proposalFormField}>
                <label htmlFor="proposal-price">Valor (R$)</label>
                <input
                  id="proposal-price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={proposalForm.price}
                  onChange={(e) => updateProposalForm('price', e.target.value)}
                  disabled={sendingProposal}
                />
              </div>
              <div className={styles.proposalFormField}>
                <label htmlFor="proposal-delivery">Prazo (dias)</label>
                <input
                  id="proposal-delivery"
                  type="number"
                  min="1"
                  value={proposalForm.deliveryDays}
                  onChange={(e) => updateProposalForm('deliveryDays', e.target.value)}
                  disabled={sendingProposal}
                />
              </div>
              <div className={styles.proposalFormField}>
                <label htmlFor="proposal-revisions">Revisões</label>
                <input
                  id="proposal-revisions"
                  type="number"
                  min="0"
                  value={proposalForm.revisions}
                  onChange={(e) => updateProposalForm('revisions', e.target.value)}
                  disabled={sendingProposal}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setShowProposalForm(false)} disabled={sendingProposal}>Cancelar</button>
              <button className={styles.proposalSubmitBtn} onClick={handleSendProposal} disabled={sendingProposal}>
                {sendingProposal ? 'Enviando...' : 'Enviar proposta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

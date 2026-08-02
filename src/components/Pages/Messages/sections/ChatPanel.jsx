import { Link } from 'react-router-dom';
import { FaCircle, FaClock, FaComments, FaPaperPlane } from 'react-icons/fa';
import styles from '../Messages.module.css';
import EmptyState from '../../../UI/EmptyState/EmptyState';
import { formatFullTime, formatTime, getSenderId, toId } from '../Messages.helpers';
import { useMessages } from '../MessagesContext';

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
    replyingTo,
    imagePreview,
    setImagePreview,
    handleSend,
    fileInputRef,
    handleFileSelect,
    uploading,
    text,
    handleTextChange,
    sending,
  } = useMessages();

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
                <span className={`${styles.chatUserStatus} ${isOtherTyping ? styles.chatUserTyping : ''}`}>
                  <FaCircle />
                  {isOtherTyping ? 'Digitando...' : activeConversation?.online || otherUser?.online ? 'Online' : 'Offline'}
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
          <div className={styles.messagesArea}>
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
                actionOnClick={() => inputRef.current?.focus()}
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
                              <button className={styles.msgActionBtn} title="Responder" onClick={() => { setReplyingTo(msg); setTimeout(() => inputRef.current?.focus(), 0); }}>
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
    </div>
  );
}

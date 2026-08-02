import { FaCircle, FaComments, FaInbox } from 'react-icons/fa';
import styles from '../Messages.module.css';
import EmptyState from '../../../UI/EmptyState/EmptyState';
import SpotlightCard from '../../../UI/SpotlightCard/SpotlightCard';
import {
  formatTime,
  getOtherParticipant,
  getParticipantInitials,
  getParticipantName,
  toId,
} from '../Messages.helpers';
import { useMessages } from '../MessagesContext';

export default function ConversationList() {
  const {
    mobileShowChat,
    conversations,
    unreadTotal,
    onlineTotal,
    search,
    setSearch,
    conversationFilter,
    setConversationFilter,
    loadingConvs,
    filteredConversations,
    hasConversationFilter,
    clearConversationFilters,
    user,
    activeId,
    selectConversation,
  } = useMessages();

  return (
    <aside className={`${styles.sidebar} ${mobileShowChat ? styles.sidebarHidden : ''}`}>
      <div className={styles.sidebarHead}>
        <div>
          <span className={styles.sidebarEyebrow}>Inbox</span>
          <h1 className={styles.sidebarTitle}>Mensagens</h1>
        </div>
        <span className={styles.convCount}>{conversations.length}</span>
      </div>

      <div className={styles.sidebarStats}>
        <span>
          <FaInbox />
          {unreadTotal ? `${unreadTotal} não lidas` : 'Tudo lido'}
        </span>
        <span>
          <FaCircle />
          {onlineTotal} online
        </span>
      </div>

      <div className={styles.searchWrap}>
        <svg className={styles.searchIco} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input className={styles.searchInput} type="text" placeholder="Buscar conversa..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className={styles.inboxTabs}>
        <button
          type="button"
          className={`${styles.inboxTab} ${conversationFilter === 'all' ? styles.inboxTabActive : ''}`}
          onClick={() => setConversationFilter('all')}
        >
          Todas
        </button>
        <button
          type="button"
          className={`${styles.inboxTab} ${conversationFilter === 'unread' ? styles.inboxTabActive : ''}`}
          onClick={() => setConversationFilter('unread')}
        >
          Não lidas
          {unreadTotal > 0 ? <span>{unreadTotal}</span> : null}
        </button>
      </div>

      <div className={styles.convList}>
        {loadingConvs ? (
          <div className={styles.loadingState}>Carregando conversas...</div>
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            compact
            className={styles.emptyConvs}
            icon={<FaComments />}
            title={
              hasConversationFilter
                ? 'Nada por aqui'
                : 'Nenhuma conversa ainda'
            }
            description={
              hasConversationFilter
                ? 'Remova filtros ou tente buscar por outro nome.'
                : 'As conversas iniciadas em perfis, serviços e pedidos aparecem neste painel.'
            }
            actionLabel={hasConversationFilter ? 'Limpar filtros' : 'Explorar serviços'}
            actionOnClick={hasConversationFilter ? clearConversationFilters : undefined}
            actionTo={!hasConversationFilter ? '/explore' : undefined}
          />
        ) : (
          filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv, user?.id);
            const name = getParticipantName(other);
            const initials = getParticipantInitials(other);
            const lastMsg = conv.lastMessage;
            const isOwn = toId(lastMsg?.senderId) === toId(user?.id);
            const unread = conv.unreadCount > 0;
            const isActive = toId(conv.id) === toId(activeId);
            const previewText = lastMsg?.deletedAt
              ? 'Mensagem apagada'
              : lastMsg?.imageUrl && !lastMsg?.content
                ? 'Imagem'
                : lastMsg?.content || 'Sem mensagens';

            return (
              <SpotlightCard
                key={conv.id}
                className={`${styles.convSurface} ${isActive ? styles.convSurfaceActive : ''} ${unread ? styles.convSurfaceUnread : ''}`}
                spotlightColor="rgba(62, 115, 230, 0.12)"
              >
                <button
                  className={styles.convItem}
                  onClick={() => selectConversation(conv.id)}
                >
                  <div className={styles.convAvatar}>
                    {other?.avatarUrl ? <img src={other.avatarUrl} alt="" className={styles.convAvatarImg} /> : initials || 'U'}
                    {(conv.online || other?.online) && <span className={styles.onlineDot} />}
                  </div>
                  <div className={styles.convBody}>
                    <div className={styles.convTop}>
                      <span className={styles.convName}>{name}</span>
                      {lastMsg && <span className={styles.convTime}>{formatTime(lastMsg.createdAt)}</span>}
                    </div>
                    <div className={styles.convBottom}>
                      <span className={styles.convPreview}>{isOwn && 'Você: '}{previewText}</span>
                      {unread && <span className={styles.unreadBadge}>{conv.unreadCount}</span>}
                    </div>
                  </div>
                </button>
              </SpotlightCard>
            );
          })
        )}
      </div>
    </aside>
  );
}

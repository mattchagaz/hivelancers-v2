import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import {
  listConversations,
  getMessages,
  sendMessage,
} from '../../../services/messages';
import styles from './Messages.module.css';

const POLL_INTERVAL = 8000;

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatFullTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today - msgDate;
  if (diff === 0) return 'Hoje';
  if (diff <= 86400000) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('chat');

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations
  useEffect(() => {
    let cancelled = false;
    setLoadingConvs(true);
    listConversations()
      .then((data) => { if (!cancelled) setConversations(data); })
      .catch((err) => { if (!cancelled) toast.error(err.message); })
      .finally(() => { if (!cancelled) setLoadingConvs(false); });
    return () => { cancelled = true; };
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingMsgs(true);
    getMessages(activeId)
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      })
      .catch((err) => { if (!cancelled) toast.error(err.message); })
      .finally(() => { if (!cancelled) setLoadingMsgs(false); });

    return () => { cancelled = true; };
  }, [activeId, scrollToBottom]);

  // Poll for new messages
  useEffect(() => {
    if (!activeId) return;

    pollRef.current = setInterval(() => {
      getMessages(activeId)
        .then((data) => {
          setMessages((prev) => {
            const newMsgs = data.messages || [];
            if (newMsgs.length !== prev.length) {
              setTimeout(scrollToBottom, 100);
              return newMsgs;
            }
            return prev;
          });
        })
        .catch(() => {});

      listConversations()
        .then(setConversations)
        .catch(() => {});
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [activeId, scrollToBottom]);

  const selectConversation = (id) => {
    setSearchParams({ chat: id });
    setMobileShowChat(true);
    setText('');
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeId || sending) return;

    setSending(true);
    try {
      const msg = await sendMessage(activeId, { content: trimmed });
      setMessages((prev) => [...prev, msg]);
      setText('');
      setTimeout(scrollToBottom, 50);

      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, lastMessage: { content: trimmed, createdAt: msg.createdAt, senderId: user?.id } }
            : c
        )
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeId);
  const otherUser = activeConversation?.participants?.find((p) => p.id !== user?.id) || activeConversation?.otherUser;

  const filteredConversations = search
    ? conversations.filter((c) => {
        const other = c.participants?.find((p) => p.id !== user?.id) || c.otherUser;
        const name = `${other?.firstName || ''} ${other?.lastName || ''}`.toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : conversations;

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups.length || groups[groups.length - 1].date !== dateKey) {
      groups.push({ date: dateKey, dateLabel: formatDateSeparator(msg.createdAt), items: [] });
    }
    groups[groups.length - 1].items.push(msg);
    return groups;
  }, []);

  return (
    <div className={styles.page}>
      {/* Sidebar - Conversations List */}
      <aside className={`${styles.sidebar} ${mobileShowChat ? styles.sidebarHidden : ''}`}>
        <div className={styles.sidebarHead}>
          <h1 className={styles.sidebarTitle}>Mensagens</h1>
          <span className={styles.convCount}>{conversations.length}</span>
        </div>

        <div className={styles.searchWrap}>
          <svg className={styles.searchIco} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.convList}>
          {loadingConvs ? (
            <div className={styles.loadingState}>Carregando conversas...</div>
          ) : filteredConversations.length === 0 ? (
            <div className={styles.emptyConvs}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p>Nenhuma conversa ainda</p>
              <span>Inicie uma conversa a partir do perfil de um freelancer.</span>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.participants?.find((p) => p.id !== user?.id) || conv.otherUser;
              const name = `${other?.firstName || ''} ${other?.lastName || ''}`.trim() || 'Usuário';
              const initials = name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
              const lastMsg = conv.lastMessage;
              const isOwn = lastMsg?.senderId === user?.id;
              const unread = conv.unreadCount > 0;
              const isActive = conv.id === activeId;

              return (
                <button
                  key={conv.id}
                  className={`${styles.convItem} ${isActive ? styles.convItemActive : ''} ${unread ? styles.convItemUnread : ''}`}
                  onClick={() => selectConversation(conv.id)}
                >
                  <div className={styles.convAvatar}>
                    {other?.avatarUrl ? (
                      <img src={other.avatarUrl} alt="" className={styles.convAvatarImg} />
                    ) : (
                      initials || 'U'
                    )}
                    {conv.online && <span className={styles.onlineDot} />}
                  </div>
                  <div className={styles.convBody}>
                    <div className={styles.convTop}>
                      <span className={styles.convName}>{name}</span>
                      {lastMsg && (
                        <span className={styles.convTime}>{formatTime(lastMsg.createdAt)}</span>
                      )}
                    </div>
                    <div className={styles.convBottom}>
                      <span className={styles.convPreview}>
                        {isOwn && 'Você: '}
                        {lastMsg?.content || 'Sem mensagens'}
                      </span>
                      {unread && <span className={styles.unreadBadge}>{conv.unreadCount}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <div className={`${styles.chat} ${mobileShowChat ? styles.chatVisible : ''}`}>
        {!activeId ? (
          <div className={styles.noChat}>
            <div className={styles.noChatIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h2>Selecione uma conversa</h2>
            <p>Escolha uma conversa ao lado ou inicie uma nova a partir do perfil de um freelancer.</p>
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
                {otherUser?.avatarUrl ? (
                  <img src={otherUser.avatarUrl} alt="" className={styles.chatAvatarImg} />
                ) : (
                  (otherUser?.firstName?.[0] || 'U').toUpperCase()
                )}
              </div>

              <div className={styles.chatUserInfo}>
                <span className={styles.chatUserName}>
                  {otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() : 'Usuário'}
                </span>
                <span className={styles.chatUserStatus}>
                  {activeConversation?.online ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className={styles.chatActions}>
                {otherUser?.username && (
                  <Link
                    to={`/profile/${otherUser.username}`}
                    className={styles.chatActionBtn}
                    title="Ver perfil"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea}>
              {loadingMsgs ? (
                <div className={styles.loadingState}>Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className={styles.emptyMessages}>
                  <p>Nenhuma mensagem ainda. Diga oi!</p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.date}>
                    <div className={styles.dateSeparator}>
                      <span>{group.dateLabel}</span>
                    </div>
                    {group.items.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`${styles.message} ${isMine ? styles.messageMine : styles.messageTheirs}`}
                        >
                          <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                            <p className={styles.bubbleText}>{msg.content}</p>
                            <span className={styles.bubbleTime}>{formatFullTime(msg.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className={styles.inputBar} onSubmit={handleSend}>
              <input
                ref={inputRef}
                className={styles.messageInput}
                type="text"
                placeholder="Digite sua mensagem..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending}
                autoFocus
              />
              <button
                className={styles.sendBtn}
                type="submit"
                disabled={!text.trim() || sending}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Messages;

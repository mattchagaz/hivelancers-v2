import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import {
  listConversations,
  getMessages,
  sendMessage,
  deleteMessage as apiDeleteMessage,
  deleteConversation as apiDeleteConversation,
} from '../../../services/messages';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
import {
  connectSocket,
  disconnectSocket,
  emitSocket,
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
} from '../../../services/socket';
import { recordRecentActivity } from '../../../utils/clientRecentActivity';
import styles from './Messages.module.css';

const TYPING_STOP_DELAY = 1200;
const TYPING_STALE_DELAY = 3500;

const toId = (value) => (value === undefined || value === null ? '' : String(value));

const getSenderId = (message) => message?.senderId || message?.sender?.id || message?.userId;

const getMessageConversationId = (message) =>
  message?.conversationId || message?.conversation_id || message?.conversation?.id;

const normalizeMessagePayload = (payload) =>
  payload?.message || payload?.data?.message || payload;

const normalizeConversationPayload = (payload) =>
  payload?.conversation ||
  payload?.data?.conversation ||
  (payload?.participants || payload?.otherUser || payload?.lastMessage ? payload : null);

const getMessageList = (data) =>
  data?.messages || data?.data?.messages || (Array.isArray(data) ? data : []);

const getPayloadConversationId = (payload, message) =>
  payload?.conversationId ||
  payload?.conversation_id ||
  payload?.conversation?.id ||
  payload?.data?.conversationId ||
  getMessageConversationId(message);

const getTypingConversationId = (payload) =>
  payload?.conversationId ||
  payload?.conversation_id ||
  payload?.conversation?.id ||
  payload?.data?.conversationId;

const getTypingUserId = (payload) =>
  payload?.userId ||
  payload?.senderId ||
  payload?.sender?.id ||
  payload?.user?.id ||
  payload?.data?.userId;

const getTypingState = (payload, fallback) => {
  if (typeof payload?.isTyping === 'boolean') return payload.isTyping;
  if (typeof payload?.typing === 'boolean') return payload.typing;
  if (typeof payload?.data?.isTyping === 'boolean') return payload.data.isTyping;
  return fallback;
};

const markConversationRead = (conversationId) => {
  if (!conversationId) return;
  emitSocket('conversation:read', { conversationId });
  emitSocket('mark_as_read', { conversationId });
};

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
  const [socketConnected, setSocketConnected] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteMsgConfirm, setDeleteMsgConfirm] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const userIdRef = useRef(user?.id);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const typingStaleTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
    setIsOtherTyping(false);
    setReplyingTo(null);
    setImagePreview(null);
  }, [activeId]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const moveConversationToTop = useCallback((items, conversationId) => {
    const index = items.findIndex((item) => toId(item.id) === toId(conversationId));
    if (index <= 0) return items;
    const next = [...items];
    const [updated] = next.splice(index, 1);
    return [updated, ...next];
  }, []);

  const emitTypingState = useCallback((isTyping, conversationId = activeIdRef.current) => {
    if (!conversationId) return;
    const payload = { conversationId, userId: userIdRef.current, isTyping };
    emitSocket('conversation:typing', payload);
    emitSocket('typing', payload);
    emitSocket(isTyping ? 'typing:start' : 'typing:stop', payload);
  }, []);

  const stopTyping = useCallback((conversationId = activeIdRef.current) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (!typingRef.current) return;
    typingRef.current = false;
    emitTypingState(false, conversationId);
  }, [emitTypingState]);

  const scheduleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(), TYPING_STOP_DELAY);
  }, [stopTyping]);

  const applyTypingUpdate = useCallback((payload, fallbackTyping) => {
    const conversationId = getTypingConversationId(payload);
    const senderId = getTypingUserId(payload);
    if (conversationId && toId(conversationId) !== toId(activeIdRef.current)) return;
    if (senderId && toId(senderId) === toId(userIdRef.current)) return;
    const typing = getTypingState(payload, fallbackTyping);
    setIsOtherTyping(Boolean(typing));
    if (typingStaleTimeoutRef.current) {
      clearTimeout(typingStaleTimeoutRef.current);
      typingStaleTimeoutRef.current = null;
    }
    if (typing) {
      typingStaleTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), TYPING_STALE_DELAY);
    }
  }, []);

  const applyConversationPreview = useCallback((payload) => {
    const message = normalizeMessagePayload(payload);
    const conversationFromPayload = normalizeConversationPayload(payload);
    const conversationId = getPayloadConversationId(payload, message) || conversationFromPayload?.id;
    if (!conversationId) return;

    setConversations((prev) => {
      let found = false;
      const activeConversationId = activeIdRef.current;
      const currentUserId = userIdRef.current;
      const senderId = getSenderId(message);
      const isActive = toId(activeConversationId) === toId(conversationId);
      const isOwn = toId(senderId) === toId(currentUserId);

      const next = prev.map((conversation) => {
        if (toId(conversation.id) !== toId(conversationId)) return conversation;
        found = true;
        const unreadCount = isActive || isOwn ? 0 : Number(conversation.unreadCount || 0) + 1;
        return {
          ...conversation,
          ...conversationFromPayload,
          participants: conversationFromPayload?.participants || conversation.participants,
          otherUser: conversationFromPayload?.otherUser || conversation.otherUser,
          lastMessage: message?.id || message?.content
            ? { ...message, senderId, createdAt: message.createdAt || new Date().toISOString() }
            : conversationFromPayload?.lastMessage || conversation.lastMessage,
          unreadCount,
        };
      });

      if (!found && conversationFromPayload?.id) return [conversationFromPayload, ...prev];
      return moveConversationToTop(next, conversationId);
    });
  }, [moveConversationToTop]);

  const appendIncomingMessage = useCallback((payload) => {
    const message = normalizeMessagePayload(payload);
    const conversationId = getPayloadConversationId(payload, message);
    const activeConversationId = activeIdRef.current;

    applyConversationPreview(payload);

    if (!message?.id && !message?.content) return;
    if (conversationId && toId(conversationId) !== toId(activeConversationId)) return;

    setMessages((prev) => {
      if (message.id && prev.some((item) => toId(item.id) === toId(message.id))) return prev;
      const next = [...prev, message];
      next.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      return next;
    });

    if (toId(conversationId) === toId(activeConversationId)) {
      markConversationRead(activeConversationId);
      setTimeout(scrollToBottom, 50);
    }
  }, [applyConversationPreview, scrollToBottom]);

  const handleMessageDeleted = useCallback(({ messageId, conversationId }) => {
    if (toId(conversationId) === toId(activeIdRef.current)) {
      setMessages((prev) => prev.map((m) =>
        toId(m.id) === toId(messageId)
          ? { ...m, content: 'Mensagem apagada', imageUrl: null, deletedAt: new Date().toISOString() }
          : m
      ));
    }
  }, []);

  const applyConversationUpdate = useCallback((payload) => {
    const conversation = normalizeConversationPayload(payload);
    if (!conversation?.id) return;
    setConversations((prev) => {
      const exists = prev.some((item) => toId(item.id) === toId(conversation.id));
      const next = exists
        ? prev.map((item) =>
            toId(item.id) === toId(conversation.id)
              ? { ...item, ...conversation, participants: conversation.participants || item.participants, otherUser: conversation.otherUser || item.otherUser }
              : item
          )
        : [conversation, ...prev];
      return moveConversationToTop(next, conversation.id);
    });
  }, [moveConversationToTop]);

  const applyPresenceUpdate = useCallback((payload, fallbackOnline) => {
    const presenceUserId = payload?.userId || payload?.id || payload?.user?.id;
    if (!presenceUserId) return;
    const online = typeof payload?.online === 'boolean' ? payload.online : fallbackOnline;
    setConversations((prev) =>
      prev.map((conversation) => {
        const participants = conversation.participants || [];
        const hasUser = participants.some((p) => toId(p.id) === toId(presenceUserId)) ||
          toId(conversation.otherUser?.id) === toId(presenceUserId);
        if (!hasUser) return conversation;
        return {
          ...conversation,
          online,
          participants: participants.map((p) =>
            toId(p.id) === toId(presenceUserId) ? { ...p, online } : p
          ),
          otherUser: toId(conversation.otherUser?.id) === toId(presenceUserId)
            ? { ...conversation.otherUser, online }
            : conversation.otherUser,
        };
      })
    );
  }, []);

  // Connect socket
  useEffect(() => {
    if (!user?.id) return undefined;
    const socket = connectSocket();
    const handleConnect = () => {
      setSocketConnected(true);
      if (activeIdRef.current) {
        getMessages(activeIdRef.current).then((data) => setMessages(getMessageList(data))).catch(() => {});
      }
      listConversations().then((data) => setConversations(data || [])).catch(() => {});
    };
    const handleDisconnect = () => setSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleDisconnect);
    setSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleDisconnect);
      disconnectSocket();
      setSocketConnected(false);
    };
  }, [user?.id]);

  // Realtime events
  useEffect(() => {
    if (!user?.id) return undefined;
    const socket = getSocket();
    const messageEvents = ['message:new', 'message', 'new_message', 'receive_message', 'conversation:message'];
    const conversationEvents = ['conversation:new', 'conversation:update', 'conversation:updated'];
    const typingStartEvents = ['typing:start', 'user:typing', 'message:typing'];
    const typingStopEvents = ['typing:stop', 'user:stop_typing', 'message:stop_typing'];
    const handleUserOnline = (p) => applyPresenceUpdate(p, true);
    const handleUserOffline = (p) => applyPresenceUpdate(p, false);
    const handleTypingStart = (p) => applyTypingUpdate(p, true);
    const handleTypingStop = (p) => applyTypingUpdate(p, false);

    messageEvents.forEach((e) => socket.on(e, appendIncomingMessage));
    conversationEvents.forEach((e) => socket.on(e, applyConversationUpdate));
    typingStartEvents.forEach((e) => socket.on(e, handleTypingStart));
    typingStopEvents.forEach((e) => socket.on(e, handleTypingStop));
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('presence:update', applyPresenceUpdate);
    socket.on('typing', handleTypingStart);
    socket.on('conversation:typing', handleTypingStart);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      messageEvents.forEach((e) => socket.off(e, appendIncomingMessage));
      conversationEvents.forEach((e) => socket.off(e, applyConversationUpdate));
      typingStartEvents.forEach((e) => socket.off(e, handleTypingStart));
      typingStopEvents.forEach((e) => socket.off(e, handleTypingStop));
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('presence:update', applyPresenceUpdate);
      socket.off('typing', handleTypingStart);
      socket.off('conversation:typing', handleTypingStart);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [appendIncomingMessage, applyConversationUpdate, applyPresenceUpdate, applyTypingUpdate, handleMessageDeleted, user?.id]);

  // Load conversations
  useEffect(() => {
    let cancelled = false;
    setLoadingConvs(true);
    listConversations()
      .then((data) => { if (!cancelled) setConversations(data || []); })
      .catch((err) => { if (!cancelled) toast.error(err.message); })
      .finally(() => { if (!cancelled) setLoadingConvs(false); });
    return () => { cancelled = true; };
  }, []);

  // Subscribe to active conversation room
  useEffect(() => {
    if (!activeId || !socketConnected) return undefined;
    joinConversationRoom(activeId);
    markConversationRead(activeId);
    return () => leaveConversationRoom(activeId);
  }, [activeId, socketConnected]);

  useEffect(() => () => {
    stopTyping();
    if (typingStaleTimeoutRef.current) clearTimeout(typingStaleTimeoutRef.current);
  }, [stopTyping]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      stopTyping();
      return;
    }
    let cancelled = false;
    setLoadingMsgs(true);
    getMessages(activeId)
      .then((data) => {
        if (cancelled) return;
        setMessages(getMessageList(data));
        markConversationRead(activeId);
        setConversations((prev) =>
          prev.map((c) => toId(c.id) === toId(activeId) ? { ...c, unreadCount: 0 } : c)
        );
        setTimeout(scrollToBottom, 100);
      })
      .catch((err) => { if (!cancelled) toast.error(err.message); })
      .finally(() => { if (!cancelled) setLoadingMsgs(false); });
    return () => { cancelled = true; };
  }, [activeId, scrollToBottom, stopTyping]);

  const selectConversation = (id) => {
    stopTyping(activeIdRef.current);
    setSearchParams({ chat: id });
    setMobileShowChat(true);
    setText('');
    setReplyingTo(null);
    setImagePreview(null);
    markConversationRead(id);
    setConversations((prev) =>
      prev.map((c) => toId(c.id) === toId(id) ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleBack = () => setMobileShowChat(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são suportadas.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 10MB).');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadImageToCloudinary(file);
      setImagePreview(url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !imagePreview) || !activeId || sending) return;

    stopTyping(activeId);
    setSending(true);
    try {
      const payload = {};
      if (trimmed) payload.content = trimmed;
      if (imagePreview) payload.imageUrl = imagePreview;
      if (replyingTo?.id) payload.replyToId = replyingTo.id;

      const msg = await sendMessage(activeId, payload);
      if (msg?.id || msg?.content || msg?.imageUrl) {
        appendIncomingMessage({
          conversationId: activeId,
          message: { ...msg, senderId: getSenderId(msg) || user?.id },
        });
      } else {
        const data = await getMessages(activeId);
        const freshMessages = getMessageList(data);
        setMessages(freshMessages);
        if (freshMessages.length > 0) {
          applyConversationPreview({
            conversationId: activeId,
            message: freshMessages[freshMessages.length - 1],
          });
        }
      }
      setText('');
      setReplyingTo(null);
      setImagePreview(null);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteMsgConfirm) return;
    try {
      await apiDeleteMessage(activeId, deleteMsgConfirm.id);
      setMessages((prev) => prev.map((m) =>
        toId(m.id) === toId(deleteMsgConfirm.id)
          ? { ...m, content: 'Mensagem apagada', imageUrl: null, deletedAt: new Date().toISOString() }
          : m
      ));
      setDeleteMsgConfirm(null);
    } catch (err) {
      toast.error(err.message);
      setDeleteMsgConfirm(null);
    }
  };

  const handleDeleteConversation = async () => {
    if (!deleteConfirm) return;
    try {
      await apiDeleteConversation(deleteConfirm);
      setConversations((prev) => prev.filter((c) => toId(c.id) !== toId(deleteConfirm)));
      if (toId(activeId) === toId(deleteConfirm)) {
        setSearchParams({});
        setMessages([]);
        setMobileShowChat(false);
      }
      setDeleteConfirm(null);
      toast.success('Conversa excluída.');
    } catch (err) {
      toast.error(err.message);
      setDeleteConfirm(null);
    }
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    if (!activeId) return;
    if (!value.trim()) { stopTyping(activeId); return; }
    if (!typingRef.current) {
      typingRef.current = true;
      emitTypingState(true, activeId);
    }
    scheduleTypingStop();
  };

  const activeConversation = conversations.find((c) => toId(c.id) === toId(activeId));
  const otherUser = activeConversation?.participants?.find((p) => toId(p.id) !== toId(user?.id)) || activeConversation?.otherUser;
  const otherProfileHandle = otherUser?.username || otherUser?.handle || otherUser?.id;
  const otherName = otherUser ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() : 'Usuário';

  useEffect(() => {
    if (!activeConversation?.id || !user?.id) return;
    recordRecentActivity(user.id, {
      type: 'conversation',
      id: activeConversation.id,
      title: otherName || 'Conversa',
      subtitle: otherProfileHandle ? `@${otherProfileHandle}` : 'Mensagens',
      href: `/messages?chat=${activeConversation.id}`,
    });
  }, [activeConversation?.id, otherName, otherProfileHandle, user?.id]);

  const filteredConversations = search
    ? conversations.filter((c) => {
        const other = c.participants?.find((p) => toId(p.id) !== toId(user?.id)) || c.otherUser;
        const name = `${other?.firstName || ''} ${other?.lastName || ''}`.toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : conversations;

  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups.length || groups[groups.length - 1].date !== dateKey) {
      groups.push({ date: dateKey, dateLabel: formatDateSeparator(msg.createdAt), items: [] });
    }
    groups[groups.length - 1].items.push(msg);
    return groups;
  }, []);

  const findSenderName = (senderId) => {
    if (toId(senderId) === toId(user?.id)) return 'Você';
    return otherName || 'Usuário';
  };

  return (
    <div className={styles.page}>
      {/* Sidebar */}
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
          <input className={styles.searchInput} type="text" placeholder="Buscar conversa..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              const other = conv.participants?.find((p) => toId(p.id) !== toId(user?.id)) || conv.otherUser;
              const name = `${other?.firstName || ''} ${other?.lastName || ''}`.trim() || 'Usuário';
              const initials = name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
              const lastMsg = conv.lastMessage;
              const isOwn = toId(lastMsg?.senderId) === toId(user?.id);
              const unread = conv.unreadCount > 0;
              const isActive = toId(conv.id) === toId(activeId);
              const previewText = lastMsg?.deletedAt
                ? 'Mensagem apagada'
                : lastMsg?.imageUrl && !lastMsg?.content
                  ? '📷 Imagem'
                  : lastMsg?.content || 'Sem mensagens';

              return (
                <button
                  key={conv.id}
                  className={`${styles.convItem} ${isActive ? styles.convItemActive : ''} ${unread ? styles.convItemUnread : ''}`}
                  onClick={() => selectConversation(conv.id)}
                >
                  <div className={styles.convAvatar}>
                    {other?.avatarUrl ? <img src={other.avatarUrl} alt="" className={styles.convAvatarImg} /> : initials || 'U'}
                    {conv.online && <span className={styles.onlineDot} />}
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
                {otherUser?.avatarUrl ? <img src={otherUser.avatarUrl} alt="" className={styles.chatAvatarImg} /> : (otherUser?.firstName?.[0] || 'U').toUpperCase()}
              </div>

              <div className={styles.chatUserInfo}>
                {otherProfileHandle ? (
                  <Link to={`/profile/${otherProfileHandle}`} className={styles.chatUserName}>{otherName || 'Usuário'}</Link>
                ) : (
                  <span className={styles.chatUserName}>{otherName || 'Usuário'}</span>
                )}
                <span className={`${styles.chatUserStatus} ${isOtherTyping ? styles.chatUserTyping : ''}`}>
                  {isOtherTyping ? 'Digitando...' : activeConversation?.online || otherUser?.online ? 'Online' : 'Offline'}
                </span>
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
                <div className={styles.emptyMessages}><p>Nenhuma mensagem ainda. Diga oi!</p></div>
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
                                        ? '📷 Imagem'
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
                        {replyingTo.imageUrl && !replyingTo.content ? '📷 Imagem' : replyingTo.content}
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
                placeholder="Digite sua mensagem..."
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

      {/* Delete conversation modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Excluir conversa</h3>
            <p>Tem certeza que deseja excluir esta conversa? Ela será removida da sua lista.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className={styles.modalConfirm} onClick={handleDeleteConversation}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete message modal */}
      {deleteMsgConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteMsgConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Apagar mensagem</h3>
            <p>Tem certeza que deseja apagar esta mensagem?</p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setDeleteMsgConfirm(null)}>Cancelar</button>
              <button className={styles.modalConfirm} onClick={handleDeleteMessage}>Apagar</button>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightboxUrl && (
        <div className={styles.lightbox} onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Imagem" className={styles.lightboxImg} />
        </div>
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default Messages;

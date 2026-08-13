import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { useAuth } from '../../../contexts/authContextStore';
import {
  listConversations,
  getMessages,
  sendMessage,
  sendProposal,
  deleteMessage as apiDeleteMessage,
  deleteConversation as apiDeleteConversation,
} from '../../../services/messages';
import {
  createConversationProposalCheckoutSession,
  getCheckoutSessionStatus,
  cancelCheckoutPayment,
} from '../../../services/payments';
import PixPaymentPanel from '../Checkout/PixPaymentPanel';
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
import {
  TYPING_STOP_DELAY,
  TYPING_STALE_DELAY,
  toId,
  getSenderId,
  normalizeMessagePayload,
  normalizeConversationPayload,
  getMessageList,
  getPayloadConversationId,
  getTypingConversationId,
  getTypingUserId,
  getTypingState,
  markConversationRead,
  formatDateSeparator,
  getOtherParticipant,
  getParticipantName,
} from './Messages.helpers';
import { MessagesContext } from './MessagesContext';
import ConversationList from './sections/ConversationList';
import ChatPanel from './sections/ChatPanel';

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
  const [conversationFilter, setConversationFilter] = useState('all');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteMsgConfirm, setDeleteMsgConfirm] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalForm, setProposalForm] = useState({ title: '', description: '', price: '', deliveryDays: '', revisions: '1' });
  const [sendingProposal, setSendingProposal] = useState(false);
  const [acceptModalProposal, setAcceptModalProposal] = useState(null);
  const [acceptMethod, setAcceptMethod] = useState('card');
  const [accepting, setAccepting] = useState(false);
  const [pixCheckout, setPixCheckout] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const userIdRef = useRef(user?.id);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const typingStaleTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    window.requestAnimationFrame(() => {
      const area = messagesAreaRef.current;
      if (!area) return;
      area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
    setIsOtherTyping(false);
    setReplyingTo(null);
    setImagePreview(null);
    if (activeId && window.innerWidth <= 768) {
      setMobileShowChat(true);
    }
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
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    }
  };

  const updateProposalForm = (field, value) => setProposalForm((prev) => ({ ...prev, [field]: value }));

  const handleSendProposal = async () => {
    if (!activeId || sendingProposal) return;
    const title = proposalForm.title.trim();
    const description = proposalForm.description.trim();
    const priceCents = Math.round(Number(proposalForm.price) * 100);
    const deliveryDays = Number(proposalForm.deliveryDays);
    const revisions = Number(proposalForm.revisions);

    if (title.length < 5) { toast.error('Dê um título com pelo menos 5 caracteres.'); return; }
    if (description.length < 10) { toast.error('Descreva melhor o escopo da proposta.'); return; }
    if (!priceCents || priceCents <= 0) { toast.error('Defina um valor válido.'); return; }
    if (!deliveryDays || deliveryDays <= 0) { toast.error('Defina o prazo de entrega.'); return; }

    setSendingProposal(true);
    try {
      const msg = await sendProposal(activeId, {
        title,
        description,
        priceCents,
        deliveryDays,
        revisions: Number.isFinite(revisions) ? revisions : 1,
      });
      if (msg) {
        appendIncomingMessage({
          conversationId: activeId,
          message: { ...msg, senderId: getSenderId(msg) || user?.id },
        });
      }
      setShowProposalForm(false);
      setProposalForm({ title: '', description: '', price: '', deliveryDays: '', revisions: '1' });
      toast.success('Proposta enviada.');
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingProposal(false);
    }
  };

  const openAcceptModal = (proposal) => {
    setAcceptModalProposal(proposal);
    setAcceptMethod('card');
  };

  const confirmAcceptProposal = async () => {
    if (!acceptModalProposal || accepting) return;
    setAccepting(true);
    try {
      const data = await createConversationProposalCheckoutSession({
        proposalId: acceptModalProposal.id,
        paymentMethodType: acceptMethod,
      });
      if (acceptMethod === 'pix' && data.pix && data.payment) {
        setPixCheckout(data);
        setAcceptModalProposal(null);
        setAccepting(false);
        return;
      }
      if (!data.checkoutUrl) throw new Error('O gateway não retornou um link de pagamento.');
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      toast.error(err.message);
      setAccepting(false);
    }
  };

  const refreshActiveMessages = useCallback(() => {
    if (!activeId) return;
    getMessages(activeId).then((data) => setMessages(getMessageList(data))).catch(() => {});
  }, [activeId]);

  // Retomada do checkout de proposta ao voltar da Stripe / cancelamento.
  useEffect(() => {
    const proposalCheckoutStatus = searchParams.get('proposalCheckout');
    if (!proposalCheckoutStatus) return undefined;

    const clearParams = () => {
      const next = new URLSearchParams(searchParams);
      next.delete('proposalCheckout');
      next.delete('session_id');
      next.delete('payment_id');
      setSearchParams(next, { replace: true });
    };

    if (proposalCheckoutStatus === 'cancel') {
      const canceledPaymentId = searchParams.get('payment_id');
      if (!canceledPaymentId) { clearParams(); return undefined; }
      cancelCheckoutPayment(canceledPaymentId)
        .then(() => toast.info('Pagamento cancelado. A proposta voltou a ficar disponível.'))
        .catch((err) => toast.error(err.message))
        .finally(clearParams);
      return undefined;
    }

    const sessionId = searchParams.get('session_id');
    if (!sessionId) { clearParams(); return undefined; }
    let cancelled = false;
    let intervalId = null;

    const check = async () => {
      try {
        const { payment } = await getCheckoutSessionStatus(sessionId);
        if (cancelled) return false;
        if (payment.order) {
          toast.success('Proposta aceita! Pedido criado.');
          refreshActiveMessages();
          return false;
        }
        return ['CHECKOUT_CREATED', 'PENDING'].includes(payment.status);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
        return false;
      }
    };

    check().then((keepPolling) => {
      if (!keepPolling || cancelled) return;
      intervalId = window.setInterval(async () => {
        const shouldContinue = await check();
        if (!shouldContinue && intervalId) window.clearInterval(intervalId);
      }, 4000);
    });
    clearParams();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const otherUser = getOtherParticipant(activeConversation, user?.id);
  const otherProfileHandle = otherUser?.username || otherUser?.handle || otherUser?.id;
  const otherName = otherUser ? getParticipantName(otherUser) : 'Usuário';

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

  const unreadTotal = conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0);
  const onlineTotal = conversations.filter((conversation) => {
    const other = getOtherParticipant(conversation, user?.id);
    return conversation.online || other?.online;
  }).length;

  const filteredConversations = conversations.filter((conversation) => {
    const other = getOtherParticipant(conversation, user?.id);
    const name = getParticipantName(other).toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase());
    const matchesFilter = conversationFilter === 'all' || Number(conversation.unreadCount || 0) > 0;
    return matchesSearch && matchesFilter;
  });

  const hasConversationFilter = Boolean(search.trim()) || conversationFilter !== 'all';

  const clearConversationFilters = () => {
    setSearch('');
    setConversationFilter('all');
  };

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

  const messagesContextValue = {
    // sidebar / lista
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
    // chat
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
    // propostas
    showProposalForm,
    setShowProposalForm,
    proposalForm,
    updateProposalForm,
    sendingProposal,
    handleSendProposal,
    openAcceptModal,
  };

  if (pixCheckout?.payment) {
    return (
      <PixPaymentPanel
        initialPayment={pixCheckout.payment}
        pix={pixCheckout.pix}
        onOrderCreated={() => {
          toast.success('Proposta aceita! Pedido criado.');
          setPixCheckout(null);
          refreshActiveMessages();
        }}
        onBack={() => setPixCheckout(null)}
      />
    );
  }

  return (
    <MessagesContext.Provider value={messagesContextValue}>
    <div className={styles.page}>
      {/* Sidebar */}
      <ConversationList />

      {/* Chat Area */}
      <ChatPanel />

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

      {/* Accept proposal modal */}
      {acceptModalProposal && (
        <div className={styles.modalOverlay} onClick={() => !accepting && setAcceptModalProposal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Aceitar proposta</h3>
            <p>{acceptModalProposal.title} · {(acceptModalProposal.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <div className={styles.proposalMethodChoice}>
              <label className={acceptMethod === 'pix' ? styles.proposalMethodActive : ''}>
                <input type="radio" name="acceptMethod" checked={acceptMethod === 'pix'} onChange={() => setAcceptMethod('pix')} />
                Pix
              </label>
              <label className={acceptMethod === 'card' ? styles.proposalMethodActive : ''}>
                <input type="radio" name="acceptMethod" checked={acceptMethod === 'card'} onChange={() => setAcceptMethod('card')} />
                Cartão
              </label>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setAcceptModalProposal(null)} disabled={accepting}>Cancelar</button>
              <button className={styles.proposalSubmitBtn} onClick={confirmAcceptProposal} disabled={accepting}>
                {accepting ? 'Abrindo pagamento...' : 'Confirmar e pagar'}
              </button>
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
    </MessagesContext.Provider>
  );
}

export default Messages;

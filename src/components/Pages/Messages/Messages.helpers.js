import { emitSocket } from '../../../services/socket';

// Helpers puros e constantes da página de mensagens.
// Extraídos de Messages.jsx para reduzir o tamanho do componente — sem mudança de comportamento.

export const TYPING_STOP_DELAY = 1200;
export const TYPING_STALE_DELAY = 3500;

export const toId = (value) => (value === undefined || value === null ? '' : String(value));

export const getSenderId = (message) => message?.senderId || message?.sender?.id || message?.userId;

export const getMessageConversationId = (message) =>
  message?.conversationId || message?.conversation_id || message?.conversation?.id;

export const normalizeMessagePayload = (payload) =>
  payload?.message || payload?.data?.message || payload;

export const normalizeConversationPayload = (payload) =>
  payload?.conversation ||
  payload?.data?.conversation ||
  (payload?.participants || payload?.otherUser || payload?.lastMessage ? payload : null);

export const getMessageList = (data) =>
  data?.messages || data?.data?.messages || (Array.isArray(data) ? data : []);

export const getPayloadConversationId = (payload, message) =>
  payload?.conversationId ||
  payload?.conversation_id ||
  payload?.conversation?.id ||
  payload?.data?.conversationId ||
  getMessageConversationId(message);

export const getTypingConversationId = (payload) =>
  payload?.conversationId ||
  payload?.conversation_id ||
  payload?.conversation?.id ||
  payload?.data?.conversationId;

export const getTypingUserId = (payload) =>
  payload?.userId ||
  payload?.senderId ||
  payload?.sender?.id ||
  payload?.user?.id ||
  payload?.data?.userId;

export const getTypingState = (payload, fallback) => {
  if (typeof payload?.isTyping === 'boolean') return payload.isTyping;
  if (typeof payload?.typing === 'boolean') return payload.typing;
  if (typeof payload?.data?.isTyping === 'boolean') return payload.data.isTyping;
  return fallback;
};

export const markConversationRead = (conversationId) => {
  if (!conversationId) return;
  emitSocket('conversation:read', { conversationId });
  emitSocket('mark_as_read', { conversationId });
};

export const formatTime = (iso) => {
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

export const formatFullTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const formatDateSeparator = (iso) => {
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

export const getOtherParticipant = (conversation, currentUserId) =>
  conversation?.participants?.find((p) => toId(p.id) !== toId(currentUserId)) || conversation?.otherUser;

export const getParticipantName = (participant) =>
  `${participant?.firstName || ''} ${participant?.lastName || ''}`.trim() || 'Usuário';

export const getParticipantInitials = (participant) =>
  getParticipantName(participant)
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

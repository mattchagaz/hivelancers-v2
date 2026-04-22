import { io } from 'socket.io-client';
import { tokenStorage } from './tokenStorage';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3333';

let socket;

const getAuth = () => {
  const token = tokenStorage.getAccess();
  return token ? { token, accessToken: token } : {};
};

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: getAuth(),
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
};

export const connectSocket = () => {
  const current = getSocket();
  current.auth = getAuth();

  if (!current.connected) {
    current.connect();
  }

  return current;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const emitSocket = (event, payload, ack) => {
  const current = getSocket();
  if (!current.connected) return false;
  current.emit(event, payload, ack);
  return true;
};

export const joinConversationRoom = (conversationId) => {
  if (!conversationId) return;
  emitSocket('conversation:join', { conversationId });
  emitSocket('join_conversation', { conversationId });
};

export const leaveConversationRoom = (conversationId) => {
  if (!conversationId) return;
  emitSocket('conversation:leave', { conversationId });
  emitSocket('leave_conversation', { conversationId });
};

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Smoke test da página de mensagens: monta o Messages com serviços/socket
// mockados e garante que a sidebar e o painel de chat renderizam sem quebrar.
// Rede de segurança para a refatoração que quebra o Messages em partes.

const { fakeSocket } = vi.hoisted(() => ({
  fakeSocket: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), connected: true },
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', firstName: 'Cliente' } }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
  Toaster: () => null,
}));

vi.mock('../../../services/messages', () => ({
  listConversations: vi.fn(() => Promise.resolve([])),
  getMessages: vi.fn(() => Promise.resolve({ messages: [] })),
  sendMessage: vi.fn(),
  deleteMessage: vi.fn(),
  deleteConversation: vi.fn(),
}));

vi.mock('../../../services/cloudinary', () => ({
  uploadImageToCloudinary: vi.fn(),
}));

vi.mock('../../../services/socket', () => ({
  connectSocket: () => fakeSocket,
  disconnectSocket: vi.fn(),
  emitSocket: vi.fn(),
  getSocket: () => fakeSocket,
  joinConversationRoom: vi.fn(),
  leaveConversationRoom: vi.fn(),
}));

vi.mock('../../../utils/clientRecentActivity', () => ({
  recordRecentActivity: vi.fn(),
}));

import { getMessages, listConversations } from '../../../services/messages';
import Messages from './Messages';

const conversation = {
  id: 'conv-1',
  participants: [
    { id: 'user-1', firstName: 'Cliente' },
    { id: 'user-2', firstName: 'Alice', lastName: 'Silva' },
  ],
  otherUser: { id: 'user-2', firstName: 'Alice', lastName: 'Silva' },
  lastMessage: { content: 'Olá!', createdAt: '2024-01-01T10:00:00Z' },
  unreadCount: 0,
};

const message = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-2',
  sender: { id: 'user-2', firstName: 'Alice' },
  content: 'Olá, tudo bem?',
  createdAt: '2024-01-01T10:00:00Z',
};

describe('Messages (smoke)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('monta a página com a lista vazia sem quebrar', async () => {
    listConversations.mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/messages']}>
        <Messages />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(listConversations).toHaveBeenCalled();
    });
  });

  it('renderiza o painel de chat da conversa ativa sem quebrar', async () => {
    listConversations.mockResolvedValue([conversation]);
    getMessages.mockResolvedValue({ messages: [message] });

    render(
      <MemoryRouter initialEntries={['/messages?chat=conv-1']}>
        <Messages />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getMessages).toHaveBeenCalledWith('conv-1');
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Alice/).length).toBeGreaterThan(0);
    });
  });
});

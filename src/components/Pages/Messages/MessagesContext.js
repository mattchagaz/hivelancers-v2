import { createContext, useContext } from 'react';

// Contexto interno da página de mensagens. O container (Messages) concentra
// estado, socket e ações e os disponibiliza aqui; cada seção (ConversationList,
// ChatPanel) consome apenas o que precisa via useMessages().
export const MessagesContext = createContext(null);

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error('useMessages deve ser usado dentro de <MessagesContext.Provider>');
  return ctx;
}

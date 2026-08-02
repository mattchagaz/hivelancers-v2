import { createContext, useContext } from 'react';

// Contexto interno da página de pedidos. O container (Orders) concentra estado
// e ações e os disponibiliza aqui; cada seção (OrderList, OrderDetail) consome
// apenas o que precisa via useOrders().
export const OrdersContext = createContext(null);

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders deve ser usado dentro de <OrdersContext.Provider>');
  return ctx;
}

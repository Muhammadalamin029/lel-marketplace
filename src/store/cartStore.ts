import { create } from "zustand";
import { ordersApi } from "@/api/orders";
import type { Order, OrderItem } from "@/api/orders";
import { getApiError } from "@/api";

interface CartState {
  pendingOrder: Order | null;
  isLoading: boolean;
  adding: Record<string, boolean>;   // productId → true while adding
  error: string | null;

  fetchPendingOrder: () => Promise<void>;
  addItem: (product_id: string, quantity?: number) => Promise<void>;
  updateQty: (itemId: string, newQty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  pendingOrder: null,
  isLoading: false,
  adding: {},
  error: null,

  fetchPendingOrder: async () => {
    set({ isLoading: true, error: null });
    try {
      const order = await ordersApi.getPending();
      set({ pendingOrder: order, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: getApiError(e) });
    }
  },

  addItem: async (product_id, quantity = 1) => {
    set((s) => ({ adding: { ...s.adding, [product_id]: true }, error: null }));
    try {
      const order = await ordersApi.addItem(product_id, quantity);
      set((s) => ({
        pendingOrder: order,
        adding: { ...s.adding, [product_id]: false },
      }));
    } catch (e) {
      set((s) => ({
        adding: { ...s.adding, [product_id]: false },
        error: getApiError(e),
      }));
      throw e;
    }
  },

  updateQty: async (itemId, newQty) => {
    const { pendingOrder } = get();
    if (!pendingOrder) return;
    set({ isLoading: true });
    try {
      const updated = await ordersApi.updateItem(pendingOrder.id, itemId, newQty);
      set({ pendingOrder: updated, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: getApiError(e) });
      // Refetch to stay in sync
      await get().fetchPendingOrder();
    }
  },

  removeItem: async (itemId) => {
    const { pendingOrder } = get();
    if (!pendingOrder) return;
    set({ isLoading: true });
    try {
      const updated = await ordersApi.removeItem(pendingOrder.id, itemId);
      // If null is returned the order is now empty — clear it
      set({ pendingOrder: updated ?? null, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: getApiError(e) });
      await get().fetchPendingOrder();
    }
  },

  clearCart: async () => {
    const { pendingOrder } = get();
    if (!pendingOrder) return;
    try {
      await ordersApi.deletePending(pendingOrder.id);
    } catch { /* silent — already gone */ }
    set({ pendingOrder: null });
  },

  totalItems: () => {
    const { pendingOrder } = get();
    return pendingOrder?.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  },

  totalPrice: () => {
    const { pendingOrder } = get();
    return Number(pendingOrder?.total_amount ?? 0);
  },
}));

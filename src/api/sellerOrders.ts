import { api } from "./client";
import type { Order } from "./orders";

export const sellerOrdersApi = {
  async list(params: { page?: number; limit?: number; status_filter?: string } = {}) {
    const { data } = await api.get("/seller/orders", { params: { limit: 20, ...params } });
    return { items: (data?.data as Order[]) ?? [], pagination: data?.pagination };
  },

  async getById(id: string) {
    const { data } = await api.get(`/seller/orders/${id}`);
    return data as Order;
  },

  async updateStatus(id: string, status: string, notes?: string) {
    const { data } = await api.patch(`/seller/orders/${id}/status`, { status, notes });
    return data?.data;
  },
};

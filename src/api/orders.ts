import { api } from "./client";

/** Matches backend UserResponse in orders schema */
export interface OrderBuyer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

/** Matches backend AddressResponse in orders schema (uses field names: street, state) */
export interface OrderAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ProductImage {
  id: string;
  image_url: string;
}

export interface OrderProduct {
  id: string;
  name: string;
  price: number;
  images: ProductImage[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  status: string;
  product: OrderProduct;
}

export interface SellerGroup {
  seller: { id: string; business_name: string } | null;
  items: OrderItem[];
  total_amount: number;
  item_count: number;
}

/** Matches backend OrderResponse schema */
export interface Order {
  id: string;
  total_amount: number;
  status: string;
  seller_item_status: string | null;
  created_at: string;
  updated_at: string;
  buyer: OrderBuyer;
  delivery_addr: OrderAddress | null;
  order_items: OrderItem[];
  seller_groups: SellerGroup[] | null;
}

export const ordersApi = {
  // ── Cart / pending order ───────────────────────────────────────────────────

  /** GET /orders/pending — the pending order is the cart */
  async getPending(): Promise<Order | null> {
    try {
      const { data } = await api.get("/orders/pending");
      return data?.data as Order;
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },

  /** POST /orders — add one product to the pending order (creates it if needed) */
  async addItem(product_id: string, quantity: number): Promise<Order> {
    const { data } = await api.post("/orders", { product_id, quantity });
    return data?.data as Order;
  },

  /** PUT /orders/{id}/items/{itemId}?quantity={qty} */
  async updateItem(orderId: string, itemId: string, quantity: number): Promise<Order> {
    const { data } = await api.put(`/orders/${orderId}/items/${itemId}?quantity=${quantity}`);
    return data?.data as Order;
  },

  /** DELETE /orders/{id}/items/{itemId} */
  async removeItem(orderId: string, itemId: string): Promise<Order | null> {
    const { data } = await api.delete(`/orders/${orderId}/items/${itemId}`);
    return data?.data ?? null;
  },

  /** DELETE /orders/{id} — delete the entire pending order */
  async deletePending(orderId: string): Promise<void> {
    await api.delete(`/orders/${orderId}`);
  },

  // ── Checkout ───────────────────────────────────────────────────────────────

  /** POST /checkout/process */
  async processCheckout(delivery_address_id: string, notes?: string): Promise<{
    order_id: string;
    total_amount: number;
    status: string;
    tracking_number: string;
    estimated_delivery: string;
  }> {
    const { data } = await api.post("/checkout/process", { delivery_address_id, notes });
    return data?.data;
  },

  /** POST /payments/initialize */
  async initializePayment(order_id: string, email: string, amount: number, callback_url: string): Promise<{
    authorization_url: string;
    reference: string;
    access_code: string;
  }> {
    const { data } = await api.post("/payments/initialize", { order_id, email, amount, callback_url });
    return data?.data ?? data;
  },

  /** POST /payments/verify */
  async verifyPayment(reference: string): Promise<{ status: string; order_id: string }> {
    const { data } = await api.post("/payments/verify", { reference });
    return data?.data ?? data;
  },

  // ── History ────────────────────────────────────────────────────────────────

  async list(params: { status?: string; page?: number; limit?: number } = {}) {
    const { data } = await api.get("/orders/", { params: { limit: 20, ...params } });
    return data as { data: Order[]; pagination: { total: number; total_pages: number; page: number; limit: number } };
  },

  async getById(id: string) {
    const { data } = await api.get(`/orders/${id}`);
    return data?.data as Order;
  },

  async cancel(id: string) {
    const { data } = await api.post(`/orders/${id}/cancel`);
    return data;
  },

  async getTimeline(id: string) {
    const { data } = await api.get(`/orders/${id}/timeline`);
    return data;
  },
};

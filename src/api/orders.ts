import { api, getPagination, unwrapData, unwrapList, type Pagination } from "./client";

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

/** Matches backend OrderResponse schema */
export interface Order {
  id: string;
  total_amount: number;
  status: string;
  estimated_delivery_date?: string | null;
  delivery_type?: "pickup" | "delivery";
  delivery_fee?: number;
  pickup_location?: string | null;
  pickup_address?: string | null;
  created_at: string;
  updated_at: string;
  buyer: OrderBuyer;
  delivery_addr: OrderAddress | null;
  order_items: OrderItem[];
  formatted_payments?: any[];
  installment?: {
    is_installment: boolean;
    amount_paid: number;
    remaining_balance: number;
    fully_paid: boolean;
    active: boolean;
  } | null;
}

export interface CheckoutConfirmation {
  order_id: string;
  total_amount: number;
  status: string;
  tracking_number: string | null;
  estimated_delivery: string | null;
}

export interface CheckoutSummary {
  order: Order;
  summary: {
    subtotal: number;
    shipping_fee: number;
    delivery_fee: number;
    tax: number;
    total: number;
    items_count: number;
  };
}

export interface InstallmentEligibility {
  eligible: boolean;
  reason?: string | null;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  min_percent: number;
  price_floor: number;
  min_initial_amount: number;
  is_installment: boolean;
}

export const ordersApi = {
  // ── Cart / pending order ───────────────────────────────────────────────────

  /** GET /orders/pending — the pending order is the cart */
  async getPending(): Promise<Order | null> {
    try {
      const { data } = await api.get("/orders/pending");
      return unwrapData<Order>(data);
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },

  /** POST /orders — add one product to the pending order (creates it if needed) */
  async addItem(product_id: string, quantity: number): Promise<Order> {
    const { data } = await api.post("/orders", { product_id, quantity });
    return unwrapData<Order>(data);
  },

  /** PUT /orders/{id}/items/{itemId}?quantity={qty} */
  async updateItem(orderId: string, itemId: string, quantity: number): Promise<Order> {
    const { data } = await api.put(`/orders/${orderId}/items/${itemId}?quantity=${quantity}`);
    return unwrapData<Order>(data);
  },

  /** DELETE /orders/{id}/items/{itemId} */
  async removeItem(orderId: string, itemId: string): Promise<Order | null> {
    const { data } = await api.delete(`/orders/${orderId}/items/${itemId}`);
    return data?.data ? unwrapData<Order>(data) : null;
  },

  /** DELETE /orders/{id} — delete the entire pending order */
  async deletePending(orderId: string): Promise<void> {
    await api.delete(`/orders/${orderId}`);
  },

  // ── Checkout ───────────────────────────────────────────────────────────────

  /** POST /checkout/process */
  async getCheckoutSummary(): Promise<CheckoutSummary> {
    const { data } = await api.get("/checkout/summary");
    return unwrapData<CheckoutSummary>(data);
  },

  async processCheckout(payload: {
    delivery_type: "delivery" | "pickup";
    delivery_address_id?: string | null;
  }): Promise<CheckoutConfirmation> {
    const { data } = await api.post("/checkout/process", payload);
    return unwrapData<CheckoutConfirmation>(data);
  },

  /** POST /payments/initialize */
  async initializePayment(order_id: string, email: string, amount: number, callback_url: string): Promise<{
    authorization_url: string;
    reference: string;
    access_code: string;
  }> {
    const { data } = await api.post("/payments/initialize", {
      order_id,
      email,
      amount,
      callback_url,
      category: "order",
      payment_method: "paystack",
    });
    return unwrapData(data);
  },

  async initializeBankTransfer(order_id: string, email: string, amount: number): Promise<{
    account_number: string;
    account_name: string;
    bank_name: string;
    amount: number;
    reference: string;
    expires_at?: string | null;
    currency: string;
  }> {
    const { data } = await api.post("/payments/initialize-bank-transfer", {
      order_id,
      email,
      amount,
      category: "order",
    });
    return unwrapData(data);
  },

  /** POST /payments/verify */
  async verifyPayment(reference: string): Promise<{ status: string; order_id: string }> {
    const { data } = await api.post("/payments/verify", { reference });
    return unwrapData(data);
  },

  // ── History ────────────────────────────────────────────────────────────────

  async list(params: { status?: string; page?: number; limit?: number } = {}) {
    const { data } = await api.get("/orders/", { params: { limit: 20, ...params } });
    return {
      data: unwrapList<Order>(data),
      pagination: getPagination(data) as Pagination,
    };
  },

  async getById(id: string) {
    const { data } = await api.get(`/orders/${id}`);
    return unwrapData<Order>(data);
  },

  async getInstallment(id: string) {
    const { data } = await api.get(`/orders/${id}/installment`);
    return unwrapData<InstallmentEligibility>(data);
  },

  async cancel(id: string) {
    const { data } = await api.post(`/orders/${id}/cancel`);
    return unwrapData(data);
  },

  async getTimeline(id: string) {
    const { data } = await api.get(`/orders/${id}/timeline`);
    return data;
  },
};

import { api, unwrapData } from "./client";

export interface Payment {
  id: string;
  order_id: string | null;
  agreement_id: string | null;
  buyer_id: string;
  seller_id: string | null;
  seller_name: string | null;
  amount: number;
  status: string;
  payment_category: string;   // "order" | "asset_deposit" | "asset_installment" | "full_pay"
  payment_type: string | null;
  payment_method: string;
  transaction_id: string;
  receipt_number?: string | null;
  buyer_name?: string | null;
  created_at: string;
  updated_at: string | null;
}

export const paymentsApi = {
  /** GET /payments/{id} — single payment (owner only). */
  async getById(id: string) {
    const { data } = await api.get(`/payments/${id}`);
    return (data?.data ?? data) as Payment;
  },

  /** GET /payments/{id}/receipt/html — printable receipt HTML (web parity). */
  async getReceiptHtml(id: string): Promise<string> {
    const { data } = await api.get(`/payments/${id}/receipt/html`, {
      responseType: "text",
      headers: { Accept: "text/html" },
    });
    return typeof data === "string" ? data : String(data ?? "");
  },

  async list(params: { page?: number; limit?: number } = {}) {
    const { data } = await api.get("/payments/", { params: { limit: 30, ...params } });
    return data as { success: boolean; data: Payment[]; pagination: any };
  },

  async initialize(payload: {
    order_id?: string;
    agreement_id?: string;
    category?: "order" | "asset_deposit" | "asset_installment" | "full_pay";
    amount: number;
    email: string;
    callback_url?: string;
    metadata?: Record<string, any>;
    payment_method?: string;
  }) {
    const { data } = await api.post("/payments/initialize", {
      category: "order",
      payment_method: "paystack",
      ...payload,
    });
    return unwrapData(data);
  },

  async initializeBankTransfer(payload: {
    order_id?: string;
    agreement_id?: string;
    category?: "order" | "asset_deposit" | "asset_installment" | "full_pay";
    amount: number;
    email: string;
    metadata?: Record<string, any>;
  }) {
    const { data } = await api.post("/payments/initialize-bank-transfer", {
      category: "order",
      ...payload,
    });
    return unwrapData(data);
  },

  async verify(reference: string) {
    const { data } = await api.post("/payments/verify", { reference });
    return unwrapData(data);
  },
};

import { api, unwrapData } from "./client";

// Single-flight cache: concurrent identical initiations (double tap,
// remount) share one request instead of minting duplicate accounts.
const transferInflight = new Map<string, Promise<any>>();
const TRANSFER_SHARE_TTL_MS = 90_000;

function transferKey(payload: Record<string, any>): string {
  return [
    payload.category ?? "",
    payload.order_id ?? "",
    payload.agreement_id ?? "",
    payload.amount,
    payload.email ?? "",
  ].join("|");
}

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

  /** POST /payments/charge-card — step 1 of the Direct-API card flow. */
  async chargeCard(payload: {
    order_id?: string;
    agreement_id?: string;
    category?: "order" | "asset_deposit" | "asset_installment" | "full_pay";
    amount: number;
    email: string;
    fullname?: string;
    phone_number?: string;
    card_number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
    redirect_url?: string;
    metadata?: Record<string, any>;
  }) {
    const { data } = await api.post("/payments/charge-card", {
      category: "order",
      payment_method: "flutterwave",
      ...payload,
    });
    return unwrapData(data);
  },

  /** POST /payments/charge-card/authorize — step 2 (PIN / AVS). */
  async authorizeCard(payload: {
    tx_ref: string;
    card_number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
    authorization: Record<string, any>;
    email?: string;
    fullname?: string;
  }) {
    const { data } = await api.post("/payments/charge-card/authorize", payload);
    return unwrapData(data);
  },

  /** POST /payments/charge-card/validate — step 3 (OTP). */
  async validateCard(tx_ref: string, otp: string) {
    const { data } = await api.post("/payments/charge-card/validate", { tx_ref, otp });
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
    const body = {
      category: "order",
      ...payload,
    };
    const key = transferKey(body);
    const hit = transferInflight.get(key);
    if (hit) return hit;
    const promise = api
      .post("/payments/initialize-bank-transfer", body)
      .then(({ data }) => unwrapData(data))
      .catch((err) => {
        if (transferInflight.get(key) === promise) transferInflight.delete(key);
        throw err;
      });
    transferInflight.set(key, promise);
    setTimeout(() => {
      if (transferInflight.get(key) === promise) transferInflight.delete(key);
    }, TRANSFER_SHARE_TTL_MS);
    return promise;
  },

  async verify(reference: string, transaction_id?: number) {
    const { data } = await api.post("/payments/verify", { reference, transaction_id });
    return unwrapData(data);
  },
};

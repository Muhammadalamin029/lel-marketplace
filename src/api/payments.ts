import { api } from "./client";

export interface Payment {
  id: string;
  order_id: string | null;
  agreement_id: string | null;
  buyer_id: string;
  seller_id: string | null;
  seller_name: string | null;
  seller_type: string | null;
  amount: number;
  status: string;
  payment_category: string;   // "order" | "asset_deposit" | "asset_installment" | "full_pay"
  payment_type: string | null;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  updated_at: string | null;
}

export const paymentsApi = {
  async list(params: { page?: number; limit?: number } = {}) {
    const { data } = await api.get("/payments/", { params: { limit: 30, ...params } });
    return data as { success: boolean; data: Payment[]; pagination: any };
  },
};

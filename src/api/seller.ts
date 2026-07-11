import { api } from "./client";

// ── Balance & payouts ────────────────────────────────────────────────────────

export interface SellerBalance {
  available_balance: number;
  pending_balance: number;
  total_paid: number;
  total_revenue: number;
  platform_fee_rate: number;
  payout_account_configured: boolean;
}

export interface PayoutAccount {
  account_number: string | null;
  bank_code: string | null;
  bank_name: string | null;
}

export interface Payout {
  id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  account_number: string | null;
  bank_name: string | null;
  created_at: string;
  processed_at: string | null;
  failure_reason: string | null;
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface SellerAnalytics {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  revenue_growth: number;
  order_growth: number;
  period: string;
  top_products: { id: string; name: string; total_sold: number; revenue: number; stock_quantity: number }[];
  inventory_insights: {
    total_products: number;
    active_products: number;
    low_stock_products: number;
    out_of_stock_products: number;
    total_inventory_value: number;
  };
  customer_insights: {
    total_customers: number;
    repeat_customers: number;
    repeat_rate: number;
    average_order_value: number;
  };
}

// ── Reviews ──────────────────────────────────────────────────────────────────

export interface SellerReview {
  id: string;
  product_id: string;
  product_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { id: string; name: string | null };
}

export const sellerApi = {
  // Balance & payouts
  async getBalance(): Promise<SellerBalance> {
    const { data } = await api.get("/seller/balance");
    return data?.data as SellerBalance;
  },

  async getPayoutAccount(): Promise<PayoutAccount | null> {
    const { data } = await api.get("/seller/payout-account");
    return (data?.data as PayoutAccount) ?? null;
  },

  async savePayoutAccount(payload: { account_number: string; bank_code: string; bank_name: string }): Promise<PayoutAccount> {
    const { data } = await api.put("/seller/payout-account", payload);
    return data?.data as PayoutAccount;
  },

  async verifyPayoutAccount(account_number: string, bank_code: string): Promise<{ verified: boolean; account_name?: string; error?: string }> {
    const { data } = await api.post("/seller/payout-account/verify", { account_number, bank_code });
    return data?.data;
  },

  async requestPayout(payload: { amount: number; account_number: string; bank_code: string; bank_name: string }): Promise<Payout> {
    const { data } = await api.post("/seller/payouts", payload);
    return data?.data as Payout;
  },

  async listPayouts(params: { page?: number; limit?: number } = {}): Promise<{ items: Payout[]; pagination: any }> {
    const { data } = await api.get("/seller/payouts", { params: { limit: 20, ...params } });
    return { items: (data?.data as Payout[]) ?? [], pagination: data?.pagination };
  },

  // KYC
  async submitKyc(): Promise<void> {
    await api.post("/seller/kyc/submit");
  },

  // Analytics
  async getAnalytics(period: string = "30d"): Promise<SellerAnalytics> {
    const { data } = await api.get("/seller/analytics", { params: { period } });
    return data?.data as SellerAnalytics;
  },

  // Reviews
  async listReviews(params: { page?: number; limit?: number } = {}): Promise<{ items: SellerReview[]; meta: any }> {
    const { data } = await api.get("/reviews/seller", { params: { limit: 10, ...params } });
    return { items: (data?.data as SellerReview[]) ?? [], meta: data?.meta };
  },
};

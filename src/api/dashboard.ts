import { api } from "./client";

export interface SellerStats {
  total_assets: number;
  total_products: number;
  active_products: number;
  out_of_stock_products: number;
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  total_revenue: number;
  net_revenue: number;
  kyc_status: "pending" | "approved" | "rejected";
  business_name: string;
  total_inspections: number;
  pending_inspections: number;
  total_agreements: number;
  pending_agreements: number;
  active_agreements: number;
  alerts: {
    overdue_agreements: number;
    payout_account_configured: boolean;
    kyc_status: string;
  };
}

export interface CustomerStats {
  total_orders: number;
  total_spent: number;
  wishlist_items: number;
  cart_items: number;
  cart_total: number;
  asset_stats: {
    total_inspections: number;
    pending_inspections: number;
    total_agreements: number;
    pending_agreements: number;
    active_agreements: number;
  };
  monthly_comparison: {
    orders_change: number;
    spending_change: number;
    current_month_orders: number;
    current_month_spent: number;
  };
  alerts: {
    cart_items: number;
    wishlist_items: number;
    pending_inspections: number;
    pending_agreements: number;
    overdue_agreements: number;
  };
}

export const dashboardApi = {
  customerStats: async (range?: string): Promise<CustomerStats> => {
    const params = range ? { range } : {};
    const { data } = await api.get("/dashboard/customer/stats", { params });
    return data;
  },
  sellerStats: async (range?: string): Promise<SellerStats> => {
    const params = range ? { range } : {};
    const { data } = await api.get("/seller/stats", { params });
    return data?.data as SellerStats;
  },
};

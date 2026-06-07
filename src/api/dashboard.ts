import { api } from "./client";

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
};

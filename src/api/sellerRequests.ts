import { api } from "./client";
import type { Inspection, Agreement } from "./inspections";

export interface AssetPayment {
  id: string;
  agreement_id: string | null;
  amount: number;
  reference: string;
  payment_category: string;
  status: string;
  created_at: string;
}

export const sellerRequestsApi = {
  /** POST /assets/inspections/{id}/review — approve or reject a buyer's viewing request */
  async reviewInspection(id: string, action: "approve" | "reject", inspection_date?: string) {
    const { data } = await api.post(`/assets/inspections/${id}/review`, { action, inspection_date });
    return data as Inspection;
  },

  /** POST /assets/agreements/{id}/approve — accept an offer, optionally reserving a unit */
  async approveAgreement(id: string, unit_id?: string) {
    const { data } = await api.post(`/assets/agreements/${id}/approve`, { unit_id });
    return data as Agreement;
  },

  /** POST /assets/agreements/{id}/reject — decline an offer */
  async rejectAgreement(id: string) {
    const { data } = await api.post(`/assets/agreements/${id}/reject`);
    return data as Agreement;
  },

  /** GET /assets/payments — seller's own asset payment history (deposits/installments) */
  async listPayments() {
    const { data } = await api.get("/assets/payments");
    return (data as AssetPayment[]) ?? [];
  },
};

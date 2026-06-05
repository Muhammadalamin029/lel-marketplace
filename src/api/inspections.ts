import { api } from "./client";

/** Matches backend AssetMini schema */
export interface AssetMini {
  id: string;
  type: string;
  title: string;
  price: number;
  min_deposit_percentage: number | null;
  image_url: string | null;
}

/** Matches backend UserMini schema */
export interface UserMini {
  id: string;
  email: string;
  name: string | null;
}

/** Matches backend AssetInspectionResponse schema */
export interface Inspection {
  id: string;
  asset_type: "automotive" | "property";
  asset_id: string;
  unit_id: string | null;
  user_id: string;
  seller_id: string;
  inspection_date: string;
  notes: string | null;
  agreed_price: number | null;
  status: "scheduled" | "confirmed" | "completed" | "rejected" | "agreement_pending" | "agreement_accepted";
  created_at: string;
  asset: AssetMini | null;
  user: UserMini | null;
}

/** Matches backend AssetAgreementResponse schema */
export interface Agreement {
  id: string;
  asset_type: string;
  asset_id: string;
  unit_id: string | null;
  inspection_id: string | null;
  total_price: number;
  deposit_paid: number;
  remaining_balance: number | null;
  plan_type: "structured" | "flexible";
  duration_months: number | null;
  monthly_installment: number | null;
  status: "pending_review" | "pending_deposit" | "active" | "completed" | "defaulted" | "cancelled";
  seller_id: string;
  user_id: string;
  total_paid: number | null;
  next_due_date: string | null;
  created_at: string;
  updated_at: string;
  asset: AssetMini | null;
}

/** Payload for POST /assets/inspections/{id}/complete */
export interface CompleteInspectionPayload {
  agreed_price: number;
  notes?: string;
  plan_type: "structured" | "flexible";
  duration_months?: number;
  monthly_installment?: number;
  unit_id?: string;
}

export const inspectionsApi = {
  // ── Inspections ────────────────────────────────────────────────────────────

  async list() {
    const { data } = await api.get("/assets/inspections");
    return data as Inspection[];
  },

  async getById(id: string) {
    const { data } = await api.get(`/assets/inspections/${id}`);
    return data as Inspection;
  },

  async schedule(payload: {
    asset_type: string;
    asset_id: string;
    unit_id?: string;
    inspection_date: string;
  }) {
    const { data } = await api.post("/assets/inspections/schedule", payload);
    return data as Inspection;
  },

  /** POST /assets/inspections/{id}/complete — user submits offer price + payment plan */
  async completeInspection(inspectionId: string, payload: CompleteInspectionPayload) {
    const { data } = await api.post(`/assets/inspections/${inspectionId}/complete`, payload);
    return data as Inspection;
  },

  async cancel(id: string) {
    await api.delete(`/assets/inspections/${id}`);
  },

  // ── Agreements ─────────────────────────────────────────────────────────────

  async listAgreements() {
    const { data } = await api.get("/assets/agreements");
    return data as Agreement[];
  },

  /** GET /assets/agreements/{id} — direct single-agreement fetch */
  async getAgreementById(id: string) {
    const { data } = await api.get(`/assets/agreements/${id}`);
    return data as Agreement;
  },

  /** POST /assets/agreements/{id}/cancel — customer cancels before deposit */
  async cancelAgreement(id: string) {
    const { data } = await api.post(`/assets/agreements/${id}/cancel`);
    return data as Agreement;
  },

  // ── Asset payments (deposit + installments) ─────────────────────────────────

  /** POST /payments/initialize — for asset deposit or installment */
  async initializeAgreementPayment(
    agreementId: string,
    amount: number,
    email: string,
    category: "asset_deposit" | "asset_installment",
    callbackUrl: string
  ) {
    const { data } = await api.post("/payments/initialize", {
      agreement_id: agreementId,
      amount,
      email,
      payment_method: "paystack",
      callback_url: callbackUrl,
      category,
    });
    return data as { authorization_url: string; reference: string; access_code: string };
  },

  /** POST /payments/verify — verify after Paystack redirect */
  async verifyPayment(reference: string) {
    const { data } = await api.post("/payments/verify", { reference });
    return data;
  },
};

import { api, unwrapData } from "./client";

/** Matches backend AssetMini schema */
export interface AssetMini {
  id: string;
  type: string;
  title: string;
  price: number;
  min_deposit_percentage: number | null;
  monthly_allowed?: boolean | null;
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

/** Payload for POST /assets/inspections/{id}/complete - must match backend's
 * AssetInspectionComplete schema, which validates `payment_plan` (not `plan_type`). */
export interface CompleteInspectionPayload {
  agreed_price: number;
  notes?: string;
  payment_plan: "monthly" | "full_payment" | "installment";
  duration_months?: number;
  monthly_installment?: number;
  unit_id?: string;
}

export interface CreateAgreementPayload {
  asset_type: "automotive" | "property";
  asset_id: string;
  unit_id?: string;
  total_price: number;
  deposit_paid: number;
  payment_plan: "monthly" | "full_payment" | "installment";
  duration_months?: number;
  monthly_installment?: number;
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

  /** POST /assets/agreements — direct asset purchase, used by FE PurchaseFlow */
  async createAgreement(payload: CreateAgreementPayload) {
    const { data } = await api.post("/assets/agreements", payload);
    return unwrapData<Agreement>(data);
  },

  /** GET /assets/agreements/{id} — direct single-agreement fetch */
  async getAgreementById(id: string) {
    const { data } = await api.get(`/assets/agreements/${id}`);
    return data as Agreement;
  },

  /** POST /assets/agreements/{id}/cancel — customer cancels before deposit */
  async cancelAgreement(id: string) {
    const { data } = await api.post(`/assets/agreements/${id}/cancel`);
    return unwrapData<Agreement>(data);
  },

  async initiateMandate(agreementId: string, payload: { email: string; callback_url?: string }) {
    const { data } = await api.post(`/assets/agreements/${agreementId}/mandate/initiate`, payload);
    return data as { redirect_url: string; reference: string };
  },

  async getMandate(agreementId: string) {
    const { data } = await api.get(`/assets/agreements/${agreementId}/mandate`);
    return data as {
      id: string;
      agreement_id: string;
      status: string;
      bank_name?: string | null;
      account_number_last4?: string | null;
      authorized_at?: string | null;
      created_at: string;
    };
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
    return unwrapData<{ authorization_url: string; reference: string; access_code: string }>(data);
  },

  async initializeAgreementBankTransfer(
    agreementId: string,
    amount: number,
    email: string,
    category: "asset_deposit" | "asset_installment"
  ) {
    const { data } = await api.post("/payments/initialize-bank-transfer", {
      agreement_id: agreementId,
      amount,
      email,
      category,
    });
    return unwrapData(data);
  },

  /** POST /payments/verify — verify after Paystack redirect */
  async verifyPayment(reference: string) {
    const { data } = await api.post("/payments/verify", { reference });
    return unwrapData(data);
  },
};

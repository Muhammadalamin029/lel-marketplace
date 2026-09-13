import { api } from "./client";

/** Matches backend FinancingDocumentRequirementOut schema */
export interface FinancingDocumentRequirement {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

/** Matches backend FinancingApplicationDocumentOut schema */
export interface FinancingApplicationDocument {
  id: string;
  requirement_id: string;
  document_url: string;
  original_filename: string | null;
  requirement: FinancingDocumentRequirement | null;
}

export type FinancingApplicationStatus = "pending_review" | "approved" | "rejected" | "revoked";

/** Matches backend FinancingApplicationOut schema */
export interface FinancingApplication {
  id: string;
  user_id: string;
  employment_status: string;
  employer_name: string | null;
  job_title: string | null;
  monthly_income: number;
  employment_duration_months: number | null;
  additional_notes: string | null;
  status: FinancingApplicationStatus;
  decision_reason: string | null;
  revocation_reason: string | null;
  reviewed_at: string | null;
  revoked_at: string | null;
  created_at: string;
  documents: FinancingApplicationDocument[];
}

export interface FinancingApplicationSubmitPayload {
  employment_status: string;
  employer_name?: string;
  job_title?: string;
  monthly_income: number;
  employment_duration_months?: number;
  additional_notes?: string;
  documents: { requirement_id: string; document_url: string; original_filename?: string }[];
}

export const financingApi = {
  async getDocumentRequirements() {
    const { data } = await api.get("/financing/document-requirements");
    return data as FinancingDocumentRequirement[];
  },

  async getMyApplication() {
    const { data } = await api.get("/financing/applications/me");
    return data as FinancingApplication | null;
  },

  async submitApplication(payload: FinancingApplicationSubmitPayload) {
    const { data } = await api.post("/financing/applications", payload);
    return data as FinancingApplication;
  },
};

import { api, unwrapData, unwrapList } from "./client";

export interface Dispute {
  id: string;
  title: string;
  reason: string;
  status: "open" | "under_review" | "in_review" | "resolved" | "closed";
  order_id?: string;
  agreement_id?: string;
  resolution_notes?: string;
  created_at: string;
}

export const disputesApi = {
  async list() {
    const { data } = await api.get("/disputes/");
    return unwrapList<Dispute>(data);
  },

  async create(payload: { title: string; reason: string; order_id?: string; agreement_id?: string }) {
    const { data } = await api.post("/disputes/", payload);
    return unwrapData<Dispute>(data);
  },
};

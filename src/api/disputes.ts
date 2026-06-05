import { api } from "./client";

export interface Dispute {
  id: string;
  title: string;
  reason: string;
  status: "open" | "in_review" | "resolved" | "closed";
  order_id?: string;
  agreement_id?: string;
  resolution_notes?: string;
  created_at: string;
}

export const disputesApi = {
  async list() {
    const { data } = await api.get("/disputes/");
    return data?.data as Dispute[];
  },

  async create(payload: { title: string; reason: string; order_id?: string; agreement_id?: string }) {
    const { data } = await api.post("/disputes/", payload);
    return data?.data as Dispute;
  },
};

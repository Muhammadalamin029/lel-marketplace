import { api } from "./client";

export interface Bank {
  id: number;
  name: string;
  code: string;
}

export const banksApi = {
  async list(): Promise<Bank[]> {
    const { data } = await api.get("/api/v1/banks/");
    return (data?.data as Bank[]) ?? [];
  },

  async search(query: string): Promise<Bank[]> {
    const { data } = await api.get("/api/v1/banks/search", { params: { query } });
    return (data?.data as Bank[]) ?? [];
  },
};

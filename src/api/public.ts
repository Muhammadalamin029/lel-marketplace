import { api } from "./client";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  product_count: number;
  created_at: string;
}

export const categoriesApi = {
  async list() {
    const { data } = await api.get("/categories/");
    return data?.data as Category[];
  },

  async getProducts(categoryId: string, params: { page?: number; limit?: number; search?: string } = {}) {
    const { data } = await api.get("/products/", {
      params: { category_id: categoryId, limit: 20, ...params },
    });
    return data as { data: any[]; pagination: any };
  },
};

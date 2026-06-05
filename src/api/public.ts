import { api } from "./client";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  product_count: number;
  created_at: string;
}

export interface PublicSeller {
  id: string;
  business_name: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  seller_type: string;
  kyc_status: string;
  logo_url: string | null;
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

export const publicApi = {
  async listSellers() {
    const { data } = await api.get("/public/sellers");
    return data?.sellers as PublicSeller[] ?? [];
  },

  async getSeller(id: string) {
    const { data } = await api.get(`/public/sellers/${id}`);
    return data?.seller as PublicSeller;
  },

  async getSellerInventory(id: string) {
    const { data } = await api.get(`/public/sellers/${id}/inventory`);
    return data;
  },
};

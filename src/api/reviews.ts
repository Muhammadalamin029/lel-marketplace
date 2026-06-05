import { api } from "./client";

export interface ReviewUser { id: string; name: string }

export interface Review {
  id: string;
  product_id: string;
  product_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
  user: ReviewUser;
}

export const reviewsApi = {
  async listMyReviews() {
    const { data } = await api.get("/reviews/my-reviews");
    return data?.data as Review[];
  },

  async listForProduct(productId: string) {
    const { data } = await api.get(`/reviews/product/${productId}`);
    return data?.data as Review[];
  },

  async create(payload: { product_id: string; rating: number; comment?: string }) {
    const { data } = await api.post("/reviews/", payload);
    return data?.data as Review;
  },

  async update(id: string, payload: { rating?: number; comment?: string }) {
    const { data } = await api.put(`/reviews/${id}`, payload);
    return data?.data as Review;
  },

  async delete(id: string) {
    await api.delete(`/reviews/${id}`);
  },
};

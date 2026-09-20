import { api, getPagination, unwrapData, unwrapList, type Pagination } from "./client";

export interface ReviewUser { id: string; name: string }

export interface Review {
  id: string;
  product_id?: string | null;
  product_name?: string | null;
  car_id?: string | null;
  car_name?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
  user: ReviewUser;
}

export interface RatingStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<number, number>;
}

function reviewsResponse(data: any) {
  return {
    data: unwrapList<Review>(data),
    pagination: (data.meta ?? getPagination(data)) as Pagination,
  };
}

export const reviewsApi = {
  async listMyReviews(page = 1) {
    const { data } = await api.get("/reviews/my-reviews", { params: { page, limit: 20 } });
    return reviewsResponse(data);
  },

  async listForProduct(productId: string, page = 1) {
    const { data } = await api.get(`/reviews/product/${productId}`, { params: { page, limit: 10 } });
    return reviewsResponse(data);
  },

  async statsForProduct(productId: string) {
    const { data } = await api.get(`/reviews/product/${productId}/stats`);
    return unwrapData<RatingStats>(data);
  },

  async listForCar(carId: string, page = 1) {
    const { data } = await api.get(`/reviews/car/${carId}`, { params: { page, limit: 10 } });
    return reviewsResponse(data);
  },

  async statsForCar(carId: string) {
    const { data } = await api.get(`/reviews/car/${carId}/stats`);
    return unwrapData<RatingStats>(data);
  },

  async listForProperty(propertyId: string, page = 1) {
    const { data } = await api.get(`/reviews/property/${propertyId}`, { params: { page, limit: 10 } });
    return reviewsResponse(data);
  },

  async statsForProperty(propertyId: string) {
    const { data } = await api.get(`/reviews/property/${propertyId}/stats`);
    return unwrapData<RatingStats>(data);
  },

  async create(payload: { product_id?: string; car_id?: string; property_id?: string; rating: number; comment?: string }) {
    const { data } = await api.post("/reviews/", payload);
    return unwrapData<Review>(data);
  },

  async update(id: string, payload: { rating?: number; comment?: string }) {
    const { data } = await api.put(`/reviews/${id}`, payload);
    return unwrapData<Review>(data);
  },

  async delete(id: string) {
    await api.delete(`/reviews/${id}`);
  },
};

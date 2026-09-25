import { api, getPagination, unwrapList } from "./client";

export interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product?: { id: string; name: string; price: number; images?: { image_url: string }[] };
}

export const wishlistApi = {
  async list(params: { page?: number; limit?: number } = {}) {
    const { data } = await api.get("/wishlist/", { params: { limit: 20, ...params } });
    return { items: unwrapList<WishlistItem>(data), pagination: getPagination(data) };
  },

  /** Backwards-compatible flat list (first page). */
  async listAll() {
    const { items } = await wishlistApi.list({ limit: 50 });
    return items;
  },

  async add(product_id: string) {
    // Backend returns the created item directly (unwrapped), unlike other endpoints.
    const { data } = await api.post("/wishlist/", { product_id });
    return data as WishlistItem;
  },

  async remove(product_id: string) {
    await api.delete(`/wishlist/${product_id}`);
  },
};

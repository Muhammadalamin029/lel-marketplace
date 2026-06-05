import { api } from "./client";

export interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product?: { id: string; name: string; price: number; images?: { image_url: string }[] };
}

export const wishlistApi = {
  async list() {
    const { data } = await api.get("/wishlist/");
    return data?.data as WishlistItem[];
  },

  async add(product_id: string) {
    const { data } = await api.post("/wishlist/", { product_id });
    return data?.data as WishlistItem;
  },

  async remove(product_id: string) {
    await api.delete(`/wishlist/${product_id}`);
  },
};

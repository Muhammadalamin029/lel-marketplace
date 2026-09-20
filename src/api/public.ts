import { api, getPagination, unwrapData, unwrapList, type Pagination } from "./client";
import type { Car, Product, Property } from "./products";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon?: string | null;
  product_count: number;
  created_at: string;
}

export interface DeliveryState {
  id: string;
  state_name: string;
  delivery_price: number | null;
}

export interface DeliverySettings {
  base_delivery_price: number;
  store_pickup_location: string | null;
  store_pickup_address: string | null;
}

export interface PromoBanner {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  image_url?: string;
  cta_text?: string;
  cta_link?: string;
  [key: string]: unknown;
}

export const categoriesApi = {
  async list() {
    const { data } = await api.get("/categories/");
    return unwrapList<Category>(data);
  },

  async getProducts(categoryId: string, params: { page?: number; limit?: number; search?: string } = {}) {
    const { data } = await api.get("/products/", {
      params: { category_id: categoryId, limit: 20, ...params },
    });
    return {
      data: unwrapList<Product>(data),
      pagination: getPagination(data) as Pagination,
    };
  },
};

export const publicApi = {
  async featuredCars() {
    const { data } = await api.get("/public/automotive/featured");
    return unwrapList<Car>(data);
  },

  async featuredProperties() {
    const { data } = await api.get("/public/properties/featured");
    return unwrapList<Property>(data);
  },

  async deliveryStates() {
    const { data } = await api.get("/public/delivery/states");
    return unwrapList<DeliveryState>(data);
  },

  async deliverySettings() {
    const { data } = await api.get("/public/delivery/settings");
    return unwrapData<DeliverySettings>(data);
  },

  async promoBanner() {
    const { data } = await api.get("/public/promo-banner");
    return unwrapData<PromoBanner>(data);
  },
};

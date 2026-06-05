import { api } from "./client";

export interface ProductImage { id: string; image_url: string }
export interface SellerInfo { id: string; business_name: string }
export interface CategoryInfo { id: string; name: string }

/** Matches backend ProductResponse */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  status: string;
  seller: SellerInfo;
  category: CategoryInfo;
  images: ProductImage[];
}

export interface CarUnit {
  id: string;
  mileage: number;
  color: string;
  status: string;
  vin: string | null;
}

/** Matches backend CarResponse */
export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  min_deposit_percentage: number;
  status: string;
  seller_id: string;
  units: CarUnit[];
  images: ProductImage[];
}

export interface PropertyUnit {
  id: string;
  unit_number: string | null;
  status: string;
  price: number | null;
}

/** Matches backend PropertyResponse */
export interface Property {
  id: string;
  title: string;
  description: string | null;
  location: string;
  price: number;
  listing_type: "sale" | "rental" | "professional";
  min_deposit_percentage: number;
  status: string;
  seller_id: string;
  images: ProductImage[];
  units: PropertyUnit[];
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
}

export const productsApi = {
  async list(params: ProductListParams = {}) {
    const { data } = await api.get("/products/", { params: { limit: 20, ...params } });
    return data as { data: Product[]; pagination: any };
  },

  async getById(id: string) {
    const { data } = await api.get(`/products/${id}`);
    return data?.data as Product;
  },

  async listCars(params: {
    page?: number; limit?: number; search?: string;
    min_price?: number; max_price?: number;
    min_year?: number; max_year?: number;
  } = {}) {
    const { data } = await api.get("/automotive/", { params: { limit: 20, status: "available", ...params } });
    return data as { data: Car[]; pagination: any };
  },

  async getCarById(id: string) {
    const { data } = await api.get(`/automotive/${id}`);
    return data?.data as Car;
  },

  async listProperties(params: {
    page?: number; limit?: number; search?: string;
    listing_type?: string; min_price?: number; max_price?: number;
  } = {}) {
    const { data } = await api.get("/properties/", { params: { limit: 20, status: "available", ...params } });
    return data as { data: Property[]; pagination: any };
  },

  async getPropertyById(id: string) {
    const { data } = await api.get(`/properties/${id}`);
    return data?.data as Property;
  },
};

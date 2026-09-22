import { api, getPagination, unwrapData, unwrapList, type Pagination } from "./client";

export interface ProductImage { id: string; image_url: string }
export interface CategoryInfo { id: string; name: string }

/** Matches backend ProductResponse */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  status: string;
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
  monthly_allowed?: boolean;
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
  monthly_allowed?: boolean;
  status: string;
  seller_id: string;
  images: ProductImage[];
  units: PropertyUnit[];
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_feet?: number | null;
  amenities?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
}

function listResponse<T>(payload: any): ListResponse<T> {
  const data = unwrapList<T>(payload);
  return { data, pagination: getPagination(payload) };
}

export const productsApi = {
  async list(params: ProductListParams = {}) {
    const { search, ...rest } = params;
    const { data } = await api.get("/products/", {
      params: { limit: 20, ...rest, ...(search ? { search_query: search } : {}) },
    });
    return listResponse<Product>(data);
  },

  async getById(id: string) {
    const { data } = await api.get(`/products/${id}`);
    return unwrapData<Product>(data);
  },

  async listCars(params: {
    page?: number; limit?: number; search?: string;
    min_price?: number; max_price?: number;
    min_year?: number; max_year?: number;
  } = {}) {
    const { data } = await api.get("/automotive/", { params: { limit: 20, status: "available", ...params } });
    return listResponse<Car>(data);
  },

  async getCarById(id: string) {
    const { data } = await api.get(`/automotive/${id}`);
    return unwrapData<Car>(data);
  },

  async listProperties(params: {
    page?: number; limit?: number; search?: string;
    listing_type?: string; min_price?: number; max_price?: number;
  } = {}) {
    const { data } = await api.get("/properties/", { params: { limit: 20, status: "available", ...params } });
    return listResponse<Property>(data);
  },

  async getPropertyById(id: string) {
    const { data } = await api.get(`/properties/${id}`);
    return unwrapData<Property>(data);
  },
};

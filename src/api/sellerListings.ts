import { api } from "./client";
import type { Product, Car, Property } from "./products";

export interface ImagePayload { image_url: string }

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  images?: ImagePayload[];
  status?: "active" | "inactive";
}

export interface CarUnitPayload { vin: string; mileage: number; color?: string }

export interface CarPayload {
  brand: string;
  model: string;
  year: number;
  price: number;
  min_deposit_percentage?: number;
  units: CarUnitPayload[];
  images?: ImagePayload[];
  status?: string;
}

export interface PropertyUnitPayload { unit_name?: string; unit_number?: string }

export interface PropertyPayload {
  title: string;
  description?: string;
  location: string;
  price: number;
  listing_type?: string;
  buildings_count?: number;
  units?: PropertyUnitPayload[];
  images?: ImagePayload[];
  status?: string;
}

export const sellerListingsApi = {
  // ── Products ─────────────────────────────────────────────────────────────
  async listProducts(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
    const { data } = await api.get("/seller/products", { params: { limit: 20, ...params } });
    return { items: (data?.data as Product[]) ?? [], pagination: data?.pagination };
  },
  async createProduct(payload: ProductPayload) {
    const { data } = await api.post("/products/", payload);
    return data?.data as Product;
  },
  async updateProduct(id: string, payload: Partial<ProductPayload>) {
    const { data } = await api.put(`/products/${id}`, payload);
    return data?.data as Product;
  },
  async updateStock(id: string, stock_quantity: number) {
    const { data } = await api.patch(`/products/${id}/stock`, null, { params: { stock_quantity } });
    return data?.data;
  },
  async deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
  },

  // ── Cars ─────────────────────────────────────────────────────────────────
  async listCars() {
    const { data } = await api.get("/automotive/seller/listings");
    return (data?.data as Car[]) ?? [];
  },
  async createCar(payload: CarPayload) {
    const { data } = await api.post("/automotive/", payload);
    return data?.data as Car;
  },
  async updateCar(id: string, payload: Partial<Omit<CarPayload, "units">>) {
    const { data } = await api.put(`/automotive/${id}`, payload);
    return data?.data as Car;
  },
  async deleteCar(id: string) {
    await api.delete(`/automotive/${id}`);
  },
  async addCarUnits(carId: string, units: CarUnitPayload[]) {
    const { data } = await api.post(`/automotive/${carId}/units`, units);
    return data?.data;
  },
  async updateCarUnit(unitId: string, payload: Partial<CarUnitPayload & { status: string }>) {
    const { data } = await api.put(`/automotive/units/${unitId}`, payload);
    return data?.data;
  },
  async deleteCarUnit(unitId: string) {
    await api.delete(`/automotive/units/${unitId}`);
  },

  // ── Properties ───────────────────────────────────────────────────────────
  async listProperties() {
    const { data } = await api.get("/properties/seller/listings");
    return (data?.data as Property[]) ?? [];
  },
  async createProperty(payload: PropertyPayload) {
    const { data } = await api.post("/properties/", payload);
    return data?.data as Property;
  },
  async updateProperty(id: string, payload: Partial<PropertyPayload>) {
    const { data } = await api.put(`/properties/${id}`, payload);
    return data?.data as Property;
  },
  async deleteProperty(id: string) {
    await api.delete(`/properties/${id}`);
  },
};

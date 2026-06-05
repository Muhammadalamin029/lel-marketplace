import { api } from "./client";

export interface Address {
  id: string;
  title: string;
  street_address: string;
  city: string;
  state_province: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
}

export interface AddressPayload {
  title: string;
  street_address: string;
  city: string;
  state_province: string;
  postal_code?: string;
  country: string;
  is_default?: boolean;
}

export const addressesApi = {
  async list() {
    const { data } = await api.get("/addresses/");
    return data?.data as Address[];
  },

  async create(payload: AddressPayload) {
    const { data } = await api.post("/addresses/", payload);
    return data?.data as Address;
  },

  async update(id: string, payload: Partial<AddressPayload>) {
    const { data } = await api.put(`/addresses/${id}`, payload);
    return data?.data as Address;
  },

  async delete(id: string) {
    await api.delete(`/addresses/${id}`);
  },

  async setDefault(id: string) {
    const { data } = await api.post(`/addresses/${id}/set-default`);
    return data?.data as Address;
  },
};

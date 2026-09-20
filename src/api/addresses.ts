import { api, unwrapData, unwrapList } from "./client";
import type { DeliveryState } from "./public";

export interface Address {
  id: string;
  title: string;
  street_address: string;
  city: string;
  state_province: string;
  delivery_state_id?: string | null;
  delivery_state?: DeliveryState | null;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface AddressPayload {
  title: string;
  street_address: string;
  city: string;
  state_province: string;
  delivery_state_id?: string | null;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export const addressesApi = {
  async list() {
    const { data } = await api.get("/addresses/");
    return unwrapList<Address>(data);
  },

  async create(payload: AddressPayload) {
    const { data } = await api.post("/addresses/", payload);
    return unwrapData<Address>(data);
  },

  async update(id: string, payload: Partial<AddressPayload>) {
    const { data } = await api.put(`/addresses/${id}`, payload);
    return unwrapData<Address>(data);
  },

  async delete(id: string) {
    await api.delete(`/addresses/${id}`);
  },

  async setDefault(id: string) {
    const { data } = await api.post(`/addresses/${id}/set-default`);
    return unwrapData<Address>(data);
  },
};

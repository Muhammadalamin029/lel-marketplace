import { api } from "./client";
import { storage } from "./storage";

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name: string; email: string; phone: string; password: string }
export interface SellerRegisterPayload {
  business_name: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  seller_type: "retailer" | "car_dealer" | "real_agent";
  website_url?: string;
  password: string;
}

export interface TokenResponse { access_token: string; refresh_token: string }
export interface UserProfile {
  id: string;
  email: string;
  role: "customer" | "seller" | "admin";
  email_verified: boolean;
}
export interface CustomerProfileData {
  name: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
}
export interface SellerProfileData {
  business_name: string;
  contact_email: string;
  contact_phone?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  kyc_status: "pending" | "approved" | "rejected";
  available_balance: number;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/login", payload);
    await storage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  async registerCustomer(payload: RegisterPayload): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/register/customer", {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
    });
    await storage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  async registerSeller(payload: SellerRegisterPayload): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/register/seller", payload);
    await storage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  async getMe(): Promise<{ user: UserProfile; profile: CustomerProfileData | SellerProfileData }> {
    const { data } = await api.get("/auth/me");
    return data;
  },

  async updateProfile(updates: Partial<CustomerProfileData>): Promise<void> {
    await api.put("/auth/me", updates);
  },

  async changePassword(current_password: string, new_password: string): Promise<void> {
    await api.put("/auth/change-password", { current_password, new_password });
  },

  async sendVerificationEmail(email: string): Promise<void> {
    await api.post("/auth/send-verification", { email });
  },

  async verifyEmail(email: string, code: string): Promise<void> {
    await api.post("/auth/verify-email", { email, code });
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post("/auth/request-password-reset", { email });
  },

  async resetPassword(email: string, code: string, new_password: string): Promise<void> {
    await api.post("/auth/reset-password", { email, code: code, new_password });
  },

  async logout(): Promise<void> {
    await storage.clearTokens();
  },
};

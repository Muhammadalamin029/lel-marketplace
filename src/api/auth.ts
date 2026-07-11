import { api } from "./client";
import { storage } from "./storage";

export type SellerType = "retailer" | "car_dealer" | "real_agent";

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name: string; email: string; phone: string; password: string }
export interface SellerRegisterPayload {
  email: string;
  password: string;
  business_name: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  website_url?: string;
  seller_type?: SellerType;
}
export interface TokenResponse { access_token: string; refresh_token: string }
export interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  business_name?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  logo_url?: string;
  default_grace_period_days?: number;
}
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
  seller_type?: SellerType;
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
      full_name: payload.name,
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

  async updateProfile(updates: ProfileUpdatePayload): Promise<void> {
    await api.put("/auth/me", updates);
  },

  async changePassword(current_password: string, new_password: string): Promise<void> {
    await api.put("/auth/change-password", { current_password, new_password, confirm_password: new_password });
  },

  async sendVerificationEmail(email: string): Promise<void> {
    await api.post("/auth/send-verification", { email });
  },

  async verifyEmail(email: string, code: string): Promise<void> {
    await api.post("/auth/verify-email", { email, verification_code: code });
  },

  async requestPasswordReset(email: string): Promise<void> {
    await api.post("/auth/request-password-reset", { email });
  },

  async resetPassword(email: string, reset_code: string, new_password: string, confirm_password: string): Promise<void> {
    await api.post("/auth/reset-password", { email, reset_code, new_password, confirm_password });
  },

  async logout(): Promise<void> {
    await storage.clearTokens();
  },
};

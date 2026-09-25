import { api } from "./client";
import { storage } from "./storage";

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name: string; email: string; phone: string; password: string }
export interface TokenResponse { access_token: string; refresh_token: string }
export interface UserProfile {
  id: string;
  email: string;
  role: "customer" | "admin";
  email_verified: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string | null;
  password_changed_at?: string;
}
export interface CustomerProfileData {
  id?: string;
  name: string;
  phone?: string;
  bio?: string;
  kyc_status?: string;
  approval_date?: string | null;
  avatar_url?: string;
  created_at?: string;
}

export interface PasswordPolicy {
  min_length: number;
  max_length: number;
  requires_uppercase: boolean;
  requires_lowercase: boolean;
  requires_number: boolean;
  requires_special_char: boolean;
  special_chars: string;
  description: string;
}

export interface PasswordStrength {
  score: number;
  max_score: number;
  strength: "Weak" | "Fair" | "Good" | "Excellent";
  feedback: string[];
}

export const authApi = {
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/login", payload);
    await storage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  /** POST /auth/google — customer sign-in with a Google ID token (web parity). */
  async googleLogin(idToken: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/google", {
      id_token: idToken,
    });
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

  async getMe(): Promise<{ user: UserProfile; profile: CustomerProfileData }> {
    const { data } = await api.get("/auth/me");
    return data;
  },

  async updateProfile(updates: Partial<CustomerProfileData>): Promise<void> {
    await api.put("/auth/me", updates);
  },

  async deleteAccount(): Promise<void> {
    await api.delete("/auth/me");
    await storage.clearTokens();
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

  /** GET /auth/password-policy — server-driven requirements (web parity). */
  async getPasswordPolicy(): Promise<PasswordPolicy> {
    const { data } = await api.get("/auth/password-policy");
    return (data?.data ?? data) as PasswordPolicy;
  },

  /** POST /auth/check-password-strength — server-side strength meter (web parity). */
  async checkPasswordStrength(password: string): Promise<{ strength: PasswordStrength; errors: string[]; is_valid: boolean }> {
    const { data } = await api.post("/auth/check-password-strength", { password });
    return (data?.data ?? data) as { strength: PasswordStrength; errors: string[]; is_valid: boolean };
  },

  /** GET /auth/verification-status/{email} — poll whether email is verified. */
  async getVerificationStatus(email: string): Promise<{ verified: boolean } & Record<string, unknown>> {
    const { data } = await api.get(`/auth/verification-status/${encodeURIComponent(email)}`);
    return (data?.data ?? data) as { verified: boolean } & Record<string, unknown>;
  },

  async resendVerificationEmail(email: string): Promise<void> {
    await api.post("/auth/resend-verification", { email });
  },

  async logout(): Promise<void> {
    await storage.clearTokens();
  },
};

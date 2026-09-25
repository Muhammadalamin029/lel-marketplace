import { api } from "./client";

/** Matches backend NotificationOut schema */
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  channels: string[];
  data: Record<string, any> | null;
  is_read: boolean;
  is_sent: boolean;
  created_at: string;
  read_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
}

/** Matches backend NotificationsResponse schema */
interface NotificationsResponse {
  notifications: Notification[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
  unread_count: number;
}

export interface NotificationPreferencesChannels {
  order_updates: boolean;
  payment_updates: boolean;
  account_updates: boolean;
  promotional_offers: boolean;
  system_announcements: boolean;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: NotificationPreferencesChannels;
  sms_notifications: NotificationPreferencesChannels;
  push_notifications: NotificationPreferencesChannels;
  in_app_notifications: NotificationPreferencesChannels;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  read_count: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  recent_activity: Record<string, number>;
}

export const notificationsApi = {
  async list(params: { page?: number; limit?: number; unread_only?: boolean } = {}) {
    const { unread_only, ...rest } = params;
    const { data } = await api.get<NotificationsResponse>("/notifications/", {
      params: { limit: 30, ...rest, ...(unread_only ? { is_read: false } : {}) },
    });
    return data; // { notifications, pagination, unread_count }
  },

  async markRead(id: string) {
    await api.patch(`/notifications/${id}`, { is_read: true });
  },

  async markAllRead() {
    await api.patch("/notifications/mark-all-read");
  },

  async getStats() {
    const { data } = await api.get<NotificationStats>("/notifications/stats");
    return data;
  },

  async getPreferences() {
    const { data } = await api.get<NotificationPreferences>("/notifications/preferences");
    return data;
  },

  async updatePreferences(payload: Partial<Pick<NotificationPreferences, "email_notifications" | "sms_notifications" | "push_notifications" | "in_app_notifications">>) {
    const { data } = await api.patch<NotificationPreferences>("/notifications/preferences", payload);
    return data;
  },

  async markManyRead(ids: string[]) {
    await api.patch("/notifications/bulk-update", { notification_ids: ids, is_read: true });
  },

  async delete(id: string) {
    await api.delete(`/notifications/${id}`);
  },

  async deleteMany(ids: string[]) {
    await api.delete("/notifications/bulk-delete", { data: { notification_ids: ids } });
  },

  /** POST /notifications/push-token — register this device for push. */
  async registerPushToken(expo_push_token: string, platform: "ios" | "android") {
    await api.post("/notifications/push-token", { expo_push_token, platform });
  },

  /** DELETE /notifications/push-token — deregister on logout. */
  async removePushToken(expo_push_token: string) {
    await api.delete("/notifications/push-token", { params: { expo_push_token } });
  },
};

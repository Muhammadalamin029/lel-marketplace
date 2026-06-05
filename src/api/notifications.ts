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

export const notificationsApi = {
  async list(params: { page?: number; limit?: number; unread_only?: boolean } = {}) {
    const { data } = await api.get<NotificationsResponse>("/notifications/", {
      params: { limit: 30, ...params },
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
    const { data } = await api.get("/notifications/stats");
    return data as { unread_count: number; total_notifications: number };
  },
};

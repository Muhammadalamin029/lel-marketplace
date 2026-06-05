import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { TabSelector } from "@/components/TabSelector";
import { Bell, Package, CreditCard, Calendar, ShieldCheck } from "lucide-react-native";
import { shadow } from "@/constants/shadows";
import { formatDate } from "@/utils/format";
import { notificationsApi } from "@/api";
import type { Notification } from "@/api";

const TABS = ["All", "Unread"] as const;
type Tab = typeof TABS[number];

function getIcon(type: string) {
  switch (type) {
    case "order_confirmed":
    case "order_shipped":
    case "order_delivered":
      return { Icon: Package, bg: "#eff6ff", color: "#3b82f6" };
    case "payment_successful":
    case "installment_paid":
      return { Icon: CreditCard, bg: "#f0fdf4", color: "#22c55e" };
    case "inspection_confirmed":
    case "inspection_scheduled":
      return { Icon: Calendar, bg: "#fffbeb", color: "#f59e0b" };
    case "agreement_approved":
    case "agreement_created":
      return { Icon: ShieldCheck, bg: "#faf5ff", color: "#a855f7" };
    default:
      return { Icon: Bell, bg: "#f3f4f6", color: "#6b7280" };
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(iso);
}

export default function NotificationsScreen() {
  useRequireAuth();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ limit: 50 });
      // Backend returns { notifications, pagination, unread_count }
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count ?? res.notifications.filter((n) => !n.is_read).length);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationsApi.markRead(id); } catch { /* revert on error is optional */ }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try { await notificationsApi.markAllRead(); } catch { /* silent */ }
  };

  const visible = activeTab === "Unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        rightSlot={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead} className="px-3 py-1 bg-amber-50 rounded-full">
              <Text className="text-xs font-semibold text-amber-600">Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View className="px-5 pt-4 pb-2">
        <TabSelector tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#f59e0b" />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState Icon={Bell} title="No notifications" subtitle={activeTab === "Unread" ? "You're all caught up!" : "Nothing here yet."} />
        ) : (
          <View className="pb-10">
            {visible.map((n) => {
              const { Icon, bg, color } = getIcon(n.type);
              return (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => markRead(n.id)}
                  className={`flex-row gap-3 p-4 rounded-2xl mb-3 ${n.is_read ? "bg-white" : "bg-amber-50"}`}
                  style={shadow.card}
                >
                  <View className="w-10 h-10 rounded-full items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                    <Icon size={18} color={color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="text-sm font-bold text-gray-900 flex-1">{n.title}</Text>
                      {!n.is_read && <View className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />}
                    </View>
                    <Text className="text-xs text-gray-500 mt-0.5 leading-relaxed" numberOfLines={2}>{n.message}</Text>
                    <Text className="text-[10px] text-gray-400 mt-1.5 font-medium">{timeAgo(n.created_at)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

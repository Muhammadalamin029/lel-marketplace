import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { Bell, Package, CreditCard, Home, Tag, ShieldCheck } from "lucide-react-native";
import { formatDate } from "@/utils/format";
import { notificationsApi } from "@/api";
import type { Notification } from "@/api";

type FilterKey = "all" | "unread" | "orders" | "payments" | "promotions";
type Category = "Orders" | "Payments" | "Property updates" | "Promotions" | "Account";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "promotions", label: "Promotions" },
];

function getCategory(type: string): Category {
  if (type.startsWith("order_")) return "Orders";
  if (type.startsWith("payment_") || type.startsWith("installment_")) return "Payments";
  if (type === "promotional_offer" || type === "wishlist_item_back_in_stock") return "Promotions";
  if (
    type === "car_approved" ||
    type === "car_rejected" ||
    type === "property_acquired" ||
    type.startsWith("inspection_") ||
    type.startsWith("agreement_")
  ) {
    return "Property updates";
  }
  return "Account";
}

function getIcon(category: Category) {
  switch (category) {
    case "Orders":
      return Package;
    case "Payments":
      return CreditCard;
    case "Property updates":
      return Home;
    case "Promotions":
      return Tag;
    default:
      return ShieldCheck;
  }
}

function badgeStyle(category: Category) {
  if (category === "Orders" || category === "Payments") {
    return { bg: "bg-emerald-100", text: "text-emerald-700" };
  }
  return { bg: "bg-gray-100", text: "text-gray-500" };
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
  const [filter, setFilter] = useState<FilterKey>("all");
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

  const visible = useMemo(
    () =>
      notifications.filter((n) => {
        switch (filter) {
          case "unread":
            return !n.is_read;
          case "orders":
            return getCategory(n.type) === "Orders";
          case "payments":
            return getCategory(n.type) === "Payments";
          case "promotions":
            return getCategory(n.type) === "Promotions";
          default:
            return true;
        }
      }),
    [notifications, filter],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
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

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        className="mb-3 flex-grow-0"
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full border ${
                active ? "bg-orange-500 border-orange-500" : "bg-white border-gray-200"
              }`}
            >
              <Text className={`text-sm font-medium ${active ? "text-white" : "text-gray-700"}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#f59e0b" />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            Icon={Bell}
            title="No notifications"
            subtitle={filter === "unread" ? "You're all caught up!" : "Nothing here yet."}
          />
        ) : (
          visible.map((n) => {
            const category = getCategory(n.type);
            const badge = badgeStyle(category);
            const Icon = getIcon(category);
            return (
              <TouchableOpacity
                key={n.id}
                onPress={() => markRead(n.id)}
                className={`flex-row px-4 py-4 border-b border-gray-100 ${
                  n.is_read ? "bg-white" : "bg-emerald-50"
                }`}
              >
                <View className="w-10 h-10 rounded-xl bg-white border border-gray-100 items-center justify-center mr-3">
                  <Icon size={18} color="#374151" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <View className={`px-2 py-0.5 rounded-full ${badge.bg}`}>
                      <Text className={`text-xs font-medium ${badge.text}`}>{category}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">{timeAgo(n.created_at)}</Text>
                  </View>
                  <Text className="text-[15px] font-semibold text-gray-900 mb-1">{n.title}</Text>
                  <Text className="text-sm text-gray-500 leading-5" numberOfLines={2}>
                    {n.message}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

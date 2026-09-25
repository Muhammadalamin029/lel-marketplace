import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { Bell, Package, CreditCard, Home, Tag, ShieldCheck } from "lucide-react-native";
import { COLORS } from "@/constants/brand";
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
  if (category === "Orders") return { bg: "#f0fdf4", text: "#16a34a" };
  if (category === "Payments") return { bg: "#eff6ff", text: "#2563eb" };
  return { bg: "#f3f4f6", text: "#6b7280" };
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

  /** Long-press to delete (web parity — single + bulk delete exist server-side). */
  const deleteOne = (id: string, wasUnread: boolean) => {
    Alert.alert("Delete notification?", "This cannot be undone.", [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
          try { await notificationsApi.delete(id); }
          catch { load(); }
        },
      },
    ]);
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
        hideBack
        rightSlot={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllRead}>
              <Text className="text-xs font-grotesk-semibold text-gray-900">Mark all Read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        className="mb-3 flex-grow-0"
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: active ? COLORS.primary : "#f3f4f6" }}
            >
              <Text className="text-xs font-grotesk-semibold" style={{ color: active ? "#fff" : "#4b5563" }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#ff4b26" />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            Icon={Bell}
            title="No notifications"
            subtitle={filter === "unread" ? "You're all caught up!" : "Nothing here yet."}
          />
        ) : (
          <>
          {visible.map((n) => {
            const category = getCategory(n.type);
            const badge = badgeStyle(category);
            const Icon = getIcon(category);
            return (
              <TouchableOpacity
                key={n.id}
                onPress={() => markRead(n.id)}
                onLongPress={() => deleteOne(n.id, !n.is_read)}
                delayLongPress={500}
                className="px-5 py-4 border-b border-gray-50"
              >
                <View className="flex-row items-start gap-3">
                  <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center">
                    <Icon size={18} color="#374151" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: badge.bg }}>
                        <Text className="text-[10px] font-grotesk-semibold" style={{ color: badge.text }}>{category}</Text>
                      </View>
                      <Text className="font-manrope text-[11px] text-gray-400">{timeAgo(n.created_at)}</Text>
                    </View>
                    <Text className="text-[13px] font-grotesk-bold text-gray-900 mb-0.5">{n.title}</Text>
                    <Text className="font-manrope text-xs text-gray-400 leading-relaxed" numberOfLines={2}>
                      {n.message}
                    </Text>
                    {!n.is_read && (
                      <View className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: COLORS.primary }} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

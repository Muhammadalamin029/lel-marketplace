import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Package } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { COLORS } from "@/constants/brand";
import { fmt, formatDate } from "@/utils/format";
import { ordersApi } from "@/api";
import type { Order } from "@/api";

const TABS = ["All", "Ongoing", "Delivered", "Cancelled"] as const;
type Tab = typeof TABS[number];

function tabFilter(orders: Order[], tab: Tab) {
  if (tab === "Ongoing") return orders.filter((o) => ["pending", "processing", "paid", "shipped"].includes(o.status));
  if (tab === "Delivered") return orders.filter((o) => o.status === "delivered");
  if (tab === "Cancelled") return orders.filter((o) => o.status === "cancelled");
  return orders;
}

function statusColor(status: string): string {
  switch (status) {
    case "delivered": return "#22c55e";
    case "cancelled": return "#ef4444";
    case "shipped": return "#3b82f6";
    default: return "#ff4b26";
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function OrdersScreen() {
  useRequireAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    ordersApi.list({ limit: 50 })
      .then(({ data }) => { if (!cancelled) setOrders(data); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Failed to load orders"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visible = tabFilter(orders, activeTab);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader
        title="Your Orders"
        subtitle={orders.length > 0 ? `${orders.length} order${orders.length === 1 ? "" : "s"} in the last 90 days` : undefined}
      />

      <View className="px-5 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {TABS.map((t) => {
              const active = activeTab === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveTab(t)}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: active ? COLORS.primary : "#f3f4f6" }}
                >
                  <Text className="text-xs font-grotesk-semibold" style={{ color: active ? "#fff" : "#4b5563" }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="font-manrope text-sm text-gray-400 mt-3">Loading orders…</Text>
          </View>
        ) : error ? (
          <EmptyState Icon={Package} title="Could not load orders" subtitle={error} />
        ) : visible.length === 0 ? (
          <EmptyState Icon={Package} title="No orders found" subtitle={`You don't have any ${activeTab.toLowerCase()} orders.`} />
        ) : (
          <View className="gap-3 pt-2">
            {visible.map((order) => {
              const thumbs = (order.order_items ?? []).slice(0, 3);
              const names = (order.order_items ?? []).map((i) => i.product?.name ?? "Item").join(", ");
              return (
                <TouchableOpacity
                  key={order.id}
                  onPress={() => router.push(`/order-details?id=${order.id}` as any)}
                  activeOpacity={0.85}
                  className="bg-white border border-gray-100 rounded-2xl p-4"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View>
                      <Text className="text-[13px] font-grotesk-extrabold text-gray-900">
                        LS-{order.id.slice(-6).toUpperCase()}
                      </Text>
                      <Text className="font-manrope text-[11px] text-gray-400 mt-0.5">
                        {formatDate(order.created_at)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor(order.status) }} />
                      <Text className="font-grotesk text-xs text-gray-600">{statusLabel(order.status)}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="flex-row">
                      {thumbs.map((item, i) => {
                        const uri = item.product?.images?.[0]?.image_url;
                        return uri ? (
                          <Image
                            key={item.id}
                            source={{ uri }}
                            className="rounded-lg bg-gray-100"
                            style={{ width: 44, height: 44, marginLeft: i === 0 ? 0 : -12, borderWidth: 2, borderColor: "#fff" }}
                          />
                        ) : (
                          <View
                            key={item.id}
                            className="rounded-lg bg-gray-100 items-center justify-center"
                            style={{ width: 44, height: 44, marginLeft: i === 0 ? 0 : -12, borderWidth: 2, borderColor: "#fff" }}
                          >
                            <Package size={18} color="#9ca3af" />
                          </View>
                        );
                      })}
                    </View>
                    <Text className="font-manrope text-xs text-gray-500 flex-1" numberOfLines={2}>
                      {names}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-grotesk-extrabold text-gray-900">{fmt(order.total_amount)}</Text>
                    <View className="flex-row items-center gap-0.5">
                      <Text className="text-xs font-grotesk-semibold" style={{ color: COLORS.success }}>View details</Text>
                      <Text className="font-grotesk text-xs" style={{ color: COLORS.success }}>›</Text>
                    </View>
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

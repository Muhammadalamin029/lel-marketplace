import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Package, ChevronRight } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { TabSelector } from "@/components/TabSelector";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";
import { ordersApi } from "@/api";
import type { Order } from "@/api";

const TABS = ["Active", "Completed", "Cancelled"] as const;
type Tab = typeof TABS[number];

function tabFilter(orders: Order[], tab: Tab) {
  if (tab === "Active") return orders.filter((o) => ["pending", "processing", "paid", "shipped"].includes(o.status));
  if (tab === "Completed") return orders.filter((o) => o.status === "delivered");
  if (tab === "Cancelled") return orders.filter((o) => o.status === "cancelled");
  return orders;
}

export default function OrdersScreen() {
  useRequireAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Active");
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="My Orders" />

      <View className="bg-white px-5 pb-4 border-b border-gray-100">
        <TabSelector tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400 mt-3">Loading orders…</Text>
          </View>
        ) : error ? (
          <EmptyState Icon={Package} title="Could not load orders" subtitle={error} />
        ) : visible.length === 0 ? (
          <EmptyState Icon={Package} title="No orders found" subtitle={`You don't have any ${activeTab.toLowerCase()} orders.`} />
        ) : (
          <View className="gap-4 pb-10">
            {visible.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push(`/order-details?id=${order.id}` as any)}
                className="bg-white rounded-2xl p-4"
                style={shadow.card}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                      <Package size={14} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</Text>
                      <Text className="text-[10px] text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                <View className="h-px bg-gray-100 mb-3" />

                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-xs text-gray-500 mb-0.5">Amount</Text>
                    <Text className="text-base font-extrabold text-gray-900">{fmt(order.total_amount)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-500 mb-1">
                      {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? "s" : ""}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs font-bold text-indigo-600">View Details</Text>
                      <ChevronRight size={14} color="#4f46e5" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

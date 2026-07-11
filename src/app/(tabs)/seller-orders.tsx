import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ShoppingBag, ChevronRight } from "lucide-react-native";
import { SellerGate } from "@/components/SellerGate";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { sellerOrdersApi } from "@/api";
import type { Order } from "@/api";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { fmt, formatDate } from "@/utils/format";

const FILTERS = ["all", "pending", "processing", "paid", "shipped", "delivered", "cancelled"] as const;

function OrdersScreenInner() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const { items } = await sellerOrdersApi.list({ status_filter: filter === "all" ? undefined : filter });
      setOrders(items);
    } catch {
      setOrders([]);
    }
  }, [filter]);

  const { loading, refreshing, load, onRefresh } = usePullToRefresh(fetchData);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="w-10 h-10 rounded-2xl bg-amber-50 items-center justify-center">
          <ShoppingBag size={18} color="#d97706" />
        </View>
        <View>
          <Text className="text-lg font-extrabold text-gray-900">Orders</Text>
          <Text className="text-xs text-gray-400">{orders.length} order{orders.length === 1 ? "" : "s"}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-none bg-white border-b border-gray-100" contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl border ${filter === f ? "bg-amber-400 border-amber-400" : "bg-white border-gray-200"}`}
          >
            <Text className={`text-xs font-bold capitalize ${filter === f ? "text-white" : "text-gray-700"}`}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" colors={["#f59e0b"]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />
        ) : orders.length === 0 ? (
          <EmptyState Icon={ShoppingBag} title="No orders yet" subtitle="Orders containing your products will show up here." />
        ) : (
          <View className="gap-3">
            {orders.map((o) => (
              <TouchableOpacity
                key={o.id}
                onPress={() => router.push(`/seller-order-details?id=${o.id}` as any)}
                className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
                style={shadow.card}
              >
                <View className="w-11 h-11 rounded-full bg-amber-50 items-center justify-center">
                  <ShoppingBag size={18} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">Order #{o.id.slice(0, 8).toUpperCase()}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{o.buyer?.name || o.buyer?.email} · {formatDate(o.created_at)}</Text>
                  <Text className="text-sm font-extrabold text-gray-900 mt-1">{fmt(o.total_amount)}</Text>
                </View>
                <View className="items-end gap-2">
                  <StatusBadge status={o.status} />
                  <ChevronRight size={16} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function OrdersScreen() {
  return (
    <SellerGate>
      <OrdersScreenInner />
    </SellerGate>
  );
}

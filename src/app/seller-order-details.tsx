import { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Mail, Phone, MapPin, Package, ShoppingBag } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { shadow } from "@/constants/shadows";
import { sellerOrdersApi, getApiError } from "@/api";
import type { Order } from "@/api";
import { fmt, formatDate } from "@/utils/format";

const NEXT_ACTION: Record<string, { label: string; next: string }> = {
  paid: { label: "Mark Shipped", next: "shipped" },
  shipped: { label: "Mark Delivered", next: "delivered" },
};

export default function SellerOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    sellerOrdersApi.getById(id).then(setOrder).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const action = order ? NEXT_ACTION[order.status] : undefined;

  const handleUpdate = async () => {
    if (!order || !action) return;
    setUpdating(true);
    try {
      await sellerOrdersApi.updateStatus(order.id, action.next);
      load();
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Order Details" subtitle={id ? `#${id.slice(0, 8).toUpperCase()}` : undefined} />
      {loading ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />
      ) : !order ? (
        <View className="items-center justify-center flex-1">
          <Text className="text-gray-500">Order not found.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="gap-4">
            <View className="bg-white rounded-3xl p-5" style={shadow.md}>
              <View className="flex-row items-center justify-between">
                <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center">
                  <ShoppingBag size={22} color="#d97706" />
                </View>
                <StatusBadge status={order.status} />
              </View>
              <Text className="text-2xl font-extrabold text-gray-900 mt-3">{fmt(order.total_amount)}</Text>
              <Text className="text-xs text-gray-400 mt-1">Placed {formatDate(order.created_at)}</Text>
            </View>

            <View className="bg-white rounded-2xl p-4 gap-2" style={shadow.card}>
              <Text className="text-xs font-bold text-gray-400 uppercase mb-1">Customer</Text>
              <Text className="text-sm font-bold text-gray-900">{order.buyer?.name}</Text>
              {order.buyer?.email && (
                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${order.buyer.email}`)} className="flex-row items-center gap-2">
                  <Mail size={14} color="#6b7280" />
                  <Text className="text-xs text-gray-500">{order.buyer.email}</Text>
                </TouchableOpacity>
              )}
              {order.buyer?.phone && (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.buyer.phone}`)} className="flex-row items-center gap-2">
                  <Phone size={14} color="#6b7280" />
                  <Text className="text-xs text-gray-500">{order.buyer.phone}</Text>
                </TouchableOpacity>
              )}
            </View>

            {order.delivery_addr && (
              <View className="bg-white rounded-2xl p-4 gap-1" style={shadow.card}>
                <View className="flex-row items-center gap-2 mb-1">
                  <MapPin size={14} color="#6b7280" />
                  <Text className="text-xs font-bold text-gray-400 uppercase">Delivery Address</Text>
                </View>
                <Text className="text-sm text-gray-700">{order.delivery_addr.street}</Text>
                <Text className="text-sm text-gray-500">{order.delivery_addr.city}, {order.delivery_addr.state}</Text>
                <Text className="text-sm text-gray-500">{order.delivery_addr.country}</Text>
              </View>
            )}

            <View className="bg-white rounded-2xl overflow-hidden" style={shadow.card}>
              <Text className="text-xs font-bold text-gray-400 uppercase p-4 pb-2">Your Items</Text>
              {order.order_items.map((item) => (
                <View key={item.id} className="flex-row items-center gap-3 px-4 py-3 border-t border-gray-50">
                  <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
                    <Package size={16} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{item.product?.name}</Text>
                    <Text className="text-xs text-gray-400">Qty {item.quantity} · {fmt(item.price)} each</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{fmt(item.quantity * item.price)}</Text>
                </View>
              ))}
            </View>

            {action && <PrimaryButton label={action.label} loading={updating} onPress={handleUpdate} />}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

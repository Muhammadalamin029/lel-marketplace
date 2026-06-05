import { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ShoppingBag, Trash2, Plus, Minus, MapPin, CreditCard, ChevronRight,
} from "lucide-react-native";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";
import { useCartStore } from "@/store/cartStore";
import type { OrderItem } from "@/api/orders";

// ─── Cart Item Row ─────────────────────────────────────────────────────────────

function CartItemRow({ item, onQtyChange, onRemove, isLoading }: {
  item: OrderItem;
  onQtyChange: (itemId: string, newQty: number) => void;
  onRemove: (itemId: string) => void;
  isLoading: boolean;
}) {
  const imageUrl = item.product?.images?.[0]?.image_url;
  const isPhysical = false; // products in orders are never physical assets

  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-3 flex-row items-center gap-3" style={shadow.md}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-xl" resizeMode="cover" />
      ) : (
        <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center flex-shrink-0">
          <ShoppingBag size={24} color="#6b7280" strokeWidth={1.5} />
        </View>
      )}

      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
          {item.product?.name ?? "Product"}
        </Text>
        <Text className="text-sm font-bold text-amber-400">{fmt(item.price)}</Text>
        <Text className="text-[11px] text-gray-400">Each</Text>
      </View>

      <View className="items-end gap-2">
        <TouchableOpacity onPress={() => onRemove(item.id)} disabled={isLoading}>
          <Trash2 size={15} color={isLoading ? "#e5e7eb" : "#d1d5db"} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
          <TouchableOpacity
            onPress={() => onQtyChange(item.id, item.quantity - 1)}
            disabled={isLoading || item.quantity <= 1}
          >
            <Minus size={13} color={item.quantity <= 1 || isLoading ? "#d1d5db" : "#6b7280"} />
          </TouchableOpacity>
          <Text className="text-sm font-bold text-gray-900 w-4 text-center">{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => onQtyChange(item.id, item.quantity + 1)}
            disabled={isLoading}
          >
            <Plus size={13} color={isLoading ? "#d1d5db" : "#6b7280"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Cart Screen ───────────────────────────────────────────────────────────────

export default function CartScreen() {
  const router = useRouter();
  const {
    pendingOrder,
    isLoading,
    fetchPendingOrder,
    updateQty,
    removeItem,
    clearCart,
    totalPrice,
    totalItems,
  } = useCartStore();

  useEffect(() => {
    fetchPendingOrder();
  }, []);

  const items = pendingOrder?.order_items ?? [];
  const total = totalPrice();
  const qty = totalItems();

  const handleRemove = async (itemId: string) => {
    await removeItem(itemId);
  };

  const handleQtyChange = async (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      await removeItem(itemId);
    } else {
      await updateQty(itemId, newQty);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
        <View>
          <Text className="text-xs text-gray-400 font-medium">Your selections</Text>
          <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
            My <Text className="text-amber-400">Cart</Text>
            {qty > 0 && <Text className="text-base font-bold text-amber-400"> ({qty})</Text>}
          </Text>
        </View>
        <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <ShoppingBag size={20} color="#374151" strokeWidth={1.8} />
        </View>
      </View>

      {isLoading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-sm text-gray-400">Loading cart…</Text>
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          Icon={ShoppingBag}
          title="Your cart is empty"
          subtitle="Browse listings and tap 'Add to Cart' on a product."
          iconBg="#fffbeb"
          iconColor="#f59e0b"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Items */}
          <View className="px-5 mt-4 gap-3">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQtyChange={handleQtyChange}
                onRemove={handleRemove}
                isLoading={isLoading}
              />
            ))}
          </View>

          {/* Delivery address */}
          <View className="px-5 mt-6">
            <SectionHeader title="Delivery" showDots={false} />
            <TouchableOpacity
              onPress={() => router.push("/addresses")}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center gap-3"
              style={shadow.md}
            >
              <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
                <MapPin size={18} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">Select delivery address</Text>
                <Text className="text-xs text-gray-400">Tap to choose or add an address</Text>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View className="px-5 mt-6">
            <SectionHeader title="Summary" showDots={false} />
            <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-3" style={shadow.md}>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Subtotal ({qty} item{qty !== 1 ? "s" : ""})</Text>
                <Text className="text-sm font-semibold text-gray-900">{fmt(total)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Delivery</Text>
                <Text className="text-sm font-semibold text-gray-400">Paid separately</Text>
              </View>
              <View className="h-px bg-gray-100" />
              <View className="flex-row justify-between">
                <Text className="text-base font-extrabold text-gray-900">Total</Text>
                <Text className="text-base font-extrabold text-amber-400">{fmt(total)}</Text>
              </View>
            </View>
          </View>

          {/* Checkout */}
          <View className="px-5 mt-5">
            <TouchableOpacity
              onPress={() => router.push("/checkout")}
              className="bg-amber-400 rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={shadow.btn}
            >
              <CreditCard size={18} color="#ffffff" />
              <Text className="text-white text-base font-bold">
                Proceed to Checkout — {fmt(total)}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

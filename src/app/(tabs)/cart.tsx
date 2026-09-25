import { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react-native";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS } from "@/constants/brand";
import { fmt } from "@/utils/format";
import { useCartStore } from "@/store/cartStore";
import type { OrderItem } from "@/api/orders";

function CartItemRow({ item, onQtyChange, onRemove, isLoading }: {
  item: OrderItem;
  onQtyChange: (itemId: string, newQty: number) => void;
  onRemove: (itemId: string) => void;
  isLoading: boolean;
}) {
  const imageUrl = item.product?.images?.[0]?.image_url;

  return (
    <View className="bg-white py-4 border-b border-gray-100">
      <View className="flex-row gap-3">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="rounded-lg" style={{ width: 64, height: 64 }} resizeMode="cover" />
        ) : (
          <View className="rounded-lg bg-gray-100 items-center justify-center" style={{ width: 64, height: 64 }}>
            <ShoppingBag size={24} color="#9ca3af" strokeWidth={1.5} />
          </View>
        )}
        <View className="flex-1 min-w-0">
          <Text className="text-[13px] font-grotesk-semibold text-gray-900" numberOfLines={2}>
            {item.product?.name ?? "Product"}
          </Text>
          <Text className="text-sm font-grotesk-extrabold mt-1" style={{ color: COLORS.primary }}>
            {fmt(item.price * item.quantity)}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center rounded-lg border border-gray-200 px-2 py-1.5 gap-4">
          <TouchableOpacity
            onPress={() => onQtyChange(item.id, item.quantity - 1)}
            disabled={isLoading || item.quantity <= 1}
            hitSlop={8}
          >
            <Minus size={14} color={item.quantity <= 1 || isLoading ? "#d1d5db" : "#374151"} />
          </TouchableOpacity>
          <Text className="text-sm font-grotesk-bold text-gray-900" style={{ minWidth: 16, textAlign: "center" }}>
            {item.quantity}
          </Text>
          <TouchableOpacity onPress={() => onQtyChange(item.id, item.quantity + 1)} disabled={isLoading} hitSlop={8}>
            <Plus size={14} color={isLoading ? "#d1d5db" : "#374151"} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => onRemove(item.id)}
          disabled={isLoading}
          className="flex-row items-center gap-1.5"
        >
          <Trash2 size={14} color={COLORS.danger} />
          <Text className="text-xs font-grotesk-semibold" style={{ color: COLORS.danger }}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const {
    pendingOrder,
    isLoading,
    fetchPendingOrder,
    updateQty,
    removeItem,
    totalPrice,
    totalItems,
  } = useCartStore();

  useEffect(() => {
    fetchPendingOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Your Cart" subtitle={qty > 0 ? `(${qty} item${qty === 1 ? "" : "s"})` : undefined} />

      {isLoading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="font-manrope text-sm text-gray-400">Loading cart…</Text>
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          Icon={ShoppingBag}
          title="Your cart is empty"
          subtitle="Browse listings and tap 'Add to Cart' on a product."
        />
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
            {/* Items */}
            <View className="px-5">
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

            {/* Order summary */}
            <View className="px-5 mt-4">
              <Text className="text-base font-grotesk-extrabold text-gray-900 mb-3">Order summary</Text>
              <View className="gap-2.5">
                <View className="flex-row justify-between">
                  <Text className="font-manrope text-[13px] text-gray-500">Subtotal</Text>
                  <Text className="text-[13px] font-grotesk-bold text-gray-900">{fmt(total)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="font-manrope text-[13px] text-gray-500">Delivery</Text>
                  <Text className="text-[13px] font-grotesk-bold text-gray-900">At checkout</Text>
                </View>
                <View className="h-px bg-gray-100 my-1" />
                <View className="flex-row justify-between">
                  <Text className="text-sm font-grotesk-bold text-gray-900">Total</Text>
                  <Text className="text-sm font-grotesk-extrabold" style={{ color: COLORS.primary }}>
                    {fmt(total)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Sticky total + checkout */}
          <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-3 border-t border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-manrope text-[13px] text-gray-400">Total</Text>
              <Text className="text-lg font-grotesk-extrabold" style={{ color: COLORS.primary }}>
                {fmt(total)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/checkout")}
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="text-white text-sm font-grotesk-bold">Proceed to checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

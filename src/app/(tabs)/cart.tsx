import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ShoppingBag, Trash2, Plus, Minus, MapPin, CreditCard, ChevronRight } from "lucide-react-native";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";

// ─── Data ──────────────────────────────────────────────────────────────────────

const INITIAL_CART = [
  { id: "1", name: "Toyota Camry 2022", price: 18500000, qty: 1, bg: "#fff7ed", iconColor: "#ea580c", type: "vehicle" },
  { id: "2", name: "Dining Table Set", price: 1200000, qty: 2, bg: "#f0fdf4", iconColor: "#16a34a", type: "product" },
  { id: "3", name: "Honda Civic 2021", price: 12000000, qty: 1, bg: "#eff6ff", iconColor: "#2563eb", type: "vehicle" },
];

// ─── Cart Item Row ─────────────────────────────────────────────────────────────

function CartItem({ item, onQtyChange, onRemove }: {
  item: typeof INITIAL_CART[0];
  onQtyChange: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  const isPhysicalAsset = item.type === "vehicle" || item.type === "real_estate";
  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-3 flex-row items-center gap-3" style={shadow.md}>
      <View className="w-16 h-16 rounded-xl items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
        <ShoppingBag size={28} color={item.iconColor} strokeWidth={1.5} />
      </View>
      <View className="flex-1 min-w-0 gap-0.5">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>{item.name}</Text>
        <Text className="text-sm font-bold text-amber-400">{fmt(item.price)}</Text>
        {isPhysicalAsset && <Text className="text-[11px] text-green-600 font-medium">Free inspection</Text>}
      </View>
      <View className="items-end gap-2">
        <TouchableOpacity onPress={() => onRemove(item.id)}>
          <Trash2 size={15} color="#d1d5db" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
          <TouchableOpacity onPress={() => onQtyChange(item.id, -1)}>
            <Minus size={13} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-sm font-bold text-gray-900 w-4 text-center">{item.qty}</Text>
          <TouchableOpacity onPress={() => onQtyChange(item.id, 1)}>
            <Plus size={13} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Cart Screen ───────────────────────────────────────────────────────────────

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState(INITIAL_CART);

  const handleQtyChange = (id: string, delta: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));
  };

  const handleRemove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const hasInspection = items.some((i) => i.type === "vehicle" || i.type === "real_estate");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
        <View>
          <Text className="text-xs text-gray-400 font-medium">Your selections</Text>
          <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
            My <Text className="text-amber-400">Cart</Text>
          </Text>
        </View>
        <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <ShoppingBag size={20} color="#374151" strokeWidth={1.8} />
        </View>
      </View>

      {items.length === 0 ? (
        <EmptyState
          Icon={ShoppingBag}
          title="Cart is empty"
          subtitle="Add items from the home page to get started."
          iconBg="#fffbeb"
          iconColor="#f59e0b"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* ── Cart Items ── */}
          <View className="px-5 mt-4 gap-3">
            {items.map((item) => (
              <CartItem key={item.id} item={item} onQtyChange={handleQtyChange} onRemove={handleRemove} />
            ))}
          </View>

          {/* ── Delivery Address ── */}
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
                <Text className="text-sm font-semibold text-gray-900">12 Adeola Odeku St, VI</Text>
                <Text className="text-xs text-gray-400">Lagos, Nigeria · Tap to change</Text>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* ── Order Summary ── */}
          <View className="px-5 mt-6">
            <SectionHeader title="Summary" showDots={false} />
            <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-3" style={shadow.md}>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Subtotal ({totalQty} items)</Text>
                <Text className="text-sm font-semibold text-gray-900">{fmt(total)}</Text>
              </View>
              {hasInspection && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Inspection fee</Text>
                  <Text className="text-sm font-semibold text-green-600">Free</Text>
                </View>
              )}
              <View className="h-px bg-gray-100" />
              <View className="flex-row justify-between">
                <Text className="text-base font-extrabold text-gray-900">Total</Text>
                <Text className="text-base font-extrabold text-amber-400">{fmt(total)}</Text>
              </View>
            </View>
          </View>

          {/* ── Checkout Button ── */}
          <View className="px-5 mt-5">
            <TouchableOpacity
              onPress={() => router.push("/checkout")}
              className="bg-amber-400 rounded-2xl py-4 flex-row items-center justify-center gap-2"
              style={shadow.btn}
            >
              <CreditCard size={18} color="#ffffff" />
              <Text className="text-white text-base font-bold">Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

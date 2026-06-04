import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";
import { MapPin, CreditCard, ChevronRight, CheckCircle, Package, Truck } from "lucide-react-native";

type Step = "review" | "processing" | "success";

const MOCK_ITEMS = [
  { id: "1", name: "Toyota Camry 2022", price: 18500000, qty: 1, type: "vehicle" },
  { id: "2", name: "Dining Table Set", price: 1200000, qty: 2, type: "product" },
];

const MOCK_ADDRESS = {
  title: "Home",
  street: "123 Awolowo Road, Ikoyi",
  city: "Lagos",
};

export default function CheckoutScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("review");
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = MOCK_ITEMS.reduce((s, i) => s + i.price * i.qty, 0);
  const hasInspection = MOCK_ITEMS.some((i) => i.type === "vehicle" || i.type === "real_estate");

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    setStep("processing");
    try {
      // TODO: POST /checkout/create-order then redirect to Paystack
      await new Promise((r) => setTimeout(r, 2000));
      setStep("success");
    } catch {
      setStep("review");
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === "processing") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-5">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-base font-bold text-gray-900">Processing your order…</Text>
        <Text className="text-sm text-gray-500">Please do not close the app.</Text>
      </SafeAreaView>
    );
  }

  if (step === "success") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-8 gap-6">
        <View className="w-24 h-24 rounded-full bg-green-50 items-center justify-center">
          <CheckCircle size={48} color="#22c55e" />
        </View>
        <View className="items-center gap-2">
          <Text className="text-2xl font-extrabold text-gray-900">Order Placed!</Text>
          <Text className="text-sm text-gray-500 text-center leading-relaxed">
            Your order has been successfully placed. You'll receive a confirmation email shortly.
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/orders")} className="w-full bg-amber-400 py-4 rounded-2xl items-center" style={shadow.btn}>
          <Text className="text-white font-bold">Track My Order</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} className="w-full bg-white border border-gray-200 py-4 rounded-2xl items-center">
          <Text className="text-gray-700 font-semibold">Continue Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Checkout" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-5 gap-6">

          {/* Delivery address */}
          <View>
            <SectionHeader title="Delivery Address" showDots={false} />
            <TouchableOpacity
              onPress={() => router.push("/addresses")}
              className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
              style={shadow.md}
            >
              <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
                <MapPin size={18} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900">{MOCK_ADDRESS.title}</Text>
                <Text className="text-xs text-gray-500">{MOCK_ADDRESS.street}, {MOCK_ADDRESS.city}</Text>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Items */}
          <View>
            <SectionHeader title="Order Items" showDots={false} />
            <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
              {MOCK_ITEMS.map((item, i) => (
                <View key={item.id} className={`flex-row items-center gap-3 p-4 ${i < MOCK_ITEMS.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center">
                    <Package size={18} color="#6b7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-xs text-gray-500">Qty: {item.qty}</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{fmt(item.price * item.qty)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Delivery note */}
          {hasInspection && (
            <View className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex-row gap-3">
              <Truck size={18} color="#3b82f6" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-blue-900 mb-0.5">Delivery Payment</Text>
                <Text className="text-xs text-blue-700 leading-relaxed">
                  Delivery for vehicles/property is paid separately to the courier at time of delivery.
                </Text>
              </View>
            </View>
          )}

          {/* Payment method */}
          <View>
            <SectionHeader title="Payment Method" showDots={false} />
            <View className="bg-white rounded-2xl p-4 flex-row items-center gap-3" style={shadow.md}>
              <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
                <CreditCard size={18} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900">Card / Bank Transfer</Text>
                <Text className="text-xs text-gray-500">Secured by Paystack</Text>
              </View>
              <View className="w-2 h-2 rounded-full bg-green-400" />
            </View>
          </View>

          {/* Order summary */}
          <View>
            <SectionHeader title="Summary" showDots={false} />
            <View className="bg-white rounded-2xl p-4 gap-3" style={shadow.md}>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Subtotal</Text>
                <Text className="text-sm font-semibold text-gray-900">{fmt(subtotal)}</Text>
              </View>
              {hasInspection && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Inspection fee</Text>
                  <Text className="text-sm font-semibold text-green-600">Free</Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Delivery</Text>
                <Text className="text-sm font-semibold text-gray-400">Paid separately</Text>
              </View>
              <View className="h-px bg-gray-100" />
              <View className="flex-row justify-between">
                <Text className="text-base font-extrabold text-gray-900">Total</Text>
                <Text className="text-base font-extrabold text-amber-400">{fmt(subtotal)}</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4 border-t border-gray-100" style={shadow.lg}>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isProcessing}
          className="bg-amber-400 rounded-2xl py-4 items-center"
          style={shadow.btn}
        >
          <Text className="text-white font-bold text-base">Place Order — {fmt(subtotal)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

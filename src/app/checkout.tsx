import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Linking, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";
import {
  MapPin, CreditCard, ChevronRight, CheckCircle, Package, Truck,
} from "lucide-react-native";
import { useCartStore } from "@/store/cartStore";
import { ordersApi } from "@/api/orders";
import { addressesApi } from "@/api";
import type { Address } from "@/api";
import { useAuthStore } from "@/store/authStore";

type Step = "review" | "processing" | "success";

export default function CheckoutScreen() {
  useRequireAuth();
  const router = useRouter();
  const { pendingOrder, fetchPendingOrder, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>("review");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingOrder();
    addressesApi.list()
      .then((data) => {
        setAddresses(data ?? []);
        const def = data?.find((a) => a.is_default);
        if (def) setSelectedAddressId(def.id);
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, []);

  const items = pendingOrder?.order_items ?? [];
  const subtotal = Number(pendingOrder?.total_amount ?? 0);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert("Address Required", "Please select a delivery address before placing your order.");
      return;
    }
    if (!pendingOrder || items.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      return;
    }

    setIsProcessing(true);
    setStep("processing");

    try {
      // 1. Process checkout — confirms address and reserves stock
      const confirmation = await ordersApi.processCheckout(selectedAddressId);
      setConfirmedOrderId(confirmation.order_id);

      // 2. Initialize Paystack payment
      const payment = await ordersApi.initializePayment(
        confirmation.order_id,
        user?.email ?? "",
        subtotal,
        "lelmarketplace://payment-callback" // deep link; falls back gracefully
      );

      // 3. Open Paystack in browser
      if (payment.authorization_url) {
        await Linking.openURL(payment.authorization_url);
      }

      // 4. After returning from browser, show success (payment verification via webhook)
      await clearCart();
      setStep("success");
    } catch (e: any) {
      setStep("review");
      Alert.alert(
        "Checkout Failed",
        e?.response?.data?.detail ?? e?.message ?? "Something went wrong. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ── States ───────────────────────────────────────────────────────────────────

  if (step === "processing") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-5">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-base font-bold text-gray-900">Processing your order…</Text>
        <Text className="text-sm text-gray-500 text-center px-8">
          You'll be redirected to Paystack to complete payment. Do not close the app.
        </Text>
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
            Your order has been confirmed. Complete payment on the Paystack page to finalise.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmedOrderId
            ? router.push(`/order-details?id=${confirmedOrderId}` as any)
            : router.push("/orders")}
          className="w-full bg-amber-400 py-4 rounded-2xl items-center"
          style={shadow.btn}
        >
          <Text className="text-white font-bold">Track My Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          className="w-full bg-white border border-gray-200 py-4 rounded-2xl items-center"
        >
          <Text className="text-gray-700 font-semibold">Continue Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (items.length === 0 && !loadingAddresses) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-5 px-8">
        <Package size={48} color="#d1d5db" />
        <Text className="text-lg font-bold text-gray-900">Your cart is empty</Text>
        <Text className="text-sm text-gray-400 text-center">Add items before checking out.</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-amber-400 px-6 py-3 rounded-2xl" style={shadow.btn}>
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Review ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Checkout" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-5 gap-6">

          {/* Delivery address */}
          <View>
            <SectionHeader title="Delivery Address" showDots={false} />
            {loadingAddresses ? (
              <ActivityIndicator color="#f59e0b" />
            ) : addresses.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push("/addresses")}
                className="bg-white rounded-2xl p-4 flex-row items-center gap-3 border border-amber-200"
                style={shadow.md}
              >
                <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
                  <MapPin size={18} color="#f59e0b" />
                </View>
                <Text className="text-sm font-semibold text-amber-600 flex-1">
                  Add a delivery address first →
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-2">
                {addresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    onPress={() => setSelectedAddressId(addr.id)}
                    className={`bg-white rounded-2xl p-4 flex-row items-center gap-3 border-2 ${selectedAddressId === addr.id ? "border-amber-400" : "border-transparent"}`}
                    style={shadow.sm}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center flex-shrink-0 ${selectedAddressId === addr.id ? "border-amber-400 bg-amber-400" : "border-gray-300"}`}>
                      {selectedAddressId === addr.id && <View className="w-2 h-2 rounded-full bg-white" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900">{addr.title}</Text>
                      <Text className="text-xs text-gray-500" numberOfLines={1}>
                        {addr.street_address}, {addr.city}, {addr.state_province}
                      </Text>
                    </View>
                    {addr.is_default && (
                      <View className="bg-green-50 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-bold text-green-600">Default</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => router.push("/addresses")} className="flex-row items-center gap-1 self-end pr-1">
                  <Text className="text-xs text-amber-500 font-semibold">+ Add new address</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Items */}
          <View>
            <SectionHeader title={`Order Items (${items.length})`} showDots={false} />
            <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
              {items.map((item, i) => (
                <View
                  key={item.id}
                  className={`flex-row items-center gap-3 p-4 ${i < items.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center">
                    <Package size={18} color="#6b7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {item.product?.name ?? "Product"}
                    </Text>
                    <Text className="text-xs text-gray-500">Qty: {item.quantity}</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">
                    {fmt(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Delivery notice */}
          <View className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex-row gap-3">
            <Truck size={18} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-blue-900 mb-0.5">Delivery Payment</Text>
              <Text className="text-xs text-blue-700 leading-relaxed">
                Delivery is paid separately to the courier when your order is ready for shipment.
              </Text>
            </View>
          </View>

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

          {/* Summary */}
          <View>
            <SectionHeader title="Summary" showDots={false} />
            <View className="bg-white rounded-2xl p-4 gap-3" style={shadow.md}>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Subtotal</Text>
                <Text className="text-sm font-semibold text-gray-900">{fmt(subtotal)}</Text>
              </View>
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
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4 border-t border-gray-100"
        style={shadow.lg}
      >
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isProcessing || !selectedAddressId || items.length === 0}
          className={`rounded-2xl py-4 items-center ${
            !selectedAddressId || items.length === 0 ? "bg-gray-200" : "bg-amber-400"
          }`}
          style={!selectedAddressId || items.length === 0 ? undefined : shadow.btn}
        >
          {isProcessing
            ? <ActivityIndicator color="#fff" />
            : <Text className={`font-bold text-base ${!selectedAddressId || items.length === 0 ? "text-gray-400" : "text-white"}`}>
                {!selectedAddressId ? "Select an address first" : `Place Order — ${fmt(subtotal)}`}
              </Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

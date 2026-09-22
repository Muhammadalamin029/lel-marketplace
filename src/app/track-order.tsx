import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight, Info } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { ordersApi } from "@/api";
import { useAuthStore } from "@/store/authStore";

export default function TrackOrderScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleTrack = async () => {
    if (!orderId.trim() || !email.trim()) {
      Alert.alert("Missing information", "Please enter both your Order ID and billing email.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await ordersApi.trackOrder(orderId.trim(), email.trim());
      const orderPath = `/order-details?id=${result.order_id}` as any;
      if (isAuthenticated) {
        router.push(orderPath);
      } else {
        Alert.alert("Order found", "Please sign in to view your order details.", [
          { text: "Sign in", onPress: () => router.push(`/(auth)/login?redirect=${encodeURIComponent(orderPath)}` as any) },
        ]);
      }
    } catch (e: any) {
      Alert.alert(
        "Order not found",
        e?.response?.status === 404
          ? "We couldn't find an order matching that ID and email address."
          : e?.response?.data?.detail ?? e?.message ?? "Could not track this order.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Track Order" subtitle="Find your order by ID and billing email" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-6 gap-6">
          <View className="bg-white rounded-3xl p-5 gap-5" style={shadow.md}>
            <View>
              <Text className="text-2xl font-extrabold text-gray-900">Track Order</Text>
              <Text className="text-sm text-gray-500 mt-2 leading-relaxed">
                Enter the order ID from your receipt and the billing email used at checkout.
              </Text>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-700">Order ID</Text>
              <TextInput
                value={orderId}
                onChangeText={setOrderId}
                placeholder="#45gtjuyhgdf"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-700">Billing Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="customer@example.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900"
              />
            </View>

            <View className="flex-row items-start gap-2 bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <Info size={16} color="#2563eb" />
              <Text className="text-xs text-blue-700 flex-1 leading-relaxed">
                The order ID is included in your confirmation email and receipt.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleTrack}
              disabled={submitting}
              className="bg-amber-400 py-4 rounded-2xl flex-row items-center justify-center gap-2"
              style={shadow.btn}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text className="text-white font-bold">Track Your Order</Text>
                  <ArrowRight size={16} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

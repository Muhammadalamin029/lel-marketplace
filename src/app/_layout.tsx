import "../../global.css";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout() {
  const { rehydrate, hasHydrated } = useAuthStore();

  useEffect(() => {
    rehydrate();
  }, []);

  // Block all rendering until we know whether the user has a valid session.
  // This prevents a flash of the wrong screen (onboarding vs tabs).
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1e1b4b", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Entry — decides onboarding vs tabs */}
      <Stack.Screen name="index" />

      {/* Tab navigation (guarded — redirects to login if not authed) */}
      <Stack.Screen name="(tabs)" />

      {/* Auth (guarded — redirects to tabs if already authed) */}
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />

      {/* Public browsing — no auth required */}
      <Stack.Screen name="product-details" />
      <Stack.Screen name="browse" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="category-products" />
      <Stack.Screen name="sellers" />
      <Stack.Screen name="seller-details" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="about" />
      <Stack.Screen name="help" />

      {/* Private — require auth (each screen checks via useRequireAuth) */}
      <Stack.Screen name="checkout" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order-details" />
      <Stack.Screen name="inspections" />
      <Stack.Screen name="inspection-details" />
      <Stack.Screen name="my-agreements" />
      <Stack.Screen name="agreement-details" />
      <Stack.Screen name="disputes" />
      <Stack.Screen name="my-payments" />
      <Stack.Screen name="my-payment-details" />
      <Stack.Screen name="my-reviews" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

import "../../global.css";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { BRAND, COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { rehydrate, hasHydrated } = useAuthStore();

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hasHydrated]);

  // Block all rendering until we know whether the user has a valid session.
  // This prevents a flash of the wrong screen (onboarding vs tabs).
  if (!hasHydrated) {
    return (
      <View style={styles.splash}>
        <Image source={require("../../assets/images/splash-icon.png")} style={styles.splashLogo} resizeMode="contain" />
        <Text style={styles.splashTitle}>{BRAND.name}</Text>
        <Text style={styles.splashSubtitle}>{BRAND.subtitle}</Text>
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
      <Stack.Screen name="financing-application" />
      <Stack.Screen name="my-financing-application" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: 32,
  },
  splashLogo: {
    width: 164,
    height: 164,
    marginBottom: 20,
  },
  splashTitle: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0,
  },
  splashSubtitle: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
    marginTop: 8,
    textAlign: "center",
  },
});

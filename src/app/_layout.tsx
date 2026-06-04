import "../../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="product-details" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order-details" />
      <Stack.Screen name="inspections" />
      <Stack.Screen name="inspection-details" />
      <Stack.Screen name="agreement-details" />
      <Stack.Screen name="disputes" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="browse" />
    </Stack>
  );
}

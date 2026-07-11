import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { homeRouteForRole } from "@/utils/sellerType";

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // If the user is already signed in and verified, bounce them out of the auth flow.
  // Unverified users stay here so they can reach the verify-email screen.
  if (isAuthenticated && user?.email_verified) {
    return <Redirect href={homeRouteForRole(user.role) as any} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-seller" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}

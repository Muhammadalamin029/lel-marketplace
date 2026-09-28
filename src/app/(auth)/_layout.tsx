import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function AuthLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // If the user is already signed in and verified, bounce them out of the auth flow.
  // Unverified users stay here so they can reach the verify-email screen.
  // Done in an effect so the redirect doesn't fire mid-render on reload.
  const shouldBounce = isAuthenticated && user?.email_verified;
  useEffect(() => {
    if (shouldBounce) {
      router.replace("/(tabs)");
    }
  }, [shouldBounce, router]);

  if (shouldBounce) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
<Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}

import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";

/**
 * Entry point — runs after _layout.tsx has confirmed hasHydrated === true.
 * Decides the correct starting screen:
 *   • Authenticated  →  the main tab navigator
 *   • Guest          →  onboarding (first launch) / login (returning user)
 *
 * We always send guests to onboarding here; the onboarding screen itself can
 * check AsyncStorage for a "seen" flag and skip straight to login if needed.
 *
 * Redirect happens in an effect (not render) so expo-router's async linking
 * state isn't updated mid-render on reload.
 */
export default function Index() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!hasHydrated) return;
    router.replace(isAuthenticated ? "/(tabs)" : "/onboarding");
  }, [hasHydrated, isAuthenticated, router]);

  return null;
}

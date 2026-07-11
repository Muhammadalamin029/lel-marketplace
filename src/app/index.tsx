import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { homeRouteForRole } from "@/utils/sellerType";

/**
 * Entry point — runs after _layout.tsx has confirmed hasHydrated === true.
 * Decides the correct starting screen:
 *   • Authenticated  →  the main tab navigator
 *   • Guest          →  onboarding (first launch) / login (returning user)
 *
 * We always send guests to onboarding here; the onboarding screen itself can
 * check AsyncStorage for a "seen" flag and skip straight to login if needed.
 */
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (isAuthenticated) {
    return <Redirect href={homeRouteForRole(role) as any} />;
  }

  return <Redirect href="/onboarding" />;
}

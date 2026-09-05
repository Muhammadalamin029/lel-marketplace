import { useEffect } from "react";
import { useRouter, usePathname } from "expo-router";
import { useAuthStore } from "@/store/authStore";

/**
 * Call at the top of any screen that requires authentication.
 *
 * Behaviour:
 *   - If the user is authenticated  → does nothing (screen renders normally).
 *   - If not authenticated          → immediately replaces the current route
 *     with the login screen (carrying the current path as a `redirect` param
 *     so login can send the user back here) so the user cannot go "back" to
 *     the protected page.
 *
 * Note: _layout.tsx already ensures hasHydrated === true before rendering any
 * screen, so we don't need to handle the loading state here.
 */
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace({ pathname: "/(auth)/login", params: { redirect: pathname } });
    }
  }, [isAuthenticated]);

  return isAuthenticated;
}

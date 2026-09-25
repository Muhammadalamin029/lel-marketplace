import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { router } from "expo-router";
import { notificationsApi } from "@/api";

let lastRegisteredToken: string | null = null;

/** Where a push tap should land, based on the backend notification type. */
export function routeForNotificationType(type?: string | null): string {
  if (!type) return "/notifications";
  if (type.startsWith("order_")) return "/orders";
  if (type.startsWith("payment_") || type.startsWith("installment_")) return "/my-payments";
  if (type.startsWith("inspection_")) return "/inspections";
  if (type.startsWith("agreement_") || type === "car_approved" || type === "car_rejected" || type === "property_acquired") {
    return "/my-agreements";
  }
  if (type === "promotional_offer" || type === "wishlist_item_back_in_stock") return "/browse";
  return "/notifications";
}

export function setupNotificationHandlers() {
  // Show pushes as banner + sound + badge while the app is foregrounded.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Tap on a push (background/killed) → deep link.
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, any> | undefined;
    router.push(routeForNotificationType(data?.type) as any);
  });
  return () => sub.remove();
}

/**
 * Ask permission, get the Expo push token and register it with the backend.
 * Safe to call repeatedly — no-ops when already registered this session.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators can't receive pushes

  const { status: existing } = await Notifications.getPermissionsAsync();
  const status =
    existing === "granted"
      ? existing
      : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "General",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#ff4b26",
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  if (!token || token === lastRegisteredToken) return token ?? null;

  try {
    await notificationsApi.registerPushToken(token, Platform.OS === "ios" ? "ios" : "android");
    lastRegisteredToken = token;
  } catch {
    // Backend unreachable or endpoint missing — retry on next app start.
    lastRegisteredToken = null;
  }
  return token;
}

/** Deactivate the token server-side (call on logout). */
export async function unregisterPushToken(): Promise<void> {
  if (!lastRegisteredToken) return;
  try {
    await notificationsApi.removePushToken(lastRegisteredToken);
  } catch {
    /* best effort */
  } finally {
    lastRegisteredToken = null;
  }
}

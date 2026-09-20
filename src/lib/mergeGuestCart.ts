import { Alert } from "react-native";
import { clearGuestCart, getGuestCart } from "@/lib/guestCart";
import { useCartStore } from "@/store/cartStore";

export async function mergeGuestCartIntoServer(): Promise<void> {
  const items = await getGuestCart();
  if (items.length === 0) return;

  const { addItem, fetchPendingOrder } = useCartStore.getState();
  const failures: string[] = [];

  for (const item of items) {
    try {
      await addItem(item.product_id, item.quantity);
    } catch {
      failures.push(item.product_id);
    }
  }

  await clearGuestCart();
  await fetchPendingOrder();

  if (failures.length > 0) {
    Alert.alert(
      "Some cart items could not be added",
      `${failures.length} item(s) were unavailable and were not carried over.`,
    );
  }
}

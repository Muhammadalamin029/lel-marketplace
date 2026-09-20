import AsyncStorage from "@react-native-async-storage/async-storage";
import { productsApi, type Order } from "@/api";

const GUEST_CART_KEY = "guest_cart";

export interface GuestCartItem {
  product_id: string;
  quantity: number;
}

export async function getGuestCart(): Promise<GuestCartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setGuestCart(items: GuestCartItem[]): Promise<void> {
  await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export async function addToGuestCart(product_id: string, quantity: number): Promise<GuestCartItem[]> {
  const items = await getGuestCart();
  const idx = items.findIndex((i) => i.product_id === product_id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
  } else {
    items.push({ product_id, quantity });
  }
  await setGuestCart(items);
  return items;
}

export async function updateGuestCartQuantity(product_id: string, quantity: number): Promise<GuestCartItem[]> {
  let items = await getGuestCart();
  if (quantity <= 0) {
    items = items.filter((i) => i.product_id !== product_id);
  } else {
    items = items.map((i) => (i.product_id === product_id ? { ...i, quantity } : i));
  }
  await setGuestCart(items);
  return items;
}

export async function removeFromGuestCart(product_id: string): Promise<GuestCartItem[]> {
  const items = (await getGuestCart()).filter((i) => i.product_id !== product_id);
  await setGuestCart(items);
  return items;
}

export async function clearGuestCart(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_CART_KEY);
}

export async function buildVirtualPendingOrder(items: GuestCartItem[]): Promise<Order | null> {
  if (items.length === 0) return null;

  const results = await Promise.allSettled(items.map((i) => productsApi.getById(i.product_id)));

  const order_items = items
    .map((item, idx) => ({ item, res: results[idx] }))
    .filter(({ res }) => res.status === "fulfilled")
    .map(({ item, res }) => {
      const product = (res as PromiseFulfilledResult<any>).value;
      return {
        id: item.product_id, // sentinel: for guest items, itemId === product_id
        quantity: item.quantity,
        price: product.price,
        status: "pending",
        product,
      };
    });

  const total_amount = order_items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return {
    id: "guest",
    total_amount,
    order_items,
  } as Order;
}

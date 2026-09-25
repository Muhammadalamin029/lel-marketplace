import OrdersScreen from "../orders";

// Orders tab — same screen as the /orders stack route (explicit wrapper:
// expo-router static analysis can't follow bare re-exports).
export default function OrdersTab() {
  return <OrdersScreen />;
}

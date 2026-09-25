import { Redirect, Tabs } from "expo-router";
import { View, Text } from "react-native";
import { Home, LayoutGrid, ShoppingCart, ClipboardList, User } from "lucide-react-native";
import { COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      numberOfLines={1}
      className={focused ? "font-grotesk-bold" : "font-manrope"}
      style={{ color: focused ? COLORS.primary : "#6b7280", fontSize: 10, marginTop: 2, textAlign: "center" }}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.totalItems());

  if (isAuthenticated && !user?.email_verified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <View className="items-center">
              <Home size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
              <TabLabel label="Home" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ focused }) => (
            <View className="items-center">
              <LayoutGrid size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
              <TabLabel label="Shop" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ focused }) => (
            <View className="items-center">
              <View>
                <ShoppingCart size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
                {cartCount > 0 && (
                  <View
                    style={{
                      position: "absolute", top: -6, right: -8,
                      backgroundColor: COLORS.primary, borderRadius: 8,
                      minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
                      {cartCount > 9 ? "9+" : cartCount}
                    </Text>
                  </View>
                )}
              </View>
              <TabLabel label="Cart" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused }) => (
            <View className="items-center">
              <ClipboardList size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
              <TabLabel label="Orders" focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => (
            <View className="items-center">
              <User size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
              <TabLabel label="Account" focused={focused} />
            </View>
          ),
        }}
      />
      {/* Kept as a stack route (linked from Account + hearts), hidden from the bar */}
      <Tabs.Screen name="wishlist" options={{ href: null, title: "Wishlist" }} />
    </Tabs>
  );
}

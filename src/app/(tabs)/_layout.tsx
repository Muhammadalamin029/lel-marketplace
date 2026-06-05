import { Redirect, Tabs } from "expo-router";
import { View, Text } from "react-native";
import { Home, ShoppingBag, Heart, User } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

function TabIcon({
  icon: Icon,
  label,
  focused,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
  focused: boolean;
}) {
  return (
    <View className="items-center justify-center pt-1" style={{ minWidth: 56 }}>
      {focused ? (
        <View className="flex-row rounded-2xl items-center justify-center bg-amber-50 px-3 py-1.5 gap-1.5">
          <Icon size={18} color="#f59e0b" strokeWidth={2.2} />
          <Text className="text-amber-500 text-xs font-bold">{label}</Text>
        </View>
      ) : (
        <Icon size={20} color="#9ca3af" strokeWidth={1.8} />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cartCount = useCartStore((s) => s.totalItems());

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
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
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Home} label="Home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon icon={ShoppingBag} label="Cart" focused={focused} />
              {cartCount > 0 && (
                <View
                  style={{
                    position: "absolute", top: 0, right: focused ? -2 : 2,
                    backgroundColor: "#ef4444", borderRadius: 8,
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
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={Heart} label="Saved" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon={User} label="Profile" focused={focused} /> }}
      />
    </Tabs>
  );
}

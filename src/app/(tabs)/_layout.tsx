import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, LayoutGrid, ShoppingCart, ClipboardList, User } from "lucide-react-native";
import { COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      numberOfLines={1}
      className={focused ? "font-grotesk-bold" : "font-manrope"}
      style={{
        color: focused ? COLORS.primary : "#6b7280",
        fontSize: 10,
        lineHeight: 12,
        marginTop: 3,
        textAlign: "center",
      }}
    >
      {label}
    </Text>
  );
}

function TabIconWrap({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", minWidth: 56 }}>
      {children}
    </View>
  );
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const cartCount = useCartStore((s) => s.totalItems());
  const insets = useSafeAreaInsets();

  // Dynamic height: fixed content zone (56) + device bottom inset.
  // Previously a hardcoded height: 72 / paddingBottom: 12 clipped on
  // notched iPhones and left a gap on gesture-nav Android.
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);
  const tabBarHeight = 60 + bottomInset;

  // Unverified users can't use tabs — bounce to verify-email in an effect
  // so the redirect doesn't fire mid-render on reload.
  const needsVerify = isAuthenticated && !user?.email_verified;
  useEffect(() => {
    if (needsVerify) {
      router.replace("/(auth)/verify-email");
    }
  }, [needsVerify, router]);

  if (needsVerify) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#374151",
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIconWrap>
              <Home size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
              <TabLabel label="Home" focused={focused} />
            </TabIconWrap>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ focused }) => (
            <TabIconWrap>
              <LayoutGrid size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
              <TabLabel label="Shop" focused={focused} />
            </TabIconWrap>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ focused }) => (
            <TabIconWrap>
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
            </TabIconWrap>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused }) => (
            <TabIconWrap>
              <ClipboardList size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
              <TabLabel label="Orders" focused={focused} />
            </TabIconWrap>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => (
            <TabIconWrap>
              <User size={22} color={focused ? COLORS.primary : "#374151"} strokeWidth={focused ? 2.2 : 1.8} />
              <TabLabel label="Account" focused={focused} />
            </TabIconWrap>
          ),
        }}
      />
      {/* Kept as a stack route (linked from Account + hearts), hidden from the bar */}
      <Tabs.Screen name="wishlist" options={{ href: null, title: "Wishlist" }} />
    </Tabs>
  );
}

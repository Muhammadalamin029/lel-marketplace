import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { Home, ShoppingBag, Heart, User } from "lucide-react-native";

function TabIcon({
  icon: Icon,
  label,
  focused,
}: {
  icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth?: number;
  }>;
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
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Home} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={ShoppingBag} label="Cart" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Heart} label="Saved" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={User} label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

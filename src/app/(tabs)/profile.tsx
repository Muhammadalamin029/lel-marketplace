import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  MapPin,
  Shield,
  Package,
  Heart,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ShoppingBag,
  Star,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Edit,
} from "lucide-react-native";
import { shadow } from "@/constants/shadows";

// TODO: replace with auth store data when API is connected
const MOCK_USER = {
  name: "Alameen Muhammad",
  email: "alameen@example.com",
  phone: "+234 800 000 0000",
  isVerified: true,
  isSeller: false,
};

const STATS = [
  { label: "Orders", value: "12", icon: ShoppingBag, color: "#f59e0b" },
  { label: "Saved", value: "8", icon: Heart, color: "#ef4444" },
  { label: "Reviews", value: "5", icon: Star, color: "#8b5cf6" },
];

type MenuItem = {
  icon: any;
  label: string;
  color: string;
  bg: string;
  route?: string;
  badge?: string;
  danger?: boolean;
};

const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Account",
    items: [
      {
        icon: User,
        label: "Personal Information",
        color: "#3b82f6",
        bg: "#eff6ff",
        route: "/edit-profile",
      },
      {
        icon: MapPin,
        label: "Saved Addresses",
        color: "#10b981",
        bg: "#f0fdf4",
        route: "/addresses",
      },
      {
        icon: Shield,
        label: "Verification & KYC",
        color: "#f59e0b",
        bg: "#fffbeb",
        badge: "Verified",
      },
    ],
  },
  {
    title: "Activity",
    items: [
      {
        icon: Package,
        label: "My Orders",
        color: "#f59e0b",
        bg: "#fffbeb",
        route: "/orders",
      },
      {
        icon: Shield,
        label: "My Inspections",
        color: "#0ea5e9",
        bg: "#f0f9ff",
        route: "/inspections",
      },
      {
        icon: AlertCircle,
        label: "My Disputes",
        color: "#ef4444",
        bg: "#fef2f2",
        route: "/disputes",
      },
      {
        icon: Heart,
        label: "Wishlist",
        color: "#ef4444",
        bg: "#fef2f2",
        route: "/(tabs)/wishlist",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        icon: Bell,
        label: "Notifications",
        color: "#8b5cf6",
        bg: "#f5f3ff",
        route: "/notifications",
      },
      {
        icon: Settings,
        label: "App Settings",
        color: "#6b7280",
        bg: "#f9fafb",
        route: "/settings",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        icon: HelpCircle,
        label: "Help & Support",
        color: "#0ea5e9",
        bg: "#f0f9ff",
        route: "/help",
      },
    ],
  },
];

function MenuItem({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const Icon = item.icon;
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 gap-3"
      activeOpacity={0.7}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center flex-shrink-0"
        style={{ backgroundColor: item.bg }}
      >
        <Icon size={16} color={item.color} />
      </View>
      <Text
        className={`flex-1 text-sm font-semibold ${item.danger ? "text-red-600" : "text-gray-900"}`}
      >
        {item.label}
      </Text>
      {item.badge && (
        <View className="flex-row items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
          <CheckCircle size={10} color="#16a34a" />
          <Text className="text-[10px] font-bold text-green-700">
            {item.badge}
          </Text>
        </View>
      )}
      <ChevronRight size={14} color="#d1d5db" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          // TODO: clear auth token + state, then navigate to login
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleBecomeSeller = () => {
    router.push("/(auth)/seller-register");
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
        <View>
          <Text className="text-xs text-gray-400 font-medium">
            Your account
          </Text>
          <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
            My <Text className="text-amber-400">Profile</Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center"
        >
          <Settings size={18} color="#374151" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Profile card */}
        <View
          className="mx-5 mt-4 bg-white rounded-3xl p-5 mb-4"
          style={shadow.md}
        >
          <View className="flex-row items-center gap-4">
            <View className="relative">
              <View className="w-16 h-16 rounded-full bg-indigo-900 items-center justify-center">
                <Text className="text-white text-2xl font-bold">
                  {MOCK_USER.name.charAt(0)}
                </Text>
              </View>
              {MOCK_USER.isVerified && (
                <View className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-400 rounded-full border-2 border-white items-center justify-center">
                  <CheckCircle size={10} color="#fff" />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-gray-900">
                {MOCK_USER.name}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                {MOCK_USER.email}
              </Text>
              <Text className="text-xs text-gray-400">{MOCK_USER.phone}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/edit-profile")}
              className="w-9 h-9 bg-amber-50 rounded-full items-center justify-center"
            >
              <Edit size={16} color="#f59e0b" />
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View className="flex-row mt-4 pt-4 border-t border-gray-100">
            {STATS.map(({ label, value, icon: Icon, color }) => (
              <View key={label} className="flex-1 items-center gap-1">
                <Icon size={18} color={color} />
                <Text className="text-base font-extrabold text-gray-900">
                  {value}
                </Text>
                <Text className="text-[10px] text-gray-400 font-medium">
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Become a seller banner */}
        {!MOCK_USER.isSeller && (
          <TouchableOpacity
            onPress={handleBecomeSeller}
            className="mx-5 mb-4 bg-amber-400 rounded-2xl p-4 flex-row items-center gap-3"
            style={shadow.btn}
          >
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Star size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">
                Become a Seller
              </Text>
              <Text className="text-white/70 text-xs mt-0.5">
                List vehicles, properties, and products
              </Text>
            </View>
            <ChevronRight size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Menu sections */}
        <View className="mx-5 gap-4">
          {MENU_SECTIONS.map((section) => (
            <View key={section.title}>
              <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                {section.title}
              </Text>
              <View
                className="bg-white rounded-2xl overflow-hidden"
                style={shadow.md}
              >
                {section.items.map((item, i) => (
                  <View key={item.label}>
                    <MenuItem
                      item={item}
                      onPress={() => handleMenuPress(item)}
                    />
                    {i < section.items.length - 1 && (
                      <View className="h-px bg-gray-50 mx-4" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white rounded-2xl px-4 py-4 flex-row items-center gap-3"
            style={shadow.md}
          >
            <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center">
              <LogOut size={16} color="#ef4444" />
            </View>
            <Text className="text-sm font-semibold text-red-600 flex-1">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

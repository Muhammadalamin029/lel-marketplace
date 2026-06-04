import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  Settings,
  ChevronRight,
  Heart,
  ShoppingBag,
  MapPin,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  Star,
  CheckCircle,
  Package,
} from "lucide-react-native";

// ─── Data ──────────────────────────────────────────────────────────────────────

const USER_STATS = [
  { label: "Orders", value: "12", icon: ShoppingBag, color: "#f59e0b" },
  { label: "Saved", value: "8", icon: Heart, color: "#ef4444" },
  { label: "Reviews", value: "5", icon: Star, color: "#8b5cf6" },
];

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      {
        icon: User,
        label: "Personal Information",
        color: "#3b82f6",
        bg: "#eff6ff",
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
        icon: Heart,
        label: "Wishlist",
        color: "#ef4444",
        bg: "#fef2f2",
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
      },
      {
        icon: Settings,
        label: "App Settings",
        color: "#6b7280",
        bg: "#f9fafb",
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
      },
    ],
  },
];

// ─── Components ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <View
      className="flex-1 bg-white rounded-2xl py-4 items-center gap-1.5"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Icon size={20} color={color} strokeWidth={1.8} />
      <Text className="text-lg font-extrabold text-gray-900">{value}</Text>
      <Text className="text-[11px] text-gray-400 font-medium">{label}</Text>
    </View>
  );
}

function MenuItem({
  icon: Icon,
  label,
  color,
  bg,
  badge,
  route,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  bg: string;
  badge?: string;
  route?: string;
  onPress?: () => void;
}) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="flex-row items-center gap-3 py-3.5 px-4"
      onPress={() => {
        if (route) router.push(route as any);
        if (onPress) onPress();
      }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <Icon size={16} color={color} strokeWidth={1.8} />
      </View>
      <Text className="flex-1 text-sm font-semibold text-gray-900">
        {label}
      </Text>
      {badge && (
        <View className="bg-green-50 px-2 py-0.5 rounded-md mr-1">
          <Text className="text-green-700 text-[10px] font-bold">{badge}</Text>
        </View>
      )}
      <ChevronRight size={15} color="#d1d5db" />
    </TouchableOpacity>
  );
}

// ─── Profile Screen ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
        <View>
          <Text className="text-xs text-gray-400 font-medium">My Account</Text>
          <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
            Profile
          </Text>
        </View>
        <TouchableOpacity className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <Settings size={18} color="#374151" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Profile Card ── */}
        <View className="px-5 mt-4">
          <View
            className="bg-indigo-950 rounded-3xl p-5 flex-row items-center gap-4"
            style={{
              shadowColor: "#1e1b4b",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {/* Avatar */}
            <View className="w-16 h-16 rounded-2xl bg-amber-400 items-center justify-center">
              <Text className="text-white text-2xl font-black">A</Text>
            </View>

            {/* Info */}
            <View className="flex-1 gap-0.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-white text-base font-extrabold">
                  Ameenu
                </Text>
                <View className="flex-row items-center gap-1 bg-green-500/20 px-1.5 py-0.5 rounded-md">
                  <CheckCircle size={10} color="#4ade80" />
                  <Text className="text-green-400 text-[10px] font-bold">
                    Verified
                  </Text>
                </View>
              </View>
              <Text className="text-white/60 text-xs">ameenu@email.com</Text>
              <Text className="text-white/60 text-xs">+234 800 000 0000</Text>
            </View>

            {/* Edit */}
            <TouchableOpacity className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
              <Settings size={15} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ── */}
        <View className="flex-row gap-3 px-5 mt-4">
          {USER_STATS.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              color={s.color}
            />
          ))}
        </View>

        {/* ── Seller Banner ── */}
        <View className="px-5 mt-4">
          <TouchableOpacity
            className="bg-amber-400 rounded-2xl p-4 flex-row items-center justify-between"
            style={{
              shadowColor: "#f59e0b",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <View className="gap-0.5">
              <Text className="text-white font-extrabold text-base">
                Become a Seller
              </Text>
              <Text className="text-white/80 text-xs">
                List your vehicle, property or item
              </Text>
            </View>
            <ChevronRight size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* ── Menu Sections ── */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} className="px-5 mt-5">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              {section.title}
            </Text>
            <View
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {section.items.map((item, i) => (
                <View key={item.label}>
                  <MenuItem
                    icon={item.icon}
                    label={item.label}
                    color={item.color}
                    bg={item.bg}
                    badge={(item as any).badge}
                    route={(item as any).route}
                  />
                  {i < section.items.length - 1 && (
                    <View className="h-px bg-gray-50 mx-4" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Log Out ── */}
        <View className="px-5 mt-4 mb-8">
          <TouchableOpacity
            className="bg-red-50 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            style={{ borderWidth: 1, borderColor: "#fee2e2" }}
          >
            <LogOut size={16} color="#ef4444" />
            <Text className="text-red-500 font-bold text-sm">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

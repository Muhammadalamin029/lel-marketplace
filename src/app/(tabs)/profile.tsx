import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User, MapPin, ShieldCheck, Package, Heart, Bell, Settings,
  HelpCircle, LogOut, Star, ChevronRight, CheckCircle, FileText,
  CreditCard, Grid3x3, Info, Landmark, AlertCircle, ClipboardList, Truck,
} from "lucide-react-native";
import { COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { dashboardApi, notificationsApi, financingApi } from "@/api";

type MenuItem = {
  icon: any;
  label: string;
  route?: string;
  meta?: string;
};

const ROW_ICON_BG = "#fdf6ec";

function MenuRow({ item, onPress, last }: { item: MenuItem; onPress: () => void; last?: boolean }) {
  const Icon = item.icon;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center gap-3 py-3.5 ${last ? "" : "border-b border-gray-50"}`}
    >
      <View className="w-9 h-9 rounded-lg items-center justify-center" style={{ backgroundColor: ROW_ICON_BG }}>
        <Icon size={16} color="#374151" />
      </View>
      <Text className="font-grotesk flex-1 text-sm text-gray-900">{item.label}</Text>
      {!!item.meta && <Text className="font-manrope text-xs text-gray-400">{item.meta}</Text>}
      <ChevronRight size={15} color="#9ca3af" />
    </TouchableOpacity>
  );
}

function Section({ title, items, onPress }: { title: string; items: MenuItem[]; onPress: (item: MenuItem) => void }) {
  return (
    <View className="mt-6">
      <Text className="text-[11px] font-grotesk-bold text-gray-400 tracking-widest mb-1">
        {title.toUpperCase()}
      </Text>
      <View>
        {items.map((item, i) => (
          <MenuRow key={item.label} item={item} onPress={() => onPress(item)} last={i === items.length - 1} />
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  useRequireAuth();
  const router = useRouter();
  const { user, profile, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.totalItems());

  const displayName = (profile as any)?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email ?? "";
  const displayPhone = (profile as any)?.phone || "";
  const isVerified = user?.email_verified ?? false;
  const avatarUrl: string | null = (profile as any)?.avatar_url ?? null;

  const [orderCount, setOrderCount] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<string | null>(null);
  const [financeMeta, setFinanceMeta] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi.customerStats()
      .then((s) => {
        setOrderCount(`${s.total_orders ?? 0} total`);
        setSavedCount(`${s.wishlist_items ?? 0} saved`);
      })
      .catch(() => {});
    notificationsApi.list({ limit: 1 })
      .then((res) => setUnreadCount(`${res.unread_count ?? 0} unread`))
      .catch(() => {});
    financingApi.getMyApplication()
      .then((app) => {
        if (!app) setFinanceMeta("apply");
        else if (app.status === "approved") setFinanceMeta("approved");
        else if (app.status === "pending_review") setFinanceMeta("in review");
        else setFinanceMeta(String(app.status).replace(/_/g, " "));
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.route) router.push(item.route as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 pt-6">
          {/* Identity */}
          <View className="flex-row items-center gap-4">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
            ) : (
              <View
                className="items-center justify-center"
                style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primarySoft }}
              >
                <Text className="text-2xl font-grotesk-extrabold" style={{ color: COLORS.primary }}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="flex-1 min-w-0">
              <Text className="text-lg font-grotesk-extrabold text-gray-900" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="font-manrope text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                {displayEmail}
              </Text>
              {!!displayPhone && (
                <Text className="font-manrope text-xs text-gray-400" numberOfLines={1}>
                  {displayPhone}
                </Text>
              )}
            </View>
          </View>

          {/* Pills */}
          <View className="flex-row gap-2 mt-3">
            {isVerified && (
              <View className="flex-row items-center gap-1 bg-green-50 px-2.5 py-1 rounded-md">
                <CheckCircle size={11} color="#16a34a" />
                <Text className="text-[11px] font-grotesk-semibold text-green-700">Verified account</Text>
              </View>
            )}
            <View className="bg-green-50 px-2.5 py-1 rounded-md">
              <Text className="text-[11px] font-grotesk-semibold text-green-700">
                {cartCount} in cart
              </Text>
            </View>
          </View>

          {/* Edit profile */}
          <TouchableOpacity
            onPress={() => router.push("/edit-profile")}
            className="rounded-xl border border-gray-200 py-3.5 flex-row items-center justify-center gap-2 mt-4"
          >
            <User size={15} color="#111827" />
            <Text className="text-sm font-grotesk-bold text-gray-900">Edit profile</Text>
          </TouchableOpacity>

          <Section
            title="Activity"
            onPress={handleMenuPress}
            items={[
              { icon: Package, label: "My orders", route: "/orders", meta: orderCount ?? undefined },
              { icon: Heart, label: "Wishlist", route: "/(tabs)/wishlist", meta: savedCount ?? undefined },
              { icon: Landmark, label: "Financing & plans", route: "/my-financing-application", meta: financeMeta ?? undefined },
              { icon: Bell, label: "Notifications", route: "/notifications", meta: unreadCount ?? undefined },
            ]}
          />

          <Section
            title="Assets"
            onPress={handleMenuPress}
            items={[
              { icon: ClipboardList, label: "My inspections", route: "/inspections" },
              { icon: FileText, label: "My agreements", route: "/my-agreements" },
              { icon: CreditCard, label: "My payments", route: "/my-payments" },
              { icon: Star, label: "My reviews", route: "/my-reviews" },
              { icon: Truck, label: "Track order", route: "/track-order" },
              { icon: AlertCircle, label: "My disputes", route: "/disputes" },
            ]}
          />

          <Section
            title="Account"
            onPress={handleMenuPress}
            items={[
              { icon: MapPin, label: "Saved addresses", route: "/addresses" },
              { icon: Grid3x3, label: "Categories", route: "/categories" },
              { icon: Settings, label: "App settings", route: "/settings" },
            ]}
          />

          <Section
            title="Support"
            onPress={handleMenuPress}
            items={[
              { icon: HelpCircle, label: "Help & support", route: "/help" },
              { icon: ShieldCheck, label: "Terms of service", route: "/terms" },
              { icon: ShieldCheck, label: "Privacy policy", route: "/privacy" },
              { icon: Info, label: "About LEL Store", route: "/about" },
            ]}
          />

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleLogout}
            className="rounded-xl border border-gray-200 py-3.5 flex-row items-center justify-center gap-2 mt-6"
          >
            <LogOut size={15} color={COLORS.danger} />
            <Text className="text-sm font-grotesk-bold" style={{ color: COLORS.danger }}>Sign out</Text>
          </TouchableOpacity>

          <Text className="font-manrope text-[11px] text-gray-300 text-center mt-5">
            Lel Store · v1.0.0 · Lagos, Nigeria
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

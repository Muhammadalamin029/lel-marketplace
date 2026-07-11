import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Settings, ChevronRight, CheckCircle, Clock, XCircle, Edit, LogOut,
  Store, ShoppingBag, FileText, Wallet, Star, BarChart3, Shield, ClipboardList,
  Bell, HelpCircle, Info,
} from "lucide-react-native";
import { shadow } from "@/constants/shadows";
import { useAuthStore } from "@/store/authStore";
import type { SellerProfileData } from "@/api";
import { listingMeta } from "@/utils/sellerType";
import { fmt } from "@/utils/format";

type MenuEntry = { icon: any; label: string; color: string; bg: string; route: string };

const KYC_COPY: Record<string, { Icon: any; color: string; bg: string; label: string }> = {
  approved: { Icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4", label: "Verified" },
  pending: { Icon: Clock, color: "#d97706", bg: "#fffbeb", label: "Pending" },
  rejected: { Icon: XCircle, color: "#dc2626", bg: "#fef2f2", label: "Rejected" },
};

function MenuGroup({ title, items, onPress }: { title: string; items: MenuEntry[]; onPress: (route: string) => void }) {
  return (
    <View>
      <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{title}</Text>
      <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
        {items.map((item, i) => (
          <View key={item.label}>
            <TouchableOpacity onPress={() => onPress(item.route)} className="flex-row items-center px-4 py-3.5 gap-3" activeOpacity={0.7}>
              <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: item.bg }}>
                <item.icon size={16} color={item.color} />
              </View>
              <Text className="flex-1 text-sm font-semibold text-gray-900">{item.label}</Text>
              <ChevronRight size={14} color="#d1d5db" />
            </TouchableOpacity>
            {i < items.length - 1 && <View className="h-px bg-gray-50 mx-4" />}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Dedicated profile screen for the seller role — deliberately does not reuse the
 * customer's menu (addresses, wishlist, buyer order history, etc. don't apply). */
export function SellerProfileView() {
  const router = useRouter();
  const { user, profile, logout } = useAuthStore();
  const seller = profile as SellerProfileData;
  const sellerType = seller?.seller_type ?? "retailer";
  const isRetailer = sellerType === "retailer";
  const meta = listingMeta(sellerType);
  const kyc = KYC_COPY[seller?.kyc_status ?? "pending"] ?? KYC_COPY.pending;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  };

  const businessMenu: MenuEntry[] = [
    { icon: Store, label: "Seller Dashboard", color: "#f59e0b", bg: "#fffbeb", route: "/seller-dashboard" },
    { icon: meta.icon, label: `My ${meta.label}`, color: "#f59e0b", bg: "#fffbeb", route: "/(tabs)/products" },
    isRetailer
      ? { icon: ShoppingBag, label: "Orders", color: "#0ea5e9", bg: "#f0f9ff", route: "/(tabs)/seller-orders" }
      : { icon: ClipboardList, label: "Requests", color: "#7e22ce", bg: "#f5f3ff", route: "/(tabs)/requests" },
    { icon: Wallet, label: "Payouts", color: "#16a34a", bg: "#f0fdf4", route: "/(tabs)/payouts" },
    ...(isRetailer ? [
      { icon: Star, label: "Reviews", color: "#f59e0b", bg: "#fffbeb", route: "/seller-reviews" },
      { icon: BarChart3, label: "Analytics", color: "#2563eb", bg: "#eff6ff", route: "/seller-analytics" },
    ] as MenuEntry[] : []),
    { icon: Shield, label: "Verification & KYC", color: "#dc2626", bg: "#fef2f2", route: "/seller-kyc" },
    { icon: Settings, label: "Business Settings", color: "#6b7280", bg: "#f9fafb", route: "/seller-settings" },
  ];

  const supportMenu: MenuEntry[] = [
    { icon: Bell, label: "Notifications", color: "#8b5cf6", bg: "#f5f3ff", route: "/notifications" },
    { icon: Settings, label: "App Settings", color: "#6b7280", bg: "#f9fafb", route: "/settings" },
    { icon: HelpCircle, label: "Help & Support", color: "#0ea5e9", bg: "#f0f9ff", route: "/help" },
    { icon: FileText, label: "Terms of Service", color: "#6b7280", bg: "#f9fafb", route: "/terms" },
    { icon: Shield, label: "Privacy Policy", color: "#6b7280", bg: "#f9fafb", route: "/privacy" },
    { icon: Info, label: "About LEL Marketplace", color: "#6b7280", bg: "#f9fafb", route: "/about" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
        <View>
          <Text className="text-xs text-gray-400 font-medium">Seller account</Text>
          <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
            My <Text className="text-amber-400">Profile</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/seller-settings" as any)} className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <Edit size={18} color="#374151" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Business card */}
        <View className="mx-5 mt-4 bg-white rounded-3xl p-5 mb-4" style={shadow.md}>
          <View className="flex-row items-center gap-4">
            {seller?.logo_url ? (
              <Image source={{ uri: seller.logo_url }} style={{ width: 64, height: 64, borderRadius: 20 }} contentFit="cover" />
            ) : (
              <View className="w-16 h-16 rounded-2xl bg-amber-400 items-center justify-center">
                <Text className="text-white text-2xl font-bold">{(seller?.business_name ?? "S").charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-base font-extrabold text-gray-900" numberOfLines={1}>{seller?.business_name ?? "Seller"}</Text>
              <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>{seller?.contact_email ?? user?.email}</Text>
              {!!seller?.contact_phone && <Text className="text-xs text-gray-400">{seller.contact_phone}</Text>}
            </View>
          </View>

          <View className="flex-row items-center mt-4 pt-4 border-t border-gray-100">
            <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: kyc.bg }}>
              <kyc.Icon size={12} color={kyc.color} />
              <Text className="text-[10px] font-bold uppercase" style={{ color: kyc.color }}>{kyc.label}</Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-[10px] text-gray-400 font-medium uppercase">Available Balance</Text>
              <Text className="text-sm font-extrabold text-gray-900">{fmt(seller?.available_balance ?? 0)}</Text>
            </View>
          </View>
        </View>

        <View className="mx-5 gap-4">
          <MenuGroup title="Business" items={businessMenu} onPress={(r) => router.push(r as any)} />
          <MenuGroup title="Preferences & Support" items={supportMenu} onPress={(r) => router.push(r as any)} />

          <TouchableOpacity onPress={handleLogout} className="bg-white rounded-2xl px-4 py-4 flex-row items-center gap-3" style={shadow.md}>
            <View className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center">
              <LogOut size={16} color="#ef4444" />
            </View>
            <Text className="text-sm font-semibold text-red-600 flex-1">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

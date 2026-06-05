import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { shadow } from "@/constants/shadows";
import { Search, Store, ChevronRight, CheckCircle, Car, Home, ShoppingBag } from "lucide-react-native";
import { publicApi } from "@/api";
import type { PublicSeller } from "@/api";

const TYPE_CONFIG: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  car_dealer:  { label: "Car Dealer",          Icon: Car,         color: "#ea580c", bg: "#fff7ed" },
  real_agent:  { label: "Real Estate Agent",   Icon: Home,        color: "#3b82f6", bg: "#eff6ff" },
  retailer:    { label: "Retail Store",        Icon: ShoppingBag, color: "#22c55e", bg: "#f0fdf4" },
};

function SellerCard({ seller, onPress }: { seller: PublicSeller; onPress: () => void }) {
  const cfg = TYPE_CONFIG[seller.seller_type] ?? TYPE_CONFIG.retailer;
  const Icon = cfg.Icon;
  const initials = seller.business_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity onPress={onPress} className="bg-white rounded-2xl p-4 flex-row items-center gap-3" style={shadow.md} activeOpacity={0.85}>
      {/* Avatar */}
      <View className="w-14 h-14 rounded-2xl items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
        {seller.logo_url ? (
          <Text className="text-xl font-bold" style={{ color: cfg.color }}>{initials}</Text>
        ) : (
          <Icon size={26} color={cfg.color} strokeWidth={1.5} />
        )}
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-extrabold text-gray-900" numberOfLines={1}>{seller.business_name}</Text>
          {seller.kyc_status === "approved" && <CheckCircle size={12} color="#22c55e" />}
        </View>
        <Text className="text-xs text-gray-400 mt-0.5">{cfg.label}</Text>
        {seller.description && (
          <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>{seller.description}</Text>
        )}
      </View>

      <ChevronRight size={16} color="#d1d5db" />
    </TouchableOpacity>
  );
}

export default function SellersScreen() {
  const router = useRouter();
  const [sellers, setSellers] = useState<PublicSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    publicApi.listSellers()
      .then(setSellers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sellers.filter((s) => {
    const matchSearch = !search || s.business_name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || s.seller_type === typeFilter;
    return matchSearch && matchType && s.kyc_status === "approved";
  });

  const TYPE_FILTERS = [
    { id: "all", label: "All" },
    { id: "car_dealer", label: "Cars" },
    { id: "real_agent", label: "Real Estate" },
    { id: "retailer", label: "Retail" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Sellers" subtitle="Verified marketplace sellers" />

      {/* Search */}
      <View className="px-5 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2.5 bg-gray-100 rounded-xl px-3.5 py-2.5">
          <Search size={16} color="#9ca3af" />
          <TextInput
            placeholder="Search sellers…"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-transparent text-sm text-gray-900"
          />
        </View>
      </View>

      {/* Type filters */}
      <View className="bg-white px-5 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-3">
            {TYPE_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setTypeFilter(f.id)}
                className={`px-4 py-1.5 rounded-full border ${typeFilter === f.id ? "bg-amber-400 border-amber-400" : "bg-white border-gray-200"}`}
              >
                <Text className={`text-xs font-semibold ${typeFilter === f.id ? "text-white" : "text-gray-700"}`}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {loading ? (
          <View className="items-center justify-center pt-20 gap-3">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400">Loading sellers…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState Icon={Store} title="No sellers found" subtitle="Try a different search or filter." />
        ) : (
          <View className="gap-3">
            {filtered.map((s) => (
              <SellerCard
                key={s.id}
                seller={s}
                onPress={() => router.push(`/seller-details?id=${s.id}` as any)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

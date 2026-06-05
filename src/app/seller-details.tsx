import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { shadow } from "@/constants/shadows";
import { CheckCircle, Phone, Globe, Car, Home, ShoppingBag, Package, ChevronRight, Store, Mail } from "lucide-react-native";
import { publicApi } from "@/api";
import type { PublicSeller } from "@/api";
import { fmt } from "@/utils/format";

const TYPE_CONFIG: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  car_dealer: { label: "Car Dealer",        Icon: Car,         color: "#ea580c", bg: "#fff7ed" },
  real_agent: { label: "Real Estate Agent", Icon: Home,        color: "#3b82f6", bg: "#eff6ff" },
  retailer:   { label: "Retail Store",      Icon: ShoppingBag, color: "#22c55e", bg: "#f0fdf4" },
};

export default function SellerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [seller, setSeller] = useState<PublicSeller | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setError("No seller ID"); setLoading(false); return; }
    Promise.all([
      publicApi.getSeller(id),
      publicApi.getSellerInventory(id).catch(() => ({ items: [] })),
    ]).then(([sellerData, inv]) => {
      setSeller(sellerData);
      setInventory(inv?.items ?? []);
    }).catch((e) => setError(e?.message ?? "Failed to load seller")).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-3">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-sm text-gray-400">Loading seller…</Text>
      </SafeAreaView>
    );
  }

  if (error || !seller) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-4 px-8">
        <Store size={40} color="#9ca3af" />
        <Text className="text-lg font-bold text-gray-900">Seller not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-amber-400 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const cfg = TYPE_CONFIG[seller.seller_type] ?? TYPE_CONFIG.retailer;
  const Icon = cfg.Icon;
  const initials = seller.business_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title={seller.business_name} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero card */}
        <View className="mx-5 mt-5 bg-white rounded-3xl p-6 items-center" style={shadow.md}>
          <View className="w-20 h-20 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: cfg.bg }}>
            <Text className="text-2xl font-extrabold" style={{ color: cfg.color }}>{initials}</Text>
          </View>
          <Text className="text-xl font-extrabold text-gray-900 text-center">{seller.business_name}</Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Icon size={14} color={cfg.color} />
            <Text className="text-sm text-gray-500">{cfg.label}</Text>
            {seller.kyc_status === "approved" && (
              <View className="flex-row items-center gap-0.5 bg-green-50 px-2 py-0.5 rounded-full ml-1">
                <CheckCircle size={10} color="#22c55e" />
                <Text className="text-[10px] font-bold text-green-700">Verified</Text>
              </View>
            )}
          </View>
          {seller.description && (
            <Text className="text-sm text-gray-500 text-center mt-3 leading-relaxed">{seller.description}</Text>
          )}
        </View>

        {/* Contact */}
        <View className="mx-5 mt-4 bg-white rounded-3xl px-5 pt-4 pb-2" style={shadow.md}>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Contact</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${seller.contact_email}`)}
            className="flex-row items-center gap-3 py-3 border-b border-gray-50"
          >
            <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
              <Mail size={16} color="#3b82f6" />
            </View>
            <Text className="text-sm text-gray-700 flex-1">{seller.contact_email}</Text>
            <ChevronRight size={14} color="#d1d5db" />
          </TouchableOpacity>
          {seller.contact_phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${seller.contact_phone}`)}
              className="flex-row items-center gap-3 py-3 border-b border-gray-50"
            >
              <View className="w-9 h-9 rounded-full bg-green-50 items-center justify-center">
                <Phone size={16} color="#22c55e" />
              </View>
              <Text className="text-sm text-gray-700 flex-1">{seller.contact_phone}</Text>
              <ChevronRight size={14} color="#d1d5db" />
            </TouchableOpacity>
          )}
          {seller.website_url && (
            <TouchableOpacity
              onPress={() => Linking.openURL(seller.website_url!)}
              className="flex-row items-center gap-3 py-3"
            >
              <View className="w-9 h-9 rounded-full bg-indigo-50 items-center justify-center">
                <Globe size={16} color="#6366f1" />
              </View>
              <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>{seller.website_url}</Text>
              <ChevronRight size={14} color="#d1d5db" />
            </TouchableOpacity>
          )}
        </View>

        {/* Inventory */}
        <View className="mx-5 mt-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Listings</Text>
          {inventory.length === 0 ? (
            <EmptyState Icon={Package} title="No listings yet" subtitle="This seller hasn't added any products yet." inCard />
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {inventory.slice(0, 6).map((item: any) => {
                const imageUrl = item.images?.[0]?.image_url;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/product-details?id=${item.id}&type=product` as any)}
                    className="bg-white rounded-2xl overflow-hidden"
                    style={[shadow.sm, { width: "47%" }]}
                  >
                    {imageUrl
                      ? <Image source={{ uri: imageUrl }} className="w-full h-28" resizeMode="cover" />
                      : <View className="w-full h-28 bg-gray-100 items-center justify-center"><Package size={28} color="#d1d5db" /></View>}
                    <View className="p-3">
                      <Text className="text-xs font-bold text-gray-900" numberOfLines={2}>{item.name ?? item.title ?? item.brand}</Text>
                      {(item.price) && <Text className="text-xs font-extrabold text-amber-400 mt-1">{fmt(item.price)}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

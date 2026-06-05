import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Bell, Tag, Car, Home } from "lucide-react-native";
import { SectionHeader } from "@/components/SectionHeader";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardItem } from "@/components/ProductCard";
import { shadow } from "@/constants/shadows";
import { productsApi } from "@/api";
import type { Car as CarType, Property, Product } from "@/api";
import { fmt } from "@/utils/format";
import { useAuthStore } from "@/store/authStore";

// ─── Category pill ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "vehicle",     label: "Vehicles",    Icon: Car  },
  { id: "real_estate", label: "Real Estate", Icon: Home },
  { id: "product",     label: "Deals",       Icon: Tag  },
];

function CategoryPill({ label, Icon, active, onPress }: { label: string; Icon: any; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border-2 ${active ? "bg-amber-400 border-amber-400" : "bg-white border-gray-200"}`}
    >
      <Icon size={14} color={active ? "#fff" : "#6b7280"} />
      <Text className={`font-semibold text-sm ${active ? "text-white" : "text-gray-700"}`}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Home Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState("vehicle");
  const [search, setSearch] = useState("");
  const [hotSales, setHotSales] = useState<ProductCardItem[]>([]);
  const [recent, setRecent] = useState<ProductCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = (profile as any)?.name || (profile as any)?.business_name || user?.email?.split("@")[0] || "there";

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all three types in parallel — any failure is silent
      const [carsRes, propsRes, productsRes] = await Promise.allSettled([
        productsApi.listCars({ limit: 6 }),
        productsApi.listProperties({ limit: 4 }),
        productsApi.list({ limit: 6 }),
      ]);

      const items: ProductCardItem[] = [];

      if (carsRes.status === "fulfilled") {
        carsRes.value.data.forEach((c: CarType) => items.push({
          id: c.id,
          name: `${c.brand} ${c.model} ${c.year}`,
          price: fmt(c.price),
          type: "vehicle",
          imageUrl: c.images?.[0]?.image_url ?? null,
          tag: "Verified",
          tagColor: "#ea580c",
        }));
      }
      if (propsRes.status === "fulfilled") {
        propsRes.value.data.forEach((p: Property) => items.push({
          id: p.id,
          name: p.title,
          price: fmt(p.price),
          type: "real_estate",
          imageUrl: p.images?.[0]?.image_url ?? null,
          tag: p.listing_type,
          tagColor: "#0284c7",
        }));
      }
      if (productsRes.status === "fulfilled") {
        productsRes.value.data.forEach((p: Product) => items.push({
          id: p.id,
          name: p.name,
          price: fmt(p.price),
          type: "product",
          imageUrl: p.images?.[0]?.image_url ?? null,
          tag: p.category?.name,
        }));
      }

      // Shuffle so all three types mix in the listings
      const shuffled = items.sort(() => Math.random() - 0.5);
      setHotSales(shuffled.slice(0, 6));
      setRecent(shuffled.slice(6, 12));
    } catch { /* silent — show empty states */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handleSearch = () => {
    if (search.trim()) router.push(`/browse?search=${encodeURIComponent(search)}` as any);
    else router.push("/browse");
  };

  const goToItem = (item: ProductCardItem) => {
    router.push(`/product-details?id=${item.id}&type=${item.type}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="pb-6">

          {/* ── Header ── */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
            <View>
              <Text className="text-xs text-gray-400 font-medium">Welcome back, {displayName} 👋</Text>
              <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
                LEL <Text className="text-amber-400">Marketplace</Text>
              </Text>
            </View>
            <TouchableOpacity className="relative" onPress={() => router.push("/notifications")}>
              <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
                <Bell size={20} color="#374151" strokeWidth={1.8} />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Search Bar ── */}
          <View className="px-5 py-3 bg-white">
            <TouchableOpacity
              onPress={handleSearch}
              className="flex-row items-center gap-2.5 bg-gray-100 rounded-xl px-3.5 py-2.5"
              activeOpacity={0.8}
            >
              <Search size={18} color="#9ca3af" />
              <TextInput
                placeholder="Search vehicles, properties..."
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
                placeholderTextColor="#9ca3af"
                className="flex-1 bg-transparent text-sm text-gray-900"
              />
            </TouchableOpacity>
          </View>

          {/* ── Promo Banner ── */}
          <View className="px-5 py-3">
            <View className="relative rounded-2xl overflow-hidden h-40 flex-row" style={{ backgroundColor: "#1e1b4b" }}>
              <View className="flex-1 p-5 justify-center gap-1.5">
                <View className="bg-amber-400 self-start px-2 py-0.5 rounded-md">
                  <Text className="text-white text-[10px] font-extrabold tracking-wide">EXCLUSIVE</Text>
                </View>
                <Text className="text-amber-400 text-2xl font-black leading-tight">LEL{"\n"}Marketplace</Text>
                <Text className="text-white text-xs" style={{ opacity: 0.85 }}>Top deals on vehicles & property</Text>
                <TouchableOpacity onPress={() => router.push("/browse")} className="bg-amber-400 self-start px-3.5 py-1.5 rounded-xl mt-1">
                  <Text className="text-white text-xs font-bold">Browse Deals</Text>
                </TouchableOpacity>
              </View>
              <View className="w-32 items-center justify-center gap-2.5">
                <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.2)" }}>
                  <Car size={36} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <Home size={24} color="#fff" strokeWidth={1.5} />
                </View>
              </View>
              <View className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.1)" }} />
            </View>
          </View>

          {/* ── Categories ── */}
          <View className="pl-5 mb-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2.5 pr-5">
                {CATEGORIES.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    label={cat.label}
                    Icon={cat.Icon}
                    active={activeCategory === cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── Hot Sales ── */}
          <View className="mt-5">
            <View className="px-5">
              <SectionHeader title="Hot Listings" onSeeAll={() => router.push("/browse")} />
            </View>
            {loading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#f59e0b" />
              </View>
            ) : hotSales.length === 0 ? (
              <Text className="text-sm text-gray-400 text-center py-6">No listings available</Text>
            ) : (
              <View className="gap-3.5 px-5">
                {hotSales.map((item) => (
                  <ProductCard key={item.id} item={item} onPress={() => goToItem(item)} variant="horizontal" />
                ))}
              </View>
            )}
          </View>

          {/* ── Recent ── */}
          {recent.length > 0 && (
            <View className="mt-7 px-5">
              <SectionHeader title="More Listings" onSeeAll={() => router.push("/browse")} />
              <View className="gap-3.5">
                {recent.map((item) => (
                  <ProductCard key={item.id} item={item} onPress={() => goToItem(item)} variant="horizontal" />
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

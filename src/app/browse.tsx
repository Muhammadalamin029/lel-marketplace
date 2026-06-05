import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardItem } from "@/components/ProductCard";
import { Car, Home, Tag, Search, Package } from "lucide-react-native";
import { productsApi } from "@/api";
import type { Product, Car as CarType, Property } from "@/api";
import { fmt } from "@/utils/format";

type Category = "all" | "vehicle" | "real_estate" | "product";

const CATEGORIES: { id: Category; label: string; Icon: any }[] = [
  { id: "all",         label: "All",         Icon: Tag  },
  { id: "vehicle",     label: "Vehicles",    Icon: Car  },
  { id: "real_estate", label: "Real Estate", Icon: Home },
  { id: "product",     label: "Products",    Icon: Tag  },
];

export default function BrowseScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [allItems, setAllItems] = useState<ProductCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDebounce, setSearchDebounce] = useState("");

  // Debounce the search term — send to API 500 ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const loadAll = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const searchParam = q.trim() || undefined;

      const [productsRes, carsRes, propsRes] = await Promise.allSettled([
        productsApi.list({ limit: 30, search: searchParam }),
        productsApi.listCars({ limit: 30, search: searchParam }),
        productsApi.listProperties({ limit: 30, search: searchParam }),
      ]);

      const items: ProductCardItem[] = [];

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

      setAllItems(items);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // Reload whenever the debounced search changes
  useEffect(() => { loadAll(searchDebounce); }, [loadAll, searchDebounce]);

  // Category filtering is still client-side (fast, no extra request needed)
  const filtered = allItems.filter((item) => {
    const matchCat = activeCategory === "all" || item.type === activeCategory;
    return matchCat;
  });

  const handlePress = (item: ProductCardItem) => {
    router.push(`/product-details?id=${item.id}&type=${item.type}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Browse" subtitle="Vehicles, Real Estate & Products" />

      {/* Search */}
      <View className="px-5 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2.5 bg-gray-100 rounded-xl px-3.5 py-2.5">
          <Search size={16} color="#9ca3af" />
          <TextInput
            placeholder="Search listings…"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-transparent text-sm text-gray-900"
          />
        </View>
      </View>

      {/* Category pills */}
      <View className="bg-white px-5 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-3">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full border ${activeCategory === cat.id ? "bg-amber-400 border-amber-400" : "bg-white border-gray-200"}`}
              >
                <Text className={`text-xs font-semibold ${activeCategory === cat.id ? "text-white" : "text-gray-700"}`}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-4">
          {loading ? (
            <View className="items-center justify-center pt-20 gap-3">
              <ActivityIndicator size="large" color="#f59e0b" />
              <Text className="text-sm text-gray-400">Loading listings…</Text>
            </View>
          ) : (
            <>
              <Text className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">
                {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
              </Text>
              {filtered.length === 0 ? (
                <EmptyState Icon={Package} title="No listings found" subtitle="Try a different search or category." />
              ) : (
                <View className="flex-row flex-wrap gap-4">
                  {filtered.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      onPress={() => handlePress(item)}
                      variant="horizontal"
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

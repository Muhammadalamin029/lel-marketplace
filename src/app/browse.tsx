import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TouchableWithoutFeedback, TextInput, StatusBar,
  ActivityIndicator, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowUpDown, SlidersHorizontal, X, Check } from "lucide-react-native";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardItem } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { COLORS } from "@/constants/brand";
import { productsApi } from "@/api";
import type { Product, Car as CarType, Property } from "@/api";
import { fmt } from "@/utils/format";
import { Package } from "lucide-react-native";

type ShopTab = "products" | "cars" | "apartments" | "properties";
type SortOption = "featured" | "price_asc" | "price_desc" | "name_asc";

const TABS: { id: ShopTab; label: string }[] = [
  { id: "products",   label: "Products" },
  { id: "cars",       label: "Cars" },
  { id: "apartments", label: "Apartments" },
  { id: "properties", label: "Properties" },
];

const SORTS: { id: SortOption; label: string }[] = [
  { id: "featured",   label: "Most Popular" },
  { id: "price_asc",  label: "Lowest Price" },
  { id: "price_desc", label: "Highest Price" },
  { id: "name_asc",   label: "Name: A to Z" },
];

const PAGE_SIZE = 20;

interface Item extends ProductCardItem {
  rawPrice: number;
  year?: number;
  listingType?: string;
}

function toCardItemForProduct(p: Product): Item {
  return {
    id: p.id,
    name: p.name,
    price: fmt(p.price),
    rawPrice: Number(p.price),
    type: "product",
    imageUrl: p.images?.[0]?.image_url ?? null,
    subtitle: p.category?.name,
  };
}

function toCardItemForCar(c: CarType): Item {
  return {
    id: c.id,
    name: `${c.brand} ${c.model}`,
    price: fmt(c.price),
    rawPrice: Number(c.price),
    year: c.year,
    type: "vehicle",
    imageUrl: c.images?.[0]?.image_url ?? null,
    tag: String(c.year),
    subtitle: c.units?.[0]?.mileage != null ? `${Number(c.units[0].mileage).toLocaleString()}KM` : undefined,
  };
}

function toCardItemForProperty(p: Property): Item {
  return {
    id: p.id,
    name: p.title,
    price: fmt(p.price),
    rawPrice: Number(p.price),
    listingType: p.listing_type,
    type: "real_estate",
    imageUrl: p.images?.[0]?.image_url ?? null,
    tag: p.listing_type === "rental" ? "For Rent" : "For Sale",
    subtitle: p.location,
  };
}

export default function BrowseScreen() {
  const router = useRouter();
  const { search: initialSearch } = useLocalSearchParams<{ search?: string }>();
  const [search, setSearch] = useState(typeof initialSearch === "string" ? initialSearch : "");
  const [tab, setTab] = useState<ShopTab>("products");
  const [sort, setSort] = useState<SortOption>("featured");
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDebounce, setSearchDebounce] = useState(search);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const loadAll = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const searchParam = q.trim() || undefined;
      const [productsRes, carsRes, propsRes] = await Promise.allSettled([
        productsApi.list({ limit: 50, search: searchParam }),
        productsApi.listCars({ limit: 50, search: searchParam }),
        productsApi.listProperties({ limit: 50, search: searchParam }),
      ]);
      const items: Item[] = [];
      if (productsRes.status === "fulfilled") productsRes.value.data.forEach((p) => items.push(toCardItemForProduct(p)));
      if (carsRes.status === "fulfilled") carsRes.value.data.forEach((c) => items.push(toCardItemForCar(c)));
      if (propsRes.status === "fulfilled") propsRes.value.data.forEach((p) => items.push(toCardItemForProperty(p)));
      setAllItems(items);
      setVisibleCount(PAGE_SIZE);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(searchDebounce); }, [loadAll, searchDebounce]);

  const activeFilterCount =
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (minYear ? 1 : 0) + (maxYear ? 1 : 0);

  const filtered = useMemo(() => {
    const lo = minPrice ? Number(minPrice) : null;
    const hi = maxPrice ? Number(maxPrice) : null;
    const yLo = minYear ? Number(minYear) : null;
    const yHi = maxYear ? Number(maxYear) : null;
    const out = allItems.filter((item) => {
      if (tab === "products" && item.type !== "product") return false;
      if (tab === "cars" && item.type !== "vehicle") return false;
      if (tab === "apartments" && !(item.type === "real_estate" && item.listingType === "rental")) return false;
      if (tab === "properties" && item.type !== "real_estate") return false;
      if (lo != null && !Number.isNaN(lo) && item.rawPrice < lo) return false;
      if (hi != null && !Number.isNaN(hi) && item.rawPrice > hi) return false;
      if (item.type === "vehicle") {
        if (yLo != null && !Number.isNaN(yLo) && (item.year ?? 0) < yLo) return false;
        if (yHi != null && !Number.isNaN(yHi) && (item.year ?? 9999) > yHi) return false;
      }
      return true;
    });
    switch (sort) {
      case "price_asc":  return [...out].sort((a, b) => a.rawPrice - b.rawPrice);
      case "price_desc": return [...out].sort((a, b) => b.rawPrice - a.rawPrice);
      case "name_asc":   return [...out].sort((a, b) => a.name.localeCompare(b.name));
      default:           return out;
    }
  }, [allItems, tab, sort, minPrice, maxPrice, minYear, maxYear]);

  const visible = filtered.slice(0, visibleCount);
  const rows: Item[][] = [];
  for (let i = 0; i < visible.length; i += 2) rows.push(visible.slice(i, i + 2));

  const clearFilters = () => {
    setMinPrice(""); setMaxPrice(""); setMinYear(""); setMaxYear("");
  };

  const handlePress = (item: ProductCardItem) => {
    router.push(`/product-details?id=${item.id}&type=${item.type}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Search */}
      <View className="px-5 pt-4 pb-2">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onSubmit={() => loadAll(search)}
          onFilterPress={() => setFiltersOpen((v) => !v)}
        />
      </View>

      {/* Category tabs */}
      <View className="flex-row px-5 border-b border-gray-100">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} className="mr-5 pb-2.5" style={active ? { borderBottomWidth: 2, borderBottomColor: COLORS.primary } : undefined}>
              <Text className={active ? "font-grotesk-bold" : "font-manrope"} style={{ color: active ? COLORS.primary : "#6b7280", fontSize: 14 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results + Sort/Filter */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="font-manrope text-xs text-gray-400">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setSortSheetOpen(true)}
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-gray-200"
          >
            <ArrowUpDown size={13} color="#374151" />
            <Text className="text-xs font-grotesk-semibold text-gray-700">Sort</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFiltersOpen((v) => !v)}
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-gray-200"
            style={activeFilterCount > 0 ? { borderColor: COLORS.primary } : undefined}
          >
            <SlidersHorizontal size={13} color={activeFilterCount > 0 ? COLORS.primary : "#374151"} />
            <Text className="text-xs font-grotesk-semibold" style={{ color: activeFilterCount > 0 ? COLORS.primary : "#374151" }}>
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline filter panel */}
      {filtersOpen && (
        <View className="mx-5 mb-2 bg-gray-50 rounded-2xl p-4 gap-3 border border-gray-100">
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-grotesk-bold text-gray-600">Min Price (₦)</Text>
              <TextInput
                value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" placeholder="0"
                placeholderTextColor="#9ca3af"
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-xs font-grotesk-bold text-gray-600">Max Price (₦)</Text>
              <TextInput
                value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" placeholder="No max"
                placeholderTextColor="#9ca3af"
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
            </View>
          </View>
          {tab === "cars" && (
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <Text className="text-xs font-grotesk-bold text-gray-600">Min Year</Text>
                <TextInput
                  value={minYear} onChangeText={setMinYear} keyboardType="numeric" placeholder="e.g. 2015"
                  placeholderTextColor="#9ca3af"
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                />
              </View>
              <View className="flex-1 gap-1.5">
                <Text className="text-xs font-grotesk-bold text-gray-600">Max Year</Text>
                <TextInput
                  value={maxYear} onChangeText={setMaxYear} keyboardType="numeric" placeholder="e.g. 2025"
                  placeholderTextColor="#9ca3af"
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                />
              </View>
            </View>
          )}
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters} className="self-end">
              <Text className="text-xs font-grotesk-bold text-red-500">Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5">
          {loading ? (
            <View className="items-center justify-center pt-20 gap-3">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text className="font-manrope text-sm text-gray-400">Loading listings…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <EmptyState Icon={Package} title="No listings found" subtitle="Try a different search, sort or filters." />
          ) : (
            <View className="gap-4">
              {rows.map((row, ri) => (
                <View key={ri} className="flex-row" style={{ gap: 12 }}>
                  {row.map((item) => (
                    <View key={item.id} style={{ flex: 1 }}>
                      <ProductCard item={item} onPress={() => handlePress(item)} variant="vertical" />
                    </View>
                  ))}
                  {row.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))}
              {visibleCount < filtered.length && (
                <TouchableOpacity
                  onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="bg-white border border-gray-200 rounded-2xl py-3.5 items-center mt-1"
                >
                  <Text className="text-sm font-grotesk-bold text-gray-700">
                    Load More ({filtered.length - visibleCount} remaining)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sort bottom sheet */}
      <Modal visible={sortSheetOpen} transparent animationType="slide" onRequestClose={() => setSortSheetOpen(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <TouchableWithoutFeedback onPress={() => setSortSheetOpen(false)}>
            <View className="flex-1" />
          </TouchableWithoutFeedback>
          <View className="bg-white rounded-t-3xl px-5 pt-4 pb-8">
            <View className="w-10 h-1 rounded-full bg-gray-200 self-center mb-4" />
            <Text className="text-base font-grotesk-extrabold text-gray-900 mb-3">Sort by</Text>
            {SORTS.map((s) => {
              const active = sort === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => { setSort(s.id); setSortSheetOpen(false); }}
                  className="flex-row items-center justify-between py-3.5 border-b border-gray-100"
                >
                  <Text className="text-sm font-grotesk-semibold" style={{ color: active ? COLORS.primary : "#111827" }}>
                    {s.label}
                  </Text>
                  {active && <Check size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => setSortSheetOpen(false)}
              className="flex-row items-center justify-center gap-1.5 py-3.5"
            >
              <X size={16} color="#6b7280" />
              <Text className="text-sm font-grotesk-semibold text-gray-500">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

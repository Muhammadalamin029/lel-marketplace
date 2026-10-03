import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TouchableWithoutFeedback, TextInput, StatusBar,
  ActivityIndicator, Modal, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowUpDown, SlidersHorizontal, X, Check, Package } from "lucide-react-native";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardItem } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { COLORS } from "@/constants/brand";
import { productsApi, wishlistApi, getApiError } from "@/api";
import { useAuthStore } from "@/store/authStore";
import type { Product, Car as CarType, Property } from "@/api";
import { fmt } from "@/utils/format";

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
  liked?: boolean;
}

function safePrice(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toCardItemForProduct(p: Product, likedIds: Set<string>): Item {
  const price = safePrice((p as any).price);
  return {
    id: p.id,
    name: p.name ?? "Product",
    price: fmt(price),
    rawPrice: price,
    type: "product",
    imageUrl: p.images?.[0]?.image_url ?? null,
    subtitle: p.category?.name,
    liked: likedIds.has(p.id),
  };
}

function toCardItemForCar(c: CarType): Item {
  const price = safePrice((c as any).price);
  return {
    id: c.id,
    name: `${c.brand ?? ""} ${c.model ?? ""}`.trim() || "Vehicle",
    price: fmt(price),
    rawPrice: price,
    year: c.year,
    type: "vehicle",
    imageUrl: c.images?.[0]?.image_url ?? null,
    tag: c.year != null ? String(c.year) : undefined,
    subtitle: c.units?.[0]?.mileage != null ? `${Number(c.units[0].mileage).toLocaleString()}KM` : undefined,
  };
}

function toCardItemForProperty(p: Property): Item {
  const price = safePrice((p as any).price);
  return {
    id: p.id,
    name: p.title ?? "Property",
    price: fmt(price),
    rawPrice: price,
    listingType: p.listing_type,
    type: "real_estate",
    imageUrl: p.images?.[0]?.image_url ?? null,
    tag: p.listing_type === "rental" ? "For Rent" : "For Sale",
    subtitle: p.location,
  };
}

function sortParams(sort: SortOption): { sort_by?: "price" | "name" | "created_at"; sort_order?: "asc" | "desc" } {
  switch (sort) {
    case "price_asc":  return { sort_by: "price", sort_order: "asc" };
    case "price_desc": return { sort_by: "price", sort_order: "desc" };
    case "name_asc":   return { sort_by: "name", sort_order: "asc" };
    default:           return {};
  }
}

export default function BrowseScreen() {
  const router = useRouter();
  const { search: initialSearch } = useLocalSearchParams<{ search?: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [search, setSearch] = useState(typeof initialSearch === "string" ? initialSearch : "");
  const [tab, setTab] = useState<ShopTab>("products");
  const [sort, setSort] = useState<SortOption>("featured");
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Products tab: server-paginated (so ALL products are reachable) ──
  const [productItems, setProductItems] = useState<Item[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // ── Cars / properties: backend has no pagination, fetch-once + client slice ──
  const [assetItems, setAssetItems] = useState<Item[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState(search);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");

  const requestId = useRef(0);

  // Sync search box when navigating here with ?search= (e.g. from Home).
  useEffect(() => {
    if (typeof initialSearch === "string") setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // Wishlist state for hearts (products only).
  useEffect(() => {
    if (!isAuthenticated) { setLikedIds(new Set()); return; }
    wishlistApi.listAll().then((items) => {
      setLikedIds(new Set(items.map((w) => w.product_id)));
    }).catch(() => {});
  }, [isAuthenticated]);

  const priceBounds = useMemo(() => {
    const lo = minPrice.trim() === "" ? undefined : Number(minPrice);
    const hi = maxPrice.trim() === "" ? undefined : Number(maxPrice);
    return {
      lo: lo != null && !Number.isNaN(lo) ? lo : undefined,
      hi: hi != null && !Number.isNaN(hi) ? hi : undefined,
    };
  }, [minPrice, maxPrice]);

  // ── Products: server-side fetch ──
  const fetchProducts = useCallback(async (
    page: number,
    opts: { append?: boolean; isRefresh?: boolean } = {},
  ) => {
    const myRequest = ++requestId.current;
    if (opts.isRefresh) setRefreshing(true);
    else if (opts.append) setLoadingMoreProducts(true);
    else setLoadingProducts(true);
    if (!opts.append) setProductsError(null);
    try {
      const q = searchDebounce.trim() || undefined;
      const res = await productsApi.list({
        page,
        limit: PAGE_SIZE,
        search: q,
        min_price: priceBounds.lo,
        max_price: priceBounds.hi,
        ...sortParams(sort),
      });
      if (requestId.current !== myRequest) return;
      const mapped = res.data.map((p) => toCardItemForProduct(p, likedIds));
      setProductItems((prev) => (opts.append ? [...prev, ...mapped.filter((m) => !prev.some((e) => e.id === m.id))] : mapped));
      setProductPage(res.pagination?.page ?? page);
      setProductTotalPages(res.pagination?.total_pages ?? page);
      setProductTotal(res.pagination?.total ?? mapped.length);
    } catch (e) {
      if (requestId.current !== myRequest) return;
      if (!opts.append) setProductsError(getApiError(e));
    } finally {
      if (requestId.current === myRequest) {
        setLoadingProducts(false);
        setLoadingMoreProducts(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounce, sort, priceBounds.lo, priceBounds.hi]);

  // Re-apply liked flags when wishlist loads after products.
  useEffect(() => {
    setProductItems((prev) => prev.map((it) => ({ ...it, liked: likedIds.has(it.id) })));
  }, [likedIds]);

  // ── Assets: fetch-once per search ──
  const fetchAssets = useCallback(async (q: string, isRefresh = false) => {
    const myRequest = ++requestId.current;
    if (isRefresh) setRefreshing(true);
    else setLoadingAssets(true);
    setAssetsError(null);
    try {
      const searchParam = q.trim() || undefined;
      const [carsRes, propsRes] = await Promise.allSettled([
        productsApi.listCars({ limit: 100, search: searchParam }),
        productsApi.listProperties({ limit: 100, search: searchParam }),
      ]);
      if (requestId.current !== myRequest) return;
      const failures: string[] = [];
      const items: Item[] = [];
      if (carsRes.status === "fulfilled") {
        carsRes.value.data.forEach((c) => items.push(toCardItemForCar(c)));
      } else {
        failures.push("vehicles");
      }
      if (propsRes.status === "fulfilled") {
        propsRes.value.data.forEach((p) => items.push(toCardItemForProperty(p)));
      } else {
        failures.push("properties");
      }
      setAssetItems(items);
      setVisibleCount(PAGE_SIZE);
      if (failures.length === 2) {
        setAssetsError(carsRes.status === "rejected" ? getApiError(carsRes.reason) : "Could not load listings.");
      } else if (failures.length === 1) {
        setAssetsError(`Could not load ${failures[0]}. Showing the rest.`);
      }
    } catch (e) {
      if (requestId.current !== myRequest) return;
      setAssetsError(getApiError(e));
    } finally {
      if (requestId.current === myRequest) {
        setLoadingAssets(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Refetch on tab / search / sort / price-filter change.
  useEffect(() => {
    if (tab === "products") fetchProducts(1);
    else fetchAssets(searchDebounce);
  }, [tab, searchDebounce, sort, priceBounds.lo, priceBounds.hi, fetchProducts, fetchAssets]);

  const onRefresh = useCallback(() => {
    if (tab === "products") fetchProducts(1, { isRefresh: true });
    else fetchAssets(searchDebounce, true);
  }, [tab, searchDebounce, fetchProducts, fetchAssets]);

  const activeFilterCount =
    (minPrice.trim() ? 1 : 0) + (maxPrice.trim() ? 1 : 0) + (minYear.trim() ? 1 : 0) + (maxYear.trim() ? 1 : 0);

  // Client-side remainder for assets (year filter + sort; price already server-side for products).
  const visibleAssets = useMemo(() => {
    const lo = priceBounds.lo ?? null;
    const hi = priceBounds.hi ?? null;
    const yLo = minYear.trim() === "" ? null : Number(minYear);
    const yHi = maxYear.trim() === "" ? null : Number(maxYear);
    const out = assetItems.filter((item) => {
      if (tab === "cars" && item.type !== "vehicle") return false;
      if (tab === "apartments" && !(item.type === "real_estate" && item.listingType === "rental")) return false;
      // Web parity (/properties mobile): rentals live under Apartments only,
      // Properties shows everything else (sale + professional).
      if (tab === "properties" && !(item.type === "real_estate" && item.listingType !== "rental")) return false;
      if (lo != null && item.rawPrice < lo) return false;
      if (hi != null && item.rawPrice > hi) return false;
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
  }, [assetItems, tab, sort, priceBounds.lo, priceBounds.hi, minYear, maxYear]);

  const isProductsTab = tab === "products";
  const loading = isProductsTab ? loadingProducts : loadingAssets;
  const listError = isProductsTab ? productsError : assetsError;
  const shownCount = isProductsTab ? productTotal : visibleAssets.length;
  const assetRows: Item[][] = [];
  const slicedAssets = visibleAssets.slice(0, visibleCount);
  for (let i = 0; i < slicedAssets.length; i += 2) assetRows.push(slicedAssets.slice(i, i + 2));
  const productRows: Item[][] = [];
  for (let i = 0; i < productItems.length; i += 2) productRows.push(productItems.slice(i, i + 2));
  const rows = isProductsTab ? productRows : assetRows;
  const canLoadMore = isProductsTab
    ? productPage < productTotalPages
    : visibleCount < visibleAssets.length;
  const remaining = isProductsTab ? undefined : visibleAssets.length - visibleCount;

  const handleLoadMore = () => {
    if (isProductsTab) fetchProducts(productPage + 1, { append: true });
    else setVisibleCount((c) => c + PAGE_SIZE);
  };

  const clearFilters = () => {
    setMinPrice(""); setMaxPrice(""); setMinYear(""); setMaxYear("");
  };

  const toggleWishlist = async (id: string, next: boolean) => {
    if (!isAuthenticated) {
      router.push("/(auth)/login" as any);
      return;
    }
    setLikedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
    try {
      if (next) await wishlistApi.add(id);
      else await wishlistApi.remove(id);
    } catch (e) {
      setLikedIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(id);
        else copy.add(id);
        return copy;
      });
      Alert.alert("Wishlist", getApiError(e));
    }
  };

  const handlePress = (item: ProductCardItem) => {
    router.push(`/product-details?id=${item.id}&type=${item.type}` as any);
  };

  const renderRows = () => (
    <View className="gap-4">
      {rows.map((row, ri) => (
        <View key={ri} className="flex-row" style={{ gap: 12 }}>
          {row.map((item) => (
            <View key={item.id} style={{ flex: 1 }}>
              <ProductCard
                item={item}
                onPress={() => handlePress(item)}
                variant="vertical"
                onWishlist={item.type === "product" ? toggleWishlist : undefined}
              />
            </View>
          ))}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
      {canLoadMore && (
        <TouchableOpacity
          onPress={handleLoadMore}
          disabled={loadingMoreProducts}
          className="bg-white border border-gray-200 rounded-2xl py-3.5 items-center mt-1"
        >
          {loadingMoreProducts ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text className="text-sm font-grotesk-bold text-gray-700">
              {isProductsTab
                ? `Load More (page ${productPage + 1} of ${productTotalPages})`
                : `Load More (${remaining} remaining)`}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Search */}
      <View className="px-5 pt-4 pb-2">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onSubmit={() => {
            if (isProductsTab) fetchProducts(1);
            else fetchAssets(search);
          }}
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
          {loading && shownCount === 0 ? "Loading…" : `${shownCount} result${shownCount === 1 ? "" : "s"}`}
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

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
        <View className="px-5">
          {loading && rows.length === 0 ? (
            <View className="items-center justify-center pt-20 gap-3">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text className="font-manrope text-sm text-gray-400">Loading listings…</Text>
            </View>
          ) : listError && rows.length === 0 ? (
            <View className="items-center justify-center pt-20 gap-3 px-8">
              <Text className="font-grotesk-bold text-base text-gray-900 text-center">Couldn't load listings</Text>
              <Text className="font-manrope text-sm text-gray-400 text-center">{listError}</Text>
              <TouchableOpacity
                onPress={() => (isProductsTab ? fetchProducts(1) : fetchAssets(searchDebounce))}
                className="mt-2 px-6 py-3 rounded-xl"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Text className="font-grotesk-bold text-sm text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : rows.length === 0 ? (
            <EmptyState Icon={Package} title="No listings found" subtitle="Try a different search, sort or filters." />
          ) : (
            <>
              {!!listError && (
                <Text className="font-manrope text-xs text-amber-600 text-center mb-3">{listError}</Text>
              )}
              {renderRows()}
            </>
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

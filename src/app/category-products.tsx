import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardItem } from "@/components/ProductCard";
import { Package } from "lucide-react-native";
import { COLORS } from "@/constants/brand";
import { fmt } from "@/utils/format";
import { categoriesApi, getApiError, wishlistApi } from "@/api";
import { useAuthStore } from "@/store/authStore";
import type { Product } from "@/api";

const PAGE_LIMIT = 20;

function toCardItem(p: Product, likedIds: Set<string>): ProductCardItem & { liked?: boolean } {
  const price = Number((p as any).price);
  return {
    id: p.id,
    name: p.name ?? "Product",
    price: fmt(Number.isFinite(price) ? price : 0),
    type: "product",
    imageUrl: p.images?.[0]?.image_url ?? null,
    subtitle: p.category?.name,
    liked: likedIds.has(p.id),
  };
}

export default function CategoryProductsScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [items, setItems] = useState<(ProductCardItem & { liked?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) { setLikedIds(new Set()); return; }
    wishlistApi.listAll().then((w) => {
      setLikedIds(new Set(w.map((x) => x.product_id)));
    }).catch(() => {});
  }, [isAuthenticated]);

  const load = useCallback(async (pageNum = 1, append = false) => {
    if (!id) return;
    if (append) setLoadingMore(true);
    else { setLoading(true); setError(null); }
    try {
      const res = await categoriesApi.getProducts(id, { page: pageNum, limit: PAGE_LIMIT });
      const liked = likedIds;
      const mapped = (res.data ?? []).map((p) => toCardItem(p, liked));
      if (pageNum === 1) setItems(mapped);
      else setItems((prev) => [...prev, ...mapped.filter((m) => !prev.some((e) => e.id === m.id))]);
      setHasMore((res.pagination?.page ?? pageNum) < (res.pagination?.total_pages ?? pageNum));
      setPage(pageNum);
    } catch (e) {
      if (!append) setError(getApiError(e));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    setItems((prev) => prev.map((it) => ({ ...it, liked: likedIds.has(it.id) })));
  }, [likedIds]);

  const toggleWishlist = async (pid: string, next: boolean) => {
    if (!isAuthenticated) {
      router.push("/(auth)/login" as any);
      return;
    }
    setLikedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(pid);
      else copy.delete(pid);
      return copy;
    });
    try {
      if (next) await wishlistApi.add(pid);
      else await wishlistApi.remove(pid);
    } catch (e) {
      setLikedIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(pid);
        else copy.add(pid);
        return copy;
      });
      Alert.alert("Wishlist", getApiError(e));
    }
  };

  const rows: (ProductCardItem & { liked?: boolean })[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title={decodeURIComponent(name ?? "Products")} subtitle={`${items.length} listing${items.length === 1 ? "" : "s"}`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {loading ? (
          <View className="items-center justify-center pt-20 gap-3">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="font-manrope text-sm text-gray-400">Loading products…</Text>
          </View>
        ) : error && items.length === 0 ? (
          <View className="items-center justify-center pt-20 gap-3 px-8">
            <Text className="font-grotesk-bold text-base text-gray-900 text-center">Couldn't load products</Text>
            <Text className="font-manrope text-sm text-gray-400 text-center">{error}</Text>
            <TouchableOpacity
              onPress={() => load(1)}
              className="mt-2 px-6 py-3 rounded-xl"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="font-grotesk-bold text-sm text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <EmptyState Icon={Package} title="No products found" subtitle={`No products in ${decodeURIComponent(name ?? "this category")} yet.`} />
        ) : (
          <>
            <View className="gap-4">
              {rows.map((row, ri) => (
                <View key={ri} className="flex-row" style={{ gap: 12 }}>
                  {row.map((item) => (
                    <View key={item.id} style={{ flex: 1 }}>
                      <ProductCard
                        item={item}
                        onPress={() => router.push(`/product-details?id=${item.id}&type=product` as any)}
                        variant="vertical"
                        onWishlist={toggleWishlist}
                      />
                    </View>
                  ))}
                  {row.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>

            {hasMore && (
              <TouchableOpacity
                onPress={() => load(page + 1, true)}
                disabled={loadingMore}
                className="mt-6 bg-white border border-gray-200 py-3.5 rounded-2xl items-center"
              >
                {loadingMore
                  ? <ActivityIndicator color={COLORS.primary} />
                  : <Text className="text-sm font-grotesk-bold text-gray-700">Load More</Text>}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

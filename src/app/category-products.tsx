import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { shadow } from "@/constants/shadows";
import { Package, Star } from "lucide-react-native";
import { fmt } from "@/utils/format";
import { categoriesApi } from "@/api";
import type { Product } from "@/api";

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const imageUrl = product.images?.[0]?.image_url;
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl overflow-hidden"
      style={[shadow.md, { width: "47%" }]}
      activeOpacity={0.85}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-full h-32" resizeMode="cover" />
      ) : (
        <View className="w-full h-32 bg-gray-100 items-center justify-center">
          <Package size={32} color="#d1d5db" strokeWidth={1.5} />
        </View>
      )}
      <View className="p-3 gap-1">
        <Text className="text-sm font-bold text-gray-900" numberOfLines={2}>{product.name}</Text>
        <Text className="text-sm font-extrabold text-amber-400">{fmt(product.price)}</Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          <Star size={11} color="#f59e0b" fill="#f59e0b" />
          <Text className="text-[10px] text-gray-400">Verified seller</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CategoryProductsScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = async (pageNum = 1) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await categoriesApi.getProducts(id, { page: pageNum, limit: 20 });
      if (pageNum === 1) setProducts(res.data ?? []);
      else setProducts((prev) => [...prev, ...(res.data ?? [])]);
      setHasMore(res.pagination?.has_next ?? false);
      setPage(pageNum);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title={decodeURIComponent(name ?? "Products")} subtitle={`${products.length} listings`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {loading && page === 1 ? (
          <View className="items-center justify-center pt-20 gap-3">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400">Loading products…</Text>
          </View>
        ) : products.length === 0 ? (
          <EmptyState Icon={Package} title="No products found" subtitle={`No products in ${decodeURIComponent(name ?? "this category")} yet.`} />
        ) : (
          <>
            <View className="flex-row flex-wrap gap-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onPress={() => router.push(`/product-details?id=${p.id}&type=product` as any)}
                />
              ))}
            </View>

            {hasMore && (
              <TouchableOpacity
                onPress={() => load(page + 1)}
                disabled={loading}
                className="mt-6 bg-white border border-gray-200 py-3.5 rounded-2xl items-center"
                style={shadow.sm}
              >
                {loading
                  ? <ActivityIndicator color="#f59e0b" />
                  : <Text className="text-sm font-bold text-gray-700">Load More</Text>}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

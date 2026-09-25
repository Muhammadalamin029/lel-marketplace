import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Heart, Trash2, ShoppingCart } from "lucide-react-native";
import { shadow } from "@/constants/shadows";
import { wishlistApi } from "@/api";
import type { WishlistItem } from "@/api";
import { fmt } from "@/utils/format";
import { useCartStore } from "@/store/cartStore";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function WishlistScreen() {
  useRequireAuth();
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addItem);

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [removing, setRemoving] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const loadPage = async (p: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await wishlistApi.list({ page: p, limit: 20 });
      setItems((prev) => (append ? [...prev, ...res.items.filter((i) => !prev.some((e) => e.id === i.id))] : (res.items ?? [])));
      setPage(p);
      setTotalPages(res.pagination.total_pages ?? 1);
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => {
    loadPage(1, false);
  }, []);

  const handleRemove = async (productId: string) => {
    setRemoving(productId);
    try {
      await wishlistApi.remove(productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    } catch { /* silent */ }
    finally { setRemoving(null); }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    if (!item.product_id) return;
    setAddingToCart(item.product_id);
    try {
      await addToCart(item.product_id, 1);
      Alert.alert(
        "Added to Cart ✓",
        `${item.product?.name ?? "Item"} added to your cart.`,
        [
          { text: "Continue", style: "cancel" },
          { text: "View Cart", onPress: () => router.push("/(tabs)/cart" as any) },
        ]
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not add to cart.");
    } finally {
      setAddingToCart(null);
    }
  };

  const navigateToProduct = (item: WishlistItem) => {
    // WishlistItem.product is always a regular product (not vehicle/property)
    router.push(`/product-details?id=${item.product_id}&type=product` as any);
  };

  /** Clear-all loops per-item removes (web parity — no bulk endpoint). */
  const handleClearAll = () => {
    if (items.length === 0 || clearing) return;
    Alert.alert(
      "Clear Wishlist",
      `Remove all ${items.length} saved item${items.length === 1 ? "" : "s"}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Clear All", style: "destructive",
          onPress: async () => {
            setClearing(true);
            try {
              const results = await Promise.allSettled(items.map((i) => wishlistApi.remove(i.product_id)));
              const failed = results.filter((r) => r.status === "rejected").length;
              if (failed === 0) setItems([]);
              else {
                const okIds = new Set(
                  items.filter((_, idx) => results[idx].status === "fulfilled").map((i) => i.product_id),
                );
                setItems((prev) => prev.filter((i) => !okIds.has(i.product_id)));
                Alert.alert("Partially cleared", `${failed} item${failed === 1 ? "" : "s"} could not be removed.`);
              }
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
        <View>
          <Text className="text-xs text-gray-400 font-grotesk-medium">Items you love</Text>
          <Text className="text-xl font-grotesk-extrabold text-gray-900 tracking-tight">
            My <Text className="font-grotesk text-[#ff4b26]">Wishlist</Text>
            {items.length > 0 && (
              <Text className="text-base font-grotesk-bold text-[#ff4b26]"> ({items.length})</Text>
            )}
          </Text>
        </View>
        <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <Heart size={20} color="#374151" strokeWidth={1.8} />
        </View>
      </View>

      {/* List actions */}
      {!loading && items.length > 0 && (
        <View className="flex-row items-center justify-between px-5 py-2.5 bg-white border-b border-gray-100">
          <Text className="font-manrope text-xs text-gray-400">
            {items.length} saved item{items.length === 1 ? "" : "s"}
          </Text>
          <TouchableOpacity onPress={handleClearAll} disabled={clearing}>
            <Text className="text-xs font-grotesk-bold text-red-500">
              {clearing ? "Clearing…" : "Clear All"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff4b26" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center">
            <Heart size={36} color="#ef4444" strokeWidth={1.5} />
          </View>
          <Text className="text-lg font-grotesk-extrabold text-gray-900">No saved items yet</Text>
          <Text className="font-manrope text-sm text-gray-400 text-center">
            Tap the heart icon on any listing to save it here.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/browse")}
            className="mt-2 bg-[#ff4b26] px-6 py-3 rounded-2xl"
            style={shadow.btn}
          >
            <Text className="text-white font-grotesk-bold">Browse Listings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View className="gap-3">
            {items.map((item) => {
              const product = item.product;
              const imageUrl = product?.images?.[0]?.image_url;
              const isRemoving = removing === item.product_id;
              const isAddingThis = addingToCart === item.product_id;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigateToProduct(item)}
                  className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
                  style={shadow.md}
                  activeOpacity={0.85}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-xl" resizeMode="cover" />
                  ) : (
                    <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center">
                      <Heart size={24} color="#d1d5db" />
                    </View>
                  )}
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-grotesk-bold text-gray-900" numberOfLines={2}>
                      {product?.name ?? "Product"}
                    </Text>
                    <Text className="text-sm font-grotesk-extrabold text-[#ff4b26] mt-0.5">
                      {fmt(product?.price ?? 0)}
                    </Text>
                  </View>
                  <View className="gap-2 items-center">
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); handleRemove(item.product_id); }}
                      disabled={isRemoving}
                      className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
                    >
                      {isRemoving
                        ? <ActivityIndicator size="small" color="#ef4444" />
                        : <Trash2 size={14} color="#ef4444" />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); handleAddToCart(item); }}
                      disabled={isAddingThis}
                      className="w-8 h-8 rounded-full bg-[#fff0e9] items-center justify-center"
                    >
                      {isAddingThis
                        ? <ActivityIndicator size="small" color="#ff4b26" />
                        : <ShoppingCart size={14} color="#ff4b26" />}
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
            {page < totalPages && (
              <TouchableOpacity
                onPress={() => loadPage(page + 1, true)}
                disabled={loadingMore}
                className="bg-white border border-gray-200 rounded-2xl py-3.5 items-center mt-1"
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#ff4b26" />
                ) : (
                  <Text className="text-sm font-grotesk-bold text-gray-700">
                    Load More (page {page + 1} of {totalPages})
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

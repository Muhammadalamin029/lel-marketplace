import { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Image, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft, Heart, Share2, Star, MapPin, Shield,
  CheckCircle, ChevronRight, AlertCircle, Phone, MessageCircle,
} from "lucide-react-native";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";
import { productsApi, reviewsApi, api } from "@/api";
import type { Car, Property, Product, Review } from "@/api";
import { useCartStore } from "@/store/cartStore";
import { InspectionModal } from "@/components/InspectionModal";

type ItemType = "vehicle" | "real_estate" | "product";

// Statuses that mean the asset is NOT available for booking
const UNAVAILABLE_STATUSES = ["sold", "awaiting_payment", "under_financing", "pending", "archived"];

// ─── Unified display shape ──────────────────────────────────────────────────────

interface DisplayItem {
  id: string;
  name: string;
  price: number;
  type: ItemType;
  description: string | null;
  images: string[];
  location?: string;
  verified: boolean;
  sellerName: string;
  sellerPhone?: string | null;
  specs: { label: string; value: string }[];
  rating: number;
  stockQuantity: number;      // products only
  available: boolean;         // assets: not in unavailable status
  unitId?: string;            // vehicles: first unit id for inspection scheduling
  rawStatus: string;          // raw backend status
}

function carToDisplay(c: Car): DisplayItem {
  return {
    id: c.id,
    name: `${c.brand} ${c.model} ${c.year}`,
    price: c.price,
    type: "vehicle",
    description: null,
    images: c.images.map((i) => i.image_url),
    verified: true,
    sellerName: "Verified Seller",
    specs: [
      { label: "Year",  value: String(c.year) },
      { label: "Brand", value: c.brand },
      { label: "Model", value: c.model },
      { label: "Units", value: String(c.units?.length ?? 0) },
    ].filter((s) => s.value),
    rating: 4.8,
    stockQuantity: 0,
    available: !UNAVAILABLE_STATUSES.includes(c.status),
    unitId: c.units?.[0]?.id ?? undefined,
    rawStatus: c.status,
  };
}

function propertyToDisplay(p: Property): DisplayItem {
  return {
    id: p.id,
    name: p.title,
    price: p.price,
    type: "real_estate",
    description: p.description ?? null,
    images: p.images.map((i) => i.image_url),
    location: p.location,
    verified: true,
    sellerName: "Verified Agent",
    specs: [
      { label: "Type",     value: p.listing_type },
      { label: "Location", value: p.location },
      { label: "Units",    value: String(p.units?.length ?? 0) },
    ].filter((s) => s.value),
    rating: 4.7,
    stockQuantity: 0,
    available: !UNAVAILABLE_STATUSES.includes(p.status),
    rawStatus: p.status,
  };
}

function productToDisplay(p: Product): DisplayItem {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    type: "product",
    description: p.description ?? null,
    images: p.images?.map((i) => i.image_url) ?? [],
    verified: p.status === "active",
    sellerName: p.seller?.business_name ?? "Seller",
    specs: [
      { label: "Category", value: p.category?.name ?? "" },
      { label: "Stock",    value: String(p.stock_quantity) },
    ].filter((s) => s.value),
    rating: 4.6,
    stockQuantity: p.stock_quantity,
    available: p.stock_quantity > 0,
    rawStatus: p.status,
  };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-gray-50 rounded-xl px-3 py-2 items-center gap-0.5" style={{ minWidth: 90 }}>
      <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</Text>
      <Text className="text-sm font-bold text-gray-900">{value}</Text>
    </View>
  );
}

function Gallery({ images, type }: { images: string[]; type: ItemType }) {
  const [current, setCurrent] = useState(0);
  const bg = type === "vehicle" ? "#fff7ed" : type === "real_estate" ? "#eff6ff" : "#f0fdf4";
  const emoji = type === "vehicle" ? "🚗" : type === "real_estate" ? "🏠" : "📦";

  if (images.length > 0) {
    return (
      <View className="h-72 relative">
        <Image source={{ uri: images[current] }} className="w-full h-full" resizeMode="cover" />
        {images.length > 1 && (
          <View className="absolute bottom-4 self-center flex-row gap-1.5">
            {images.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setCurrent(i)}>
                <View className={`w-2 h-2 rounded-full ${i === current ? "bg-amber-400" : "bg-white/60"}`} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="h-72 items-center justify-center" style={{ backgroundColor: bg }}>
      <Text className="text-6xl">{emoji}</Text>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();

  const { addItem, pendingOrder, isLoading: cartLoading, adding } = useCartStore();

  const [item, setItem] = useState<DisplayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<{ average_rating: number; total_reviews: number } | null>(null);

  const isInCart = item
    ? (pendingOrder?.order_items ?? []).some((ci) => ci.product?.id === item.id)
    : false;
  const isAdding = item ? !!adding[item.id] : false;

  useEffect(() => {
    if (!id) { setError("No item ID provided"); setLoading(false); return; }

    const load = async () => {
      try {
        if (type === "vehicle") {
          setItem(carToDisplay(await productsApi.getCarById(id)));
        } else if (type === "real_estate") {
          setItem(propertyToDisplay(await productsApi.getPropertyById(id)));
        } else {
          const [prod, reviewsRes, statsRes] = await Promise.allSettled([
            productsApi.getById(id),
            reviewsApi.listForProduct(id),
            api.get(`/reviews/product/${id}/stats`).then((r) => r.data?.data),
          ]);
          if (prod.status === "fulfilled") setItem(productToDisplay(prod.value));
          if (reviewsRes.status === "fulfilled") setReviews(reviewsRes.value ?? []);
          if (statsRes.status === "fulfilled") setReviewStats(statsRes.value);
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load listing");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, type]);

  // ── Cart handler (products only) ────────────────────────────────────────────

  const handleAddToCart = async () => {
    if (!item || item.type !== "product") return;
    try {
      await addItem(item.id, 1);
      Alert.alert(
        "Added to Cart ✓",
        `${item.name} has been added to your cart.`,
        [
          { text: "Continue Shopping", style: "cancel" },
          { text: "View Cart", onPress: () => router.push("/(tabs)/cart" as any) },
        ]
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not add item to cart. Please try again.");
    }
  };

  // ── Contact seller ──────────────────────────────────────────────────────────

  const handleContact = () => {
    if (item?.sellerPhone) {
      Linking.openURL(`tel:${item.sellerPhone}`);
    } else {
      Alert.alert("Contact Seller", "Contact details will be shared once your inspection is confirmed.");
    }
  };

  // ── Loading / error ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-3">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-sm text-gray-400">Loading…</Text>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-4 px-8">
        <AlertCircle size={40} color="#9ca3af" />
        <Text className="text-lg font-bold text-gray-900">Not found</Text>
        <Text className="text-sm text-gray-400 text-center">{error ?? "Could not load this listing."}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-amber-400 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isPhysical = item.type === "vehicle" || item.type === "real_estate";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Floating top bar */}
      <View className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center" style={shadow.float}>
          <ArrowLeft size={18} color="#111827" />
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => setLiked(!liked)} className="w-10 h-10 rounded-full bg-white items-center justify-center" style={shadow.float}>
            <Heart size={18} color={liked ? "#ef4444" : "#6b7280"} fill={liked ? "#ef4444" : "transparent"} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center" style={shadow.float}>
            <Share2 size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Gallery images={item.images} type={item.type} />

        <View className="px-5 pt-5 pb-4 gap-4">
          {/* Name + verified */}
          <View className="flex-row items-start justify-between gap-2">
            <Text className="text-2xl font-extrabold text-gray-900 flex-1 leading-tight" numberOfLines={3}>
              {item.name}
            </Text>
            {item.verified && (
              <View className="flex-row items-center gap-1 bg-green-50 px-2 py-1 rounded-lg flex-shrink-0">
                <CheckCircle size={12} color="#16a34a" />
                <Text className="text-green-700 text-[10px] font-bold">Verified</Text>
              </View>
            )}
          </View>

          {/* Price + rating + stock */}
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-2xl font-black text-amber-400">{fmt(item.price)}</Text>
              {/* Stock badge for products */}
              {item.type === "product" && (
                item.stockQuantity > 0
                  ? <Text className="text-xs text-green-600 font-semibold">{item.stockQuantity} in stock</Text>
                  : <Text className="text-xs text-red-500 font-bold">Out of Stock</Text>
              )}
              {/* Availability for physical assets */}
              {isPhysical && !item.available && (
                <View className="flex-row items-center gap-1 bg-red-50 px-2 py-0.5 rounded-md self-start">
                  <AlertCircle size={10} color="#ef4444" />
                  <Text className="text-[10px] font-bold text-red-600 capitalize">
                    {item.rawStatus.replace(/_/g, " ")}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-row items-center gap-1">
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-sm font-bold text-gray-900">{item.rating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Location (properties only) */}
          {item.location && (
            <View className="flex-row items-center gap-1.5">
              <MapPin size={14} color="#9ca3af" />
              <Text className="text-sm text-gray-500">{item.location}</Text>
            </View>
          )}

          <View className="h-px bg-gray-100" />

          {/* Specs */}
          {item.specs.length > 0 && (
            <View>
              <Text className="text-base font-extrabold text-gray-900 mb-3">Specifications</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {item.specs.map((s) => <SpecChip key={s.label} label={s.label} value={s.value} />)}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Description */}
          {item.description && (
            <>
              <View className="h-px bg-gray-100" />
              <View>
                <Text className="text-base font-extrabold text-gray-900 mb-2">Description</Text>
                <Text className="text-sm text-gray-500 leading-relaxed">{item.description}</Text>
              </View>
            </>
          )}

          <View className="h-px bg-gray-100" />

          {/* Free inspection banner (physical assets) */}
          {isPhysical && (
            <View className="bg-amber-50 rounded-2xl p-4 flex-row items-center gap-3" style={{ borderWidth: 1, borderColor: "#fde68a" }}>
              <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                <Shield size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-amber-800">Free Physical Inspection</Text>
                <Text className="text-xs text-amber-600 mt-0.5">
                  We verify every {item.type === "vehicle" ? "vehicle" : "property"} before you commit to buying.
                </Text>
              </View>
            </View>
          )}

          {/* Seller */}
          <View>
            <Text className="text-base font-extrabold text-gray-900 mb-3">
              {item.type === "real_estate" ? "Agent" : "Seller"}
            </Text>
            <TouchableOpacity className="flex-row items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <View className="w-12 h-12 rounded-full bg-indigo-950 items-center justify-center">
                <Text className="text-white font-bold text-base">{item.sellerName.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900">{item.sellerName}</Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <CheckCircle size={10} color="#16a34a" />
                  <Text className="text-xs text-gray-500">
                    {item.type === "real_estate" ? "Verified agent" : "Verified seller"}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Reviews (products only) */}
          {item.type === "product" && (reviews.length > 0 || reviewStats) && (
            <>
              <View className="h-px bg-gray-100" />
              <View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-extrabold text-gray-900">
                    Reviews{reviewStats ? ` (${reviewStats.total_reviews})` : ""}
                  </Text>
                  {reviewStats && (
                    <View className="flex-row items-center gap-1">
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-sm font-bold text-gray-900">
                        {reviewStats.average_rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="gap-3">
                  {reviews.slice(0, 3).map((r) => (
                    <View key={r.id} className="bg-gray-50 rounded-2xl p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                          <View className="w-7 h-7 rounded-full bg-indigo-900 items-center justify-center">
                            <Text className="text-white text-xs font-bold">
                              {(r.user?.name ?? "U").charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text className="text-sm font-bold text-gray-900">{r.user?.name ?? "Customer"}</Text>
                        </View>
                        <View className="flex-row gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={12} color="#f59e0b" fill={s <= r.rating ? "#f59e0b" : "transparent"} />
                          ))}
                        </View>
                      </View>
                      {r.comment && (
                        <Text className="text-sm text-gray-600 leading-relaxed">{r.comment}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Sticky CTA bar ───────────────────────────────────────────────────── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4"
        style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6", ...shadow.lg }}
      >
        {/* Products: Add to Cart */}
        {item.type === "product" && (
          <TouchableOpacity
            onPress={isInCart ? () => router.push("/(tabs)/cart" as any) : handleAddToCart}
            disabled={isAdding || cartLoading || (!isInCart && item.stockQuantity <= 0)}
            className="rounded-2xl py-4 items-center justify-center"
            style={[
              shadow.btn,
              {
                backgroundColor:
                  item.stockQuantity <= 0
                    ? "#e5e7eb"
                    : isInCart
                    ? "#22c55e"
                    : "#f59e0b",
              },
            ]}
          >
            {isAdding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-bold text-base" style={{ color: item.stockQuantity <= 0 ? "#9ca3af" : "#fff" }}>
                {item.stockQuantity <= 0
                  ? "Out of Stock"
                  : isInCart
                  ? "✓ View in Cart"
                  : "Add to Cart"}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Vehicles: Book Inspection + Contact Seller */}
        {item.type === "vehicle" && (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => item.available ? setInspectionModalVisible(true) : null}
              disabled={!item.available}
              className={`flex-1 border-2 rounded-2xl py-4 items-center justify-center ${item.available ? "border-amber-400" : "border-gray-300 bg-gray-50"}`}
              style={item.available ? { shadowColor: "#f59e0b", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 } : undefined}
            >
              <Text className={`text-sm font-bold ${item.available ? "text-amber-500" : "text-gray-400"}`}>
                {item.available ? "Book Inspection" : "Unavailable"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleContact}
              className="flex-1 bg-gray-900 rounded-2xl py-4 items-center justify-center flex-row gap-2"
              style={shadow.md}
            >
              <Phone size={15} color="#fff" />
              <Text className="text-white text-sm font-bold">Contact Seller</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Properties: Schedule Viewing + Chat with Agent */}
        {item.type === "real_estate" && (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => item.available ? setInspectionModalVisible(true) : null}
              disabled={!item.available}
              className={`flex-1 border-2 rounded-2xl py-4 items-center justify-center ${item.available ? "border-amber-400" : "border-gray-300 bg-gray-50"}`}
              style={item.available ? { shadowColor: "#f59e0b", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 } : undefined}
            >
              <Text className={`text-sm font-bold ${item.available ? "text-amber-500" : "text-gray-400"}`}>
                {item.available ? "Schedule Viewing" : "Unavailable"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleContact}
              className="flex-1 bg-gray-900 rounded-2xl py-4 items-center justify-center flex-row gap-2"
              style={shadow.md}
            >
              <MessageCircle size={15} color="#fff" />
              <Text className="text-white text-sm font-bold">Chat with Agent</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Inspection Modal */}
      {item && isPhysical && (
        <InspectionModal
          visible={inspectionModalVisible}
          onClose={() => setInspectionModalVisible(false)}
          assetId={item.id}
          assetType={item.type as "vehicle" | "real_estate"}
          assetTitle={item.name}
          unitId={item.unitId}
        />
      )}
    </SafeAreaView>
  );
}

import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Image, Alert, Linking, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft, Heart, Star, MapPin, ShieldCheck,
  AlertCircle, Truck, RotateCcw, BadgeCheck, ExternalLink,
  Minus, Plus, Calendar, Gauge, Palette, Hash,
  BedDouble, Bath, Ruler, Headphones, Clock,
} from "lucide-react-native";
import MapView, { Marker } from "react-native-maps";
import { fmt } from "@/utils/format";
import { COLORS } from "@/constants/brand";
import { productsApi, reviewsApi, wishlistApi, getApiError } from "@/api";
import type { Car, Property, Product, Review } from "@/api";
import type { ProductCardItem } from "@/components/ProductCard";
import { ProductCard } from "@/components/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { InspectionModal } from "@/components/InspectionModal";

type ItemType = "vehicle" | "real_estate" | "product";

const UNAVAILABLE_STATUSES = ["sold", "awaiting_payment", "under_financing", "pending", "archived"];

const CAR_FEATURES = [
  { Icon: ShieldCheck, label: "Secure Booking" },
  { Icon: Calendar, label: "30-days Money Back" },
  { Icon: Headphones, label: "24/7 support" },
  { Icon: Clock, label: "2-years Warranty" },
];

const PROPERTY_FEATURES = [
  { Icon: ShieldCheck, label: "Secure Viewing" },
  { Icon: Calendar, label: "30-days Money Back" },
  { Icon: Headphones, label: "24/7 support" },
  { Icon: Clock, label: "2-years Warranty" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Unified display shape ──────────────────────────────────────────────────────

interface DisplayItem {
  id: string;
  name: string;
  price: number;
  type: ItemType;
  description: string | null;
  images: string[];
  location?: string;
  categoryLabel?: string;
  verified: boolean;
  stockQuantity: number;
  available: boolean;
  unitId?: string;
  rawStatus: string;
  minDepositPercent: number;
  monthlyAllowed: boolean;
  // vehicle unit
  unitMileage?: number | null;
  unitColor?: string | null;
  unitVin?: string | null;
  year?: number;
  // property
  amenities?: string[];
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  listingType?: string;
}

function carToDisplay(c: Car): DisplayItem {
  const unit = c.units?.[0];
  return {
    id: c.id,
    name: `${c.brand} ${c.model}`,
    price: c.price,
    type: "vehicle",
    description: null,
    images: c.images.map((i) => i.image_url),
    categoryLabel: "Automotive",
    verified: true,
    stockQuantity: 0,
    available: !UNAVAILABLE_STATUSES.includes(c.status),
    unitId: unit?.id ?? undefined,
    rawStatus: c.status,
    minDepositPercent: Number((c as any).min_deposit_percentage ?? 10),
    monthlyAllowed: (c as any).monthly_allowed !== false,
    unitMileage: unit?.mileage ?? null,
    unitColor: unit?.color ?? null,
    unitVin: unit?.vin ?? null,
    year: c.year,
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
    categoryLabel: "Real Estate",
    verified: true,
    stockQuantity: 0,
    available: !UNAVAILABLE_STATUSES.includes(p.status),
    rawStatus: p.status,
    minDepositPercent: Number((p as any).min_deposit_percentage ?? 10),
    monthlyAllowed: (p as any).monthly_allowed !== false,
    amenities: p.amenities ?? [],
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    squareFeet: p.square_feet ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    listingType: p.listing_type,
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
    categoryLabel: p.category?.name ?? "Products",
    verified: p.status === "active",
    stockQuantity: p.stock_quantity,
    available: p.stock_quantity > 0,
    rawStatus: p.status,
    minDepositPercent: 0,
    monthlyAllowed: false,
  };
}

// ─── Shared bits (web Mobile* parity) ───────────────────────────────────────────

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={8}
      className="items-center justify-center bg-white border border-gray-200"
      style={{ width: 36, height: 36, borderRadius: 8 }}
    >
      <ChevronLeft size={16} color="#111827" />
    </TouchableOpacity>
  );
}

function Gallery({ images, selected, onSelect, badge }: {
  images: string[];
  selected: number;
  onSelect: (i: number) => void;
  badge?: string;
}) {
  return (
    <View className="px-4 mt-3">
      <View className="relative w-full rounded-2xl overflow-hidden bg-gray-100" style={{ aspectRatio: 4 / 3 }}>
        {images.length > 0 ? (
          <Image source={{ uri: images[Math.min(selected, images.length - 1)] }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-5xl">🏠</Text>
          </View>
        )}
        {!!badge && (
          <View className="absolute bg-white px-3 py-1.5 rounded-full" style={{ top: 12, left: 12 }}>
            <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 12 }}>{badge}</Text>
          </View>
        )}
      </View>
      {images.length > 1 && (
        <View className="flex-row gap-3 mt-3">
          {images.slice(0, 3).map((uri, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onSelect(i)}
              className="rounded-md overflow-hidden border-2 shrink-0"
              style={{
                width: 62, height: 47,
                borderColor: selected === i ? COLORS.primary : "#e5e7eb",
              }}
            >
              <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="font-grotesk-semibold text-gray-900" style={{ fontSize: 17 }}>
      {children}
    </Text>
  );
}

function StarRow({ average }: { average: number }) {
  return (
    <View className="flex-row items-center gap-1.5 mt-2">
      <View className="flex-row items-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={14}
            color={i < Math.round(average) ? "#facc15" : "#a1a1aa"}
            fill={i < Math.round(average) ? "#facc15" : "transparent"}
          />
        ))}
      </View>
      <Text className="font-manrope text-gray-500" style={{ fontSize: 12 }}>
        {average > 0 ? `${average.toFixed(1)} Star rating` : "No ratings yet"}
      </Text>
    </View>
  );
}

function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <Text className="font-manrope text-gray-500" style={{ fontSize: 12 }}>No reviews yet.</Text>;
  }
  return (
    <View className="gap-4">
      {reviews.slice(0, 2).map((r) => (
        <View key={r.id}>
          <View className="flex-row items-center gap-2 mb-1 flex-wrap">
            <View className="flex-row items-center gap-0.5">
              <Star size={14} color="#facc15" fill="#facc15" />
              <Text className="font-grotesk-semibold text-gray-900" style={{ fontSize: 12 }}>
                {r.rating.toFixed(1)}
              </Text>
            </View>
            <Text className="font-grotesk-semibold text-gray-900" style={{ fontSize: 12 }}>
              {r.user?.name ?? "Customer"}
            </Text>
            <Text className="font-manrope text-gray-500" style={{ fontSize: 12 }}>
              {r.created_at ? timeAgo(r.created_at) : ""}
            </Text>
          </View>
          {!!r.comment && (
            <Text className="font-manrope text-gray-500 leading-relaxed" style={{ fontSize: 12 }}>
              {r.comment}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function CategoryEyebrow({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-1 mb-1.5">
      <Text className="font-manrope text-gray-500" style={{ fontSize: 14 }}>{label}</Text>
      <BadgeCheck size={14} color="#16a34a" fill="#16a34a" stroke="#fff" />
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
  const [qty, setQty] = useState(1);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<{ average_rating: number; total_reviews: number } | null>(null);
  const [related, setRelated] = useState<ProductCardItem[]>([]);

  const isInCart = item
    ? (pendingOrder?.order_items ?? []).some((ci) => ci.product?.id === item.id)
    : false;
  const isAdding = item ? !!adding[item.id] : false;

  useEffect(() => {
    if (!id) { setError("No item ID provided"); setLoading(false); return; }

    const load = async () => {
      try {
        if (type === "vehicle") {
          const [car, reviewsRes, statsRes, relRes] = await Promise.allSettled([
            productsApi.getCarById(id),
            reviewsApi.listForCar(id),
            reviewsApi.statsForCar(id),
            productsApi.listCars({ limit: 8 }),
          ]);
          if (car.status === "fulfilled") setItem(carToDisplay(car.value));
          if (reviewsRes.status === "fulfilled") setReviews(reviewsRes.value.data ?? []);
          if (statsRes.status === "fulfilled") setReviewStats(statsRes.value);
          if (relRes.status === "fulfilled") {
            setRelated(relRes.value.data.filter((c) => c.id !== id).slice(0, 6).map((c) => ({
              id: c.id, name: `${c.brand} ${c.model}`, price: fmt(c.price),
              type: "vehicle" as const, imageUrl: c.images?.[0]?.image_url ?? null,
              tag: String(c.year),
              subtitle: c.units?.[0]?.mileage != null ? `${Number(c.units[0].mileage).toLocaleString()}KM` : undefined,
            })));
          }
        } else if (type === "real_estate") {
          const [property, reviewsRes, statsRes, relRes] = await Promise.allSettled([
            productsApi.getPropertyById(id),
            reviewsApi.listForProperty(id),
            reviewsApi.statsForProperty(id),
            productsApi.listProperties({ limit: 8 }),
          ]);
          if (property.status === "fulfilled") setItem(propertyToDisplay(property.value));
          if (reviewsRes.status === "fulfilled") setReviews(reviewsRes.value.data ?? []);
          if (statsRes.status === "fulfilled") setReviewStats(statsRes.value);
          if (relRes.status === "fulfilled") {
            setRelated(relRes.value.data.filter((p) => p.id !== id).slice(0, 6).map((p) => ({
              id: p.id, name: p.title, price: fmt(p.price),
              type: "real_estate" as const, imageUrl: p.images?.[0]?.image_url ?? null,
              tag: p.listing_type === "rental" ? "For Rent" : "For Sale",
              subtitle: p.location,
            })));
          }
        } else {
          const [prod, reviewsRes, statsRes, relRes] = await Promise.allSettled([
            productsApi.getById(id),
            reviewsApi.listForProduct(id),
            reviewsApi.statsForProduct(id),
            productsApi.list({ limit: 8 }),
          ]);
          if (prod.status === "fulfilled") setItem(productToDisplay(prod.value));
          if (reviewsRes.status === "fulfilled") setReviews(reviewsRes.value.data ?? []);
          if (statsRes.status === "fulfilled") setReviewStats(statsRes.value);
          if (relRes.status === "fulfilled") {
            setRelated(relRes.value.data.filter((p) => p.id !== id).slice(0, 6).map((p) => ({
              id: p.id, name: p.name, price: fmt(p.price),
              type: "product" as const, imageUrl: p.images?.[0]?.image_url ?? null,
              subtitle: p.category?.name,
            })));
          }
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load listing");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, type]);

  useEffect(() => {
    if (type !== "product" || !id) return;
    wishlistApi.listAll().then((items) => {
      setLiked(items.some((w) => w.product_id === id));
    }).catch(() => {});
  }, [id, type]);

  const handleAddToCart = async (goCheckout = false) => {
    if (!item || item.type !== "product") return;
    try {
      await addItem(item.id, qty);
      if (goCheckout) {
        router.push("/checkout" as any);
        return;
      }
      Alert.alert("Added to Cart", `${item.name} has been added to your cart.`, [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Cart", onPress: () => router.push("/(tabs)/cart" as any) },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not add item to cart. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      await Share.share({ message: `${item.name} — ${fmt(item.price)} on LEL Store`, title: item.name });
    } catch { /* dismissed */ }
  };

  const toggleWishlist = async () => {
    if (!item || item.type !== "product") return;
    const next = !liked;
    setLiked(next);
    try {
      if (next) await wishlistApi.add(item.id);
      else await wishlistApi.remove(item.id);
    } catch (e) {
      setLiked(!next);
      Alert.alert("Wishlist", getApiError(e));
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-3">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="font-manrope text-gray-400" style={{ fontSize: 14 }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center gap-4 px-8">
        <AlertCircle size={40} color="#9ca3af" />
        <Text className="font-grotesk-extrabold text-gray-900" style={{ fontSize: 18 }}>Not found</Text>
        <Text className="font-manrope text-gray-400 text-center" style={{ fontSize: 14 }}>{error ?? "Could not load this listing."}</Text>
        <TouchableOpacity onPress={() => router.back()} className="px-6 py-3 rounded-xl" style={{ backgroundColor: COLORS.primary }}>
          <Text className="font-grotesk-bold text-white" style={{ fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const avgRating = reviewStats?.average_rating ?? 0;
  const totalReviews = reviewStats?.total_reviews ?? reviews.length;
  const minDepositAmount = Math.round(item.price * (item.minDepositPercent / 100));

  // ═══════════════════════ VEHICLE (web CarDetails mobile) ═══════════════════════
  if (item.type === "vehicle") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="px-4 pt-4">
          <BackButton onPress={() => router.back()} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <Gallery images={item.images} selected={photoIdx} onSelect={setPhotoIdx} />

          <View className="px-4 mt-5">
            <CategoryEyebrow label="Automotive" />
            <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 20 }}>{item.name}</Text>
            <Text className="font-grotesk-bold mt-2" style={{ fontSize: 24, color: COLORS.primary }}>
              {fmt(item.price)}
            </Text>
            <Text className="font-manrope text-gray-500 mt-1" style={{ fontSize: 12 }}>
              Min. Deposit ({item.minDepositPercent}%):{" "}
              <Text className="font-grotesk-semibold text-gray-900">{fmt(minDepositAmount)}</Text>
            </Text>
            <StarRow average={avgRating} />
          </View>

          {/* Specs */}
          <View className="mt-4 px-4 py-4 border-t border-b border-gray-200 flex-row flex-wrap" style={{ rowGap: 12 }}>
            {[
              { Icon: Calendar, label: "Year:", value: String(item.year ?? "N/A") },
              { Icon: Gauge, label: "Mileage:", value: item.unitMileage != null ? `${Number(item.unitMileage).toLocaleString()} km` : "N/A" },
              { Icon: Palette, label: "Color:", value: item.unitColor || "N/A" },
              { Icon: Hash, label: "VIN:", value: item.unitVin || "N/A" },
            ].map(({ Icon, label, value }) => (
              <View key={label} className="flex-row items-center gap-2" style={{ width: "50%" }}>
                <Icon size={16} color="#71717a" />
                <Text className="font-manrope text-gray-500" style={{ fontSize: 14 }}>{label}</Text>
                <Text className="font-grotesk-medium text-gray-900" style={{ fontSize: 14 }} numberOfLines={1}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          {/* Overview */}
          <View className="px-4 py-4 border-b border-gray-200">
            <View className="mb-2"><SectionTitle>Overview</SectionTitle></View>
            <Text className="font-manrope text-gray-500 leading-relaxed" style={{ fontSize: 14 }}>
              Experience reliable, verified vehicle ownership with the {item.year} {item.name} — every
              listing on LEL Store is physically inspected so you can buy with total confidence.
            </Text>
          </View>

          {/* Why buy with us */}
          <View className="px-4 py-4 border-b border-gray-200">
            <View className="mb-3"><SectionTitle>Why buy with us</SectionTitle></View>
            <View className="flex-row flex-wrap" style={{ rowGap: 12 }}>
              {CAR_FEATURES.map(({ Icon, label }) => (
                <View key={label} className="flex-row items-center gap-2" style={{ width: "50%" }}>
                  <Icon size={16} color="#18181b" strokeWidth={1.75} />
                  <Text className="font-grotesk-medium text-gray-900" style={{ fontSize: 14 }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews */}
          <View className="px-4 py-5 border-b border-gray-200">
            <View className="mb-4"><SectionTitle>Reviews ({totalReviews})</SectionTitle></View>
            <ReviewList reviews={reviews} />
          </View>

          {/* Related */}
          {related.length > 0 && (
            <View className="mt-5 px-4">
              <View className="mb-3"><SectionTitle>You may also like.</SectionTitle></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {related.map((rel) => (
                  <ProductCard
                    key={rel.id}
                    item={rel}
                    variant="rail"
                    width={150}
                    onPress={() => router.push(`/product-details?id=${rel.id}&type=${rel.type}` as any)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Sticky actions */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 flex-row gap-3" style={{ paddingBottom: 32 }}>
          <TouchableOpacity
            onPress={() => item.available && router.push(`/asset-purchase?id=${item.id}&type=automotive` as any)}
            disabled={!item.available}
            className="flex-1 items-center justify-center border border-gray-200"
            style={{ height: 48, borderRadius: 999, opacity: item.available ? 1 : 0.6 }}
          >
            <Text className="font-grotesk-semibold text-gray-900" style={{ fontSize: 14 }}>
              {item.available ? "Buy Now" : "Currently Unavailable"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => item.available && setInspectionModalVisible(true)}
            disabled={!item.available}
            className="flex-1 items-center justify-center"
            style={{ height: 48, borderRadius: 999, backgroundColor: COLORS.primary, opacity: item.available ? 1 : 0.6 }}
          >
            <Text className="font-grotesk-semibold text-white" style={{ fontSize: 14 }}>Book Inspection</Text>
          </TouchableOpacity>
        </View>

        <InspectionModal
          visible={inspectionModalVisible}
          onClose={() => setInspectionModalVisible(false)}
          assetId={item.id}
          assetType="vehicle"
          assetTitle={item.name}
          unitId={item.unitId}
        />
      </SafeAreaView>
    );
  }

  // ═══════════════════════ PROPERTY (web PropertyDetails mobile) ═══════════════════════
  if (item.type === "real_estate") {
    const listingLabel = item.listingType === "rental" ? "For Rent" : item.listingType === "professional" ? "Professional" : "For Sale";
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="px-4 pt-4">
          <BackButton onPress={() => router.back()} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <Gallery images={item.images} selected={photoIdx} onSelect={setPhotoIdx} badge={listingLabel} />

          <View className="px-4 mt-5">
            <CategoryEyebrow label="Real Estate" />
            <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 20 }}>{item.name}</Text>
            <Text className="font-grotesk-bold mt-2" style={{ fontSize: 24, color: COLORS.primary }}>
              {fmt(item.price)}
            </Text>
            {!!item.location && (
              <View className="flex-row items-center gap-1.5 mt-2">
                <MapPin size={16} color="#71717a" />
                <Text className="font-manrope text-gray-500" style={{ fontSize: 14 }}>{item.location}</Text>
              </View>
            )}
          </View>

          {/* Facts */}
          <View className="mt-4 px-4 py-4 border-t border-b border-gray-200 flex-row items-center gap-5">
            {item.bedrooms != null && (
              <View className="flex-row items-center gap-1.5">
                <BedDouble size={16} color="#71717a" />
                <Text className="font-manrope text-gray-900" style={{ fontSize: 14 }}>{item.bedrooms} bedrooms</Text>
              </View>
            )}
            {item.bathrooms != null && (
              <View className="flex-row items-center gap-1.5">
                <Bath size={16} color="#71717a" />
                <Text className="font-manrope text-gray-900" style={{ fontSize: 14 }}>{item.bathrooms} baths</Text>
              </View>
            )}
            {item.squareFeet != null && (
              <View className="flex-row items-center gap-1.5">
                <Ruler size={16} color="#71717a" />
                <Text className="font-manrope text-gray-900" style={{ fontSize: 14 }}>{item.squareFeet} sqm</Text>
              </View>
            )}
          </View>

          {/* About */}
          <View className="px-4 py-4 border-b border-gray-200">
            <View className="mb-2"><SectionTitle>About this home</SectionTitle></View>
            <Text className="font-manrope text-gray-500 leading-relaxed" style={{ fontSize: 14 }}>
              {item.description || `A verified ${item.location ?? ""} listing on LEL Store — every property is physically inspected so you can buy or view with total confidence.`}
            </Text>
          </View>

          {/* Payment */}
          <View className="px-4 py-4 border-b border-gray-200">
            <View className="mb-3"><SectionTitle>Payment</SectionTitle></View>
            <View className="gap-2.5">
              <View className="flex-row justify-between">
                <Text className="font-manrope text-gray-500" style={{ fontSize: 14 }}>Price</Text>
                <Text className="font-grotesk-medium text-gray-900" style={{ fontSize: 14 }}>{fmt(item.price)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-manrope text-gray-500" style={{ fontSize: 14 }}>Min. deposit ({item.minDepositPercent}%)</Text>
                <Text className="font-grotesk-medium text-gray-900" style={{ fontSize: 14 }}>{fmt(minDepositAmount)}</Text>
              </View>
            </View>
            {item.monthlyAllowed && (
              <View className="mt-3 rounded-lg px-3 py-2.5 border" style={{ backgroundColor: "#FFF5F2", borderColor: "#FFD9C7" }}>
                <Text className="font-manrope text-gray-900" style={{ fontSize: 12 }}>
                  Monthly payment plans are available on this property — pay the deposit now and spread the rest.
                </Text>
              </View>
            )}
          </View>

          {/* Amenities */}
          {(item.amenities?.length ?? 0) > 0 && (
            <View className="px-4 py-4 border-b border-gray-200">
              <View className="mb-3"><SectionTitle>Amenities</SectionTitle></View>
              <View className="flex-row flex-wrap" style={{ rowGap: 10 }}>
                {item.amenities!.map((a) => (
                  <View key={a} className="flex-row items-center gap-2" style={{ width: "50%" }}>
                    <View className="rounded-full bg-green-600" style={{ width: 6, height: 6 }} />
                    <Text className="font-manrope text-gray-900" style={{ fontSize: 14 }}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Location */}
          {item.latitude != null && item.longitude != null && (
            <View className="px-4 py-4 border-b border-gray-200">
              <View className="mb-3"><SectionTitle>Location</SectionTitle></View>
              <View className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 192 }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: item.latitude, longitude: item.longitude,
                    latitudeDelta: 0.02, longitudeDelta: 0.02,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker coordinate={{ latitude: item.latitude, longitude: item.longitude }} title={item.name} />
                </MapView>
              </View>
              <TouchableOpacity
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`)}
                className="flex-row items-center gap-1 mt-2"
              >
                <Text className="font-grotesk-semibold" style={{ fontSize: 12, color: COLORS.primary }}>Open in Maps</Text>
                <ExternalLink size={12} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Reviews */}
          <View className="px-4 py-5 border-b border-gray-200">
            <View className="mb-4"><SectionTitle>Reviews ({totalReviews})</SectionTitle></View>
            <ReviewList reviews={reviews} />
          </View>

          {/* Related */}
          {related.length > 0 && (
            <View className="mt-5 px-4">
              <View className="mb-3"><SectionTitle>You may also like.</SectionTitle></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {related.map((rel) => (
                  <ProductCard
                    key={rel.id}
                    item={rel}
                    variant="rail"
                    width={150}
                    onPress={() => router.push(`/product-details?id=${rel.id}&type=${rel.type}` as any)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Sticky actions */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 flex-row gap-3" style={{ paddingBottom: 32 }}>
          <TouchableOpacity
            onPress={() => item.available && router.push(`/asset-purchase?id=${item.id}&type=property` as any)}
            disabled={!item.available}
            className="flex-1 items-center justify-center border border-gray-200"
            style={{ height: 48, borderRadius: 999, opacity: item.available ? 1 : 0.6 }}
          >
            <Text className="font-grotesk-semibold text-gray-900" style={{ fontSize: 14 }}>
              {item.monthlyAllowed ? "Pay Monthly" : "Buy Now"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => item.available && setInspectionModalVisible(true)}
            disabled={!item.available}
            className="flex-1 items-center justify-center"
            style={{ height: 48, borderRadius: 999, backgroundColor: COLORS.primary, opacity: item.available ? 1 : 0.6 }}
          >
            <Text className="font-grotesk-semibold text-white" style={{ fontSize: 14 }}>Book Inspection</Text>
          </TouchableOpacity>
        </View>

        <InspectionModal
          visible={inspectionModalVisible}
          onClose={() => setInspectionModalVisible(false)}
          assetId={item.id}
          assetType="real_estate"
          assetTitle={item.name}
        />
      </SafeAreaView>
    );
  }

  // ═══════════════════════ PRODUCT (unchanged mockup layout) ═══════════════════════
  const inStock = item.stockQuantity > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <View className="px-5 pt-3 pb-1">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="self-start p-1 -ml-1">
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <View className="px-5">
          <View className="rounded-2xl overflow-hidden bg-gray-100" style={{ height: 300 }}>
            {item.images.length > 0 ? (
              <Image source={{ uri: item.images[Math.min(photoIdx, item.images.length - 1)] }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="w-full h-full items-center justify-center bg-gray-50">
                <Text className="text-5xl">📦</Text>
              </View>
            )}
          </View>
          {item.images.length > 1 && (
            <View className="flex-row gap-2 mt-2.5">
              {item.images.slice(0, 4).map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setPhotoIdx(i)}
                  className="rounded-lg overflow-hidden border-2"
                  style={{ width: 56, height: 56, borderColor: photoIdx === i ? COLORS.primary : "#f3f4f6" }}
                >
                  <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className="px-5 pt-4 gap-4">
          {!!item.categoryLabel && (
            <View className="flex-row items-center gap-1">
              <Text className="font-manrope text-gray-400" style={{ fontSize: 14 }}>{item.categoryLabel}</Text>
              {item.verified && <BadgeCheck size={14} color="#16a34a" fill="#16a34a" stroke="#fff" />}
            </View>
          )}
          <View className="flex-row items-start justify-between gap-3">
            <Text className="font-grotesk-extrabold text-gray-900 flex-1 leading-snug" style={{ fontSize: 20 }} numberOfLines={3}>
              {item.name}
            </Text>
            {totalReviews > 0 && (
              <View className="items-end">
                <View className="flex-row items-center gap-1">
                  <Star size={13} color="#facc15" fill="#facc15" />
                  <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 12 }}>
                    {avgRating.toFixed(1)}
                  </Text>
                  <Text className="font-manrope text-gray-400" style={{ fontSize: 12 }}>({totalReviews})</Text>
                </View>
                {inStock && (
                  <Text className="font-grotesk-semibold mt-0.5" style={{ fontSize: 11, color: COLORS.success }}>In Stock</Text>
                )}
              </View>
            )}
          </View>

          <Text className="font-grotesk-extrabold" style={{ fontSize: 24, color: COLORS.primary }}>
            {fmt(item.price)}
          </Text>

          <View className="h-px bg-gray-100" />

          <View className="flex-row items-center gap-6">
            <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 14 }}>Quantity</Text>
            <View className="flex-row items-center rounded-full border border-gray-200 px-1 py-1 gap-4">
              <TouchableOpacity onPress={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 items-center justify-center">
                <Minus size={14} color="#374151" />
              </TouchableOpacity>
              <Text className="font-grotesk-bold text-gray-900" style={{ minWidth: 20, textAlign: "center", fontSize: 14 }}>
                {String(qty).padStart(2, "0")}
              </Text>
              <TouchableOpacity
                onPress={() => setQty((q) => Math.min(item.stockQuantity || 99, q + 1))}
                className="w-7 h-7 items-center justify-center"
              >
                <Plus size={14} color="#374151" />
              </TouchableOpacity>
            </View>
            {!inStock && <Text className="font-grotesk-bold text-red-500" style={{ fontSize: 12 }}>Out of Stock</Text>}
          </View>
          <View className="h-px bg-gray-100" />

          {!!item.description && (
            <>
              <View>
                <Text className="font-grotesk-extrabold text-gray-900 mb-1.5" style={{ fontSize: 14 }}>Description</Text>
                <Text className="font-manrope text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>{item.description}</Text>
              </View>
              <View className="h-px bg-gray-100" />
            </>
          )}

          <View className="gap-4">
            <View className="flex-row gap-3">
              <Truck size={18} color="#111827" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 13 }}>Delivery — calculated at checkout</Text>
                <Text className="font-manrope text-gray-400 mt-0.5" style={{ fontSize: 12 }}>Same-day dispatch for Lagos orders placed before noon.</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <ShieldCheck size={18} color="#111827" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 13 }}>Sold and fulfilled by Lel Store</Text>
                <Text className="font-manrope text-gray-400 mt-0.5" style={{ fontSize: 12 }}>Every item is checked before dispatch.</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <RotateCcw size={18} color="#111827" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 13 }}>7-day return window</Text>
                <Text className="font-manrope text-gray-400 mt-0.5" style={{ fontSize: 12 }}>Unused items in original packaging.</Text>
              </View>
            </View>
          </View>
          <View className="h-px bg-gray-100" />

          {(reviews.length > 0 || totalReviews > 0) && (
            <>
              <View>
                <TouchableOpacity
                  onPress={() => router.push("/my-reviews" as any)}
                  className="flex-row items-center justify-between mb-3"
                >
                  <Text className="font-grotesk-extrabold text-gray-900" style={{ fontSize: 14 }}>Reviews ({totalReviews})</Text>
                  <Text className="text-gray-400 text-base">›</Text>
                </TouchableOpacity>
                <View className="gap-4">
                  {reviews.slice(0, 2).map((r) => (
                    <View key={r.id}>
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Star size={12} color="#facc15" fill="#facc15" />
                        <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 12 }}>{r.rating.toFixed(1)}</Text>
                        <Text className="font-grotesk-bold text-gray-900 ml-1" style={{ fontSize: 12 }}>{r.user?.name ?? "Customer"}</Text>
                      </View>
                      {!!r.comment && (
                        <Text className="font-manrope text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>{r.comment}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
              <View className="h-px bg-gray-100" />
            </>
          )}

          {related.length > 0 && (
            <View>
              <Text className="font-grotesk-extrabold text-gray-900 mb-3" style={{ fontSize: 16 }}>You may also like.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {related.map((rel) => (
                  <ProductCard
                    key={rel.id}
                    item={rel}
                    variant="rail"
                    width={150}
                    onPress={() => router.push(`/product-details?id=${rel.id}&type=${rel.type}` as any)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-3 border-t border-gray-100">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={toggleWishlist}
            className="rounded-xl border border-gray-200 items-center justify-center"
            style={{ width: 52 }}
          >
            <Heart size={20} color={liked ? COLORS.danger : "#374151"} fill={liked ? COLORS.danger : "transparent"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (isInCart ? router.push("/(tabs)/cart" as any) : handleAddToCart(false))}
            disabled={isAdding || cartLoading || (!isInCart && !inStock)}
            className="flex-1 rounded-xl border border-gray-300 items-center justify-center py-4"
          >
            {isAdding ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 14 }}>
                {!inStock ? "Out of Stock" : isInCart ? "View in Cart" : "Add to cart"}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (isInCart ? router.push("/checkout" as any) : handleAddToCart(true))}
            disabled={isAdding || !inStock}
            className="flex-1 rounded-xl items-center justify-center py-4"
            style={{ backgroundColor: COLORS.primary, opacity: !inStock ? 0.5 : 1 }}
          >
            <Text className="font-grotesk-bold text-white" style={{ fontSize: 14 }}>Buy now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

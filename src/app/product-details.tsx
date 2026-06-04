import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Heart, Share2, Star, MapPin, Shield, CheckCircle, Car, Home, Tag, ChevronRight } from "lucide-react-native";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProductType = "vehicle" | "real_estate" | "product";

interface Product {
  id: string;
  name: string;
  price: number;
  type: ProductType;
  tag: string;
  location: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  description: string;
  specs: { label: string; value: string }[];
  seller: { name: string; verified: boolean; rating: number };
}

const PRODUCT: Product = {
  id: "1",
  name: "Toyota Camry 2022",
  price: 18500000,
  type: "vehicle",
  tag: "Verified",
  location: "Victoria Island, Lagos",
  rating: 4.8,
  reviewCount: 43,
  verified: true,
  description:
    "A well-maintained 2022 Toyota Camry SE in excellent condition. Full service history, single owner, never involved in any accident. Full AC, reverse camera, leather seats, and all factory features intact.",
  specs: [
    { label: "Year", value: "2022" },
    { label: "Mileage", value: "18,400 km" },
    { label: "Fuel", value: "Petrol" },
    { label: "Transmission", value: "Automatic" },
    { label: "Condition", value: "Used" },
    { label: "Color", value: "Pearl White" },
  ],
  seller: { name: "Premium Auto Lagos", verified: true, rating: 4.9 },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getProductIcon(type: ProductType) {
  return type === "vehicle" ? Car : type === "real_estate" ? Home : Tag;
}

function getIconBg(type: ProductType) {
  return type === "vehicle" ? "#fff7ed" : type === "real_estate" ? "#f0f9ff" : "#fefce8";
}

function getIconColor(type: ProductType) {
  return type === "vehicle" ? "#ea580c" : type === "real_estate" ? "#0284c7" : "#ca8a04";
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CtaButtons({ type, onBookInspection, onBuyNow }: { type: ProductType; onBookInspection: () => void; onBuyNow: () => void }) {
  const isPhysical = type === "vehicle" || type === "real_estate";
  if (isPhysical) {
    return (
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onBookInspection}
          className="flex-1 border-2 border-amber-400 rounded-2xl py-4 items-center justify-center"
          style={{ shadowColor: "#f59e0b", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }}
        >
          <Text className="text-amber-500 text-sm font-bold">Book Inspection</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBuyNow} className="flex-1 bg-amber-400 rounded-2xl py-4 items-center justify-center" style={shadow.btn}>
          <Text className="text-white text-sm font-bold">Buy Now</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity onPress={onBuyNow} className="bg-amber-400 rounded-2xl py-4 items-center justify-center" style={shadow.btn}>
      <Text className="text-white text-base font-bold">Buy Now</Text>
    </TouchableOpacity>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-gray-50 rounded-xl px-3 py-2 items-center gap-0.5" style={{ minWidth: 90 }}>
      <Text className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</Text>
      <Text className="text-sm font-bold text-gray-900">{value}</Text>
    </View>
  );
}

function GalleryPlaceholder({ type }: { type: ProductType }) {
  const Icon = getProductIcon(type);
  return (
    <View className="h-72 items-center justify-center" style={{ backgroundColor: getIconBg(type) }}>
      <Icon size={96} color={getIconColor(type)} strokeWidth={1} />
      <View className="absolute bottom-4 flex-row gap-1.5">
        <View className="w-2 h-2 rounded-full bg-amber-400" />
        {[1, 2, 3].map((i) => <View key={i} className="w-2 h-2 rounded-full bg-white/60" />)}
      </View>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function ProductDetailsScreen() {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const product = PRODUCT;

  const handleBookInspection = () => {
    // TODO: pass real asset id when API-connected
    router.push("/inspection-details?id=INSP-001");
  };

  const handleBuyNow = () => {
    router.push("/checkout");
  };

  const handleShare = async () => {
    // TODO: use expo-sharing when available
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* ── Floating Top Bar ── */}
      <View className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-5 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center" style={shadow.float}>
          <ArrowLeft size={18} color="#111827" />
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity onPress={() => setLiked(!liked)} className="w-10 h-10 rounded-full bg-white items-center justify-center" style={shadow.float}>
            <Heart size={18} color={liked ? "#ef4444" : "#6b7280"} fill={liked ? "#ef4444" : "transparent"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} className="w-10 h-10 rounded-full bg-white items-center justify-center" style={shadow.float}>
            <Share2 size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <GalleryPlaceholder type={product.type} />

        <View className="px-5 pt-5 pb-4 gap-4">
          {/* Name + Tag */}
          <View className="flex-row items-start justify-between gap-2">
            <Text className="text-2xl font-extrabold text-gray-900 flex-1 leading-tight" numberOfLines={2}>
              {product.name}
            </Text>
            {product.verified && (
              <View className="flex-row items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
                <CheckCircle size={12} color="#16a34a" />
                <Text className="text-green-700 text-[10px] font-bold">Verified</Text>
              </View>
            )}
          </View>

          {/* Price + Rating */}
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-black text-amber-400">{fmt(product.price)}</Text>
            <View className="flex-row items-center gap-1">
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-sm font-bold text-gray-900">{product.rating}</Text>
              <Text className="text-xs text-gray-400">({product.reviewCount})</Text>
            </View>
          </View>

          {/* Location */}
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color="#9ca3af" />
            <Text className="text-sm text-gray-500">{product.location}</Text>
          </View>

          <View className="h-px bg-gray-100" />

          {/* Specs */}
          {product.specs.length > 0 && (
            <View>
              <Text className="text-base font-extrabold text-gray-900 mb-3">Specifications</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {product.specs.map((s, i) => <SpecChip key={i} label={s.label} value={s.value} />)}
                </View>
              </ScrollView>
            </View>
          )}

          <View className="h-px bg-gray-100" />

          {/* Description */}
          <View>
            <Text className="text-base font-extrabold text-gray-900 mb-2">Description</Text>
            <Text className="text-sm text-gray-500 leading-relaxed">{product.description}</Text>
          </View>

          <View className="h-px bg-gray-100" />

          {/* Inspection Banner */}
          {(product.type === "vehicle" || product.type === "real_estate") && (
            <View className="bg-amber-50 rounded-2xl p-4 flex-row items-center gap-3" style={{ borderWidth: 1, borderColor: "#fde68a" }}>
              <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                <Shield size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-amber-800">Free Physical Inspection</Text>
                <Text className="text-xs text-amber-600 mt-0.5">
                  We verify every {product.type === "vehicle" ? "vehicle" : "property"} before you commit to buying.
                </Text>
              </View>
            </View>
          )}

          {/* Seller */}
          <View>
            <Text className="text-base font-extrabold text-gray-900 mb-3">Seller</Text>
            <TouchableOpacity onPress={() => {}} className="flex-row items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <View className="w-12 h-12 rounded-full bg-indigo-950 items-center justify-center">
                <Text className="text-white font-bold text-base">{product.seller.name[0]}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm font-bold text-gray-900">{product.seller.name}</Text>
                  {product.seller.verified && <CheckCircle size={12} color="#16a34a" />}
                </View>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <Star size={11} color="#f59e0b" fill="#f59e0b" />
                  <Text className="text-xs text-gray-500">{product.seller.rating} seller rating</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Sticky CTA Bar ── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-8 pt-4"
        style={{ borderTopWidth: 1, borderTopColor: "#f3f4f6", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 10 }}
      >
        <CtaButtons type={product.type} onBookInspection={handleBookInspection} onBuyNow={handleBuyNow} />
      </View>
    </SafeAreaView>
  );
}

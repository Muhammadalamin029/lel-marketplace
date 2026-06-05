import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Heart, Car, Home, Tag } from "lucide-react-native";
import { shadow } from "@/constants/shadows";

export type ProductType = "vehicle" | "real_estate" | "product";

// ── Per-type visual config ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ProductType, { bg: string; color: string; Icon: any; badge: string }> = {
  vehicle:     { bg: "#fff7ed", color: "#ea580c", Icon: Car,  badge: "Free Inspection" },
  real_estate: { bg: "#eff6ff", color: "#3b82f6", Icon: Home, badge: "Free Inspection" },
  product:     { bg: "#f0fdf4", color: "#22c55e", Icon: Tag,  badge: "" },
};

export interface ProductCardItem {
  id: string;
  name: string;
  price: string;             // pre-formatted, e.g. "₦18,500,000"
  type: ProductType;
  imageUrl?: string | null;
  tag?: string;              // optional override badge (e.g. "Verified", "Hot Deal")
  tagColor?: string;
}

interface ProductCardProps {
  item: ProductCardItem;
  onPress: () => void;
  /** "vertical" = compact tile, "horizontal" = full-width row card */
  variant?: "vertical" | "horizontal";
  onWishlist?: (id: string, liked: boolean) => void;
}

export function ProductCard({ item, onPress, variant = "vertical", onWishlist }: ProductCardProps) {
  const [liked, setLiked] = useState(false);

  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.product;
  const badgeText = item.tag ?? cfg.badge;
  const badgeColor = item.tagColor ?? cfg.color;

  const handleWishlist = () => {
    const next = !liked;
    setLiked(next);
    onWishlist?.(item.id, next);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`bg-white rounded-2xl overflow-hidden border border-gray-100 ${variant === "horizontal" ? "flex-row" : ""}`}
      style={[shadow.md, variant === "vertical" ? { width: 160 } : { width: "100%" }]}
    >
      {/* ── Thumbnail ── */}
      <View className={`relative ${variant === "horizontal" ? "w-32 h-32" : "h-28"}`}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center" style={{ backgroundColor: cfg.bg }}>
            <cfg.Icon size={44} color={cfg.color} strokeWidth={1.5} />
          </View>
        )}

        {/* Wishlist button */}
        <TouchableOpacity
          onPress={handleWishlist}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5"
          style={shadow.sm}
        >
          <Heart
            size={13}
            color={liked ? "#ef4444" : "#d1d5db"}
            fill={liked ? "#ef4444" : "transparent"}
          />
        </TouchableOpacity>

        {/* Badge */}
        {!!badgeText && (
          <View
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: badgeColor }}
          >
            <Text className="text-white text-[10px] font-bold">{badgeText}</Text>
          </View>
        )}
      </View>

      {/* ── Info ── */}
      <View className={`p-3 gap-1 ${variant === "horizontal" ? "flex-1 justify-center" : ""}`}>
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>{item.name}</Text>
        <Text className="text-sm font-bold text-amber-400" numberOfLines={1}>{item.price}</Text>
        {(item.type === "vehicle" || item.type === "real_estate") && (
          <Text className="text-[11px] text-green-600 font-medium">Free inspection</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

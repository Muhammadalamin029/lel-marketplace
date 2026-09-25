import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Heart, Car, Home, Tag, BadgeCheck, Gauge, MapPin } from "lucide-react-native";
import { COLORS } from "@/constants/brand";

export type ProductType = "vehicle" | "real_estate" | "product";

// ── Per-type visual config (mirrors web Mobile*Card fallbacks) ────────────────

const TYPE_CONFIG: Record<ProductType, { bg: string; color: string; Icon: any }> = {
  vehicle:     { bg: "#f4f4f5", color: "#a1a1aa", Icon: Car  },
  real_estate: { bg: "#f4f4f5", color: "#a1a1aa", Icon: Home },
  product:     { bg: "#f4f4f5", color: "#a1a1aa", Icon: Tag  },
};

export interface ProductCardItem {
  id: string;
  name: string;
  price: string;             // pre-formatted, e.g. "₦18,500,000"
  type: ProductType;
  imageUrl?: string | null;
  /** on-image top-left pill badge (web parity: year for cars, For Sale/Rent) */
  tag?: string;
  /** gray meta line under the name (category / mileage / location) */
  subtitle?: string;
  liked?: boolean;
}

interface ProductCardProps {
  item: ProductCardItem;
  onPress: () => void;
  /** "vertical" = 2-col grid tile, "horizontal" = full-width row, "rail" = fixed-width rail card */
  variant?: "vertical" | "horizontal" | "rail";
  onWishlist?: (id: string, liked: boolean) => void;
  width?: number;
}

/** Uniform image ratio across all types so grid cards are always the same size. */
const IMAGE_ASPECT = 4 / 3;

function MetaIcon({ type }: { type: ProductType }) {
  if (type === "vehicle") return <Gauge size={11} color="#71717a" />;
  if (type === "real_estate") return <MapPin size={11} color="#71717a" />;
  return null;
}

export function ProductCard({ item, onPress, variant = "vertical", onWishlist, width }: ProductCardProps) {
  const [localLiked, setLocalLiked] = useState(item.liked ?? false);
  const liked = onWishlist ? (item.liked ?? localLiked) : localLiked;

  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.product;
  // Web parity: only product cards carry a wishlist heart.
  const showHeart = item.type === "product";

  const handleWishlist = () => {
    const next = !liked;
    setLocalLiked(next);
    onWishlist?.(item.id, next);
  };

  const image = (
    <>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="w-full h-full items-center justify-center" style={{ backgroundColor: cfg.bg }}>
          <cfg.Icon size={24} color={cfg.color} strokeWidth={1.5} />
        </View>
      )}
      {showHeart && (
        <TouchableOpacity
          onPress={handleWishlist}
          className="absolute top-2 right-2 bg-white rounded-full items-center justify-center"
          style={{ width: 28, height: 28, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
        >
          <Heart size={14} color={liked ? "#ef4444" : "#18181b"} fill={liked ? "#ef4444" : "transparent"} />
        </TouchableOpacity>
      )}
      {!!item.tag && (
        <View
          className="absolute px-2 py-1 rounded-lg bg-white"
          style={{ top: 6, left: 6, opacity: 0.95, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 }}
        >
          <Text className="font-grotesk-bold text-gray-900" style={{ fontSize: 9 }}>{item.tag}</Text>
        </View>
      )}
    </>
  );

  const body = (
    <View className="p-2.5">
      <View className="flex-row items-center gap-1 mb-0.5">
        <Text className="font-grotesk-semibold text-gray-900 flex-1" style={{ fontSize: 14 }} numberOfLines={1}>
          {item.name}
        </Text>
        <BadgeCheck size={14} color="#17A60D" fill="#17A60D" stroke="#fff" />
      </View>
      {!!item.subtitle && (
        <View className="flex-row items-center gap-1 mb-1">
          <MetaIcon type={item.type} />
          <Text className="font-manrope text-gray-500 flex-1" style={{ fontSize: 11 }} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
      )}
      <Text className="font-grotesk-bold" style={{ fontSize: 14, color: COLORS.primary }} numberOfLines={1}>
        {item.price}
      </Text>
    </View>
  );

  if (variant === "horizontal") {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className="bg-white rounded-xl overflow-hidden border border-gray-200 flex-row"
      >
        <View style={{ width: 120, aspectRatio: IMAGE_ASPECT }}>{image}</View>
        <View className="flex-1 justify-center">{body}</View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-xl overflow-hidden border border-gray-200"
      style={variant === "rail" ? { width: width ?? 170 } : { flex: 1 }}
    >
      <View style={{ aspectRatio: IMAGE_ASPECT }}>{image}</View>
      {body}
    </TouchableOpacity>
  );
}

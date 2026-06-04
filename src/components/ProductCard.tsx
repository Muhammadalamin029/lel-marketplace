import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Heart } from "lucide-react-native";
import { shadow } from "@/constants/shadows";

interface ProductCardItem {
  id: string;
  name: string;
  price: string;
  tag?: string;
  tagColor?: string;
  iconColor?: string;
  bgColor?: string;
  Icon: any;
  type?: string;
}

interface ProductCardProps {
  item: ProductCardItem;
  onPress: () => void;
  /** "vertical" = fixed 160px wide (horizontal scroll), "horizontal" = flex-1 (grid row) */
  variant?: "vertical" | "horizontal";
}

export function ProductCard({ item, onPress, variant = "vertical" }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const { Icon } = item;
  const isPhysicalAsset = item.type === "vehicle" || item.type === "real_estate";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100"
      style={[
        shadow.md,
        variant === "vertical" ? { width: 160 } : { flex: 1 },
      ]}
    >
      {/* Image placeholder */}
      <View
        className="relative h-28 items-center justify-center"
        style={{ backgroundColor: item.bgColor ?? "#f9fafb" }}
      >
        <Icon size={44} color={item.iconColor ?? "#6b7280"} strokeWidth={1.5} />

        {/* Wishlist */}
        <TouchableOpacity
          onPress={() => setLiked(!liked)}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5"
          style={shadow.sm}
        >
          <Heart
            size={13}
            color={liked ? "#ef4444" : "#d1d5db"}
            fill={liked ? "#ef4444" : "transparent"}
          />
        </TouchableOpacity>

        {/* Tag badge */}
        {item.tag && (
          <View
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: item.tagColor ?? "#6b7280" }}
          >
            <Text className="text-white text-[10px] font-bold">{item.tag}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View className="p-3 gap-1">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-sm font-bold text-amber-400">{item.price}</Text>
        {isPhysicalAsset && (
          <Text className="text-[11px] text-green-600 font-medium">Free inspection</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

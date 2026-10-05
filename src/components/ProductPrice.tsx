import { View, Text } from "react-native";
import { fmt } from "@/utils/format";
import { COLORS } from "@/constants/brand";
import {
  getDiscountPct,
  getEffectivePrice,
  isOnSale,
  type Discountable,
} from "@/lib/discount";

interface ProductPriceProps {
  product: Discountable;
  /** new-price font size (default 13 to stay small next to the name) */
  priceSize?: number;
  originalSize?: number;
  priceColor?: string;
}

/**
 * Sale layout: new price, then old linethrough price with the -% pill
 * locked beside it. Non-sale products render a single price.
 */
export function ProductPrice({
  product,
  priceSize = 13,
  originalSize = 11,
  priceColor = COLORS.primary,
}: ProductPriceProps) {
  const onSale = isOnSale(product);
  const current = getEffectivePrice(product);
  if (!onSale) {
    return (
      <Text className="font-grotesk-bold" style={{ fontSize: priceSize, color: priceColor }} numberOfLines={1}>
        {fmt(current)}
      </Text>
    );
  }
  const base = Number(product.price) || 0;
  const pct = getDiscountPct(product);
  const label = Number.isInteger(pct) ? String(pct) : pct.toFixed(pct < 10 ? 1 : 0);
  return (
    <View className="flex-row items-center flex-wrap" style={{ gap: 6 }}>
      <Text className="font-grotesk-bold" style={{ fontSize: priceSize, color: priceColor }} numberOfLines={1}>
        {fmt(current)}
      </Text>
      <View className="flex-row items-center" style={{ gap: 4 }}>
        <Text
          className="font-manrope"
          style={{ fontSize: originalSize, color: "#9ca3af", textDecorationLine: "line-through" }}
          numberOfLines={1}
        >
          {fmt(base)}
        </Text>
        <View className="rounded-full items-center justify-center" style={{ backgroundColor: "#dc2626", paddingHorizontal: 6, paddingVertical: 1 }}>
          <Text className="font-grotesk-bold text-white" style={{ fontSize: 9 }}>-{label}%</Text>
        </View>
      </View>
    </View>
  );
}

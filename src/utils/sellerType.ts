import { Package, Car, Building2 } from "lucide-react-native";
import type { SellerType } from "@/api";

/** Each seller only ever deals in one asset type, determined at registration. */
export const LISTING_META: Record<SellerType, {
  label: string; singular: string; icon: typeof Package;
  addRoute: "/product-form" | "/car-listing-form" | "/property-listing-form";
}> = {
  retailer: { label: "Products", singular: "Product", icon: Package, addRoute: "/product-form" },
  car_dealer: { label: "Cars", singular: "Car", icon: Car, addRoute: "/car-listing-form" },
  real_agent: { label: "Properties", singular: "Property", icon: Building2, addRoute: "/property-listing-form" },
};

export function listingMeta(sellerType?: SellerType | null) {
  return LISTING_META[sellerType ?? "retailer"];
}

/** The (tabs) group's default screen is the customer home — sellers must be sent to their own tab explicitly. */
export function homeRouteForRole(role?: string | null): "/(tabs)" | "/(tabs)/seller-dashboard" {
  return role === "seller" ? "/(tabs)/seller-dashboard" : "/(tabs)";
}

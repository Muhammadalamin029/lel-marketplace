import { useEffect, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Linking, Image, Dimensions, NativeSyntheticEvent, NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, ArrowRight } from "lucide-react-native";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardItem } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { BRAND_ASSETS, COLORS } from "@/constants/brand";
import { productsApi, publicApi, categoriesApi, notificationsApi } from "@/api";
import type { Car as CarType, Property, Product, CampaignBanner, Category } from "@/api";
import { fmt } from "@/utils/format";
import { useAuthStore } from "@/store/authStore";

const { width: SCREEN_W } = Dimensions.get("window");

// Exact grid math: % widths + gap can exceed 100% on iOS text/measure
// rounding and collapse a 2-col grid into one (oversized) column.
const GRID_GAP = 12;
const GRID_TILE_W = (SCREEN_W - 40 - GRID_GAP) / 2;

// Slide #1 is always the bundled campaign image; the rest are served by the
// backend (Admin Settings → Campaigns) so admins can upload and control them.
const FIRST_SLIDE_IMAGE = require("../../../assets/images/campaign/1.jpg");

interface CarouselSlide {
  key: string;
  localImage?: number;
  remoteImage?: string;
  link?: string | null;
}

// ─── Promo carousel ────────────────────────────────────────────────────────────

function PromoCarousel({ campaigns, onOpenLink }: { campaigns: CampaignBanner[]; onOpenLink: (link?: string | null) => void }) {
  const [page, setPage] = useState(0);
  const slides: CarouselSlide[] = [
    { key: "local-campaign-1", localImage: FIRST_SLIDE_IMAGE, link: "/browse" },
    ...campaigns.map((c) => ({
      key: c.id,
      remoteImage: c.image_url,
      link: c.cta_link,
    })),
  ];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setPage(Math.round(x / (SCREEN_W - 40)));
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {slides.map((s, i) => (
          <TouchableOpacity
            key={s.key}
            activeOpacity={0.9}
            onPress={() => onOpenLink(s.link)}
            className="rounded-2xl overflow-hidden bg-gray-100"
            style={{ width: SCREEN_W - 40, height: 150 }}
          >
            {s.localImage ? (
              <Image source={s.localImage} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : s.remoteImage ? (
              <Image source={{ uri: s.remoteImage }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {slides.length > 1 && (
        <View className="flex-row justify-center gap-1.5 mt-2.5">
          {slides.map((s, i) => (
            <View
              key={s.key}
              className="rounded-full"
              style={{
                width: i === page ? 18 : 6, height: 6,
                backgroundColor: i === page ? COLORS.primary : "#e5e7eb",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Home Screen ───────────────────────────────────────────────────────────────

const CATEGORY_TILES = [
  { key: "products", label: "Products", image: BRAND_ASSETS.gadgets },
  { key: "real-estate", label: "Real Estate", image: BRAND_ASSETS.property },
  { key: "autos", label: "Autos", image: BRAND_ASSETS.car },
  { key: "electronics", label: "Electronics", image: BRAND_ASSETS.hero },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [search, setSearch] = useState("");
  const [hotSales, setHotSales] = useState<ProductCardItem[]>([]);
  const [autos, setAutos] = useState<ProductCardItem[]>([]);
  const [properties, setProperties] = useState<ProductCardItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignBanner[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const displayName = (profile as any)?.name || user?.email?.split("@")[0] || "there";
  const avatarUrl = (profile as any)?.avatar_url as string | undefined;

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const [carsRes, propsRes, productsRes, catsRes, campaignsRes, notifRes] = await Promise.allSettled([
        productsApi.listCars({ limit: 8 }),
        productsApi.listProperties({ limit: 8 }),
        productsApi.list({ limit: 8 }),
        categoriesApi.list(),
        publicApi.campaignBanners(),
        notificationsApi.list({ limit: 1 }),
      ]);

      if (carsRes.status === "fulfilled") {
        setAutos(carsRes.value.data.map((c: CarType) => ({
          id: c.id,
          name: `${c.brand} ${c.model}`,
          price: fmt(c.price),
          type: "vehicle" as const,
          imageUrl: c.images?.[0]?.image_url ?? null,
          tag: String(c.year),
          subtitle: c.units?.[0]?.mileage != null ? `${Number(c.units[0].mileage).toLocaleString()}KM` : undefined,
        })));
      }
      if (propsRes.status === "fulfilled") {
        setProperties(propsRes.value.data.map((p: Property) => ({
          id: p.id,
          name: p.title,
          price: fmt(p.price),
          type: "real_estate" as const,
          imageUrl: p.images?.[0]?.image_url ?? null,
          tag: p.listing_type === "rental" ? "For Rent" : "For Sale",
          subtitle: p.location,
        })));
      }
      const items: ProductCardItem[] = [];
      if (carsRes.status === "fulfilled") {
        carsRes.value.data.slice(0, 2).forEach((c: CarType) => items.push({
          id: c.id,
          name: `${c.brand} ${c.model}`,
          price: fmt(c.price),
          type: "vehicle",
          imageUrl: c.images?.[0]?.image_url ?? null,
          tag: String(c.year),
          subtitle: c.units?.[0]?.mileage != null ? `${Number(c.units[0].mileage).toLocaleString()}KM` : undefined,
        }));
      }
      if (productsRes.status === "fulfilled") {
        productsRes.value.data.slice(0, 4).forEach((p: Product) => items.push({
          id: p.id,
          name: p.name,
          price: fmt(p.price),
          type: "product",
          imageUrl: p.images?.[0]?.image_url ?? null,
          subtitle: p.category?.name,
        }));
      }
      setHotSales(items.slice(0, 6));
      if (catsRes.status === "fulfilled") setCategories(catsRes.value.slice(0, 8));
      if (campaignsRes.status === "fulfilled") setCampaigns(campaignsRes.value ?? []);
      if (notifRes.status === "fulfilled") setUnread(notifRes.value.unread_count ?? 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handleSearch = () => {
    if (search.trim()) router.push(`/browse?search=${encodeURIComponent(search)}` as any);
    else router.push("/browse");
  };

  const handleSlideLink = (link?: string | null) => {
    if (!link) {
      router.push("/browse");
      return;
    }
    if (/^https?:\/\//.test(link)) {
      Linking.openURL(link).catch(() => router.push("/browse"));
      return;
    }
    router.push(link as any);
  };

  const goToItem = (item: ProductCardItem) => {
    router.push(`/product-details?id=${item.id}&type=${item.type}` as any);
  };

  const goCategory = (tileKey: string) => {
    if (tileKey === "autos") {
      router.push("/browse" as any);
    } else if (tileKey === "real-estate") {
      router.push("/browse" as any);
    } else {
      const match = categories.find((c) => c.name.toLowerCase().includes(tileKey.split("-")[0]));
      if (match) router.push(`/category-products?id=${match.id}&name=${encodeURIComponent(match.name)}` as any);
      else router.push("/browse" as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View className="flex-row items-center gap-3">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-10 h-10 rounded-full" />
            ) : (
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: COLORS.primarySoft }}
              >
                <Text className="text-sm font-grotesk-extrabold" style={{ color: COLORS.primary }}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text className="font-manrope text-xs text-gray-400">Welcome Back.</Text>
              <Text className="font-grotesk-extrabold text-gray-900" style={{ fontSize: 16 }} numberOfLines={1}>
                {displayName}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/notifications")} className="relative p-1">
            <Bell size={22} color="#111827" strokeWidth={1.8} />
            {unread > 0 && (
              <View
                className="absolute top-0 right-0 rounded-full items-center justify-center"
                style={{ backgroundColor: COLORS.primary, minWidth: 16, height: 16, paddingHorizontal: 3 }}
              >
                <Text className="text-white font-grotesk-extrabold" style={{ fontSize: 9 }}>
                  {unread > 9 ? "9+" : unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search ── */}
        <View className="px-5 pb-3">
          <SearchBar value={search} onChangeText={setSearch} onSubmit={handleSearch} onFilterPress={handleSearch} />
        </View>

        {/* ── Promo carousel ── */}
        <View className="px-5">
          <PromoCarousel campaigns={campaigns} onOpenLink={handleSlideLink} />
        </View>

        {/* ── Categories ── */}
        <View className="mt-5">
          <Text className="font-grotesk-extrabold text-gray-900 px-5 mb-3" style={{ fontSize: 16 }}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {CATEGORY_TILES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => goCategory(t.key)}
                className="items-center"
                style={{ width: 76 }}
              >
                <Image source={t.image} style={{ width: 60, height: 60, borderRadius: 14 }} resizeMode="cover" />
                <Text
                  className="font-grotesk text-gray-600 text-center"
                  style={{ fontSize: 10, lineHeight: 14, height: 14, marginTop: 6 }}
                  numberOfLines={1}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Recommended ── */}
        <View className="mt-6 px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-grotesk-extrabold text-gray-900" style={{ fontSize: 16 }}>Recommended</Text>
            <TouchableOpacity onPress={() => router.push("/browse")} className="flex-row items-center gap-1">
              <Text className="font-manrope text-xs text-gray-400">See more</Text>
              <ArrowRight size={13} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
              {hotSales.map((item) => (
                <View key={`${item.type}-${item.id}`} style={{ width: GRID_TILE_W }}>
                  <ProductCard item={item} onPress={() => goToItem(item)} variant="vertical" />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Find your next Auto ── */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-5 mb-1">
            <Text className="font-grotesk-extrabold text-gray-900" style={{ fontSize: 16 }}>Find your next Auto</Text>
            <TouchableOpacity onPress={() => router.push("/browse")} className="flex-row items-center gap-1">
              <Text className="font-manrope text-xs text-gray-400">See more</Text>
              <ArrowRight size={13} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <Text className="font-manrope text-[11px] text-gray-400 px-5 mb-3">
            Inspected vehicles, duty paid, financing available
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {autos.map((item) => (
              <ProductCard key={item.id} item={item} onPress={() => goToItem(item)} variant="rail" width={170} />
            ))}
          </ScrollView>
        </View>

        {/* ── Find your next Property ── */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between px-5 mb-1">
            <Text className="font-grotesk-extrabold text-gray-900" style={{ fontSize: 16 }}>Find your next Property</Text>
            <TouchableOpacity onPress={() => router.push("/browse")} className="flex-row items-center gap-1">
              <Text className="font-manrope text-xs text-gray-400">See more</Text>
              <ArrowRight size={13} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <Text className="font-manrope text-[11px] text-gray-400 px-5 mb-3">
            Inspected properties, financing available
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {properties.map((item) => (
              <ProductCard key={item.id} item={item} onPress={() => goToItem(item)} variant="rail" width={170} />
            ))}
          </ScrollView>
        </View>

        {/* ── Monthly Plans ── */}
        <View className="mt-6 px-5">
          <View className="bg-white border border-gray-100 rounded-2xl p-5">
            <Text className="font-manrope text-[11px] text-gray-400 mb-1">Monthly Plans</Text>
            <Text className="text-base font-grotesk-extrabold text-gray-900 leading-snug">
              Pay monthly, stay stocked and covered.
            </Text>
            <Text className="font-manrope text-xs text-gray-500 leading-relaxed mt-1.5">
              Spread payments on vehicles and properties with approved financing. Pause or cancel anytime.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/financing-application")}
              className="rounded-full border border-gray-300 py-3 items-center mt-4"
            >
              <Text className="text-xs font-grotesk-bold text-gray-900">View Plans</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

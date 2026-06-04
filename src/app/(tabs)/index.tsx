import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Bell, Tag, Car, Home } from "lucide-react-native";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";

// ─── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "1", label: "Vehicles", Icon: Car },
  { id: "2", label: "Real Estate", Icon: Home },
  { id: "3", label: "Deals", Icon: Tag },
];

const HOT_SALES = [
  {
    id: "1",
    name: "Toyota Camry 2022",
    price: fmt(18500000),
    tag: "Verified",
    tagColor: "#ea580c",
    iconColor: "#ea580c",
    bgColor: "#fff7ed",
    Icon: Car,
    type: "vehicle",
  },
  {
    id: "2",
    name: "3-Bed Apartment Lekki",
    price: fmt(85000000),
    tag: "Hot Deal",
    tagColor: "#dc2626",
    iconColor: "#dc2626",
    bgColor: "#fef2f2",
    Icon: Home,
    type: "real_estate",
  },
  {
    id: "3",
    name: "Honda Civic 2021",
    price: fmt(12000000),
    tag: "Verified",
    tagColor: "#2563eb",
    iconColor: "#2563eb",
    bgColor: "#eff6ff",
    Icon: Car,
    type: "vehicle",
  },
];

const RECENT = [
  {
    id: "1",
    name: "BMW 5 Series",
    price: fmt(32000000),
    bgColor: "#fffbeb",
    iconColor: "#b45309",
    Icon: Car,
    type: "vehicle",
  },
  {
    id: "2",
    name: "Office Complex VI",
    price: fmt(200000000),
    bgColor: "#f0f9ff",
    iconColor: "#0284c7",
    Icon: Home,
    type: "real_estate",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function CategoryPill({
  label,
  Icon,
  active,
  onPress,
}: {
  label: string;
  Icon: any;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border-2 ${
        active ? "bg-amber-400 border-amber-400" : "bg-white border-gray-200"
      }`}
    >
      <Icon size={14} color={active ? "#ffffff" : "#6b7280"} />
      <Text
        className={`font-semibold text-sm ${active ? "text-white" : "text-gray-700"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Home Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("1");
  const [search, setSearch] = useState("");
  const notifDot = true;

  const goToProduct = () => router.push("/product-details");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pb-6">
          {/* ── Header ── */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
            <View>
              <Text className="text-xs text-gray-400 font-medium">
                Welcome back 👋
              </Text>
              <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
                LEL <Text className="text-amber-400">Marketplace</Text>
              </Text>
            </View>
            <TouchableOpacity className="relative">
              <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
                <Bell size={20} color="#374151" strokeWidth={1.8} />
              </View>
              {notifDot && (
                <View className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </TouchableOpacity>
          </View>

          {/* ── Search Bar ── */}
          <View className="px-5 py-3 bg-white">
            <View className="flex-row items-center gap-2.5 bg-gray-100 rounded-xl px-3.5 py-2.5">
              <Search size={18} color="#9ca3af" />
              <TextInput
                placeholder="Search vehicles, properties..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#9ca3af"
                className="flex-1 bg-transparent text-sm text-gray-900"
              />
            </View>
          </View>

          {/* ── Promo Banner ── */}
          <View className="px-5 py-3">
            <View
              className="relative rounded-2xl overflow-hidden h-40 flex-row"
              style={{ backgroundColor: "#1e1b4b" }}
            >
              <View className="flex-1 p-5 justify-center gap-1.5">
                <View className="bg-amber-400 self-start px-2 py-0.5 rounded-md">
                  <Text className="text-white text-[10px] font-extrabold tracking-wide">
                    EXCLUSIVE
                  </Text>
                </View>
                <Text className="text-amber-400 text-2xl font-black leading-tight">
                  LEL{"\n"}Marketplace
                </Text>
                <Text className="text-white text-xs" style={{ opacity: 0.85 }}>
                  Top deals on vehicles & property
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/browse")}
                  className="bg-amber-400 self-start px-3.5 py-1.5 rounded-xl mt-1"
                >
                  <Text className="text-white text-xs font-bold">
                    Browse Deals
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="w-32 items-center justify-center gap-2.5">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(245,158,11,0.2)" }}
                >
                  <Car size={36} color="#f59e0b" strokeWidth={1.5} />
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <Home size={24} color="#ffffff" strokeWidth={1.5} />
                </View>
              </View>
              <View
                className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full"
                style={{ backgroundColor: "rgba(245,158,11,0.1)" }}
              />
              <View
                className="absolute right-14 -top-5 w-20 h-20 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              />
            </View>
            <Text className="text-center text-[11px] text-gray-400 mt-2">
              *Verified listings only. Inspection available nationwide.
            </Text>
          </View>

          {/* ── Categories ── */}
          <View className="pl-5 mb-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2.5 pr-5">
                {CATEGORIES.map((cat) => (
                  <CategoryPill
                    key={cat.id}
                    label={cat.label}
                    Icon={cat.Icon}
                    active={activeCategory === cat.id}
                    onPress={() => setActiveCategory(cat.id)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── Hot Sales ── */}
          <View className="mt-5">
            <View className="px-5">
              <SectionHeader
                title="Hot Sales"
                onSeeAll={() => router.push("/browse")}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3.5 px-5">
                {HOT_SALES.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onPress={goToProduct}
                    variant="vertical"
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── Recently Viewed ── */}
          <View className="mt-7 px-5">
            <SectionHeader
              title="Recently Viewed"
              onSeeAll={() => router.push("/browse")}
            />
            <View className="flex-row gap-3.5">
              {RECENT.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onPress={goToProduct}
                  variant="horizontal"
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

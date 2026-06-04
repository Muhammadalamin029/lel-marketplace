import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { Car, Home, Tag, Search, SlidersHorizontal, Package } from "lucide-react-native";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "vehicle", label: "Vehicles" },
  { id: "real_estate", label: "Real Estate" },
  { id: "product", label: "Products" },
];

const ALL_ITEMS = [
  { id: "1", name: "Toyota Camry 2022", price: fmt(18500000), tag: "Verified", tagColor: "#ea580c", iconColor: "#ea580c", bgColor: "#fff7ed", Icon: Car, type: "vehicle" },
  { id: "2", name: "3-Bed Apartment Lekki", price: fmt(85000000), tag: "Hot Deal", tagColor: "#dc2626", iconColor: "#dc2626", bgColor: "#fef2f2", Icon: Home, type: "real_estate" },
  { id: "3", name: "Honda Civic 2021", price: fmt(12000000), tag: "Verified", tagColor: "#2563eb", iconColor: "#2563eb", bgColor: "#eff6ff", Icon: Car, type: "vehicle" },
  { id: "4", name: "BMW 5 Series 2020", price: fmt(32000000), tag: "Verified", tagColor: "#7c3aed", iconColor: "#7c3aed", bgColor: "#f5f3ff", Icon: Car, type: "vehicle" },
  { id: "5", name: "Office Complex VI", price: fmt(200000000), tag: "Commercial", tagColor: "#0284c7", iconColor: "#0284c7", bgColor: "#f0f9ff", Icon: Home, type: "real_estate" },
  { id: "6", name: "Leather Sofa Set", price: fmt(850000), tag: "New", tagColor: "#16a34a", iconColor: "#16a34a", bgColor: "#f0fdf4", Icon: Tag, type: "product" },
  { id: "7", name: "Samsung 65\" QLED TV", price: fmt(1200000), tag: "New", tagColor: "#0891b2", iconColor: "#0891b2", bgColor: "#ecfeff", Icon: Tag, type: "product" },
  { id: "8", name: "2-Bed Flat Surulere", price: fmt(45000000), tag: "Rental", tagColor: "#d97706", iconColor: "#d97706", bgColor: "#fffbeb", Icon: Home, type: "real_estate" },
];

export default function BrowseScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = ALL_ITEMS.filter((item) => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Browse" subtitle="Vehicles, Real Estate & Products" />

      {/* Search bar */}
      <View className="px-5 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2.5 bg-gray-100 rounded-xl px-3.5 py-2.5">
          <Search size={16} color="#9ca3af" />
          <TextInput
            placeholder="Search listings…"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-transparent text-sm text-gray-900"
          />
        </View>
      </View>

      {/* Category pills */}
      <View className="bg-white px-5 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-3">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full border ${
                  activeCategory === cat.id ? "bg-amber-400 border-amber-400" : "bg-white border-gray-200"
                }`}
              >
                <Text className={`text-xs font-semibold ${activeCategory === cat.id ? "text-white" : "text-gray-700"}`}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-4">
          <Text className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">
            {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
          </Text>

          {filtered.length === 0 ? (
            <EmptyState Icon={Package} title="No listings found" subtitle="Try a different search or category." />
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {filtered.map((item) => (
                <View key={item.id} style={{ width: "47%" }}>
                  <ProductCard item={item} onPress={() => router.push("/product-details")} variant="horizontal" />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

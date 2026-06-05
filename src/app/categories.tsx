import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { shadow } from "@/constants/shadows";
import { Grid3x3, Search, ChevronRight, Package } from "lucide-react-native";
import { categoriesApi } from "@/api";
import type { Category } from "@/api";

const CATEGORY_COLORS = [
  "#fff7ed", "#eff6ff", "#f0fdf4", "#faf5ff",
  "#fef2f2", "#f0f9ff", "#fffbeb", "#f5f3ff",
];
const CATEGORY_ACCENT = [
  "#ea580c", "#3b82f6", "#22c55e", "#8b5cf6",
  "#ef4444", "#0284c7", "#f59e0b", "#7c3aed",
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    categoriesApi.list()
      .then((data) => setCategories(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Categories" subtitle="Browse by product type" />

      <View className="px-5 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2.5 bg-gray-100 rounded-xl px-3.5 py-2.5">
          <Search size={16} color="#9ca3af" />
          <TextInput
            placeholder="Search categories…"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-transparent text-sm text-gray-900"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {loading ? (
          <View className="items-center justify-center pt-20 gap-3">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400">Loading categories…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState Icon={Grid3x3} title="No categories found" subtitle="Try a different search." />
        ) : (
          <View className="flex-row flex-wrap gap-4">
            {filtered.map((cat, i) => {
              const bg = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              const accent = CATEGORY_ACCENT[i % CATEGORY_ACCENT.length];
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => router.push(`/category-products?id=${cat.id}&name=${encodeURIComponent(cat.name)}` as any)}
                  className="bg-white rounded-2xl p-4 overflow-hidden"
                  style={[shadow.md, { width: "47%" }]}
                  activeOpacity={0.85}
                >
                  {/* Colour accent bar */}
                  <View className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: accent }} />

                  <View className="w-12 h-12 rounded-2xl items-center justify-center mb-3 mt-1" style={{ backgroundColor: bg }}>
                    <Package size={24} color={accent} strokeWidth={1.5} />
                  </View>

                  <Text className="text-sm font-extrabold text-gray-900" numberOfLines={1}>{cat.name}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{cat.product_count ?? 0} products</Text>

                  <View className="flex-row items-center gap-1 mt-3">
                    <Text className="text-[10px] font-bold uppercase tracking-wide" style={{ color: accent }}>Browse</Text>
                    <ChevronRight size={10} color={accent} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

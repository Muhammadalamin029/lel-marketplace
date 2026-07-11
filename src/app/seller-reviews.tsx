import { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Star } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { shadow } from "@/constants/shadows";
import { sellerApi } from "@/api";
import type { SellerReview } from "@/api";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { formatDate } from "@/utils/format";

function Stars({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} color="#f59e0b" fill={i <= rating ? "#f59e0b" : "transparent"} />
      ))}
    </View>
  );
}

export default function SellerReviewsScreen() {
  const [reviews, setReviews] = useState<SellerReview[]>([]);

  const fetchData = useCallback(async () => {
    try { setReviews((await sellerApi.listReviews({ limit: 50 })).items); } catch { setReviews([]); }
  }, []);

  const { loading, refreshing, load, onRefresh } = usePullToRefresh(fetchData);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Reviews" subtitle="What buyers say about your listings" />
      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" colors={["#f59e0b"]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
        ) : reviews.length === 0 ? (
          <EmptyState Icon={Star} title="No reviews yet" subtitle="Reviews on your products will show up here." />
        ) : (
          <View className="gap-4">
            <View className="bg-white rounded-3xl p-5 items-center" style={shadow.md}>
              <Text className="text-3xl font-extrabold text-gray-900">{average.toFixed(1)}</Text>
              <Stars rating={Math.round(average)} />
              <Text className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length === 1 ? "" : "s"}</Text>
            </View>

            <View className="gap-3">
              {reviews.map((r) => (
                <View key={r.id} className="bg-white rounded-2xl p-4" style={shadow.card}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-gray-900">{r.user?.name ?? "Buyer"}</Text>
                    <Stars rating={r.rating} />
                  </View>
                  {r.product_name && <Text className="text-xs text-gray-400 mt-0.5">{r.product_name}</Text>}
                  {r.comment && <Text className="text-sm text-gray-700 mt-2">{r.comment}</Text>}
                  <Text className="text-xs text-gray-400 mt-2">{formatDate(r.created_at)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { shadow } from "@/constants/shadows";
import { Star, Edit2, Trash2, X, Package } from "lucide-react-native";
import { formatDate } from "@/utils/format";
import { reviewsApi } from "@/api";
import type { Review } from "@/api";

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} color="#f59e0b" fill={i <= rating ? "#f59e0b" : "transparent"} />
      ))}
    </View>
  );
}

function StarPicker({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <View className="flex-row gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i)}>
          <Star size={32} color="#f59e0b" fill={i <= rating ? "#f59e0b" : "transparent"} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MyReviewsScreen() {
  useRequireAuth();
  // Deep-link from order-details: ?leave=1&productId=xxx&productName=xxx
  const { leave, productId, productName } = useLocalSearchParams<{
    leave?: string; productId?: string; productName?: string;
  }>();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);
  // New-review state (from order deep-link)
  const [newProductId, setNewProductId] = useState(productId ?? "");
  const [newProductName] = useState(decodeURIComponent(productName ?? ""));
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [showNewModal, setShowNewModal] = useState(leave === "1" && !!productId);
  const [savingNew, setSavingNew] = useState(false);

  const load = () => {
    setLoading(true);
    reviewsApi.listMyReviews()
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmitNew = async () => {
    if (!newProductId) { Alert.alert("Error", "No product selected."); return; }
    if (newRating < 1) { Alert.alert("Rating Required", "Please select a star rating."); return; }
    setSavingNew(true);
    try {
      const created = await reviewsApi.create({
        product_id: newProductId,
        rating: newRating,
        comment: newComment.trim() || undefined,
      });
      setReviews((prev) => [created, ...prev]);
      setShowNewModal(false);
      Alert.alert("Review Submitted", "Thank you for your feedback!");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.detail ?? e?.message ?? "Failed to submit review.");
    } finally {
      setSavingNew(false);
    }
  };

  const openEdit = (r: Review) => {
    setEditTarget(r);
    setEditRating(r.rating);
    setEditComment(r.comment ?? "");
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const updated = await reviewsApi.update(editTarget.id, { rating: editRating, comment: editComment.trim() || undefined });
      setReviews((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      setEditTarget(null);
    } catch {
      Alert.alert("Error", "Failed to update review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Review", "Are you sure you want to delete this review? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await reviewsApi.delete(id);
            setReviews((prev) => prev.filter((r) => r.id !== id));
          } catch {
            Alert.alert("Error", "Failed to delete review.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="My Reviews" subtitle={`${reviews.length} review${reviews.length !== 1 ? "s" : ""} written`} />

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400 mt-3">Loading reviews…</Text>
          </View>
        ) : reviews.length === 0 ? (
          <EmptyState
            Icon={Star}
            title="No reviews yet"
            subtitle="After purchasing a product, you can leave a review to share your experience."
            iconBg="#fffbeb"
            iconColor="#f59e0b"
          />
        ) : (
          <View className="gap-4 pb-10">
            {reviews.map((r) => (
              <View key={r.id} className="bg-white rounded-3xl p-5" style={shadow.md}>
                {/* Product name */}
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center">
                    <Package size={16} color="#6b7280" />
                  </View>
                  <Text className="text-sm font-bold text-gray-900 flex-1" numberOfLines={1}>
                    {r.product_name ?? "Product"}
                  </Text>
                </View>

                {/* Rating + date */}
                <View className="flex-row items-center justify-between mb-3">
                  <StarRow rating={r.rating} />
                  <Text className="text-[10px] text-gray-400">{formatDate(r.created_at)}</Text>
                </View>

                {/* Comment */}
                {r.comment && (
                  <Text className="text-sm text-gray-600 leading-relaxed mb-4">{r.comment}</Text>
                )}

                {/* Actions */}
                <View className="flex-row gap-2 pt-3 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={() => openEdit(r)}
                    className="flex-1 flex-row items-center justify-center gap-2 bg-blue-50 py-2.5 rounded-xl"
                  >
                    <Edit2 size={14} color="#3b82f6" />
                    <Text className="text-xs font-bold text-blue-600">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(r.id)}
                    className="flex-1 flex-row items-center justify-center gap-2 bg-red-50 py-2.5 rounded-xl"
                  >
                    <Trash2 size={14} color="#ef4444" />
                    <Text className="text-xs font-bold text-red-600">Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editTarget} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditTarget(null)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
            <Text className="text-lg font-extrabold text-gray-900">Edit Review</Text>
            <TouchableOpacity onPress={() => setEditTarget(null)} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
            <View className="gap-6 pb-10">
              <View className="items-center gap-3">
                <Text className="text-sm font-semibold text-gray-700">Your Rating</Text>
                <StarPicker rating={editRating} onChange={setEditRating} />
                <Text className="text-xs text-gray-400">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][editRating]}
                </Text>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Your Review (optional)</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900"
                  placeholder="Share your experience with this product…"
                  placeholderTextColor="#9ca3af"
                  value={editComment}
                  onChangeText={setEditComment}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 100, textAlignVertical: "top" }}
                />
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="bg-amber-400 py-4 rounded-2xl items-center"
                style={shadow.btn}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white font-bold">Save Review</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── New Review Modal (from order detail deep-link) ── */}
      <Modal visible={showNewModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowNewModal(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
            <Text className="text-lg font-extrabold text-gray-900">Leave a Review</Text>
            <TouchableOpacity onPress={() => setShowNewModal(false)} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
            <View className="gap-6 pb-10">
              {newProductName ? (
                <View className="flex-row items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Package size={16} color="#6b7280" />
                  <Text className="text-sm font-bold text-gray-800 flex-1" numberOfLines={1}>{newProductName}</Text>
                </View>
              ) : null}
              <View className="items-center gap-3">
                <Text className="text-sm font-semibold text-gray-700">Your Rating</Text>
                <View className="flex-row gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TouchableOpacity key={i} onPress={() => setNewRating(i)}>
                      <Star size={32} color="#f59e0b" fill={i <= newRating ? "#f59e0b" : "transparent"} />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-xs text-gray-400">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][newRating]}
                </Text>
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Your Review (optional)</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900"
                  placeholder="Share your experience with this product…"
                  placeholderTextColor="#9ca3af"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 100, textAlignVertical: "top" }}
                />
              </View>
              <TouchableOpacity
                onPress={handleSubmitNew}
                disabled={savingNew}
                className="bg-amber-400 py-4 rounded-2xl items-center"
                style={shadow.btn}
              >
                {savingNew ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Submit Review</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

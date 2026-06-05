import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, Modal, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { AlertCircle, Plus, X, ChevronRight, MessageCircle } from "lucide-react-native";
import { formatDate } from "@/utils/format";
import { disputesApi } from "@/api";
import type { Dispute } from "@/api";

export default function DisputesScreen() {
  useRequireAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", reason: "", orderId: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    disputesApi.list()
      .then((data) => setDisputes(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.reason.trim()) {
      Alert.alert("Missing Fields", "Please fill in the title and reason.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await disputesApi.create({
        title: form.title.trim(),
        reason: form.reason.trim(),
        order_id: form.orderId.trim() || undefined,
      });
      setDisputes((prev) => [created, ...prev]);
      setForm({ title: "", reason: "", orderId: "" });
      setModalOpen(false);
      Alert.alert("Submitted", "Your dispute has been received. Our team will review it within 2–3 business days.");
    } catch {
      Alert.alert("Error", "Failed to submit dispute. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader
        title="My Disputes"
        subtitle="Open issues & resolutions"
        rightSlot={
          <TouchableOpacity onPress={() => setModalOpen(true)} className="w-9 h-9 bg-amber-400 rounded-full items-center justify-center" style={shadow.md}>
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#f59e0b" />
          </View>
        ) : disputes.length === 0 ? (
          <EmptyState Icon={AlertCircle} title="No disputes" subtitle="You haven't opened any disputes yet." />
        ) : (
          <View className="gap-4 pb-10">
            {disputes.map((d) => (
              <View key={d.id} className="bg-white rounded-3xl p-5" style={shadow.card}>
                <View className="flex-row items-start justify-between gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-gray-900">{d.title}</Text>
                    <Text className="text-[10px] text-gray-400 mt-0.5">
                      {d.order_id ? `Order: ${d.order_id.slice(-8).toUpperCase()} · ` : ""}
                      {formatDate(d.created_at)}
                    </Text>
                  </View>
                  <StatusBadge status={d.status} />
                </View>

                {d.resolution_notes && (
                  <View className="bg-green-50 rounded-xl p-3 mb-3 border border-green-100">
                    <View className="flex-row items-center gap-2 mb-1">
                      <MessageCircle size={12} color="#16a34a" />
                      <Text className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Resolution</Text>
                    </View>
                    <Text className="text-xs text-green-800 leading-relaxed">{d.resolution_notes}</Text>
                  </View>
                )}

                <View className="flex-row items-center justify-end gap-1">
                  <Text className="text-xs font-bold text-indigo-600">View Details</Text>
                  <ChevronRight size={14} color="#4f46e5" />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
            <Text className="text-lg font-extrabold text-gray-900">Open a Dispute</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
            <View className="gap-5 pb-10">
              {[
                { label: "Dispute Title *", key: "title", placeholder: "e.g. Item not as described", multi: false },
                { label: "Order ID (optional)", key: "orderId", placeholder: "e.g. ORD-2024-0042", multi: false },
                { label: "Reason *", key: "reason", placeholder: "Describe the issue in detail…", multi: true },
              ].map(({ label, key, placeholder, multi }) => (
                <View key={key} className="gap-2">
                  <Text className="text-sm font-semibold text-gray-700">{label}</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900"
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    value={(form as any)[key]}
                    onChangeText={(val) => setForm((prev) => ({ ...prev, [key]: val }))}
                    multiline={multi}
                    numberOfLines={multi ? 4 : 1}
                    style={multi ? { minHeight: 100, textAlignVertical: "top" } : {}}
                  />
                </View>
              ))}

              <View className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <Text className="text-xs text-amber-800 leading-relaxed">
                  Our team will review your dispute within 2–3 business days. Provide as much detail as possible.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                className="bg-amber-400 py-4 rounded-2xl items-center"
                style={shadow.btn}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Submit Dispute</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

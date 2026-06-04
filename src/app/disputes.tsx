import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, Modal, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { AlertCircle, Plus, X, ChevronRight, MessageCircle } from "lucide-react-native";
import { formatDate } from "@/utils/format";


const MOCK_DISPUTES = [
  { id: "DSP-001", title: "Item not as described", status: "open", orderId: "ORD-2023-8942", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), resolution: null },
  { id: "DSP-002", title: "Delivery delay", status: "resolved", orderId: "ORD-2023-7721", createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), resolution: "Refund of ₦50,000 processed." },
];

export default function DisputesScreen() {
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", reason: "", orderId: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.reason.trim()) {
      Alert.alert("Missing Fields", "Please fill in the title and reason.");
      return;
    }
    setSubmitting(true);
    try {
      // TODO: POST /disputes { title, reason, order_id }
      await new Promise((r) => setTimeout(r, 800));
      setDisputes((prev) => [{
        id: `DSP-00${prev.length + 1}`,
        title: form.title,
        status: "open",
        orderId: form.orderId || "—",
        createdAt: new Date().toISOString(),
        resolution: null,
      }, ...prev]);
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
        {disputes.length === 0 ? (
          <EmptyState Icon={AlertCircle} title="No disputes" subtitle="You haven't opened any disputes yet." />
        ) : (
          <View className="gap-4 pb-10">
            {disputes.map((d) => (
              <View key={d.id} className="bg-white rounded-3xl p-5" style={shadow.card}>
                <View className="flex-row items-start justify-between gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-gray-900">{d.title}</Text>
                    <Text className="text-[10px] text-gray-400 mt-0.5">Order: {d.orderId} · {formatDate(d.createdAt)}</Text>
                  </View>
                  <StatusBadge status={d.status} />
                </View>

                {d.resolution && (
                  <View className="bg-green-50 rounded-xl p-3 mb-3 border border-green-100">
                    <View className="flex-row items-center gap-2 mb-1">
                      <MessageCircle size={12} color="#16a34a" />
                      <Text className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Resolution</Text>
                    </View>
                    <Text className="text-xs text-green-800 leading-relaxed">{d.resolution}</Text>
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

      {/* New dispute modal */}
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
                { label: "Order ID (optional)", key: "orderId", placeholder: "e.g. ORD-2023-8942", multi: false },
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
                  Our team will review your dispute within 2–3 business days. Ensure you provide as much detail as possible to help us resolve it quickly.
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

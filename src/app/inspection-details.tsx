import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, Modal, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { Car, Home, Calendar, AlertCircle, X, ChevronDown } from "lucide-react-native";
import { inspectionsApi } from "@/api";
import type { Inspection, CompleteInspectionPayload } from "@/api/inspections";
import { fmt } from "@/utils/format";

// ─── Finalize Offer Modal ──────────────────────────────────────────────────────

function FinalizeOfferModal({
  visible, onClose, onSubmit, assetPrice, isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CompleteInspectionPayload) => void;
  assetPrice: number;
  isSubmitting: boolean;
}) {
  const [agreedPrice, setAgreedPrice] = useState(String(assetPrice));
  const [planType, setPlanType] = useState<"structured" | "flexible">("flexible");
  const [duration, setDuration] = useState("6");
  const [notes, setNotes] = useState("");
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const price = Number(agreedPrice) || 0;
  const durationNum = Number(duration) || 6;
  const monthly = planType === "structured" && price > 0 ? price / durationNum : 0;

  const handleSubmit = () => {
    if (!agreedPrice || price <= 0) {
      Alert.alert("Price Required", "Please enter a valid negotiated price.");
      return;
    }
    onSubmit({
      agreed_price: price,
      notes: notes.trim() || undefined,
      plan_type: planType,
      duration_months: planType === "structured" ? durationNum : undefined,
      monthly_installment: planType === "structured" ? monthly : undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
          <Text className="text-lg font-extrabold text-gray-900">Finalize Offer & Plan</Text>
          <TouchableOpacity onPress={onClose} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
            <X size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
          <View className="gap-5 pb-10">
            <Text className="text-sm text-gray-600 leading-relaxed">
              Enter your final offer and choose a payment plan. The seller will review and approve.
            </Text>

            {/* Price */}
            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-700">Negotiated Final Price (₦) *</Text>
              <TextInput
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 text-base font-bold text-gray-900"
                placeholder={`Listed at ${fmt(assetPrice)}`}
                placeholderTextColor="#9ca3af"
                value={agreedPrice}
                onChangeText={setAgreedPrice}
                keyboardType="numeric"
              />
            </View>

            {/* Plan type */}
            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-700">Payment Model *</Text>
              <TouchableOpacity
                onPress={() => setShowPlanPicker(!showPlanPicker)}
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 flex-row items-center justify-between"
              >
                <Text className="text-sm font-semibold text-gray-900">
                  {planType === "structured" ? "Structured (Fixed monthly)" : "Flexible (Open duration)"}
                </Text>
                <ChevronDown size={16} color="#6b7280" />
              </TouchableOpacity>
              {showPlanPicker && (
                <View className="border border-gray-200 rounded-xl overflow-hidden">
                  {[
                    { value: "flexible", label: "Flexible (Open duration)" },
                    { value: "structured", label: "Structured (Fixed monthly)" },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => { setPlanType(opt.value as any); setShowPlanPicker(false); }}
                      className={`px-4 py-3 border-b border-gray-100 ${planType === opt.value ? "bg-amber-50" : "bg-white"}`}
                    >
                      <Text className={`text-sm font-semibold ${planType === opt.value ? "text-amber-600" : "text-gray-800"}`}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Structured: duration + monthly */}
            {planType === "structured" && (
              <View className="gap-3">
                <View className="gap-2">
                  <Text className="text-sm font-bold text-gray-700">Duration</Text>
                  <TouchableOpacity
                    onPress={() => setShowDurationPicker(!showDurationPicker)}
                    className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 flex-row items-center justify-between"
                  >
                    <Text className="text-sm font-semibold text-gray-900">{duration} months</Text>
                    <ChevronDown size={16} color="#6b7280" />
                  </TouchableOpacity>
                  {showDurationPicker && (
                    <View className="border border-gray-200 rounded-xl overflow-hidden">
                      {["3", "6", "12", "24"].map((d) => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => { setDuration(d); setShowDurationPicker(false); }}
                          className={`px-4 py-3 border-b border-gray-100 ${duration === d ? "bg-amber-50" : "bg-white"}`}
                        >
                          <Text className={`text-sm font-semibold ${duration === d ? "text-amber-600" : "text-gray-800"}`}>
                            {d} months
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                {monthly > 0 && (
                  <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <Text className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Monthly Payment</Text>
                    <Text className="text-xl font-extrabold text-amber-600">{fmt(monthly)}</Text>
                    <Text className="text-xs text-amber-600 mt-0.5">{fmt(price)} ÷ {durationNum} months</Text>
                  </View>
                )}
              </View>
            )}

            {/* Flexible info */}
            {planType === "flexible" && (
              <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <Text className="text-sm font-bold text-blue-800 mb-1">Flexible Terms</Text>
                <Text className="text-sm text-blue-700 leading-relaxed">
                  Pay any amount at any time. The full balance must be cleared within 6 months of activation.
                </Text>
              </View>
            )}

            {/* Notes */}
            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-700">Inspection Notes (Optional)</Text>
              <TextInput
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900"
                placeholder="Any comments about the asset or your visit…"
                placeholderTextColor="#9ca3af"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="bg-amber-400 py-4 rounded-2xl items-center"
              style={shadow.btn}
            >
              {isSubmitting
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Submit Offer</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function InspectionDetailsScreen() {
  useRequireAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [insp, setInsp] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalizeModalVisible, setFinalizeModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    if (!id) { setError("No inspection ID"); setLoading(false); return; }
    try {
      const data = await inspectionsApi.getById(id);
      setInsp(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load inspection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleFinalize = async (payload: CompleteInspectionPayload) => {
    if (!insp) return;
    setIsSubmitting(true);
    try {
      await inspectionsApi.completeInspection(insp.id, payload);
      setFinalizeModalVisible(false);
      Alert.alert(
        "Offer Submitted!",
        "Your offer and payment plan have been sent to the seller for review.",
        [
          { text: "View My Agreements", onPress: () => router.push("/my-agreements") },
          { text: "OK", style: "cancel" },
        ]
      );
      await load();
    } catch (e: any) {
      Alert.alert("Submission Failed", e?.response?.data?.detail ?? e?.message ?? "Could not submit offer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!insp) return;
    Alert.alert("Cancel Inspection", "Are you sure? This cannot be undone.", [
      { text: "Keep It", style: "cancel" },
      {
        text: "Cancel Inspection", style: "destructive",
        onPress: async () => {
          try {
            await inspectionsApi.cancel(insp.id);
            router.back();
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not cancel.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-3">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-sm text-gray-400">Loading inspection…</Text>
      </SafeAreaView>
    );
  }

  if (error || !insp) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-4 px-8">
        <AlertCircle size={40} color="#9ca3af" />
        <Text className="text-lg font-bold text-gray-900">Inspection not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-amber-400 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isVehicle = insp.asset_type === "automotive";
  const AssetIcon = isVehicle ? Car : Home;
  const iconBg = isVehicle ? "#fff7ed" : "#eff6ff";
  const iconColor = isVehicle ? "#ea580c" : "#3b82f6";

  const formattedDate = new Date(insp.inspection_date).toLocaleDateString("en-NG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const formattedTime = new Date(insp.inspection_date).toLocaleTimeString("en-NG", {
    hour: "2-digit", minute: "2-digit",
  });

  const canFinalize = insp.status === "confirmed";
  const canCancel = insp.status === "scheduled" || insp.status === "confirmed";
  const isAgreementReady = insp.status === "agreement_accepted";
  const isAgreementPending = insp.status === "agreement_pending";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Inspection Details" subtitle={`#${insp.id.slice(0, 8).toUpperCase()}`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-5">

          {/* Asset card */}
          <View className="bg-white rounded-3xl p-5" style={shadow.md}>
            <View className="flex-row items-center gap-4 mb-4">
              <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: iconBg }}>
                <AssetIcon size={28} color={iconColor} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-gray-900" numberOfLines={2}>
                  {insp.asset?.title ?? `${insp.asset_type} Asset`}
                </Text>
                <View className="mt-1.5"><StatusBadge status={insp.status} /></View>
              </View>
            </View>
            <View className="h-px bg-gray-100 mb-4" />
            <View className="flex-row items-start gap-3">
              <Calendar size={16} color="#9ca3af" style={{ marginTop: 1 }} />
              <View>
                <Text className="text-[10px] text-gray-400 font-semibold uppercase">Date & Time</Text>
                <Text className="text-sm font-bold text-gray-900">{formattedDate}</Text>
                <Text className="text-xs text-gray-500">{formattedTime}</Text>
              </View>
            </View>
          </View>

          {/* Status guidance */}
          {insp.status === "scheduled" && (
            <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
              <Text className="text-sm font-bold text-yellow-800 mb-1">Awaiting Seller Confirmation</Text>
              <Text className="text-sm text-yellow-700 leading-relaxed">
                Your request has been sent. The seller will confirm a date and time soon.
              </Text>
            </View>
          )}

          {canFinalize && (
            <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <Text className="text-sm font-bold text-blue-800 mb-1">Inspection Confirmed ✓</Text>
              <Text className="text-sm text-blue-700 leading-relaxed">
                After your visit, tap "Finalize Offer & Plan" to submit your offer and payment plan to the seller.
              </Text>
            </View>
          )}

          {isAgreementPending && (
            <View className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <Text className="text-sm font-bold text-purple-800 mb-1">Offer Under Review</Text>
              <Text className="text-sm text-purple-700 leading-relaxed">
                Your offer and payment plan have been submitted. The seller is reviewing.
              </Text>
            </View>
          )}

          {isAgreementReady && (
            <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <Text className="text-sm font-bold text-green-800 mb-1">Agreement Approved! 🎉</Text>
              <Text className="text-sm text-green-700 leading-relaxed">
                The seller approved your offer. Go to My Agreements to make your deposit and activate the plan.
              </Text>
            </View>
          )}

          {/* Financial summary */}
          {insp.asset && (
            <View className="bg-white rounded-3xl p-5" style={shadow.md}>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Financial Summary</Text>
              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Listing Price</Text>
                  <Text className="text-sm font-bold text-gray-900">{fmt(insp.asset.price)}</Text>
                </View>
                {insp.asset.min_deposit_percentage && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-500">Min. Deposit ({insp.asset.min_deposit_percentage}%)</Text>
                    <Text className="text-sm font-bold text-amber-500">
                      {fmt((insp.asset.price * Number(insp.asset.min_deposit_percentage)) / 100)}
                    </Text>
                  </View>
                )}
                {insp.agreed_price && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-500">Agreed Price</Text>
                    <Text className="text-sm font-bold text-green-600">{fmt(insp.agreed_price)}</Text>
                  </View>
                )}
                <View className="h-px bg-gray-100 my-1" />
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Inspection Fee</Text>
                  <Text className="text-sm font-bold text-green-600">Free</Text>
                </View>
              </View>
            </View>
          )}

          {/* Notes */}
          {insp.notes && (
            <View className="bg-amber-50 rounded-3xl p-5 border border-amber-100">
              <Text className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Notes</Text>
              <Text className="text-sm text-amber-800 leading-relaxed">{insp.notes}</Text>
            </View>
          )}

          {/* Actions */}
          {canFinalize && (
            <TouchableOpacity
              onPress={() => setFinalizeModalVisible(true)}
              className="bg-amber-400 py-4 rounded-2xl items-center"
              style={shadow.btn}
            >
              <Text className="text-white font-bold text-base">Finalize Offer & Plan</Text>
            </TouchableOpacity>
          )}

          {isAgreementReady && (
            <TouchableOpacity
              onPress={() => router.push("/my-agreements")}
              className="bg-green-500 py-4 rounded-2xl items-center"
              style={shadow.btn}
            >
              <Text className="text-white font-bold text-base">Pay Deposit → View Agreement</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              onPress={handleCancel}
              className="border border-red-200 bg-red-50 py-4 rounded-2xl items-center"
            >
              <Text className="text-red-600 font-semibold">Cancel Inspection Request</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>

      <FinalizeOfferModal
        visible={finalizeModalVisible}
        onClose={() => setFinalizeModalVisible(false)}
        onSubmit={handleFinalize}
        assetPrice={insp.asset?.price ?? 0}
        isSubmitting={isSubmitting}
      />
    </SafeAreaView>
  );
}

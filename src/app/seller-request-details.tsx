import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { CheckCircle, FileText } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { shadow } from "@/constants/shadows";
import { inspectionsApi, sellerRequestsApi, productsApi, getApiError } from "@/api";
import type { Inspection, Agreement, AssetPayment } from "@/api";
import { fmt, formatDate } from "@/utils/format";

export default function SellerRequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [payments, setPayments] = useState<AssetPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<{ id: string; label: string }[] | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const insp = await inspectionsApi.getById(id);
      setInspection(insp);
      const agreements = await inspectionsApi.listAgreements();
      const match = agreements.find((a) => a.inspection_id === id) ?? null;
      setAgreement(match);
      if (match) {
        const allPayments = await sellerRequestsApi.listPayments();
        setPayments(allPayments.filter((p) => p.agreement_id === match.id));
      }
    } catch {
      setInspection(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleReview = async (action: "approve" | "reject") => {
    if (!inspection) return;
    setActing(true);
    try {
      await sellerRequestsApi.reviewInspection(inspection.id, action);
      load();
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setActing(false);
    }
  };

  const startApproveAgreement = async () => {
    if (!agreement) return;
    setActing(true);
    try {
      const units = agreement.asset_type === "automotive"
        ? (await productsApi.getCarById(agreement.asset_id)).units.filter((u) => u.status === "available").map((u) => ({ id: u.id, label: `${u.color ?? "Unit"} · ${u.mileage.toLocaleString()} km${u.vin ? ` · ${u.vin}` : ""}` }))
        : agreement.asset_type === "property"
        ? (await productsApi.getPropertyById(agreement.asset_id)).units.filter((u) => u.status === "available").map((u) => ({ id: u.id, label: (u as any).unit_name || u.unit_number || "Unit" }))
        : [];

      if (units.length > 1) {
        setAvailableUnits(units);
      } else {
        await sellerRequestsApi.approveAgreement(agreement.id, units[0]?.id);
        load();
      }
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setActing(false);
    }
  };

  const confirmApproveWithUnit = async () => {
    if (!agreement || !selectedUnitId) return;
    setActing(true);
    try {
      await sellerRequestsApi.approveAgreement(agreement.id, selectedUnitId);
      setAvailableUnits(null);
      setSelectedUnitId(null);
      load();
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setActing(false);
    }
  };

  const handleRejectAgreement = async () => {
    if (!agreement) return;
    setActing(true);
    try {
      await sellerRequestsApi.rejectAgreement(agreement.id);
      load();
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setActing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Request Details" />
      {loading ? (
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 60 }} />
      ) : !inspection ? (
        <View className="items-center justify-center flex-1"><Text className="text-gray-500">Request not found.</Text></View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="gap-4">
            <View className="bg-white rounded-3xl p-5" style={shadow.md}>
              <View className="flex-row items-center justify-between">
                <View className="w-12 h-12 rounded-2xl bg-purple-50 items-center justify-center">
                  <FileText size={22} color="#7e22ce" />
                </View>
                <StatusBadge status={inspection.status} />
              </View>
              <Text className="text-lg font-extrabold text-gray-900 mt-3">{inspection.asset?.title}</Text>
              <Text className="text-sm text-gray-500 mt-0.5">{fmt(inspection.asset?.price ?? 0)}</Text>
              <Text className="text-xs text-gray-400 mt-2">Requested by {inspection.user?.name || inspection.user?.email}</Text>
              <Text className="text-xs text-gray-400">Viewing: {formatDate(inspection.inspection_date)}</Text>
            </View>

            {inspection.status === "scheduled" && (
              <View className="flex-row gap-3">
                <View className="flex-1"><PrimaryButton label="Approve" loading={acting} onPress={() => handleReview("approve")} /></View>
                <View className="flex-1"><PrimaryButton label="Reject" variant="dark" loading={acting} onPress={() => handleReview("reject")} /></View>
              </View>
            )}

            {inspection.status === "confirmed" && (
              <View className="bg-blue-50 rounded-2xl p-4">
                <Text className="text-sm text-blue-900">Viewing confirmed. Waiting for the buyer to submit an offer after inspection.</Text>
              </View>
            )}

            {agreement && (
              <View className="bg-white rounded-2xl p-4 gap-2" style={shadow.card}>
                <Text className="text-xs font-bold text-gray-400 uppercase mb-1">Agreement</Text>
                <View className="flex-row justify-between"><Text className="text-xs text-gray-500">Total Price</Text><Text className="text-sm font-bold text-gray-900">{fmt(agreement.total_price)}</Text></View>
                <View className="flex-row justify-between"><Text className="text-xs text-gray-500">Deposit Paid</Text><Text className="text-sm font-bold text-gray-900">{fmt(agreement.deposit_paid)}</Text></View>
                <View className="flex-row justify-between"><Text className="text-xs text-gray-500">Balance</Text><Text className="text-sm font-bold text-gray-900">{fmt(agreement.remaining_balance ?? 0)}</Text></View>
                <View className="flex-row justify-between"><Text className="text-xs text-gray-500">Plan</Text><Text className="text-sm font-bold text-gray-900 capitalize">{agreement.plan_type}{agreement.duration_months ? ` · ${agreement.duration_months}mo` : ""}</Text></View>
                {agreement.next_due_date && (
                  <View className="flex-row justify-between"><Text className="text-xs text-gray-500">Next Due</Text><Text className="text-sm font-bold text-gray-900">{formatDate(agreement.next_due_date)}</Text></View>
                )}
              </View>
            )}

            {agreement?.status === "pending_review" && !availableUnits && (
              <View className="flex-row gap-3">
                <View className="flex-1"><PrimaryButton label="Approve & Finalize" loading={acting} onPress={startApproveAgreement} /></View>
                <View className="flex-1"><PrimaryButton label="Reject Offer" variant="dark" loading={acting} onPress={handleRejectAgreement} /></View>
              </View>
            )}

            {availableUnits && (
              <View className="bg-white rounded-2xl p-4 gap-3" style={shadow.card}>
                <Text className="text-xs font-bold text-gray-400 uppercase">Select Unit to Assign</Text>
                {availableUnits.map((u) => (
                  <TouchableOpacity key={u.id} onPress={() => setSelectedUnitId(u.id)} className="flex-row items-center justify-between py-2 border-b border-gray-50">
                    <Text className="text-sm text-gray-800 flex-1">{u.label}</Text>
                    {selectedUnitId === u.id && <CheckCircle size={16} color="#16a34a" />}
                  </TouchableOpacity>
                ))}
                <PrimaryButton label="Confirm Approval" loading={acting} disabled={!selectedUnitId} onPress={confirmApproveWithUnit} />
              </View>
            )}

            {payments.length > 0 && (
              <View className="bg-white rounded-2xl overflow-hidden" style={shadow.card}>
                <Text className="text-xs font-bold text-gray-400 uppercase p-4 pb-2">Payment History</Text>
                {payments.map((p) => (
                  <View key={p.id} className="flex-row items-center justify-between px-4 py-3 border-t border-gray-50">
                    <View>
                      <Text className="text-sm font-semibold text-gray-900 capitalize">{p.payment_category.replace(/_/g, " ")}</Text>
                      <Text className="text-xs text-gray-400">{formatDate(p.created_at)}</Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-sm font-bold text-gray-900">{fmt(p.amount)}</Text>
                      <StatusBadge status={p.status} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, Alert, Modal, TextInput, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { Car, Home, Calendar, CreditCard, AlertCircle, X } from "lucide-react-native";
import { fmt } from "@/utils/format";
import { inspectionsApi } from "@/api";
import type { Agreement } from "@/api";
import { useAuthStore } from "@/store/authStore";

function progressPercent(agr: Agreement): number {
  if (!agr.total_price) return 0;
  const paid = agr.total_paid ?? agr.deposit_paid ?? 0;
  return Math.min(100, Math.round((paid / agr.total_price) * 100));
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────

function PaymentModal({
  visible,
  onClose,
  onPay,
  agreementTotal,
  remainingBalance,
  minDeposit,
  isDeposit,
  isPaying,
}: {
  visible: boolean;
  onClose: () => void;
  onPay: (amount: number) => void;
  agreementTotal: number;
  remainingBalance: number;
  minDeposit: number;
  isDeposit: boolean;
  isPaying: boolean;
}) {
  const [amount, setAmount] = useState(String(isDeposit ? minDeposit : 0));

  const numAmount = Number(amount) || 0;
  const tooLow = isDeposit && numAmount < minDeposit;
  const tooHigh = numAmount > remainingBalance;

  const quickAmounts = [
    { label: "10%", value: Math.round(agreementTotal * 0.1) },
    { label: "20%", value: Math.round(agreementTotal * 0.2) },
    { label: "50%", value: Math.round(agreementTotal * 0.5) },
    { label: "Full", value: remainingBalance },
  ].filter((q) => q.value <= remainingBalance && q.value >= minDeposit);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
          <Text className="text-lg font-extrabold text-gray-900">
            {isDeposit ? "Make Deposit Payment" : "Pay Installment"}
          </Text>
          <TouchableOpacity onPress={onClose} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
            <X size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
          <View className="gap-5 pb-10">
            {/* Balance info */}
            <View className="bg-gray-50 rounded-2xl p-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Remaining Balance</Text>
                <Text className="text-sm font-bold text-gray-900">{fmt(remainingBalance)}</Text>
              </View>
              {isDeposit && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Minimum Deposit</Text>
                  <Text className="text-sm font-bold text-amber-600">{fmt(minDeposit)}</Text>
                </View>
              )}
            </View>

            {/* Amount input */}
            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-700">Payment Amount (₦) *</Text>
              <TextInput
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 text-lg font-bold text-gray-900"
                placeholder="Enter amount"
                placeholderTextColor="#9ca3af"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              {tooLow && (
                <Text className="text-xs text-red-500">
                  Minimum first payment is {fmt(minDeposit)}
                </Text>
              )}
              {tooHigh && (
                <Text className="text-xs text-red-500">
                  Cannot exceed remaining balance of {fmt(remainingBalance)}
                </Text>
              )}
            </View>

            {/* Quick amount buttons */}
            {quickAmounts.length > 0 && (
              <View className="gap-2">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quick Select</Text>
                <View className="flex-row flex-wrap gap-2">
                  {quickAmounts.map((q) => (
                    <TouchableOpacity
                      key={q.label}
                      onPress={() => setAmount(String(q.value))}
                      className={`px-4 py-2 rounded-xl border ${numAmount === q.value ? "bg-amber-400 border-amber-400" : "bg-white border-gray-200"}`}
                    >
                      <Text className={`text-xs font-bold ${numAmount === q.value ? "text-white" : "text-gray-700"}`}>
                        {q.label} — {fmt(q.value)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <Text className="text-sm font-bold text-blue-800 mb-1">Secured via Paystack</Text>
              <Text className="text-sm text-blue-700 leading-relaxed">
                You'll be redirected to Paystack to complete payment. Your balance updates automatically after verification.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => onPay(numAmount)}
              disabled={isPaying || numAmount <= 0 || tooLow || tooHigh}
              className={`py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                isPaying || numAmount <= 0 || tooLow || tooHigh ? "bg-amber-200" : "bg-amber-400"
              }`}
              style={shadow.btn}
            >
              {isPaying
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <CreditCard size={16} color="#fff" />
                    <Text className="text-white font-bold">
                      Pay {numAmount > 0 ? fmt(numAmount) : "…"}
                    </Text>
                  </>
                )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function AgreementDetailsScreen() {
  useRequireAuth();
  const router = useRouter();
  const { id, openPayment } = useLocalSearchParams<{ id: string; openPayment?: string }>();
  const { user } = useAuthStore();

  const [agr, setAgr] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!id) { setError("No agreement ID"); setLoading(false); return; }
    try {
      const data = await inspectionsApi.getAgreementById(id);
      setAgr(data ?? null);
      if (!data) setError("Agreement not found");
    } catch (e: any) {
      setError(e?.message ?? "Failed to load agreement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Auto-open payment modal when navigated here from the list's Pay button
  useEffect(() => {
    if (!loading && agr && openPayment === "true") {
      setPayModalVisible(true);
    }
  }, [loading, agr, openPayment]);

  const handlePay = async (amount: number) => {
    if (!agr || !user?.email) return;
    setIsPaying(true);
    try {
      const category = agr.status === "pending_deposit" ? "asset_deposit" : "asset_installment";
      const callbackUrl = "lelmarketplace://payment-callback"; // deep link
      const result = await inspectionsApi.initializeAgreementPayment(
        agr.id,
        amount,
        user.email,
        category,
        callbackUrl,
      );
      if (result.authorization_url) {
        setPayModalVisible(false);
        await Linking.openURL(result.authorization_url);
        // Refresh after returning from browser
        await load();
      }
    } catch (e: any) {
      Alert.alert(
        "Payment Failed",
        e?.response?.data?.detail ?? e?.message ?? "Could not initialise payment. Please try again."
      );
    } finally {
      setIsPaying(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Agreement",
      "Are you sure you want to cancel this agreement? Your deposit (if any) will be reviewed for refund.",
      [
        { text: "Keep Agreement", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              await inspectionsApi.cancelAgreement(agr!.id);
              Alert.alert("Cancelled", "Your agreement has been cancelled.");
              router.back();
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.detail ?? e?.message ?? "Could not cancel.");
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-3">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-sm text-gray-400">Loading agreement…</Text>
      </SafeAreaView>
    );
  }

  if (error || !agr) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-4 px-8">
        <AlertCircle size={40} color="#9ca3af" />
        <Text className="text-lg font-bold text-gray-900">Agreement not found</Text>
        <Text className="text-sm text-gray-400 text-center">{error}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-amber-400 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isVehicle = agr.asset_type === "automotive";
  const AssetIcon = isVehicle ? Car : Home;
  const pct = progressPercent(agr);
  const paid = agr.total_paid ?? agr.deposit_paid ?? 0;
  const minDeposit = Math.round((agr.total_price * (Number(agr.asset?.min_deposit_percentage ?? 10))) / 100);
  const remainingBalance = agr.remaining_balance ?? agr.total_price;

  const isDeposit = agr.status === "pending_deposit";
  const isActive = agr.status === "active";
  const canCancel = agr.status === "pending_review" || agr.status === "pending_deposit";
  const isCompleted = agr.status === "completed";

  const createdDate = new Date(agr.created_at).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Agreement Details" subtitle={`#${agr.id.slice(0, 8).toUpperCase()}`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-5">

          {/* Asset + status + progress */}
          <View className="bg-white rounded-3xl p-5" style={shadow.md}>
            <View className="flex-row items-center gap-4 mb-4">
              <View
                className={`w-14 h-14 rounded-2xl items-center justify-center ${isVehicle ? "bg-orange-50" : "bg-blue-50"}`}
              >
                <AssetIcon size={28} color={isVehicle ? "#ea580c" : "#3b82f6"} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-gray-900" numberOfLines={2}>
                  {agr.asset?.title ?? `${agr.asset_type} Asset`}
                </Text>
                <View className="mt-1.5">
                  <StatusBadge status={agr.status} />
                </View>
              </View>
            </View>

            {/* Progress bar */}
            {(isActive || isCompleted) && (
              <View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase">Amount Paid</Text>
                  <Text className="text-[10px] font-bold text-gray-600">{pct}%</Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-[10px] text-gray-400">{fmt(paid)} paid</Text>
                  <Text className="text-[10px] text-gray-400">{fmt(agr.total_price)} total</Text>
                </View>
              </View>
            )}
          </View>

          {/* Status guidance */}
          {agr.status === "pending_review" && (
            <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
              <Text className="text-sm font-bold text-yellow-800 mb-1">Awaiting Seller Approval</Text>
              <Text className="text-sm text-yellow-700 leading-relaxed">
                The seller is reviewing your offer. You'll be notified once approved.
              </Text>
            </View>
          )}

          {isDeposit && (
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <Text className="text-sm font-bold text-amber-800 mb-1">Deposit Required to Activate</Text>
              <Text className="text-sm text-amber-700 leading-relaxed">
                Pay the minimum deposit ({fmt(minDeposit)}) to activate your installment plan and secure this asset.
              </Text>
            </View>
          )}

          {isCompleted && (
            <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <Text className="text-sm font-bold text-green-800 mb-1">Agreement Completed ✓</Text>
              <Text className="text-sm text-green-700">
                All payments have been made. This asset is fully yours.
              </Text>
            </View>
          )}

          {/* Financial details */}
          <View className="bg-white rounded-3xl p-5" style={shadow.md}>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Financial Details</Text>
            <View className="gap-3">
              {[
                { label: "Total Price",         value: fmt(agr.total_price),                       color: "#111827" },
                { label: "Deposit Paid",         value: fmt(agr.deposit_paid),                      color: "#22c55e" },
                { label: "Remaining Balance",    value: fmt(remainingBalance),                      color: remainingBalance > 0 ? "#ef4444" : "#22c55e" },
                ...(agr.monthly_installment
                  ? [{ label: "Monthly Installment", value: fmt(agr.monthly_installment), color: "#f59e0b" }]
                  : []),
              ].map(({ label, value, color }) => (
                <View key={label} className="flex-row justify-between items-center">
                  <Text className="text-sm text-gray-500">{label}</Text>
                  <Text className="text-sm font-bold" style={{ color }}>{value}</Text>
                </View>
              ))}
              <View className="h-px bg-gray-100 my-1" />
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Plan Type</Text>
                <Text className="text-sm font-bold text-gray-800">
                  {agr.plan_type === "structured" ? "Structured" : "Flexible"}
                  {agr.duration_months ? ` · ${agr.duration_months} months` : ""}
                </Text>
              </View>
              {agr.next_due_date && isActive && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-gray-500">Next Payment Due</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Calendar size={12} color="#f59e0b" />
                    <Text className="text-sm font-bold text-amber-600">
                      {new Date(agr.next_due_date).toLocaleDateString("en-NG", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Pay deposit button */}
          {isDeposit && (
            <TouchableOpacity
              onPress={() => setPayModalVisible(true)}
              className="bg-amber-400 py-4 rounded-2xl flex-row items-center justify-center gap-2"
              style={shadow.btn}
            >
              <CreditCard size={16} color="#fff" />
              <Text className="text-white font-bold text-base">
                Pay Deposit — min. {fmt(minDeposit)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Pay installment button */}
          {isActive && remainingBalance > 0 && (
            <TouchableOpacity
              onPress={() => setPayModalVisible(true)}
              className="bg-amber-400 py-4 rounded-2xl flex-row items-center justify-center gap-2"
              style={shadow.btn}
            >
              <CreditCard size={16} color="#fff" />
              <Text className="text-white font-bold text-base">
                Pay Installment{agr.monthly_installment ? ` — ${fmt(agr.monthly_installment)}` : ""}
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel agreement */}
          {canCancel && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isCancelling}
              className="border border-red-200 bg-red-50 py-4 rounded-2xl items-center"
            >
              {isCancelling
                ? <ActivityIndicator color="#ef4444" />
                : <Text className="text-red-600 font-semibold">Cancel Agreement</Text>}
            </TouchableOpacity>
          )}

          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <Text className="text-xs text-gray-400 text-center leading-relaxed">
              Agreement signed on {createdDate}. All transactions are secured via our escrow system.
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Payment modal */}
      {agr && (
        <PaymentModal
          visible={payModalVisible}
          onClose={() => setPayModalVisible(false)}
          onPay={handlePay}
          agreementTotal={agr.total_price}
          remainingBalance={remainingBalance}
          minDeposit={minDeposit}
          isDeposit={isDeposit}
          isPaying={isPaying}
        />
      )}
    </SafeAreaView>
  );
}

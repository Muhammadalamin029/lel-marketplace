import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { Car, Home, Calendar, CreditCard, AlertCircle, CheckCircle } from "lucide-react-native";
import { fmt } from "@/utils/format";

const MOCK_AGREEMENTS: Record<string, any> = {
  "AGR-001": {
    id: "AGR-001",
    assetName: "Toyota Camry 2022",
    assetType: "vehicle",
    seller: "Premium Auto Lagos",
    status: "active",
    totalPrice: 18500000,
    depositPaid: 1850000,
    remainingBalance: 16650000,
    monthlyInstallment: 1000000,
    nextDueDate: "10 Jul 2026",
    duration: "18 months",
    planType: "Structured",
    createdAt: "10 Jun 2026",
  },
  "AGR-002": {
    id: "AGR-002",
    assetName: "3-Bed Apartment Lekki",
    assetType: "real_estate",
    seller: "Lekki Realty Co.",
    status: "pending_deposit",
    totalPrice: 85000000,
    depositPaid: 0,
    remainingBalance: 85000000,
    monthlyInstallment: 4000000,
    nextDueDate: null,
    duration: "24 months",
    planType: "Structured",
    createdAt: "05 Jun 2026",
  },
};

export default function AgreementDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agr = MOCK_AGREEMENTS[id ?? "AGR-001"];

  if (!agr) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center gap-4 px-8">
        <AlertCircle size={40} color="#9ca3af" />
        <Text className="text-lg font-bold text-gray-900">Agreement not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-amber-400 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const AssetIcon = agr.assetType === "vehicle" ? Car : Home;
  const paidPercent = Math.round((agr.depositPaid / agr.totalPrice) * 100);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Agreement Details" subtitle={`Ref: #${agr.id}`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-5">

          {/* Asset + status */}
          <View className="bg-white rounded-3xl p-5" style={shadow.md}>
            <View className="flex-row items-center gap-4 mb-4">
              <View className={`w-14 h-14 rounded-2xl items-center justify-center ${agr.assetType === "vehicle" ? "bg-orange-50" : "bg-blue-50"}`}>
                <AssetIcon size={28} color={agr.assetType === "vehicle" ? "#ea580c" : "#3b82f6"} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-gray-900">{agr.assetName}</Text>
                <Text className="text-xs text-gray-400 mt-0.5">{agr.seller}</Text>
                <View className="mt-1.5">
                  <StatusBadge status={agr.status} />
                </View>
              </View>
            </View>

            {/* Progress bar */}
            {agr.depositPaid > 0 && (
              <View className="mt-2">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase">Amount Paid</Text>
                  <Text className="text-[10px] font-bold text-gray-600">{paidPercent}%</Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View className="h-full bg-amber-400 rounded-full" style={{ width: `${paidPercent}%` }} />
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-[10px] text-gray-400">{fmt(agr.depositPaid)} paid</Text>
                  <Text className="text-[10px] text-gray-400">{fmt(agr.totalPrice)} total</Text>
                </View>
              </View>
            )}
          </View>

          {/* Financial summary */}
          <View className="bg-white rounded-3xl p-5" style={shadow.md}>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Financial Details</Text>
            <View className="gap-3">
              {[
                { label: "Total Price", value: fmt(agr.totalPrice), color: "#111827" },
                { label: "Deposit Paid", value: fmt(agr.depositPaid), color: "#22c55e" },
                { label: "Remaining Balance", value: fmt(agr.remainingBalance), color: "#ef4444" },
                { label: "Monthly Installment", value: fmt(agr.monthlyInstallment), color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <View key={label} className="flex-row justify-between items-center">
                  <Text className="text-sm text-gray-500">{label}</Text>
                  <Text className="text-sm font-bold" style={{ color }}>{value}</Text>
                </View>
              ))}
              <View className="h-px bg-gray-100 my-1" />
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Plan Type</Text>
                <Text className="text-sm font-bold text-gray-800">{agr.planType} · {agr.duration}</Text>
              </View>
              {agr.nextDueDate && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-gray-500">Next Payment Due</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Calendar size={12} color="#f59e0b" />
                    <Text className="text-sm font-bold text-amber-600">{agr.nextDueDate}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          {agr.status === "pending_deposit" && (
            <TouchableOpacity className="bg-amber-400 py-4 rounded-2xl flex-row items-center justify-center gap-2" style={shadow.btn}>
              <CreditCard size={16} color="#fff" />
              <Text className="text-white font-bold">Pay Deposit — {fmt(agr.totalPrice * 0.1)}</Text>
            </TouchableOpacity>
          )}

          {agr.status === "active" && (
            <TouchableOpacity className="bg-amber-400 py-4 rounded-2xl flex-row items-center justify-center gap-2" style={shadow.btn}>
              <CreditCard size={16} color="#fff" />
              <Text className="text-white font-bold">Pay Installment — {fmt(agr.monthlyInstallment)}</Text>
            </TouchableOpacity>
          )}

          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <Text className="text-xs text-gray-500 text-center leading-relaxed">
              Agreement started on {agr.createdAt}. All transactions are secured via our escrow system.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

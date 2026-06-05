import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { TabSelector } from "@/components/TabSelector";
import { shadow } from "@/constants/shadows";
import { CreditCard, ChevronRight } from "lucide-react-native";
import { fmt, formatDate } from "@/utils/format";
import { paymentsApi } from "@/api";
import type { Payment } from "@/api";

const TABS = ["All", "Orders", "Assets"] as const;
type Tab = typeof TABS[number];

const CATEGORY_LABELS: Record<string, string> = {
  order: "Product Order",
  asset_deposit: "Asset Deposit",
  asset_installment: "Installment",
  full_pay: "Full Payment",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  order:              { bg: "#eff6ff", text: "#3b82f6" },
  asset_deposit:      { bg: "#faf5ff", text: "#8b5cf6" },
  asset_installment:  { bg: "#fffbeb", text: "#f59e0b" },
  full_pay:           { bg: "#f0fdf4", text: "#22c55e" },
};

function tabFilter(payments: Payment[], tab: Tab): Payment[] {
  if (tab === "Orders") return payments.filter((p) => p.payment_category === "order");
  if (tab === "Assets") return payments.filter((p) => p.payment_category !== "order");
  return payments;
}

export default function MyPaymentsScreen() {
  useRequireAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("All");

  useEffect(() => {
    paymentsApi.list({ limit: 50 })
      .then((res) => setPayments(res.data ?? []))
      .catch((e) => setError(e?.message ?? "Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const visible = tabFilter(payments, activeTab);
  const totalSpent = payments.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="My Payments" subtitle="Transaction history" />

      {/* Summary card */}
      {!loading && payments.length > 0 && (
        <View className="mx-5 mt-4 mb-2 bg-amber-400 rounded-2xl p-4 flex-row items-center justify-between" style={shadow.btn}>
          <View>
            <Text className="text-xs text-white/70 font-medium">Total Spent</Text>
            <Text className="text-xl font-extrabold text-white">{fmt(totalSpent)}</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <CreditCard size={20} color="#fff" />
          </View>
        </View>
      )}

      <View className="px-5 pt-3 pb-2">
        <TabSelector tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <ScrollView className="flex-1 px-5 pt-3" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400 mt-3">Loading payments…</Text>
          </View>
        ) : error ? (
          <EmptyState Icon={CreditCard} title="Could not load payments" subtitle={error} />
        ) : visible.length === 0 ? (
          <EmptyState Icon={CreditCard} title="No payments found" subtitle={`No ${activeTab !== "All" ? activeTab.toLowerCase() + " " : ""}payments yet.`} />
        ) : (
          <View className="gap-3 pb-10">
            {visible.map((p) => {
              const colors = CATEGORY_COLORS[p.payment_category] ?? { bg: "#f3f4f6", text: "#6b7280" };
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/my-payment-details?id=${p.id}` as any)}
                  className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
                  style={shadow.card}
                  activeOpacity={0.85}
                >
                  <View className="w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.bg }}>
                    <CreditCard size={22} color={colors.text} />
                  </View>

                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-bold text-gray-900">
                      {CATEGORY_LABELS[p.payment_category] ?? p.payment_category}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                      {p.seller_name ? `To: ${p.seller_name}` : `Ref: ${p.transaction_id.slice(0, 14)}…`}
                    </Text>
                    <Text className="text-[10px] text-gray-400 mt-0.5">{formatDate(p.created_at)}</Text>
                  </View>

                  <View className="items-end gap-1.5">
                    <Text className="text-base font-extrabold text-gray-900">{fmt(p.amount)}</Text>
                    <StatusBadge status={p.status} />
                  </View>

                  <ChevronRight size={14} color="#d1d5db" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
import { inspectionsApi } from "@/api";
import type { Agreement } from "@/api";
import { Car, Home, CreditCard, Calendar, ChevronRight, FileText } from "lucide-react-native";
import { fmt } from "@/utils/format";

const TABS = ["All", "Active", "Pending", "Completed"] as const;
type Tab = typeof TABS[number];

function tabFilter(agreements: Agreement[], tab: Tab): Agreement[] {
  switch (tab) {
    case "Active":    return agreements.filter((a) => a.status === "active");
    case "Pending":   return agreements.filter((a) => ["pending_review", "pending_deposit"].includes(a.status));
    case "Completed": return agreements.filter((a) => ["completed", "cancelled", "defaulted"].includes(a.status));
    default:          return agreements;
  }
}

function progressPercent(agr: Agreement): number {
  if (!agr.total_price || agr.total_price === 0) return 0;
  const paid = agr.total_paid ?? agr.deposit_paid ?? 0;
  return Math.min(100, Math.round((paid / agr.total_price) * 100));
}

export default function MyAgreementsScreen() {
  useRequireAuth();
  const router = useRouter();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("All");

  useEffect(() => {
    let cancelled = false;
    inspectionsApi.listAgreements()
      .then((data) => { if (!cancelled) setAgreements(data ?? []); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Failed to load agreements"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visible = tabFilter(agreements, activeTab);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="My Agreements" subtitle="Purchase & installment contracts" />

      <View className="px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <TabSelector tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400 mt-3">Loading agreements…</Text>
          </View>
        ) : error ? (
          <EmptyState Icon={FileText} title="Could not load agreements" subtitle={error} />
        ) : visible.length === 0 ? (
          <EmptyState
            Icon={FileText}
            title="No agreements found"
            subtitle={activeTab === "All" ? "You haven't entered any purchase agreements yet." : `No ${activeTab.toLowerCase()} agreements.`}
          />
        ) : (
          <View className="gap-4 pb-10">
            {visible.map((agr) => {
              const isVehicle = agr.asset_type === "automotive";
              const AssetIcon = isVehicle ? Car : Home;
              const iconBg = isVehicle ? "#fff7ed" : "#eff6ff";
              const iconColor = isVehicle ? "#ea580c" : "#3b82f6";
              const pct = progressPercent(agr);
              const paid = agr.total_paid ?? agr.deposit_paid ?? 0;

              return (
                <TouchableOpacity
                  key={agr.id}
                  onPress={() => router.push(`/agreement-details?id=${agr.id}` as any)}
                  className="bg-white rounded-3xl p-5"
                  style={shadow.md}
                  activeOpacity={0.85}
                >
                  {/* Asset row */}
                  <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
                      <AssetIcon size={24} color={iconColor} strokeWidth={1.5} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-extrabold text-gray-900" numberOfLines={1}>
                        {agr.asset?.title ?? `${agr.asset_type} Asset`}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5">
                        #{agr.id.slice(0, 8).toUpperCase()} · {agr.plan_type === "structured" ? "Installment" : "Flexible"}
                      </Text>
                    </View>
                    <StatusBadge status={agr.status} />
                  </View>

                  {/* Progress bar */}
                  {agr.status === "active" && (
                    <View className="mb-4">
                      <View className="flex-row justify-between mb-1.5">
                        <Text className="text-[10px] text-gray-400 font-semibold uppercase">Amount Paid</Text>
                        <Text className="text-[10px] font-bold text-gray-600">{pct}%</Text>
                      </View>
                      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <View className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </View>
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-[10px] text-gray-400">{fmt(paid)} paid</Text>
                        <Text className="text-[10px] text-gray-400">{fmt(agr.total_price)} total</Text>
                      </View>
                    </View>
                  )}

                  {/* Key financials */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-gray-50 rounded-xl p-3">
                      <Text className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Total Price</Text>
                      <Text className="text-sm font-bold text-gray-900">{fmt(agr.total_price)}</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 rounded-xl p-3">
                      <Text className="text-[10px] text-gray-400 font-semibold uppercase mb-1">
                        {agr.status === "pending_deposit" ? "Deposit Due" : "Remaining"}
                      </Text>
                      <Text className="text-sm font-bold text-amber-500">
                        {fmt(agr.remaining_balance ?? agr.total_price)}
                      </Text>
                    </View>
                    {agr.monthly_installment && (
                      <View className="flex-1 bg-gray-50 rounded-xl p-3">
                        <Text className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Monthly</Text>
                        <Text className="text-sm font-bold text-gray-900">{fmt(agr.monthly_installment)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Next due date */}
                  {agr.next_due_date && agr.status === "active" && (
                    <View className="flex-row items-center gap-2 bg-amber-50 rounded-xl px-3 py-2 mb-4 border border-amber-100">
                      <Calendar size={13} color="#f59e0b" />
                      <Text className="text-xs text-amber-700 font-semibold">
                        Next payment due:{" "}
                        {new Date(agr.next_due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                  )}

                  {/* CTAs */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    {agr.status === "pending_deposit" && (
                      <TouchableOpacity
                        onPress={() => router.push(`/agreement-details?id=${agr.id}&openPayment=true` as any)}
                        className="flex-row items-center gap-1.5 bg-amber-400 px-4 py-2 rounded-xl"
                        style={shadow.btn}
                      >
                        <CreditCard size={14} color="#fff" />
                        <Text className="text-white text-xs font-bold">Pay Deposit</Text>
                      </TouchableOpacity>
                    )}
                    {agr.status === "active" && (
                      <TouchableOpacity
                        onPress={() => router.push(`/agreement-details?id=${agr.id}&openPayment=true` as any)}
                        className="flex-row items-center gap-1.5 bg-amber-400 px-4 py-2 rounded-xl"
                        style={shadow.btn}
                      >
                        <CreditCard size={14} color="#fff" />
                        <Text className="text-white text-xs font-bold">Pay Installment</Text>
                      </TouchableOpacity>
                    )}
                    {!["pending_deposit", "active"].includes(agr.status) && <View />}
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs font-bold text-indigo-600">Details</Text>
                      <ChevronRight size={14} color="#4f46e5" />
                    </View>
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

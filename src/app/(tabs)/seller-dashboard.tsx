import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { shadow } from "@/constants/shadows";
import {
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  CreditCard,
  TrendingUp,
  ShoppingBag,
  ShieldAlert,
  Bell,
  Plus,
  Wallet,
} from "lucide-react-native";
import { dashboardApi } from "@/api";
import type { SellerStats, SellerProfileData } from "@/api";
import { fmt } from "@/utils/format";
import { useAuthStore } from "@/store/authStore";
import { listingMeta } from "@/utils/sellerType";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

function QuickAction({ label, Icon, onPress }: { label: string; Icon: any; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-1 items-center gap-2 py-1">
      <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center">
        <Icon size={20} color="#d97706" />
      </View>
      <Text className="text-xs font-bold text-gray-700 text-center">{label}</Text>
    </TouchableOpacity>
  );
}

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const sellerType = (profile as SellerProfileData)?.seller_type ?? "retailer";
  const meta = listingMeta(sellerType);
  const usesOrders = sellerType === "retailer";
  const [stats, setStats] = useState<SellerStats | null>(null);

  const fetchData = useCallback(async () => {
    try { setStats(await dashboardApi.sellerStats("30d")); } catch { setStats(null); }
  }, []);

  const { loading, refreshing, load, onRefresh } = usePullToRefresh(fetchData);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const kycStatus = stats?.kyc_status || (profile as SellerProfileData)?.kyc_status;
  const isKycApproved = kycStatus === "approved";
  const payoutConfigured = stats?.alerts?.payout_account_configured;
  const businessName = stats?.business_name || (profile as SellerProfileData)?.business_name || "Seller";
  const secondaryTabRoute = usesOrders ? "/(tabs)/seller-orders" : "/(tabs)/requests";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center justify-between px-5 pt-4 pb-4 bg-white border-b border-gray-100">
        <View>
          <Text className="text-lg font-extrabold text-gray-900">Seller Dashboard</Text>
          <Text className="text-xs text-gray-500">Manage your business</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/notifications" as any)} className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <Bell size={20} color="#374151" strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" colors={["#f59e0b"]} />}
      >
        {loading ? (
          <View className="items-center justify-center pt-20 gap-3">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400">Loading dashboard...</Text>
          </View>
        ) : !stats ? (
          <View className="items-center justify-center pt-20 gap-3">
            <AlertCircle size={48} color="#ef4444" />
            <Text className="text-base text-gray-900 font-bold">Failed to load stats</Text>
            <Text className="text-sm text-gray-400 text-center">Pull down to try again.</Text>
          </View>
        ) : (
          <View className="gap-5">

            {/* Hero */}
            <View className="bg-amber-400 rounded-3xl p-5" style={shadow.btn}>
              <View className="flex-row items-center gap-3">
                <View className="w-14 h-14 rounded-2xl bg-white/25 items-center justify-center">
                  <Text className="text-white text-xl font-extrabold">{businessName.charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold uppercase tracking-widest text-white/80">Welcome back</Text>
                  <Text className="text-xl font-extrabold text-white" numberOfLines={1}>{businessName}</Text>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2 mt-4">
                <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-white/20">
                  {isKycApproved ? <CheckCircle size={12} color="#fff" /> : <Clock size={12} color="#fff" />}
                  <Text className="text-[10px] font-bold uppercase text-white">KYC {kycStatus}</Text>
                </View>
                {!payoutConfigured && (
                  <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-white/20">
                    <AlertCircle size={12} color="#fff" />
                    <Text className="text-[10px] font-bold uppercase text-white">Missing Payout Info</Text>
                  </View>
                )}
              </View>
            </View>

            {/* KYC CTA */}
            {!isKycApproved && (
              <TouchableOpacity
                onPress={() => router.push("/seller-kyc" as any)}
                className="bg-blue-50 p-4 rounded-2xl flex-row items-center gap-3"
              >
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                  <ShieldAlert size={20} color="#2563eb" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-blue-900">Verify your account</Text>
                  <Text className="text-xs text-blue-800 mt-0.5">Complete verification to list {meta.label.toLowerCase()} and get paid.</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Quick Actions */}
            <View className="bg-white rounded-3xl p-4 flex-row" style={shadow.md}>
              <QuickAction label={`Add ${meta.singular}`} Icon={Plus} onPress={() => router.push(meta.addRoute as any)} />
              <QuickAction label={usesOrders ? "Orders" : "Requests"} Icon={usesOrders ? ShoppingBag : FileText} onPress={() => router.push(secondaryTabRoute as any)} />
              <QuickAction label="Payouts" Icon={Wallet} onPress={() => router.push("/(tabs)/payouts" as any)} />
            </View>

            {/* Quick Stats Grid */}
            <View className="flex-row flex-wrap gap-4">
              <View className="bg-white p-4 rounded-2xl flex-1 min-w-[45%]" style={shadow.sm}>
                <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mb-2">
                  <DollarSign size={20} color="#16a34a" />
                </View>
                <Text className="text-xs font-bold text-gray-400 uppercase">Gross Revenue</Text>
                <Text className="text-lg font-extrabold text-gray-900 mt-1">{fmt(stats.total_revenue || 0)}</Text>
                <Text className="text-[10px] text-gray-400 mt-1 text-green-600">Total completed</Text>
              </View>

              <View className="bg-white p-4 rounded-2xl flex-1 min-w-[45%]" style={shadow.sm}>
                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mb-2">
                  <TrendingUp size={20} color="#2563eb" />
                </View>
                <Text className="text-xs font-bold text-gray-400 uppercase">Net Earnings</Text>
                <Text className="text-lg font-extrabold text-gray-900 mt-1">{fmt(stats.net_revenue || 0)}</Text>
                <Text className="text-[10px] text-blue-600 font-medium mt-1">Est. after fees</Text>
              </View>
            </View>

            {/* Business Summary — content depends on what this seller actually sells */}
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 ml-2">
                Business Summary
              </Text>
              <View className="bg-white rounded-3xl overflow-hidden" style={shadow.md}>

                {usesOrders ? (
                  <TouchableOpacity onPress={() => router.push("/(tabs)/seller-orders" as any)} className="flex-row p-4 border-b border-gray-50 items-center gap-4">
                    <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center">
                      <ShoppingBag size={24} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-gray-900">{stats.total_orders || 0} Orders</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{stats.pending_orders || 0} pending, {stats.delivered_orders || 0} delivered</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => router.push("/(tabs)/products" as any)} className="flex-row p-4 border-b border-gray-50 items-center gap-4">
                    <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center">
                      <meta.icon size={24} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-gray-900">{stats.total_assets || 0} {meta.label}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">Manage your listings</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {!usesOrders && (
                  <TouchableOpacity onPress={() => router.push("/(tabs)/requests" as any)} className="flex-row p-4 items-center gap-4">
                    <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center">
                      <FileText size={24} color="#7e22ce" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-gray-900">{stats.total_agreements || 0} Agreements</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{stats.pending_inspections || 0} inspections + {stats.pending_agreements || 0} offers pending review</Text>
                    </View>
                  </TouchableOpacity>
                )}

              </View>
            </View>

            {/* Alerts Section */}
            {(stats.alerts?.overdue_agreements > 0 || !payoutConfigured) && (
              <View>
                <Text className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3 ml-2">
                  Action Required
                </Text>
                <View className="bg-white rounded-3xl overflow-hidden" style={shadow.md}>
                  {stats.alerts?.overdue_agreements > 0 && (
                    <View className="flex-row p-4 items-center gap-3 border-b border-gray-50">
                      <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
                        <AlertCircle size={20} color="#dc2626" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900">{stats.alerts.overdue_agreements} Overdue Agreements</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">Please review your active agreements.</Text>
                      </View>
                    </View>
                  )}
                  {!payoutConfigured && (
                    <TouchableOpacity onPress={() => router.push("/(tabs)/payouts" as any)} className="flex-row p-4 items-center gap-3">
                      <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center">
                        <CreditCard size={20} color="#ea580c" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-900">Configure Payout Account</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">Required to receive payments.</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

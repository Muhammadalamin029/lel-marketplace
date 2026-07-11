import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp, ShoppingBag, DollarSign, Package } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TabSelector } from "@/components/TabSelector";
import { shadow } from "@/constants/shadows";
import { sellerApi } from "@/api";
import type { SellerAnalytics } from "@/api";
import { fmt } from "@/utils/format";

const PERIODS = ["7d", "30d", "90d", "1y"] as const;

function StatTile({ label, value, growth, Icon, color, bg }: { label: string; value: string; growth?: number; Icon: any; color: string; bg: string }) {
  return (
    <View className="bg-white p-4 rounded-2xl flex-1 min-w-[45%]" style={shadow.sm}>
      <View className="w-10 h-10 rounded-full items-center justify-center mb-2" style={{ backgroundColor: bg }}>
        <Icon size={20} color={color} />
      </View>
      <Text className="text-xs font-bold text-gray-400 uppercase">{label}</Text>
      <Text className="text-lg font-extrabold text-gray-900 mt-1">{value}</Text>
      {growth !== undefined && (
        <Text className={`text-[10px] font-bold mt-1 ${growth >= 0 ? "text-green-600" : "text-red-500"}`}>
          {growth >= 0 ? "+" : ""}{growth.toFixed(1)}% vs previous
        </Text>
      )}
    </View>
  );
}

export default function SellerAnalyticsScreen() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("30d");
  const [data, setData] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    sellerApi.getAnalytics(period).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [period]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Analytics" />
      <View className="px-5 pt-4"><TabSelector tabs={PERIODS} activeTab={period} onTabChange={setPeriod} /></View>

      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
        ) : !data ? (
          <Text className="text-gray-400 text-center mt-10">Could not load analytics.</Text>
        ) : (
          <View className="gap-5">
            <View className="flex-row flex-wrap gap-4">
              <StatTile label="Revenue" value={fmt(data.total_revenue)} growth={data.revenue_growth} Icon={DollarSign} color="#16a34a" bg="#f0fdf4" />
              <StatTile label="Orders" value={String(data.total_orders)} growth={data.order_growth} Icon={ShoppingBag} color="#d97706" bg="#fffbeb" />
              <StatTile label="Avg Order" value={fmt(data.average_order_value)} Icon={TrendingUp} color="#2563eb" bg="#eff6ff" />
              <StatTile label="Active Listings" value={String(data.inventory_insights.active_products)} Icon={Package} color="#7e22ce" bg="#f5f3ff" />
            </View>

            <View className="bg-white rounded-2xl p-4" style={shadow.card}>
              <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Inventory</Text>
              <View className="flex-row justify-between py-1"><Text className="text-sm text-gray-500">Total Products</Text><Text className="text-sm font-bold text-gray-900">{data.inventory_insights.total_products}</Text></View>
              <View className="flex-row justify-between py-1"><Text className="text-sm text-gray-500">Low Stock</Text><Text className="text-sm font-bold text-gray-900">{data.inventory_insights.low_stock_products}</Text></View>
              <View className="flex-row justify-between py-1"><Text className="text-sm text-gray-500">Out of Stock</Text><Text className="text-sm font-bold text-gray-900">{data.inventory_insights.out_of_stock_products}</Text></View>
              <View className="flex-row justify-between py-1"><Text className="text-sm text-gray-500">Inventory Value</Text><Text className="text-sm font-bold text-gray-900">{fmt(data.inventory_insights.total_inventory_value)}</Text></View>
            </View>

            <View className="bg-white rounded-2xl p-4" style={shadow.card}>
              <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Customers</Text>
              <View className="flex-row justify-between py-1"><Text className="text-sm text-gray-500">Total Customers</Text><Text className="text-sm font-bold text-gray-900">{data.customer_insights.total_customers}</Text></View>
              <View className="flex-row justify-between py-1"><Text className="text-sm text-gray-500">Repeat Rate</Text><Text className="text-sm font-bold text-gray-900">{data.customer_insights.repeat_rate.toFixed(1)}%</Text></View>
            </View>

            {data.top_products.length > 0 && (
              <View className="bg-white rounded-2xl overflow-hidden" style={shadow.card}>
                <Text className="text-xs font-bold text-gray-400 uppercase p-4 pb-2">Top Products</Text>
                {data.top_products.map((p) => (
                  <View key={p.id} className="flex-row items-center justify-between px-4 py-3 border-t border-gray-50">
                    <Text className="text-sm text-gray-800 flex-1" numberOfLines={1}>{p.name}</Text>
                    <Text className="text-xs text-gray-400 mr-3">{p.total_sold} sold</Text>
                    <Text className="text-sm font-bold text-gray-900">{fmt(p.revenue)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

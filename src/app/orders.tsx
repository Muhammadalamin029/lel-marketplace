import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Package, ChevronRight } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { TabSelector } from "@/components/TabSelector";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";

const MOCK_ORDERS = [
  { id: "ORD-2023-8942", date: "12 Oct 2023", status: "processing", amount: 1200000, itemsCount: 2 },
  { id: "ORD-2023-7721", date: "05 Oct 2023", status: "delivered", amount: 85000, itemsCount: 1 },
  { id: "ORD-2023-6110", date: "28 Sep 2023", status: "cancelled", amount: 450000, itemsCount: 3 },
];

const TABS = ["Active", "Completed", "Cancelled"] as const;
type Tab = typeof TABS[number];

export default function OrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Active");

  const filteredOrders = MOCK_ORDERS.filter((o) => {
    if (activeTab === "Active") return o.status === "processing" || o.status === "shipped";
    if (activeTab === "Completed") return o.status === "delivered";
    if (activeTab === "Cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      <ScreenHeader title="My Orders" />

      {/* Tabs */}
      <View className="bg-white px-5 pb-4 border-b border-gray-100">
        <TabSelector tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <EmptyState
            Icon={Package}
            title="No orders found"
            subtitle={`You don't have any ${activeTab.toLowerCase()} orders.`}
          />
        ) : (
          <View className="gap-4 pb-10">
            {filteredOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => router.push("/order-details")}
                className="bg-white rounded-2xl p-4"
                style={shadow.card}
              >
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                      <Package size={14} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-gray-900">{order.id}</Text>
                      <Text className="text-[10px] text-gray-400">{order.date}</Text>
                    </View>
                  </View>
                  <StatusBadge status={order.status} />
                </View>

                <View className="h-px bg-gray-100 mb-3" />

                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-xs text-gray-500 mb-0.5">Amount</Text>
                    <Text className="text-base font-extrabold text-gray-900">{fmt(order.amount)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-500 mb-1">
                      {order.itemsCount} {order.itemsCount === 1 ? "Item" : "Items"}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs font-bold text-indigo-600">View Details</Text>
                      <ChevronRight size={14} color="#4f46e5" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

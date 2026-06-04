import { View, Text, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, Package, Truck, MapPin } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { fmt } from "@/utils/format";
import { shadow } from "@/constants/shadows";

const ORDER = {
  id: "ORD-2023-8942",
  date: "12 Oct 2023, 14:30",
  status: "processing",
  items: [{ name: "Leather Sofa Set", price: 1200000, qty: 1 }],
  subtotal: 1200000,
  shipping: 0,
  tax: 0,
  total: 1200000,
  address: { title: "Home", full: "123 Awolowo Road, Ikoyi, Lagos, Nigeria" },
};

export default function OrderDetailsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      <ScreenHeader title={ORDER.id} subtitle={ORDER.date} />

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Tracker */}
        <View className="bg-white rounded-2xl p-5 mb-5 border border-gray-100" style={shadow.md}>
          <Text className="text-sm font-bold text-gray-900 mb-4">Tracking Status</Text>
          <View className="flex-row justify-between">
            {[
              { label: "Placed", Icon: CheckCircle, active: true },
              { label: "Processing", Icon: Package, active: true, current: true },
              { label: "Shipped", Icon: Truck, active: false },
              { label: "Delivered", Icon: MapPin, active: false },
            ].map(({ label, Icon, active, current }) => (
              <View key={label} className="items-center flex-1">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center z-10 ${
                    current ? "border-4 border-white" : ""
                  }`}
                  style={{ backgroundColor: active ? (current ? "#f59e0b" : "#22c55e") : "#e5e7eb" }}
                >
                  <Icon size={current ? 14 : 16} color="white" />
                </View>
                <Text
                  className={`text-[10px] font-${active ? "bold" : "medium"} mt-2 ${
                    active ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Items */}
        <Text className="text-sm font-bold text-gray-900 mb-3 px-1">Items</Text>
        <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100" style={shadow.md}>
          {ORDER.items.map((item, i) => (
            <View key={i} className="flex-row justify-between items-center py-2">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center">
                  <Package size={20} color="#9ca3af" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-gray-900">{item.name}</Text>
                  <Text className="text-xs text-gray-500">Qty: {item.qty}</Text>
                </View>
              </View>
              <Text className="text-sm font-extrabold text-amber-500">{fmt(item.price)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <Text className="text-sm font-bold text-gray-900 mb-3 px-1">Payment Summary</Text>
        <View className="bg-white rounded-2xl p-5 mb-5 border border-gray-100" style={shadow.md}>
          {[
            { label: "Subtotal", value: fmt(ORDER.subtotal) },
            { label: "Shipping", value: "Paid Separately", valueClass: "text-gray-400" },
            { label: "Tax", value: fmt(ORDER.tax) },
          ].map(({ label, value, valueClass }) => (
            <View key={label} className="flex-row justify-between mb-3">
              <Text className="text-sm text-gray-500">{label}</Text>
              <Text className={`text-sm font-medium text-gray-900 ${valueClass ?? ""}`}>{value}</Text>
            </View>
          ))}
          <View className="h-px bg-gray-100 mb-4" />
          <View className="flex-row justify-between items-center">
            <Text className="text-base font-bold text-gray-900">Total Paid</Text>
            <Text className="text-xl font-black text-amber-400">{fmt(ORDER.total)}</Text>
          </View>
        </View>

        {/* Delivery Notice */}
        <View className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-5 flex-row gap-3">
          <Truck size={20} color="#3b82f6" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-blue-900 mb-1">Delivery Payment Notice</Text>
            <Text className="text-xs text-blue-800/80 leading-relaxed">
              You will pay for delivery directly to the logistics provider when your order is ready for shipment.
            </Text>
          </View>
        </View>

        {/* Address */}
        <Text className="text-sm font-bold text-gray-900 mb-3 px-1">Delivery Address</Text>
        <View className="bg-white rounded-2xl p-4 mb-10 border border-gray-100 flex-row items-start gap-3" style={shadow.md}>
          <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center">
            <MapPin size={18} color="#4f46e5" />
          </View>
          <View className="flex-1 pt-1">
            <Text className="text-sm font-bold text-gray-900 mb-1">{ORDER.address.title}</Text>
            <Text className="text-sm text-gray-500 leading-relaxed">{ORDER.address.full}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

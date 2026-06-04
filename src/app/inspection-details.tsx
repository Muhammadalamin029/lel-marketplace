import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { Calendar, Clock, MapPin, Car, Home, Building, User, Phone, MessageCircle, AlertCircle } from "lucide-react-native";

const MOCK_INSPECTIONS: Record<string, any> = {
  "INSP-001": {
    id: "INSP-001",
    assetName: "Toyota Camry 2022",
    assetType: "vehicle",
    status: "confirmed",
    date: "14 Oct 2026, 10:00 AM",
    location: "Victoria Island, Lagos",
    seller: { name: "Premium Auto Lagos", phone: "+234 801 234 5678" },
    notes: "Please bring a valid ID. Parking available on site.",
    price: 18500000,
    deposit: 1850000,
  },
  "INSP-002": {
    id: "INSP-002",
    assetName: "3-Bed Apartment Lekki",
    assetType: "real_estate",
    status: "pending",
    date: "Awaiting Confirmation",
    location: "Lekki Phase 1, Lagos",
    seller: { name: "Lekki Realty Co.", phone: "+234 802 345 6789" },
    notes: "Agent will call to confirm a suitable time.",
    price: 85000000,
    deposit: 8500000,
  },
};

export default function InspectionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insp = MOCK_INSPECTIONS[id ?? "INSP-001"];

  if (!insp) {
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

  const AssetIcon = insp.assetType === "vehicle" ? Car : Home;
  const iconBg = insp.assetType === "vehicle" ? "#fff7ed" : "#eff6ff";
  const iconColor = insp.assetType === "vehicle" ? "#ea580c" : "#3b82f6";

  const canCancel = insp.status === "confirmed" || insp.status === "pending";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Inspection Details" subtitle={`Ref: #${insp.id}`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-5">

          {/* Asset card */}
          <View className="bg-white rounded-3xl p-5" style={shadow.md}>
            <View className="flex-row items-center gap-4 mb-4">
              <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: iconBg }}>
                <AssetIcon size={28} color={iconColor} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-gray-900">{insp.assetName}</Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <StatusBadge status={insp.status} />
                </View>
              </View>
            </View>

            <View className="h-px bg-gray-100 mb-4" />

            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Calendar size={16} color="#9ca3af" />
                <View>
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase">Date & Time</Text>
                  <Text className="text-sm font-bold text-gray-900">{insp.date}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <MapPin size={16} color="#9ca3af" />
                <View>
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase">Location</Text>
                  <Text className="text-sm font-bold text-gray-900">{insp.location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Price info */}
          <View className="bg-white rounded-3xl p-5" style={shadow.md}>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Financial Summary</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Listing Price</Text>
                <Text className="text-sm font-bold text-gray-900">₦{insp.price.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Required Deposit (10%)</Text>
                <Text className="text-sm font-bold text-amber-500">₦{insp.deposit.toLocaleString()}</Text>
              </View>
              <View className="h-px bg-gray-100 my-1" />
              <View className="flex-row justify-between">
                <Text className="text-sm text-gray-500">Inspection Fee</Text>
                <Text className="text-sm font-bold text-green-600">Free</Text>
              </View>
            </View>
          </View>

          {/* Seller */}
          <View className="bg-white rounded-3xl p-5" style={shadow.md}>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Seller</Text>
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-indigo-900 items-center justify-center">
                <Text className="text-white font-bold text-sm">{insp.seller.name.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-900">{insp.seller.name}</Text>
                <Text className="text-xs text-gray-400">{insp.seller.phone}</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity className="w-9 h-9 rounded-full bg-green-50 items-center justify-center">
                  <Phone size={16} color="#22c55e" />
                </TouchableOpacity>
                <TouchableOpacity className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center">
                  <MessageCircle size={16} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Notes */}
          {insp.notes && (
            <View className="bg-amber-50 rounded-3xl p-5 border border-amber-100">
              <Text className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Notes from Seller</Text>
              <Text className="text-sm text-amber-800 leading-relaxed">{insp.notes}</Text>
            </View>
          )}

          {/* Actions */}
          {insp.status === "confirmed" && (
            <TouchableOpacity
              className="bg-amber-400 py-4 rounded-2xl items-center"
              style={shadow.btn}
              onPress={() => {}}
            >
              <Text className="text-white font-bold">Proceed to Agreement</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              className="border border-red-200 bg-red-50 py-4 rounded-2xl items-center"
              onPress={() => router.back()}
            >
              <Text className="text-red-600 font-semibold">Cancel Inspection</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

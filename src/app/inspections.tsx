import { View, Text, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Car, Home, Clock, ChevronRight } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";

const MOCK_INSPECTIONS = [
  {
    id: "INSP-001",
    assetName: "Toyota Camry 2022",
    assetType: "vehicle",
    status: "confirmed",
    date: "14 Oct 2023, 10:00 AM",
    location: "Victoria Island, Lagos",
  },
  {
    id: "INSP-002",
    assetName: "3-Bed Apartment Lekki",
    assetType: "real_estate",
    status: "pending",
    date: "Awaiting Confirmation",
    location: "Lekki Phase 1, Lagos",
  },
];

export default function InspectionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      <ScreenHeader title="My Inspections" subtitle="Track your physical visits" />

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {MOCK_INSPECTIONS.length === 0 ? (
          <EmptyState
            Icon={Calendar}
            title="No inspections"
            subtitle="You haven't requested any inspections yet."
          />
        ) : (
          <View className="gap-4 pb-10">
            {MOCK_INSPECTIONS.map((insp) => {
              const isVehicle = insp.assetType === "vehicle";
              return (
                <TouchableOpacity
                  key={insp.id}
                  className="bg-white rounded-3xl p-5 border border-gray-100"
                  style={shadow.card}
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`w-12 h-12 rounded-2xl items-center justify-center ${
                          isVehicle ? "bg-orange-50" : "bg-blue-50"
                        }`}
                      >
                        {isVehicle
                          ? <Car size={20} color="#ea580c" />
                          : <Home size={20} color="#3b82f6" />}
                      </View>
                      <View>
                        <Text className="text-sm font-extrabold text-gray-900">{insp.assetName}</Text>
                        <Text className="text-xs text-gray-400 mt-0.5">#{insp.id}</Text>
                      </View>
                    </View>
                    <StatusBadge status={insp.status} />
                  </View>

                  <View className="bg-gray-50 rounded-xl p-3 gap-2">
                    <View className="flex-row items-center gap-2">
                      <Clock size={14} color="#6b7280" />
                      <Text
                        className={`text-sm font-bold ${
                          insp.status === "confirmed" ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {insp.date}
                      </Text>
                    </View>
                    {insp.status === "confirmed" && (
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm text-gray-600" numberOfLines={1}>
                          📍 {insp.location}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center justify-end mt-3 gap-1">
                    <Text className="text-xs font-bold text-indigo-600">View Details</Text>
                    <ChevronRight size={14} color="#4f46e5" />
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

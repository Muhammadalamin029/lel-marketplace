import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, Car, Home, Clock, ChevronRight } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { inspectionsApi } from "@/api";
import type { Inspection } from "@/api";

export default function InspectionsScreen() {
  useRequireAuth();
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    inspectionsApi.list()
      .then((data) => { if (!cancelled) setInspections(data); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Failed to load inspections"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="My Inspections" subtitle="Track your physical visits" />

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="items-center justify-center pt-20">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-sm text-gray-400 mt-3">Loading inspections…</Text>
          </View>
        ) : error ? (
          <EmptyState Icon={Calendar} title="Could not load inspections" subtitle={error} />
        ) : inspections.length === 0 ? (
          <EmptyState Icon={Calendar} title="No inspections" subtitle="You haven't requested any inspections yet." />
        ) : (
          <View className="gap-4 pb-10">
            {inspections.map((insp) => {
              const isVehicle = insp.asset_type === "vehicle";
              return (
                <TouchableOpacity
                  key={insp.id}
                  onPress={() => router.push(`/inspection-details?id=${insp.id}` as any)}
                  className="bg-white rounded-3xl p-5 border border-gray-100"
                  style={shadow.card}
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-3">
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isVehicle ? "bg-orange-50" : "bg-blue-50"}`}>
                        {isVehicle ? <Car size={20} color="#ea580c" /> : <Home size={20} color="#3b82f6" />}
                      </View>
                      <View>
                        <Text className="text-sm font-extrabold text-gray-900">
                          {insp.asset?.title ?? `${insp.asset_type} asset`}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-0.5">#{insp.id.slice(0, 8).toUpperCase()}</Text>
                      </View>
                    </View>
                    <StatusBadge status={insp.status} />
                  </View>

                  <View className="bg-gray-50 rounded-xl p-3 gap-2">
                    <View className="flex-row items-center gap-2">
                      <Clock size={14} color="#6b7280" />
                      <Text className={`text-sm font-bold ${insp.status === "confirmed" ? "text-gray-900" : "text-gray-500"}`}>
                        {new Date(insp.inspection_date).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                    {insp.seller && (
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-gray-500">Seller: <Text className="font-semibold">{insp.seller.business_name}</Text></Text>
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

import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { FileText, Trash2, ChevronRight } from "lucide-react-native";
import { SellerGate } from "@/components/SellerGate";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { inspectionsApi, getApiError } from "@/api";
import type { Inspection } from "@/api";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { fmt, formatDate } from "@/utils/format";

const CANCELLABLE = ["scheduled", "confirmed"];

function RequestsScreenInner() {
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);

  const fetchData = useCallback(async () => {
    try { setInspections(await inspectionsApi.list()); } catch { setInspections([]); }
  }, []);

  const { loading, refreshing, load, onRefresh } = usePullToRefresh(fetchData);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancel = (item: Inspection) => {
    Alert.alert("Cancel Request", "Remove this request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel", style: "destructive",
        onPress: async () => {
          try { await inspectionsApi.cancel(item.id); load(); }
          catch (e) { Alert.alert("Error", getApiError(e)); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="w-10 h-10 rounded-2xl bg-purple-50 items-center justify-center">
          <FileText size={18} color="#7e22ce" />
        </View>
        <View>
          <Text className="text-lg font-extrabold text-gray-900">Requests</Text>
          <Text className="text-xs text-gray-400">{inspections.length} · Inspections & purchase agreements</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" colors={["#f59e0b"]} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
        ) : inspections.length === 0 ? (
          <EmptyState Icon={FileText} title="No requests yet" subtitle="Buyer inspection and offer requests will show up here." />
        ) : (
          <View className="gap-3 pb-10">
            {inspections.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/seller-request-details?id=${item.id}` as any)}
                className="bg-white rounded-2xl p-4 flex-row items-center gap-3"
                style={shadow.card}
              >
                <View className="w-11 h-11 rounded-full bg-purple-50 items-center justify-center">
                  <FileText size={18} color="#7e22ce" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>{item.asset?.title ?? "Asset"}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{item.user?.name || item.user?.email} · {formatDate(item.inspection_date)}</Text>
                  <Text className="text-sm font-extrabold text-gray-900 mt-1">{fmt(item.asset?.price ?? 0)}</Text>
                </View>
                <View className="items-end gap-2">
                  <StatusBadge status={item.status} />
                  {CANCELLABLE.includes(item.status) ? (
                    <TouchableOpacity onPress={() => cancel(item)}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  ) : (
                    <ChevronRight size={16} color="#d1d5db" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function RequestsScreen() {
  return (
    <SellerGate>
      <RequestsScreenInner />
    </SellerGate>
  );
}

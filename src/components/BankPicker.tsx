import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X, ChevronDown } from "lucide-react-native";
import { banksApi, type Bank } from "@/api";

interface BankPickerProps {
  value: { bank_code: string; bank_name: string } | null;
  onSelect: (bank: Bank) => void;
}

export function BankPicker({ value, onSelect }: BankPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const task = query.trim()
      ? banksApi.search(query.trim())
      : banksApi.list();
    task.then(setBanks).catch(() => setBanks([])).finally(() => setLoading(false));
  }, [open, query]);

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bank</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between border border-gray-200 rounded-xl bg-gray-50 px-4 py-3"
      >
        <Text className={`text-sm ${value ? "text-gray-900" : "text-gray-400"}`}>
          {value?.bank_name ?? "Select bank"}
        </Text>
        <ChevronDown size={16} color="#9ca3af" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
            <Text className="text-lg font-extrabold text-gray-900">Select Bank</Text>
            <TouchableOpacity onPress={() => setOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>
          <View className="px-5 py-3">
            <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-3">
              <Search size={16} color="#9ca3af" />
              <TextInput
                className="flex-1 p-3 text-sm text-gray-900"
                placeholder="Search banks"
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={banks}
              keyExtractor={(b) => b.code}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { onSelect(item); setOpen(false); setQuery(""); }}
                  className="px-5 py-3.5 border-b border-gray-50"
                >
                  <Text className="text-sm font-semibold text-gray-900">{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

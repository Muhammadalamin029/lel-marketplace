import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, Plus, CheckCircle, MoreVertical } from "lucide-react-native";

const INITIAL_ADDRESSES = [
  {
    id: "1",
    title: "Home",
    street: "123 Awolowo Road",
    city: "Ikoyi",
    state: "Lagos",
    country: "Nigeria",
    isDefault: true,
  },
  {
    id: "2",
    title: "Office",
    street: "45 Admiralty Way",
    city: "Lekki Phase 1",
    state: "Lagos",
    country: "Nigeria",
    isDefault: false,
  },
];

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center"
          >
            <ArrowLeft size={18} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-gray-900">Saved Addresses</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
          <Plus size={20} color="#ea580c" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="gap-4 pb-24">
          {addresses.map((address) => (
            <View
              key={address.id}
              className={`bg-white rounded-2xl p-4 border-2 ${
                address.isDefault ? "border-amber-400" : "border-transparent"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-2">
                  <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center">
                    <MapPin size={18} color="#4f46e5" />
                  </View>
                  <View>
                    <Text className="text-base font-bold text-gray-900">{address.title}</Text>
                    {address.isDefault && (
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <CheckCircle size={10} color="#f59e0b" />
                        <Text className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                          Default
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity className="p-1">
                  <MoreVertical size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View className="pl-12">
                <Text className="text-sm text-gray-600 mb-1">{address.street}</Text>
                <Text className="text-sm text-gray-500">
                  {address.city}, {address.state}
                </Text>
                <Text className="text-sm text-gray-500">{address.country}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add New Button */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
        <TouchableOpacity className="w-full bg-gray-900 h-14 rounded-2xl items-center justify-center flex-row gap-2">
          <Plus size={18} color="#ffffff" />
          <Text className="text-white font-bold text-base">Add New Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

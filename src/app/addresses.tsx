import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StatusBar,
  Modal, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, Plus, CheckCircle, Edit2, Trash2, X, Star } from "lucide-react-native";
import { shadow } from "@/constants/shadows";


type Address = {
  id: string;
  title: string;
  street: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
};

const INITIAL_ADDRESSES: Address[] = [
  { id: "1", title: "Home", street: "123 Awolowo Road", city: "Ikoyi", state: "Lagos", country: "Nigeria", isDefault: true },
  { id: "2", title: "Office", street: "45 Admiralty Way", city: "Lekki Phase 1", state: "Lagos", country: "Nigeria", isDefault: false },
];

const BLANK: Omit<Address, "id" | "isDefault"> = { title: "", street: "", city: "", state: "", country: "Nigeria" };

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<typeof BLANK>(BLANK);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditing(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({ title: addr.title, street: addr.street, city: addr.city, state: addr.state, country: addr.country });
    setModalOpen(true);
  };

  const set = (key: keyof typeof BLANK) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const showMsg = (title: string, msg?: string) => Alert.alert(title, msg);

  const handleSave = async () => {
    if (!form.title.trim() || !form.street.trim() || !form.city.trim()) {
      showMsg("Missing Fields", "Please fill in the title, street, and city.");
      return;
    }
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600)); // TODO: API call
      if (editing) {
        setAddresses((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...form } : a));
        showMsg("Updated", "Address updated successfully.");
      } else {
        const newAddr: Address = { id: Date.now().toString(), ...form, isDefault: addresses.length === 0 };
        setAddresses((prev) => [...prev, newAddr]);
        showMsg("Added", "New address saved.");
      }
      setModalOpen(false);
    } catch {
      showMsg("Error", "Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Address", "Remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          setAddresses((prev) => {
            const filtered = prev.filter((a) => a.id !== id);
            if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
              filtered[0].isDefault = true;
            }
            return filtered;
          });
        },
      },
    ]);
  };

  const setDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      <View className="flex-row items-center justify-between px-5 pt-4 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center">
            <ArrowLeft size={18} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-extrabold text-gray-900">Saved Addresses</Text>
        </View>
        <TouchableOpacity onPress={openAdd} className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center" style={shadow.sm}>
          <Plus size={20} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        <View className="gap-4 pb-28">
          {addresses.map((addr) => (
            <View
              key={addr.id}
              className={`bg-white rounded-2xl p-4 border-2 ${addr.isDefault ? "border-amber-400" : "border-transparent"}`}
              style={shadow.card}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center">
                    <MapPin size={18} color="#4f46e5" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-gray-900">{addr.title}</Text>
                    {addr.isDefault && (
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <CheckCircle size={10} color="#f59e0b" />
                        <Text className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Default</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className="flex-row gap-1.5">
                  {!addr.isDefault && (
                    <TouchableOpacity onPress={() => setDefault(addr.id)} className="w-8 h-8 rounded-full bg-amber-50 items-center justify-center">
                      <Star size={14} color="#f59e0b" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => openEdit(addr)} className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                    <Edit2 size={14} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(addr.id)} className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="pl-12">
                <Text className="text-sm text-gray-600 mb-0.5">{addr.street}</Text>
                <Text className="text-sm text-gray-500">{addr.city}, {addr.state}</Text>
                <Text className="text-sm text-gray-500">{addr.country}</Text>
              </View>
            </View>
          ))}

          {addresses.length === 0 && (
            <View className="items-center justify-center pt-16 gap-3">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                <MapPin size={28} color="#9ca3af" />
              </View>
              <Text className="text-base font-bold text-gray-900">No addresses yet</Text>
              <Text className="text-sm text-gray-400">Tap + to add your first address.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
        <TouchableOpacity onPress={openAdd} className="w-full bg-gray-900 h-14 rounded-2xl items-center justify-center flex-row gap-2" style={shadow.md}>
          <Plus size={18} color="#ffffff" />
          <Text className="text-white font-bold text-base">Add New Address</Text>
        </TouchableOpacity>
      </View>

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
            <Text className="text-lg font-extrabold text-gray-900">{editing ? "Edit Address" : "New Address"}</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
              <X size={18} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
            <View className="gap-4 pb-10">
              {[
                { label: "Label (e.g. Home, Office)", key: "title" as const, placeholder: "Home" },
                { label: "Street Address", key: "street" as const, placeholder: "123 Awolowo Road" },
                { label: "City / Area", key: "city" as const, placeholder: "Ikoyi" },
                { label: "State", key: "state" as const, placeholder: "Lagos" },
                { label: "Country", key: "country" as const, placeholder: "Nigeria" },
              ].map(({ label, key, placeholder }) => (
                <View key={key} className="gap-1.5">
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900"
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    value={form[key]}
                    onChangeText={set(key)}
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="bg-amber-400 py-4 rounded-2xl items-center mt-2"
                style={shadow.btn}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">{editing ? "Save Changes" : "Add Address"}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

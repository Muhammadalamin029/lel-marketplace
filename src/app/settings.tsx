import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { Bell, Lock, Eye, Smartphone, Moon, Globe, Trash2, ChevronRight, Shield } from "lucide-react-native";


type ToggleSetting = { id: string; label: string; subtitle: string; value: boolean };

export default function SettingsScreen() {
  const [settings, setSettings] = useState<ToggleSetting[]>([
    { id: "push_orders", label: "Order Notifications", subtitle: "Updates on your orders", value: true },
    { id: "push_promos", label: "Promotions", subtitle: "Deals and special offers", value: false },
    { id: "email_updates", label: "Email Updates", subtitle: "Summary emails from LEL Marketplace", value: true },
    { id: "dark_mode", label: "Dark Mode", subtitle: "Easier on the eyes at night", value: false },
    { id: "biometric", label: "Biometric Login", subtitle: "Use Face ID / fingerprint to sign in", value: false },
  ]);

  const toggle = (id: string) =>
    setSettings((prev) => prev.map((s) => s.id === id ? { ...s, value: !s.value } : s));

  const SECTIONS = [
    {
      title: "Notifications",
      items: settings.slice(0, 3),
    },
    {
      title: "Appearance & Security",
      items: settings.slice(3),
    },
  ];

  const ACTIONS = [
    { icon: Globe, label: "Language", value: "English", onPress: () => {} },
    { icon: Shield, label: "Privacy Policy", onPress: () => {} },
    { icon: Lock, label: "Terms of Service", onPress: () => {} },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Settings" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-6">

          {SECTIONS.map((section) => (
            <View key={section.title}>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{section.title}</Text>
              <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
                {section.items.map((item, i) => (
                  <View key={item.id} className={`flex-row items-center px-4 py-4 ${i < section.items.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">{item.label}</Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{item.subtitle}</Text>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={() => toggle(item.id)}
                      trackColor={{ false: "#e5e7eb", true: "#fbbf24" }}
                      thumbColor="#fff"
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Action items */}
          <View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">General</Text>
            <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
              {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.label}
                    onPress={action.onPress}
                    className={`flex-row items-center px-4 py-4 ${i < ACTIONS.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <Icon size={18} color="#6b7280" style={{ marginRight: 12 }} />
                    <Text className="text-sm font-semibold text-gray-900 flex-1">{action.label}</Text>
                    {action.value && <Text className="text-sm text-gray-400 mr-2">{action.value}</Text>}
                    <ChevronRight size={16} color="#d1d5db" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Danger zone */}
          <View>
            <Text className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Danger Zone</Text>
            <TouchableOpacity
              onPress={() => Alert.alert("Coming Soon", "Account deletion requires email confirmation. Please contact support.")}
              className="bg-white border border-red-100 rounded-2xl px-4 py-4 flex-row items-center gap-3"
              style={shadow.md}
            >
              <Trash2 size={18} color="#ef4444" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-red-600">Delete Account</Text>
                <Text className="text-xs text-gray-400">This action is permanent and cannot be undone.</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <Text className="text-xs text-gray-300">LEL Marketplace · v1.0.0</Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { View, Text, ScrollView, StatusBar, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { Car, Home, ShoppingBag, Shield, Award, Users, ExternalLink } from "lucide-react-native";

const FEATURES = [
  { icon: Car,         color: "#ea580c", bg: "#fff7ed", title: "Vehicles",        desc: "Buy verified cars with installment plans and free inspection." },
  { icon: Home,        color: "#3b82f6", bg: "#eff6ff", title: "Real Estate",     desc: "Browse properties for sale, rental, or commercial use." },
  { icon: ShoppingBag, color: "#22c55e", bg: "#f0fdf4", title: "Retail Products", desc: "Shop from verified sellers across all product categories." },
  { icon: Shield,      color: "#8b5cf6", bg: "#f5f3ff", title: "Escrow & Safety", desc: "All payments held in escrow until you're satisfied." },
];

const STATS = [
  { value: "500+",  label: "Verified Sellers" },
  { value: "10K+",  label: "Listings" },
  { value: "₦2B+",  label: "Transactions" },
  { value: "4.8★",  label: "App Rating" },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="About" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Hero */}
        <View className="bg-indigo-950 mx-5 mt-5 rounded-3xl p-6 items-center gap-3" style={shadow.md}>
          <View className="w-16 h-16 rounded-2xl bg-amber-400 items-center justify-center">
            <ShoppingBag size={32} color="#fff" strokeWidth={1.5} />
          </View>
          <Text className="text-2xl font-extrabold text-white text-center">LEL Marketplace</Text>
          <Text className="text-sm text-white/70 text-center leading-relaxed">
            Nigeria's premier verified marketplace for vehicles, real estate, and quality products — with escrow-backed transactions and free physical inspections.
          </Text>
        </View>

        {/* Stats */}
        <View className="mx-5 mt-4 bg-white rounded-3xl p-5 flex-row flex-wrap" style={shadow.md}>
          {STATS.map(({ value, label }) => (
            <View key={label} className="w-1/2 items-center py-3">
              <Text className="text-2xl font-extrabold text-amber-400">{value}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">{label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View className="mx-5 mt-4 gap-3">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">What we offer</Text>
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <View key={title} className="bg-white rounded-2xl p-4 flex-row gap-3" style={shadow.sm}>
              <View className="w-11 h-11 rounded-2xl items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={22} color={color} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-gray-900">{title}</Text>
                <Text className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Values */}
        <View className="mx-5 mt-4 bg-amber-50 rounded-3xl p-5 border border-amber-100">
          <View className="flex-row items-center gap-2 mb-3">
            <Award size={18} color="#f59e0b" />
            <Text className="text-sm font-extrabold text-amber-800">Our Commitment</Text>
          </View>
          <Text className="text-sm text-amber-700 leading-relaxed">
            Every seller is KYC-verified. Every vehicle and property transaction includes a free physical inspection. Your money is held in escrow until the deal is complete — you are never at risk.
          </Text>
        </View>

        {/* Legal links */}
        <View className="mx-5 mt-4 bg-white rounded-3xl overflow-hidden" style={shadow.sm}>
          {[
            { label: "Terms of Service", route: "/terms" },
            { label: "Privacy Policy",   route: "/privacy" },
            { label: "Help & Support",   route: "/help" },
          ].map(({ label, route }, i, arr) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(route as any)}
              className={`flex-row items-center justify-between px-5 py-4 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <Text className="text-sm font-semibold text-gray-700">{label}</Text>
              <ExternalLink size={14} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="items-center mt-6 gap-1">
          <Text className="text-xs text-gray-400">LEL Marketplace · v1.0.0</Text>
          <Text className="text-xs text-gray-300">© 2026 LEL Marketplace. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

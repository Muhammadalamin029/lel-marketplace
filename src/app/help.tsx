import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail, ExternalLink } from "lucide-react-native";

const FAQS = [
  { q: "How does the inspection process work?", a: "After expressing interest in a vehicle or property, you schedule a physical inspection with the seller. Our platform coordinates the date and time. You pay no inspection fee." },
  { q: "How do installment payments work?", a: "Once an inspection is complete and both parties agree on a price, the seller creates an agreement with a deposit and monthly plan. You pay the deposit to activate the agreement, then pay monthly installments until the asset is fully paid off." },
  { q: "Is my payment secure?", a: "Yes. All payments are processed through Paystack, a PCI-DSS Level 1 compliant gateway. Funds are held in escrow until conditions are met." },
  { q: "How do I open a dispute?", a: "Go to Disputes in your profile menu and tap the '+' button. Provide a title, the order or agreement ID, and a detailed description. Our team responds within 2–3 business days." },
  { q: "Can I cancel an order?", a: "Orders can be cancelled before they are shipped. Go to My Orders, tap the order, and select Cancel. Refunds are processed within 3–5 business days." },
  { q: "How do I become a seller?", a: "Tap 'Become a Seller' on your profile and complete the seller registration form. You'll need to submit KYC documents for verification before you can list items." },
];

function FAQItem({ item }: { item: typeof FAQS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setOpen(!open)}
      className="bg-white rounded-2xl p-4 mb-3"
      style={shadow.card}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="text-sm font-bold text-gray-900 flex-1">{item.q}</Text>
        {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
      </View>
      {open && (
        <Text className="text-sm text-gray-500 leading-relaxed mt-3 pt-3 border-t border-gray-100">{item.a}</Text>
      )}
    </TouchableOpacity>
  );
}

const CONTACTS = [
  { icon: Mail, label: "Email Support", value: "support@lel-marketplace.com", color: "#3b82f6", bg: "#eff6ff" },
  { icon: MessageCircle, label: "Live Chat", value: "Available 8am – 8pm WAT", color: "#22c55e", bg: "#f0fdf4" },
  { icon: Phone, label: "Phone", value: "+234 800 LEL HELP", color: "#f59e0b", bg: "#fffbeb" },
];

export default function HelpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Help & Support" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-5 gap-6">

          {/* Contact channels */}
          <View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Us</Text>
            <View className="gap-3">
              {CONTACTS.map(({ icon: Icon, label, value, color, bg }) => (
                <TouchableOpacity key={label} className="bg-white rounded-2xl p-4 flex-row items-center gap-3" style={shadow.card}>
                  <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon size={18} color={color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900">{label}</Text>
                    <Text className="text-xs text-gray-400">{value}</Text>
                  </View>
                  <ExternalLink size={14} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* FAQs */}
          <View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Frequently Asked Questions</Text>
            {FAQS.map((faq, i) => <FAQItem key={i} item={faq} />)}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { ScrollView, View, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";

const SECTIONS = [
  {
    title: "1. Asset Inspections",
    body: "LEL Marketplace strictly mandates that all high-ticket transactions involving vehicles or land/buildings undergo a mutually agreed-upon physical inspection session. By using our platform, buyers acknowledge that digital images are for reference only and finalising purchases without physical sign-offs waives certain platform protections.",
  },
  {
    title: "2. Escrow & Payments",
    body: 'LEL Marketplace processes payments as an escrow facilitator. We do not own inventory sold by third-party merchants unless tagged "Internal Inventory." Funds for inspections and final agreements remain locked until completion triggers are met by both parties.',
  },
  {
    title: "3. Dispute & Arbitration",
    body: "In the event of a dispute (e.g., misrepresentation of an asset), buyers must open a ticket within 48 hours of discovering the defect. LEL Marketplace retains the final authority to freeze seller accounts and enforce refunds from escrow.",
  },
  {
    title: "4. User Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials. You agree not to use the platform for fraudulent, deceptive, or illegal activities. LEL Marketplace reserves the right to suspend or terminate accounts that violate these terms.",
  },
  {
    title: "5. Seller Obligations",
    body: "Sellers must complete KYC verification before listing assets. All listings must be accurate and not misleading. Sellers are responsible for honouring confirmed agreements and inspection appointments.",
  },
  {
    title: "6. Limitation of Liability",
    body: "LEL Marketplace acts as an intermediary and is not liable for the condition of assets, seller conduct, or buyer conduct beyond our escrow obligations. Our liability is limited to the escrow amount held for a given transaction.",
  },
  {
    title: "7. Changes to Terms",
    body: "We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms. We will notify users of significant changes via email.",
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Terms of Service" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        <View className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
          <Text className="text-xs text-amber-700 font-semibold text-center">
            Last updated: January 2026 · By using LEL Marketplace, you agree to these terms.
          </Text>
        </View>

        <View className="gap-5">
          {SECTIONS.map((s) => (
            <View key={s.title} className="bg-white rounded-2xl p-5">
              <Text className="text-sm font-extrabold text-gray-900 mb-2">{s.title}</Text>
              <Text className="text-sm text-gray-600 leading-relaxed">{s.body}</Text>
            </View>
          ))}
        </View>

        <Text className="text-xs text-gray-400 text-center mt-6">
          For questions about these terms, contact legal@lel-marketplace.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

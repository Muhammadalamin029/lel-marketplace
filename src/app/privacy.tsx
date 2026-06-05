import { ScrollView, View, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";

const SECTIONS = [
  {
    title: "1. Data We Collect",
    body: "To operate a secure escrow and highly-regulated physical marketplace, LEL Marketplace collects necessary identification information. For Merchants, this includes CAC documents, government IDs (KYC), and payout routing numbers. For Customers, this includes basic contact parameters (email, phone number) used exclusively to coordinate physical inspections.",
  },
  {
    title: "2. How We Share Data",
    body: "Before Purchase: Users browsing stores remain completely anonymous to the seller.\n\nDuring Inspection: Upon scheduling an inspection, we share the buyer's appointment details with the seller. The buyer's residential address is masked unless delivery is required for a standard retail product.\n\nPost-Purchase: Finalised legal receipts and property/automotive documents will contain the legal names of both parties as required by law.",
  },
  {
    title: "3. Financial Security",
    body: "LEL Marketplace does not store raw credit card numbers or banking passwords. All fiat processing, card tokenisation, and payout bridging is handled via our PCI-DSS Level 1 compliant gateway partners (Paystack). Our database only holds non-sensitive transaction references and escrow states.",
  },
  {
    title: "4. Data Storage & Security",
    body: "Your data is stored on secured servers with encryption at rest and in transit. We use industry-standard security practices including JWT authentication, rate limiting, and regular security audits. Passwords are hashed using Argon2.",
  },
  {
    title: "5. Your Rights",
    body: "You have the right to access, correct, or request deletion of your personal data at any time. Note that due to AML laws and real estate deed requirements, records of finalised purchases may need to be retained for a statutory period and cannot always be fully expunged.",
  },
  {
    title: "6. Cookies & Analytics",
    body: "The mobile app does not use cookies. We may collect anonymous usage analytics (screen views, feature usage) to improve the product. No personally identifiable information is included in analytics data.",
  },
  {
    title: "7. Contact",
    body: "For privacy-related requests, contact our Data Protection Officer at privacy@lel-marketplace.com. We aim to respond to all requests within 30 days.",
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Privacy Policy" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
          <Text className="text-xs text-blue-700 font-semibold text-center">
            Last updated: January 2026 · We respect your privacy and are committed to protecting your personal data.
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
          For privacy requests, contact privacy@lel-marketplace.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

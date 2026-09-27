import { ScrollView, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LegalDocument } from "@/components/LegalDocument";

const SECTIONS = [
  {
    title: "1. About LEL Store and Acceptance",
    body: "LEL Store (LEL Store Ltd, Osun State, Nigeria) runs a curated single-vendor marketplace for general products, vehicles and real estate, with physical inspections, escrow payments and financing options. By creating an account, ordering, booking an inspection or paying, you agree to these Terms and our Privacy Policy. Contact: support@lelstore.com.",
  },
  {
    title: "2. Eligibility and Accounts",
    body: "You must be at least 18 and legally capable of contracting under Nigerian law to buy vehicles, property or financing products. Provide accurate details, keep credentials confidential, and keep your profile updated in Settings. We may suspend accounts for false information, fraud or policy violations.",
  },
  {
    title: "3. Listings",
    body: "Photos, descriptions, VIN, mileage, floor areas and map pins are for reference. Only a physical inspection report and signed agreement define the final condition and price of a high-ticket asset. Prices are in Nigerian Naira (NGN); delivery, inspection and financing charges are shown separately at checkout.",
  },
  {
    title: "4. Asset Inspections",
    body: "Vehicles and land or buildings require a mutually agreed physical inspection before final purchase. Inspection fees are paid in advance; appointments need at least 24 hours notice and cancellation at least 12 hours before. Buying without a signed inspection sign-off waives certain platform protections and limits dispute eligibility.",
  },
  {
    title: "5. Orders, Delivery and Pickup",
    body: "Standard orders are delivered or collected at the published pickup point. Give an accurate address, phone number and availability. Delivery dates are estimates; risk transfers on delivery or pickup sign-off. Report damage within 48 hours via support or disputes.",
  },
  {
    title: "6. Escrow, Payments and Financing",
    body: "LEL Store holds inspection fees and purchase funds in escrow until completion triggers (inspection sign-off, agreement execution, delivery confirmation) are met. All card and transfer processing is handled by Paystack (PCI-DSS Level 1); we never store raw card numbers or bank passwords. Financing and direct-debit mandates follow your separate agreement terms; mandate activation may take up to 6 hours.",
  },
  {
    title: "7. Returns, Refunds and Disputes",
    body: "Open a dispute ticket within 48 hours of discovering a defect or misrepresentation. LEL Store may freeze affected escrow funds, request evidence, order re-inspection, and enforce refund or replacement from escrow. Assets sold after signed inspection are final except for proven material misrepresentation or title defects.",
  },
  {
    title: "8. Acceptable Use",
    body: "No fraud, impersonation, money laundering, bypassing escrow or inspection, scraping, reverse engineering, or uploading unlawful content. No abuse of support or operations teams. Violations may lead to order cancellation, suspension and referral to law enforcement.",
  },
  {
    title: "9. Intellectual Property",
    body: "LEL Store branding, software, photos and copy belong to LEL Store Ltd or its licensors. You receive a limited, revocable licence to use the app for personal purchases only.",
  },
  {
    title: "10. Suspension, Deletion and Termination",
    body: "Delete your account any time in Settings, Danger Zone, Delete Account, or without logging in at https://lelstore.com/account-deletion (email support@lelstore.com). Deletion blocks sign-in immediately, keeps a 30-day grace period, then purges personal data; anonymised escrow ledgers are kept up to 7 years by law. We may suspend or terminate for breach, fraud or legal orders, with notice where the law requires.",
  },
  {
    title: "11. Warranties, Liability and Indemnity",
    body: "The app is provided as is. To the maximum extent permitted by Nigerian law, our aggregate liability for any order is limited to amounts you paid for that order through escrow. You indemnify us against claims arising from your misuse or breach.",
  },
  {
    title: "12. Governing Law, Arbitration and Changes",
    body: "These terms are governed by the laws of the Federal Republic of Nigeria. Disputes are first negotiated in good faith, then resolved by arbitration in Lagos under the Arbitration and Mediation Act 2023, in English. Material changes are posted with a new effective date and notified where required. Questions: support@lelstore.com, +234 800 123 4567, Osun State, Nigeria.",
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Terms of Service" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        <LegalDocument
          slug="terms"
          fallback={SECTIONS}
          fallbackLabel="Last updated: October 2026 · Offline copy — the current terms are at lelstore.com/legal."
        />

        <Text className="font-manrope text-xs text-gray-400 text-center mt-6">
          For questions about these terms, contact support@lelstore.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

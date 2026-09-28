import { ScrollView, Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LegalDocument } from "@/components/LegalDocument";

const SECTIONS = [
  {
    title: "1. Data Controller and Contact",
    body: "LEL Store Ltd (trading as LEL Store, Osun State, Nigeria) controls your data for the LEL Store app and lelstore.com. Privacy and deletion requests: support@lelstore.com. We respond within 30 days. This screen shows a summary when offline; the current policy is always at https://lelstore.com/privacy.",
  },
  {
    title: "2. Data We Collect",
    body: "Identity and account: name, email, password (stored only as an Argon2 hash), Google ID if you use Google sign-in, and login security data. Profile and contact: phone number, bio, profile photo, delivery and billing addresses. Transactions: cart, orders, inspection bookings, agreements, reviews, wishlist and disputes. Financing (only if you apply): employment details, income and uploaded ID or payslip documents. Payments: non-sensitive references only (amounts, receipt numbers, escrow states) — we never collect raw card numbers or bank passwords. Technical: notification preferences and Expo push tokens if you enable notifications.",
  },
  {
    title: "3. Purposes and Legal Basis (NDPR)",
    body: "We process your data to run your account, checkout, inspections, agreements, delivery and support (contract); for marketing notifications only with your consent, withdrawable in Settings; for AML, tax and deed-tracing record-keeping (legal obligation); and for fraud prevention and security (legitimate interests). Sensitive financing data is processed only when you submit an application.",
  },
  {
    title: "4. How We Share Data",
    body: "Browsing users are not publicly identified. Paid inspection details go to LEL Store operations only; your home address stays masked unless delivery is required. Final receipts and agreements contain legal names as required by law. Processors: Flutterwave (payments, PCI-DSS Level 1), Cloudinary (images), Google Identity (sign-in), Gmail (transactional email) and Expo Push (notifications). We do not sell personal data.",
  },
  {
    title: "5. Financial Security and Data Protection",
    body: "Card details are transmitted over TLS straight to our PCI-DSS Level 1 processor (Flutterwave) and are never stored on our servers or in logs. Connections use TLS, passwords use Argon2 hashing, sessions use short-lived tokens, and admin access is role-based. Report suspected compromise to support@lelstore.com immediately.",
  },
  {
    title: "6. Data Retention and Deletion",
    body: "Account data is kept while your account is active. On deletion (Settings, Danger Zone, Delete Account, or https://lelstore.com/account-deletion by email to support@lelstore.com with no login needed): sign-in is blocked immediately, the account has a 30-day grace period, then personal data is permanently deleted or irreversibly anonymised. Anonymised escrow and financial ledgers are kept up to 7 years for anti-money laundering, tax and deed-tracing law and cannot be expunged.",
  },
  {
    title: "7. Your Rights",
    body: "You may access, correct, erase, export (JSON), restrict or object to processing of your data, and withdraw consent at any time — in Settings or by emailing support@lelstore.com from your account email. Web requests are actioned within 7 days, with purge after the 30-day grace period.",
  },
  {
    title: "8. Cookies and Analytics",
    body: "The mobile app uses no cookies and contains no advertising or analytics SDKs. On-device storage (secure session, preferences) is strictly necessary for sign-in and checkout.",
  },
  {
    title: "9. Children",
    body: "LEL Store is for adults aged 18 and over. We do not knowingly collect data from children; contact support@lelstore.com for prompt deletion if you believe a child provided data.",
  },
  {
    title: "10. International Transfers",
    body: "Primary hosting is in secure cloud regions; some processors (email, push, CDN) may handle data outside Nigeria under contracts, encryption and strict necessity, consistent with NDPR safeguards.",
  },
  {
    title: "11. Changes to This Policy",
    body: "We update this policy as the app evolves. Material changes are posted with a new Last updated date and notified in-app or by email where required.",
  },
  {
    title: "12. Contact and App Permissions",
    body: "Privacy contact: support@lelstore.com, +234 800 123 4567, Osun State, Nigeria. You may also complain to the Nigeria Data Protection Commission (NDPC). The app uses internet access, push notifications (order and payment updates) and photo/camera access only when you upload a profile picture or financing document. It does not access your location, microphone, SMS or contacts.",
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Privacy Policy" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        <LegalDocument
          slug="privacy"
          fallback={SECTIONS}
          fallbackLabel="Last updated: October 2026 · Offline copy — the current policy is at lelstore.com/privacy."
        />

        <Text className="font-manrope text-xs text-gray-400 text-center mt-6">
          For privacy requests, contact support@lelstore.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

import { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, XCircle, ShieldCheck, ShieldAlert, FileText } from "lucide-react-native";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { shadow } from "@/constants/shadows";
import { useAuthStore } from "@/store/authStore";
import { sellerApi, getApiError } from "@/api";

const STATUS_COPY: Record<string, { Icon: any; color: string; bg: string; title: string }> = {
  approved: { Icon: ShieldCheck, color: "#16a34a", bg: "#f0fdf4", title: "Verified" },
  pending: { Icon: Clock, color: "#d97706", bg: "#fffbeb", title: "Under Review" },
  rejected: { Icon: XCircle, color: "#dc2626", bg: "#fef2f2", title: "Not Approved" },
};

const REQUIRED_DOCS = [
  "Government-issued ID",
  "Business Registration Certificate",
  "Tax Identification Number (TIN)",
  "Bank Account Verification",
];

export default function SellerKycScreen() {
  const { profile, fetchMe } = useAuthStore();
  const kycStatus = (profile as any)?.kyc_status ?? "unverified";
  const copy = STATUS_COPY[kycStatus] ?? { Icon: ShieldAlert, color: "#2563eb", bg: "#eff6ff", title: "Verification Required" };
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await sellerApi.submitKyc();
      await fetchMe();
      Alert.alert("Submitted", "Your verification request has been sent for review.");
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Verification & KYC" />
      <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5">
          <View className="bg-white rounded-3xl p-6 items-center" style={shadow.md}>
            <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: copy.bg }}>
              <copy.Icon size={28} color={copy.color} />
            </View>
            <Text className="text-base font-extrabold text-gray-900">{copy.title}</Text>
            <Text className="text-sm text-gray-500 text-center mt-1">
              {kycStatus === "approved"
                ? "Your seller account is fully verified."
                : kycStatus === "pending"
                ? "We're reviewing your submission. This usually takes 1-2 business days."
                : kycStatus === "rejected"
                ? "Your last submission was not approved. You can submit again below."
                : "Submit your verification to unlock listings, orders, and payouts."}
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-4" style={shadow.card}>
            <View className="flex-row items-center gap-2 mb-3">
              <FileText size={16} color="#6b7280" />
              <Text className="text-xs font-bold text-gray-400 uppercase">Required Documents</Text>
            </View>
            {REQUIRED_DOCS.map((doc) => (
              <Text key={doc} className="text-sm text-gray-700 py-1.5">• {doc}</Text>
            ))}
          </View>

          {kycStatus !== "approved" && kycStatus !== "pending" && (
            <PrimaryButton label="Start Verification" loading={submitting} onPress={handleSubmit} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

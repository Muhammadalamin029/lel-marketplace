import { ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Clock, XCircle, ShieldAlert } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { shadow } from "@/constants/shadows";

const STATUS_COPY: Record<string, { Icon: any; color: string; bg: string; title: string; body: string }> = {
  pending: {
    Icon: Clock, color: "#d97706", bg: "#fffbeb",
    title: "Account Under Review",
    body: "Your seller account is pending verification. You'll be able to manage listings, orders, and payouts once approved.",
  },
  rejected: {
    Icon: XCircle, color: "#dc2626", bg: "#fef2f2",
    title: "Account Not Approved",
    body: "Your seller verification was not approved. Contact support for details or to resubmit.",
  },
  default: {
    Icon: ShieldAlert, color: "#2563eb", bg: "#eff6ff",
    title: "Verification Required",
    body: "Submit your seller verification to unlock listings, orders, and payouts.",
  },
};

/** Gates seller-only screens (products/orders/payouts) behind an approved KYC status. */
export function SellerGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile) as { kyc_status?: string } | null;
  const kycStatus = profile?.kyc_status;

  if (kycStatus === "approved") return <>{children}</>;

  const copy = STATUS_COPY[kycStatus ?? "default"] ?? STATUS_COPY.default;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-8">
      <View className="w-full bg-white rounded-3xl p-6 items-center" style={shadow.md}>
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: copy.bg }}>
          <copy.Icon size={28} color={copy.color} />
        </View>
        <Text className="text-base font-extrabold text-gray-900 text-center">{copy.title}</Text>
        <Text className="text-sm text-gray-500 text-center mt-2 leading-5">{copy.body}</Text>
        <TouchableOpacity
          onPress={() => router.push("/seller-kyc" as any)}
          className="mt-5 bg-amber-400 px-6 py-3 rounded-2xl"
          style={shadow.btn}
        >
          <Text className="text-white font-bold text-sm">View Verification Status</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

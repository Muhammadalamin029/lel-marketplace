import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { shadow } from "@/constants/shadows";
import { Landmark, FileCheck2 } from "lucide-react-native";
import { useFinancingStore } from "@/store/financingStore";
import { fmt } from "@/utils/format";

const STATUS_DISPLAY: Record<string, { badgeStatus: string; label: string }> = {
  pending_review: { badgeStatus: "pending", label: "Pending Review" },
  approved: { badgeStatus: "confirmed", label: "Approved" },
  rejected: { badgeStatus: "rejected", label: "Rejected" },
  revoked: { badgeStatus: "rejected", label: "Revoked" },
};

export default function MyFinancingApplicationScreen() {
  useRequireAuth();
  const router = useRouter();
  const { myApplication, isLoading, fetchMyApplication } = useFinancingStore();

  useEffect(() => {
    fetchMyApplication();
  }, [fetchMyApplication]);

  if (isLoading && !myApplication) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ScreenHeader title="Financing Application" />
        <View className="items-center justify-center pt-20">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      </SafeAreaView>
    );
  }

  if (!myApplication) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ScreenHeader title="Financing Application" />
        <EmptyState
          Icon={Landmark}
          title="No financing application yet"
          subtitle="Submit an application to become eligible for monthly and installment payment plans."
        />
        <View className="px-5">
          <TouchableOpacity
            onPress={() => router.push("/financing-application" as any)}
            className="bg-amber-400 py-4 rounded-2xl items-center"
            style={shadow.btn}
          >
            <Text className="text-white font-bold">Apply Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const display = STATUS_DISPLAY[myApplication.status] ?? { badgeStatus: myApplication.status, label: myApplication.status };
  const canReapply = myApplication.status === "rejected" || myApplication.status === "revoked";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Financing Application" subtitle="Your financing eligibility status" />

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5">
          <View className="flex-row items-center justify-between bg-white rounded-2xl p-4" style={shadow.md}>
            <Text className="text-sm font-bold text-gray-700">Status</Text>
            <StatusBadge status={display.badgeStatus} label={display.label} />
          </View>

          {myApplication.status === "approved" && (
            <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <Text className="text-sm text-green-700 leading-relaxed">
                You're approved. You can select monthly or installment plans on any purchase.
              </Text>
            </View>
          )}

          {myApplication.status === "pending_review" && (
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <Text className="text-sm text-amber-700 leading-relaxed">
                Your application is being reviewed by our team. We'll notify you once a decision is made.
              </Text>
            </View>
          )}

          {myApplication.status === "rejected" && myApplication.decision_reason && (
            <View className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <Text className="text-xs font-bold text-red-700 mb-1">Reason</Text>
              <Text className="text-sm text-red-700 leading-relaxed">{myApplication.decision_reason}</Text>
            </View>
          )}

          {myApplication.status === "revoked" && myApplication.revocation_reason && (
            <View className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <Text className="text-xs font-bold text-red-700 mb-1">Reason</Text>
              <Text className="text-sm text-red-700 leading-relaxed">{myApplication.revocation_reason}</Text>
            </View>
          )}

          <View className="bg-white rounded-2xl p-4 gap-4" style={shadow.md}>
            <Text className="text-sm font-bold text-gray-700">Application Details</Text>
            <View className="flex-row flex-wrap gap-4">
              <View className="flex-1 min-w-[45%]">
                <Text className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Employment Status</Text>
                <Text className="text-sm font-bold text-gray-900 capitalize">{myApplication.employment_status.replace("_", " ")}</Text>
              </View>
              <View className="flex-1 min-w-[45%]">
                <Text className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Monthly Income</Text>
                <Text className="text-sm font-bold text-gray-900">{fmt(myApplication.monthly_income)}</Text>
              </View>
              {myApplication.employer_name && (
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Employer</Text>
                  <Text className="text-sm font-bold text-gray-900">{myApplication.employer_name}</Text>
                </View>
              )}
              {myApplication.job_title && (
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Job Title</Text>
                  <Text className="text-sm font-bold text-gray-900">{myApplication.job_title}</Text>
                </View>
              )}
            </View>

            {myApplication.documents.length > 0 && (
              <View className="gap-2 pt-2 border-t border-gray-100">
                <Text className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Documents</Text>
                {myApplication.documents.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    onPress={() => Linking.openURL(doc.document_url)}
                    className="flex-row items-center gap-2"
                  >
                    <FileCheck2 size={14} color="#f59e0b" />
                    <Text className="text-sm text-amber-600 font-semibold">
                      {doc.requirement?.name || doc.original_filename || "Document"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {canReapply && (
            <TouchableOpacity
              onPress={() => router.push("/financing-application" as any)}
              className="bg-amber-400 py-4 rounded-2xl items-center"
              style={shadow.btn}
            >
              <Text className="text-white font-bold">Apply Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

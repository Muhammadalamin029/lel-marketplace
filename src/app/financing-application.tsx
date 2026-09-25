import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { ChevronDown, Upload, FileCheck2, X, Landmark } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useFinancingStore } from "@/store/financingStore";
import { uploadDocumentToCloudinary } from "@/utils/cloudinaryUpload";

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "business_owner", label: "Business Owner" },
  { value: "unemployed", label: "Unemployed" },
  { value: "retired", label: "Retired" },
  { value: "student", label: "Student" },
];

type DocState = { url: string; filename: string; uploading: boolean } | null;

export default function FinancingApplicationScreen() {
  useRequireAuth();
  const router = useRouter();
  const {
    documentRequirements,
    myApplication,
    fetchDocumentRequirements,
    fetchMyApplication,
    submitApplication,
  } = useFinancingStore();

  const [employmentStatus, setEmploymentStatus] = useState("");
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [employerName, setEmployerName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [employmentDurationMonths, setEmploymentDurationMonths] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [documents, setDocuments] = useState<Record<string, DocState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDocumentRequirements();
    fetchMyApplication();
  }, [fetchDocumentRequirements, fetchMyApplication]);

  const canApply = !myApplication || myApplication.status === "rejected" || myApplication.status === "revoked";

  const handleUploadFromLibrary = async (requirementId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.7 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const filename = asset.fileName || `document-${Date.now()}.jpg`;
    setDocuments((prev) => ({ ...prev, [requirementId]: { url: "", filename, uploading: true } }));
    try {
      const url = await uploadDocumentToCloudinary({ uri: asset.uri, name: filename, mimeType: asset.mimeType });
      setDocuments((prev) => ({ ...prev, [requirementId]: { url, filename, uploading: false } }));
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Could not upload document.");
      setDocuments((prev) => ({ ...prev, [requirementId]: null }));
    }
  };

  const handleUploadFile = async (requirementId: string) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"] });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setDocuments((prev) => ({ ...prev, [requirementId]: { url: "", filename: asset.name, uploading: true } }));
    try {
      const url = await uploadDocumentToCloudinary({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
      setDocuments((prev) => ({ ...prev, [requirementId]: { url, filename: asset.name, uploading: false } }));
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Could not upload document.");
      setDocuments((prev) => ({ ...prev, [requirementId]: null }));
    }
  };

  const handleSubmit = async () => {
    if (!employmentStatus || !monthlyIncome) {
      Alert.alert("Missing information", "Employment status and monthly income are required.");
      return;
    }
    const missingRequired = documentRequirements.filter((r) => r.is_required && !documents[r.id]?.url);
    if (missingRequired.length > 0) {
      Alert.alert("Missing documents", `Please upload: ${missingRequired.map((r) => r.name).join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitApplication({
        employment_status: employmentStatus,
        employer_name: employerName || undefined,
        job_title: jobTitle || undefined,
        monthly_income: Number(monthlyIncome),
        employment_duration_months: employmentDurationMonths ? Number(employmentDurationMonths) : undefined,
        additional_notes: additionalNotes || undefined,
        documents: Object.entries(documents)
          .filter(([, doc]) => doc?.url)
          .map(([requirement_id, doc]) => ({ requirement_id, document_url: doc!.url, original_filename: doc!.filename })),
      });
      Alert.alert("Application Submitted", "Your financing application is now pending review.", [
        { text: "OK", onPress: () => router.replace("/my-financing-application") },
      ]);
    } catch (e: any) {
      Alert.alert("Submission Failed", e?.response?.data?.detail ?? e?.message ?? "Could not submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canApply) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" />
        <ScreenHeader title="Financing Application" />
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <Landmark size={40} color="#9ca3af" />
          <Text className="text-base font-grotesk-bold text-gray-800 text-center">You already have a financing application</Text>
          <Text className="font-manrope text-sm text-gray-500 text-center capitalize">
            Status: {myApplication?.status.replace("_", " ")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/my-financing-application")}
            className="bg-[#ff4b26] py-3 px-6 rounded-2xl mt-2"
          >
            <Text className="text-white font-grotesk-bold">View Application Status</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Financing Application" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-6 gap-6">
          <Text className="font-grotesk text-sm text-gray-600 leading-relaxed">
            Submit your employment and income details to become eligible for monthly and installment payment plans on any purchase.
          </Text>

          <View className="bg-white rounded-2xl p-4 gap-5" style={shadow.md}>
            <View className="gap-2">
              <Text className="text-sm font-grotesk-bold text-gray-700">Employment Status *</Text>
              <TouchableOpacity
                onPress={() => setShowStatusPicker(!showStatusPicker)}
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 flex-row items-center justify-between"
              >
                <Text className="text-sm font-grotesk-semibold text-gray-900">
                  {EMPLOYMENT_STATUS_OPTIONS.find((o) => o.value === employmentStatus)?.label || "Select status"}
                </Text>
                <ChevronDown size={16} color="#6b7280" />
              </TouchableOpacity>
              {showStatusPicker && (
                <View className="border border-gray-200 rounded-xl overflow-hidden">
                  {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => { setEmploymentStatus(opt.value); setShowStatusPicker(false); }}
                      className={`px-4 py-3 border-b border-gray-100 ${employmentStatus === opt.value ? "bg-[#fff0e9]" : "bg-white"}`}
                    >
                      <Text className={`text-sm font-grotesk-semibold ${employmentStatus === opt.value ? "text-[#e03f1c]" : "text-gray-800"}`}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View className="gap-2">
              <Text className="text-sm font-grotesk-bold text-gray-700">Employer Name</Text>
              <TextInput
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900"
                placeholder="e.g. Acme Ltd"
                placeholderTextColor="#9ca3af"
                value={employerName}
                onChangeText={setEmployerName}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-grotesk-bold text-gray-700">Job Title</Text>
              <TextInput
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900"
                placeholder="e.g. Accountant"
                placeholderTextColor="#9ca3af"
                value={jobTitle}
                onChangeText={setJobTitle}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-grotesk-bold text-gray-700">Monthly Income (₦) *</Text>
              <TextInput
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900"
                placeholder="e.g. 350000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-grotesk-bold text-gray-700">Employment Duration (months)</Text>
              <TextInput
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3.5 text-sm text-gray-900"
                placeholder="e.g. 24"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={employmentDurationMonths}
                onChangeText={setEmploymentDurationMonths}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-grotesk-bold text-gray-700">Additional Notes</Text>
              <TextInput
                className="border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900"
                placeholder="Anything else you'd like us to know"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>
          </View>

          {documentRequirements.length > 0 && (
            <View className="bg-white rounded-2xl p-4 gap-4" style={shadow.md}>
              <Text className="text-sm font-grotesk-bold text-gray-700">Supporting Documents</Text>
              {documentRequirements.map((req) => {
                const doc = documents[req.id];
                return (
                  <View key={req.id} className="gap-2">
                    <Text className="text-xs font-grotesk-bold text-gray-600">
                      {req.name}{req.is_required && <Text className="font-grotesk text-red-500"> *</Text>}
                    </Text>
                    {req.description && <Text className="font-manrope text-xs text-gray-400">{req.description}</Text>}

                    {doc?.url ? (
                      <View className="flex-row items-center justify-between border border-gray-200 rounded-xl bg-gray-50 px-4 py-3">
                        <View className="flex-row items-center gap-2 flex-1">
                          <FileCheck2 size={16} color="#16a34a" />
                          <Text className="font-grotesk text-sm text-gray-800 flex-1" numberOfLines={1}>{doc.filename}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setDocuments((prev) => ({ ...prev, [req.id]: null }))}>
                          <X size={16} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    ) : doc?.uploading ? (
                      <View className="flex-row items-center gap-2 border border-gray-200 rounded-xl bg-gray-50 px-4 py-3">
                        <ActivityIndicator size="small" color="#d97706" />
                        <Text className="font-manrope text-sm text-gray-500">Uploading...</Text>
                      </View>
                    ) : (
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleUploadFromLibrary(req.id)}
                          className="flex-1 flex-row items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl py-3"
                        >
                          <Upload size={14} color="#6b7280" />
                          <Text className="text-xs font-grotesk-semibold text-gray-600">Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleUploadFile(req.id)}
                          className="flex-1 flex-row items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl py-3"
                        >
                          <Upload size={14} color="#6b7280" />
                          <Text className="text-xs font-grotesk-semibold text-gray-600">File / PDF</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#ff4b26] py-4 rounded-2xl items-center"
            style={shadow.btn}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-grotesk-bold text-base">Submit Application</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

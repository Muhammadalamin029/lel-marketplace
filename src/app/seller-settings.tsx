import { useState } from "react";
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FormInput } from "@/components/FormInput";
import { FormSection } from "@/components/FormSection";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ImageUploader } from "@/components/ImageUploader";
import { useAuthStore } from "@/store/authStore";
import { getApiError } from "@/api";
import type { SellerProfileData } from "@/api";

export default function SellerSettingsScreen() {
  const { profile, updateProfile } = useAuthStore();
  const seller = profile as SellerProfileData;

  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<string[]>(seller?.logo_url ? [seller.logo_url] : []);
  const [form, setForm] = useState({
    business_name: seller?.business_name ?? "",
    contact_phone: seller?.contact_phone ?? "",
    website_url: seller?.website_url ?? "",
    description: seller?.description ?? "",
  });

  const set = (key: keyof typeof form) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.business_name.trim()) {
      Alert.alert("Missing Field", "Business name is required.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        business_name: form.business_name.trim(),
        contact_phone: form.contact_phone.trim() || undefined,
        website_url: form.website_url.trim() || undefined,
        description: form.description.trim() || undefined,
        logo_url: logo[0],
      });
      Alert.alert("Saved", "Your business profile has been updated.");
    } catch (e) {
      Alert.alert("Error", getApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScreenHeader title="Business Settings" />
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="gap-5">
            <FormSection title="Business Logo">
              <ImageUploader images={logo} onChange={setLogo} max={1} />
            </FormSection>

            <FormSection title="Business Info">
              <FormInput label="Business Name" required placeholder="Your business name" value={form.business_name} onChangeText={set("business_name")} />
              <FormInput label="Contact Phone" keyboardType="phone-pad" placeholder="+234..." value={form.contact_phone} onChangeText={set("contact_phone")} />
              <FormInput label="Website" autoCapitalize="none" placeholder="https://..." value={form.website_url} onChangeText={set("website_url")} />
              <FormInput label="Description" multiline numberOfLines={4} textAlignVertical="top" style={{ minHeight: 90 }} placeholder="What does your business offer?" value={form.description} onChangeText={set("description")} />
            </FormSection>

            <PrimaryButton label="Save Changes" loading={saving} onPress={handleSave} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

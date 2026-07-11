import { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { Image } from "expo-image";
import { AlertCircle } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { authApi, getApiError } from "@/api";
import { FormInput } from "@/components/FormInput";
import { PrimaryButton } from "@/components/PrimaryButton";

const SELLER_TYPES = [
  { value: "retailer", label: "Retail Business" },
  { value: "car_dealer", label: "Car Dealer" },
  { value: "real_agent", label: "Real Estate Agent" },
] as const;

const BLANK = {
  seller_type: "retailer" as (typeof SELLER_TYPES)[number]["value"],
  business_name: "", contact_email: "", contact_phone: "", website_url: "", description: "",
  password: "", confirmPassword: "",
};

function SectionLabel({ children }: { children: string }) {
  return (
    <View className="pt-2 mt-1 border-t border-border">
      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{children}</Text>
    </View>
  );
}

export default function RegisterSellerScreen() {
  const router = useRouter();
  const { registerSeller, isLoading } = useAuthStore();
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<typeof form>>({});

  const set = (key: keyof typeof form) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.business_name.trim()) errs.business_name = "Business name is required";
    if (!form.contact_email.trim()) errs.contact_email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.contact_email)) errs.contact_email = "Enter a valid email";
    if (!form.contact_phone.trim()) errs.contact_phone = "Phone number is required";
    if (!form.description.trim()) errs.description = "A short description is required";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "At least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setError(null);
    try {
      await registerSeller({
        email: form.contact_email.trim(),
        password: form.password,
        business_name: form.business_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        description: form.description.trim(),
        website_url: form.website_url.trim() || undefined,
        seller_type: form.seller_type,
      });
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(form.contact_email.trim())}` as any);
    } catch (e) {
      setError(getApiError(e));
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerClassName="flex-grow justify-center items-center p-6" showsVerticalScrollIndicator={false}>
        <View className="mb-6 items-center">
          <Image source={require("../../../assets/images/logo.png")} style={{ width: 160, height: 54 }} contentFit="contain" />
        </View>

        <View className="w-full max-w-[400px] bg-card rounded-xl p-6 shadow-sm border border-border">
          <Text className="text-2xl font-semibold text-foreground text-center mb-1">Become a Seller</Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">Start selling on Alhaq Marketplace</Text>

          {error && (
            <View className="flex-row items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-sm text-destructive flex-1">{error}</Text>
            </View>
          )}

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Business Category</Text>
              <View className="flex-row gap-2">
                {SELLER_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => set("seller_type")(t.value)}
                    className={`flex-1 py-2.5 rounded-lg items-center border ${form.seller_type === t.value ? "bg-primary border-primary" : "bg-card border-border"}`}
                  >
                    <Text className={`text-[11px] font-bold text-center ${form.seller_type === t.value ? "text-primary-foreground" : "text-foreground"}`}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <SectionLabel>Business Details</SectionLabel>
            <FormInput label="Business Name" required placeholder="e.g. Acme Retail" value={form.business_name} onChangeText={set("business_name")} error={fieldErrors.business_name} />
            <FormInput label="Business Email" required keyboardType="email-address" autoCapitalize="none" placeholder="you@business.com" value={form.contact_email} onChangeText={set("contact_email")} error={fieldErrors.contact_email} />
            <FormInput label="Contact Phone" required keyboardType="phone-pad" placeholder="+234..." value={form.contact_phone} onChangeText={set("contact_phone")} error={fieldErrors.contact_phone} />
            <FormInput label="Website (optional)" autoCapitalize="none" placeholder="https://..." value={form.website_url} onChangeText={set("website_url")} />
            <FormInput label="Business Description" required multiline numberOfLines={3} textAlignVertical="top" style={{ minHeight: 70 }} placeholder="What do you sell?" value={form.description} onChangeText={set("description")} error={fieldErrors.description} />

            <SectionLabel>Account Security</SectionLabel>
            <FormInput label="Password" required secureTextEntry placeholder="Create a password" value={form.password} onChangeText={set("password")} error={fieldErrors.password} />
            <FormInput label="Confirm Password" required secureTextEntry placeholder="Confirm your password" value={form.confirmPassword} onChangeText={set("confirmPassword")} error={fieldErrors.confirmPassword} />

            {isLoading ? (
              <View className="py-3.5 items-center"><ActivityIndicator color="#f59e0b" /></View>
            ) : (
              <PrimaryButton label="Create Seller Account" onPress={handleRegister} />
            )}
          </View>

          <View className="mt-6 items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Text className="text-muted-foreground text-sm">Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity><Text className="text-primary text-sm font-medium underline">Sign in</Text></TouchableOpacity>
              </Link>
            </View>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity><Text className="text-muted-foreground text-xs underline">Register as a customer instead</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

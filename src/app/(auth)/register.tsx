import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react-native";
import { authApi, getApiError } from "@/api";
import { BRAND_ASSETS, COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";

type Form = { name: string; email: string; phone: string; password: string; confirmPassword: string };

export default function Register() {
  const router = useRouter();
  const { registerCustomer, isLoading } = useAuthStore();
  const [form, setForm] = useState<Form>({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof Form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!accepted) return setError("Please agree to the Terms and Privacy Policy.");
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) return setError("Please fill all required fields.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setError(null);
    try {
      await registerCustomer({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      authApi.sendVerificationEmail(form.email.trim()).catch(() => {});
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(form.email.trim())}` as any);
    } catch (e) {
      setError(getApiError(e));
    }
  };

  const disabled = isLoading || !accepted || !form.name || !form.email || !form.phone || !form.password || form.password !== form.confirmPassword;

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <View className="px-8 pt-12">
          <Image source={BRAND_ASSETS.signup} style={{ width: "100%", height: 170, borderRadius: 10 }} resizeMode="cover" />
          <Text className="text-3xl font-black text-gray-950 mt-7">Sign Up</Text>
          <Text className="text-sm text-gray-400 mt-2 mb-6">Create an account to get started with LEL Store.</Text>

          {error && (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-sm text-red-600 flex-1">{error}</Text>
            </View>
          )}

          <View className="gap-4">
            <Field label="Full Name" icon={<User size={16} color="#9ca3af" />} value={form.name} onChangeText={update("name")} placeholder="Enter your full name" />
            <Field label="Email" icon={<Mail size={16} color="#9ca3af" />} value={form.email} onChangeText={update("email")} placeholder="Enter your email" keyboardType="email-address" />
            <Field label="Phone Number" icon={<Phone size={16} color="#9ca3af" />} value={form.phone} onChangeText={update("phone")} placeholder="Enter your phone number" keyboardType="phone-pad" />
            <PasswordField label="Password" value={form.password} onChangeText={update("password")} show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            <PasswordField label="Confirm Password" value={form.confirmPassword} onChangeText={update("confirmPassword")} show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          </View>

          <TouchableOpacity onPress={() => setAccepted((v) => !v)} className="flex-row items-center gap-2 mt-5">
            <View className="w-5 h-5 rounded border items-center justify-center" style={{ borderColor: accepted ? COLORS.primary : "#d1d5db", backgroundColor: accepted ? COLORS.primary : "#fff" }}>
              {accepted && <Check size={13} color="#fff" />}
            </View>
            <View className="flex-1 flex-row flex-wrap">
              <Text className="text-xs text-gray-500">I agree to the </Text>
              <TouchableOpacity onPress={() => router.push("/terms")} hitSlop={8}>
                <Text style={{ color: COLORS.primary }} className="text-xs font-bold">Terms and Conditions</Text>
              </TouchableOpacity>
              <Text className="text-xs text-gray-500"> and </Text>
              <TouchableOpacity onPress={() => router.push("/privacy")} hitSlop={8}>
                <Text style={{ color: COLORS.primary }} className="text-xs font-bold">Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <TouchableOpacity disabled={disabled} onPress={handleRegister} className="h-14 rounded-full items-center justify-center mt-6" style={{ backgroundColor: disabled ? "#ffb3a2" : COLORS.primary }}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-sm font-black">Create Account</Text>}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-xs text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={{ color: COLORS.primary }} className="text-xs font-bold">Sign in.</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-bold text-gray-900">{props.label}</Text>
      <View className="h-14 bg-gray-50 rounded-sm flex-row items-center px-4">
        {props.icon}
        <TextInput className="flex-1 text-sm text-gray-950 px-3" placeholder={props.placeholder} placeholderTextColor="#bdbdbd" value={props.value} onChangeText={props.onChangeText} keyboardType={props.keyboardType ?? "default"} autoCapitalize="none" />
      </View>
    </View>
  );
}

function PasswordField({ label, value, onChangeText, show, onToggle }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-bold text-gray-900">{label}</Text>
      <View className="h-14 bg-gray-50 rounded-sm flex-row items-center px-4">
        <Lock size={16} color="#9ca3af" />
        <TextInput className="flex-1 text-sm text-gray-950 px-3" placeholder="Create your password" placeholderTextColor="#bdbdbd" value={value} onChangeText={onChangeText} secureTextEntry={!show} />
        <TouchableOpacity onPress={onToggle}>
          {show ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

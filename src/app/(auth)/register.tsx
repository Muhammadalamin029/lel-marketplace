import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { AlertCircle, Check, Eye, EyeOff, ChevronLeft } from "lucide-react-native";
import { authApi, getApiError } from "@/api";
import { COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { handleGoogleResponse, useGoogleIdTokenRequest } from "@/hooks/useGoogleAuth";
import { AuthPrimaryButton, GoogleButton, OrDivider, AuthInput } from "@/components/forms";

type Form = { name: string; email: string; phone: string; password: string; confirmPassword: string };

const PHONE_FORMAT_HINT = "Use international format, e.g. +2348012345678.";
const PHONE_REGEX = /^[+]?[1-9]\d{0,15}$/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>]/;
const WEAK_PASSWORDS = new Set([
  "password", "123456", "qwerty", "abc123", "admin", "letmein",
  "welcome", "monkey", "1234567890", "password123", "admin123",
]);

function getPasswordPolicyError(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (password.length > 128) return "Password must be no more than 128 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/\d/.test(password)) return "Password must contain at least one number";
  if (!SPECIAL_CHAR_REGEX.test(password)) return "Password must contain at least one special character";
  if (WEAK_PASSWORDS.has(password.toLowerCase())) return "Password is too common and easily guessed";
  return null;
}

export default function Register() {
  const router = useRouter();
  const { registerCustomer, isLoading } = useAuthStore();
  const [form, setForm] = useState<Form>({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { request: googleRequest, response: googleResponse, promptAsync: promptGoogle, configured: googleConfigured } =
    useGoogleIdTokenRequest();

  useEffect(() => {
    if (!googleResponse) return;
    (async () => {
      setGoogleBusy(true);
      setError(null);
      try {
        const { redirectTarget } = await handleGoogleResponse(googleResponse);
        router.replace(redirectTarget as any);
      } catch (e) {
        const msg = e instanceof Error ? e.message : getApiError(e);
        if (msg !== "Google sign-in was cancelled.") setError(msg);
      } finally {
        setGoogleBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const update = (key: keyof Form) => (value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!accepted) return setError("Please agree to the Terms and Privacy Policy.");
    if (!name || !email || !phone || !form.password) return setError("Please fill all required fields.");
    if (!PHONE_REGEX.test(phone)) return setError("Enter a valid phone number in international format, e.g. +2348012345678.");
    const passwordError = getPasswordPolicyError(form.password);
    if (passwordError) return setError(passwordError);
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setError(null);
    try {
      await registerCustomer({ name, email, phone, password: form.password });
      authApi.sendVerificationEmail(email).catch(() => {});
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(email)}` as any);
    } catch (e) {
      setError(getApiError(e));
    }
  };

  const disabled = isLoading || !accepted || !form.name || !form.email || !form.phone || !form.password || form.password !== form.confirmPassword;

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 34 }}>
        <View className="px-7 pt-14 flex-1">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="self-start p-1 -ml-1 mb-6">
            <ChevronLeft size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[26px] font-grotesk-extrabold text-gray-950">Create account.</Text>
          <Text className="font-manrope text-sm text-gray-400 mt-2 mb-8">Sign up to start shopping on LEL Store.</Text>

          {error && (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="font-grotesk text-sm text-red-600 flex-1">{error}</Text>
            </View>
          )}

          <View className="gap-5">
            <View className="gap-2">
              <Text className="text-sm font-grotesk-semibold text-gray-900">Full name</Text>
              <AuthInput value={form.name} onChangeText={update("name")} placeholder="Enter your full name" autoCapitalize="words" />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-grotesk-semibold text-gray-900">Email address</Text>
              <AuthInput value={form.email} onChangeText={update("email")} placeholder="Enter your email" keyboardType="email-address" />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-grotesk-semibold text-gray-900">Phone number</Text>
              <AuthInput value={form.phone} onChangeText={update("phone")} placeholder="+2348012345678" keyboardType="phone-pad" />
              <Text className="font-manrope text-[11px] text-gray-400">{PHONE_FORMAT_HINT}</Text>
            </View>
            <View className="gap-2">
              <Text className="text-sm font-grotesk-semibold text-gray-900">Password</Text>
              <AuthInput
                value={form.password} onChangeText={update("password")}
                placeholder="Create your password" secureTextEntry={!showPassword}
                rightSlot={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                  </TouchableOpacity>
                }
              />
              <PasswordStrengthMeter password={form.password} />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-grotesk-semibold text-gray-900">Confirm password</Text>
              <AuthInput
                value={form.confirmPassword} onChangeText={update("confirmPassword")}
                placeholder="Confirm your password" secureTextEntry={!showPassword}
              />
            </View>
          </View>

          <TouchableOpacity onPress={() => setAccepted((v) => !v)} className="flex-row items-center gap-2 mt-5">
            <View
              className="w-5 h-5 rounded border items-center justify-center"
              style={{ borderColor: accepted ? COLORS.primary : "#d1d5db", backgroundColor: accepted ? COLORS.primary : "#fff" }}
            >
              {accepted && <Check size={13} color="#fff" />}
            </View>
            <View className="flex-1 flex-row flex-wrap">
              <Text className="font-manrope text-xs text-gray-500">I agree to the </Text>
              <TouchableOpacity onPress={() => router.push("/terms")} hitSlop={8}>
                <Text style={{ color: COLORS.primary }} className="text-xs font-grotesk-bold">Terms and Conditions</Text>
              </TouchableOpacity>
              <Text className="font-manrope text-xs text-gray-500"> and </Text>
              <TouchableOpacity onPress={() => router.push("/privacy")} hitSlop={8}>
                <Text style={{ color: COLORS.primary }} className="text-xs font-grotesk-bold">Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <View className="mt-8">
            <AuthPrimaryButton title={isLoading ? "Please wait…" : "Create Account"} onPress={handleRegister} disabled={disabled} busy={isLoading} />
          </View>

          {googleConfigured && (
            <>
              <View className="my-6">
                <OrDivider />
              </View>
              <GoogleButton
                onPress={() => promptGoogle()}
                disabled={!googleRequest || googleBusy || isLoading}
                busy={googleBusy}
              />
            </>
          )}

          <View className="flex-row justify-center mt-auto pt-10">
            <Text className="font-manrope text-xs text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: COLORS.primary }} className="text-xs font-grotesk-bold">Sign in.</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

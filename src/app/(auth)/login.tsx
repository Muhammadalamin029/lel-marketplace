import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, Eye, EyeOff, ChevronLeft } from "lucide-react-native";
import { authApi, getApiError } from "@/api";
import { COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";
import { handleGoogleResponse, useGoogleIdTokenRequest } from "@/hooks/useGoogleAuth";
import { AuthPrimaryButton, GoogleButton, OrDivider, AuthInput } from "@/components/forms";

export default function Login() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        const { redirectTarget } = await handleGoogleResponse(googleResponse, redirect);
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

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setError(null);
    try {
      const trimmedEmail = email.trim();
      await login({ email: trimmedEmail, password });
      const { user } = useAuthStore.getState();
      if (!user?.email_verified) {
        authApi.sendVerificationEmail(trimmedEmail).catch(() => {});
        router.replace(`/(auth)/verify-email?email=${encodeURIComponent(trimmedEmail)}` as any);
      } else {
        router.replace((redirect as any) ?? "/(tabs)");
      }
    } catch (e) {
      setError(getApiError(e));
    }
  };

  const disabled = isLoading || !email.trim() || !password;

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 34 }}>
        <View className="px-7 pt-14 flex-1">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="self-start p-1 -ml-1 mb-6">
            <ChevronLeft size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[26px] font-grotesk-extrabold text-gray-950">Welcome back.</Text>
          <Text className="font-manrope text-sm text-gray-400 mt-2 mb-8">Log in to continue to LEL Store.</Text>

          {error && (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="font-grotesk text-sm text-red-600 flex-1">{error}</Text>
            </View>
          )}

          <View className="gap-5">
            <View className="gap-2">
              <Text className="text-sm font-grotesk-semibold text-gray-900">Email address</Text>
              <AuthInput
                value={email} onChangeText={setEmail}
                placeholder="Enter your email" keyboardType="email-address"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-grotesk-semibold text-gray-900">Password</Text>
              <AuthInput
                value={password} onChangeText={setPassword}
                placeholder="Enter your password" secureTextEntry={!showPassword}
                rightSlot={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                  </TouchableOpacity>
                }
              />
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password" as any)} className="items-end mt-4">
            <Text style={{ color: COLORS.primary }} className="text-xs font-grotesk-bold">Forget Password?</Text>
          </TouchableOpacity>

          <View className="mt-10">
            <AuthPrimaryButton title={isLoading ? "Please wait…" : "Log In"} onPress={handleLogin} disabled={disabled} busy={isLoading} />
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
            <Text className="font-manrope text-xs text-gray-500">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: COLORS.primary }} className="text-xs font-grotesk-bold">Sign up.</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { authApi, getApiError } from "@/api";
import { BRAND, BRAND_ASSETS, COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <View className="px-8 pt-14">
          <Image source={BRAND_ASSETS.login} style={{ width: "100%", height: 210, borderRadius: 10 }} resizeMode="cover" />
          <Text className="text-3xl font-black text-gray-950 mt-8">Log in</Text>
          <Text className="text-sm text-gray-400 mt-2 mb-8">Welcome back. Please login to your {BRAND.name} account.</Text>

          {error && (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-sm text-red-600 flex-1">{error}</Text>
            </View>
          )}

          <View className="gap-5">
            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-900">Email or phone number</Text>
              <View className="h-14 bg-gray-50 rounded-sm flex-row items-center px-4">
                <TextInput className="flex-1 text-sm text-gray-950" placeholder="Enter email or phone number" placeholderTextColor="#bdbdbd" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                <Mail size={16} color="#9ca3af" />
              </View>
            </View>
            <View className="gap-2">
              <Text className="text-sm font-bold text-gray-900">Password</Text>
              <View className="h-14 bg-gray-50 rounded-sm flex-row items-center px-4">
                <Lock size={16} color="#9ca3af" />
                <TextInput className="flex-1 text-sm text-gray-950 px-3" placeholder="Enter your password" placeholderTextColor="#bdbdbd" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password" as any)} className="items-end mt-5">
            <Text style={{ color: COLORS.primary }} className="text-xs font-bold">Forget Password ?</Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={disabled} onPress={handleLogin} className="h-14 rounded-full items-center justify-center mt-12" style={{ backgroundColor: disabled ? "#ffb3a2" : COLORS.primary }}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-sm font-black">Get Started</Text>}
          </TouchableOpacity>

          <View className="flex-row items-center gap-4 my-5">
            <View className="h-px bg-gray-100 flex-1" />
            <Text className="text-xs text-gray-400">Or</Text>
            <View className="h-px bg-gray-100 flex-1" />
          </View>
          <TouchableOpacity className="h-14 rounded-full border border-gray-200 items-center justify-center">
            <Text className="text-gray-950 text-sm font-bold">Continue with Google</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-16">
            <Text className="text-xs text-gray-500">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity><Text style={{ color: COLORS.primary }} className="text-xs font-bold">Sign up</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

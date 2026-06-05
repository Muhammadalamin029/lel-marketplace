import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Mail, CheckCircle, AlertCircle, RefreshCw } from "lucide-react-native";
import { authApi, getApiError } from "@/api";

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) { setError("Enter the 6-digit code from your email."); return; }
    setIsVerifying(true);
    setError(null);
    try {
      await authApi.verifyEmail(email ?? "", code);
      setSuccess(true);
      setTimeout(() => router.replace("/(tabs)"), 1800);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    try {
      await authApi.sendVerificationEmail(email ?? "");
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6 gap-5">
        <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center">
          <CheckCircle size={40} color="#22c55e" />
        </View>
        <Text className="text-2xl font-extrabold text-gray-900 text-center">Email Verified!</Text>
        <Text className="text-sm text-gray-500 text-center">Your account is now active. Redirecting you to the app…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerClassName="flex-grow justify-center items-center p-6" showsVerticalScrollIndicator={false}>

        <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-6">
          <Mail size={32} color="#3b82f6" />
        </View>

        <Text className="text-2xl font-extrabold text-gray-900 text-center mb-2">Check your email</Text>
        <Text className="text-sm text-gray-500 text-center mb-1">We sent a 6-digit code to</Text>
        <Text className="text-sm font-bold text-gray-800 text-center mb-8">{email}</Text>

        {error && (
          <View className="w-full max-w-[400px] flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <AlertCircle size={16} color="#ef4444" />
            <Text className="text-sm text-red-600 flex-1">{error}</Text>
          </View>
        )}

        <View className="w-full max-w-[400px] bg-card rounded-xl p-6 border border-border gap-5">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Verification Code</Text>
            <TextInput
              className="border border-border rounded-lg bg-card px-4 py-3.5 text-2xl text-center font-mono tracking-[14px] text-foreground"
              placeholder="------"
              placeholderTextColor="#d1d5db"
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <Text className="text-xs text-muted-foreground text-center">Code expires in 15 minutes</Text>
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={code.length < 6 || isVerifying}
            className={`rounded-lg p-3.5 items-center flex-row justify-center gap-2 ${code.length < 6 || isVerifying ? "bg-primary/50" : "bg-primary"}`}
          >
            {isVerifying && <ActivityIndicator size="small" color="#fff" />}
            <Text className="text-primary-foreground text-sm font-semibold">
              {isVerifying ? "Verifying…" : "Verify Email"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-sm text-muted-foreground">Didn't receive it?</Text>
            <TouchableOpacity onPress={handleResend} disabled={isResending} className="flex-row items-center gap-1">
              {isResending
                ? <ActivityIndicator size="small" color="#f59e0b" />
                : <RefreshCw size={13} color="#f59e0b" />}
              <Text className="text-primary text-sm font-medium">Resend</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, CheckCircle, ChevronLeft } from "lucide-react-native";
import { authApi, getApiError } from "@/api";
import { COLORS } from "@/constants/brand";
import { useAuthStore } from "@/store/authStore";
import { handleGoogleResponse, useGoogleIdTokenRequest } from "@/hooks/useGoogleAuth";
import { AuthPrimaryButton, GoogleButton, OrDivider, AuthInput } from "@/components/forms";

const RESEND_COOLDOWN = 60;

function fmtCountdown(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function VerifyEmail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { fetchMe, user } = useAuthStore();
  const email = params.email || user?.email || "";

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [googleBusy, setGoogleBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { request: googleRequest, response: googleResponse, promptAsync: promptGoogle, configured: googleConfigured } =
    useGoogleIdTokenRequest();

  const startCooldown = () => {
    setCountdown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

  useEffect(() => {
    if (email) {
      authApi.sendVerificationEmail(email).catch(() => {});
      startCooldown();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    if (code.length < 6) { setError("Enter the 6-digit code from your email."); return; }
    setIsVerifying(true);
    setError(null);
    try {
      await authApi.verifyEmail(email, code);
      setSuccess(true);
      setTimeout(async () => {
        await fetchMe();
        router.replace("/(tabs)" as any);
      }, 1800);
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
      await authApi.sendVerificationEmail(email);
      startCooldown();
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setIsResending(false);
    }
  };

  const canResend = countdown === 0 && !isResending;

  if (success) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6 gap-5">
        <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center">
          <CheckCircle size={40} color="#22c55e" />
        </View>
        <Text className="text-2xl font-grotesk-extrabold text-gray-900 text-center">Email Verified!</Text>
        <Text className="font-manrope text-sm text-gray-500 text-center">Your account is now active. Redirecting you to the app…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 34 }}>
        <View className="px-7 pt-14 flex-1">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="self-start p-1 -ml-1 mb-6">
            <ChevronLeft size={22} color="#111827" />
          </TouchableOpacity>

          <Text className="text-[26px] font-grotesk-extrabold text-gray-950">Verify your account.</Text>
          <Text className="font-manrope text-sm text-gray-400 mt-2 mb-8">
            Enter the code sent to your email{email ? ` (${email})` : ""}.
          </Text>

          {error && (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="font-grotesk text-sm text-red-600 flex-1">{error}</Text>
            </View>
          )}

          <View className="gap-2">
            <Text className="text-sm font-grotesk-semibold text-gray-900">Enter Code sent to your Email</Text>
            <AuthInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter Code"
              keyboardType="number-pad"
            />
          </View>

          <View className="items-center mt-8 gap-1.5">
            <Text className="text-xs text-gray-900 font-grotesk-semibold">Didn't Receive any code?</Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend}>
              {isResending ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text className="text-xs font-grotesk-bold" style={{ color: canResend ? COLORS.primary : "#d1d5db" }}>
                  Resend Code{countdown > 0 ? ` (${fmtCountdown(countdown)})` : ""}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-10">
            <AuthPrimaryButton
              title={isVerifying ? "Verifying…" : "Verify Account"}
              onPress={handleVerify}
              disabled={code.length < 6 || isVerifying}
              busy={isVerifying}
            />
          </View>

          {googleConfigured && (
            <>
              <View className="my-6">
                <OrDivider />
              </View>
              <GoogleButton
                onPress={() => promptGoogle()}
                disabled={!googleRequest || googleBusy}
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

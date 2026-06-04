import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react-native";

type Step = "email" | "code" | "password" | "done";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      // TODO: POST /auth/forgot-password { email }
      await new Promise((r) => setTimeout(r, 800));
      setStep("code");
    } catch {
      setError("Could not send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length < 6) { setError("Enter the 6-digit code from your email."); return; }
    setIsLoading(true);
    setError(null);
    try {
      // TODO: POST /auth/verify-reset-code { email, code }
      await new Promise((r) => setTimeout(r, 600));
      setStep("password");
    } catch {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    setError(null);
    try {
      // TODO: POST /auth/reset-password { email, code, new_password }
      await new Promise((r) => setTimeout(r, 800));
      setStep("done");
    } catch {
      setError("Could not reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-gray-50" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-14 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
          <ArrowLeft size={18} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-gray-900">Reset Password</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-8 pb-12">

          {/* Step indicator */}
          <View className="flex-row items-center gap-2 mb-8">
            {(["email", "code", "password", "done"] as Step[]).map((s, i) => (
              <View key={s} className="flex-row items-center">
                <View className={`w-7 h-7 rounded-full items-center justify-center ${
                  step === s ? "bg-amber-400" :
                  ["email","code","password","done"].indexOf(step) > i ? "bg-green-500" : "bg-gray-200"
                }`}>
                  <Text className="text-white text-xs font-bold">{i + 1}</Text>
                </View>
                {i < 3 && <View className={`w-8 h-0.5 mx-1 ${["email","code","password","done"].indexOf(step) > i ? "bg-green-500" : "bg-gray-200"}`} />}
              </View>
            ))}
          </View>

          {error && (
            <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-sm text-red-600 flex-1">{error}</Text>
            </View>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <View className="gap-5">
              <View>
                <Text className="text-2xl font-extrabold text-gray-900 mb-2">Forgot password?</Text>
                <Text className="text-sm text-gray-500 leading-relaxed">Enter your email address and we'll send you a reset code.</Text>
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Email Address</Text>
                <View className="flex-row items-center border border-gray-200 rounded-xl bg-white px-3">
                  <Mail size={16} color="#9ca3af" />
                  <TextInput
                    className="flex-1 py-3.5 px-2 text-sm text-gray-900"
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSendCode}
                disabled={!email.trim() || isLoading}
                className={`py-4 rounded-2xl items-center ${!email.trim() || isLoading ? "bg-amber-200" : "bg-amber-400"}`}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Send Reset Code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Code */}
          {step === "code" && (
            <View className="gap-5">
              <View>
                <Text className="text-2xl font-extrabold text-gray-900 mb-2">Check your email</Text>
                <Text className="text-sm text-gray-500 leading-relaxed">We sent a 6-digit code to <Text className="font-semibold text-gray-700">{email}</Text>.</Text>
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-gray-700">Reset Code</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl bg-white px-4 py-3.5 text-2xl text-center font-mono tracking-[12px] text-gray-900"
                  placeholder="------"
                  placeholderTextColor="#d1d5db"
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                onPress={handleVerifyCode}
                disabled={code.length < 6 || isLoading}
                className={`py-4 rounded-2xl items-center ${code.length < 6 || isLoading ? "bg-amber-200" : "bg-amber-400"}`}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Verify Code</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendCode} className="items-center">
                <Text className="text-sm text-amber-500 font-semibold">Resend code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: New password */}
          {step === "password" && (
            <View className="gap-5">
              <View>
                <Text className="text-2xl font-extrabold text-gray-900 mb-2">Create new password</Text>
                <Text className="text-sm text-gray-500">Choose a strong password for your account.</Text>
              </View>
              {[
                { label: "New Password", value: newPassword, set: setNewPassword },
                { label: "Confirm Password", value: confirmPassword, set: setConfirmPassword },
              ].map(({ label, value, set }) => (
                <View key={label} className="gap-2">
                  <Text className="text-sm font-semibold text-gray-700">{label}</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl bg-white px-4 py-3.5 text-sm text-gray-900"
                    placeholder={`Enter ${label.toLowerCase()}`}
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={set}
                    secureTextEntry
                  />
                </View>
              ))}
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={!newPassword || !confirmPassword || isLoading}
                className={`py-4 rounded-2xl items-center ${!newPassword || !confirmPassword || isLoading ? "bg-amber-200" : "bg-amber-400"}`}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Reset Password</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <View className="items-center gap-6 pt-8">
              <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center">
                <CheckCircle size={40} color="#22c55e" />
              </View>
              <View className="items-center gap-2">
                <Text className="text-2xl font-extrabold text-gray-900">Password reset!</Text>
                <Text className="text-sm text-gray-500 text-center">Your password has been updated. You can now sign in with your new password.</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                className="w-full bg-amber-400 py-4 rounded-2xl items-center"
              >
                <Text className="text-white font-bold">Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { Image } from "expo-image";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setError(null);
    try {
      // Login logic here
      console.log("Login", { email, password });
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !email || !password;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center items-center p-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 items-center">
          <Image
            source={require("../../../assets/images/logo.png")}
            style={{ width: 180, height: 60 }}
            contentFit="contain"
          />
          <Link href="/(tabs)" asChild>
            <TouchableOpacity>
              <Text className="text-primary text-sm font-medium underline">
                Skip
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View className="w-full max-w-[400px] bg-card rounded-xl p-6 shadow-sm border border-border">
          <Text className="text-2xl font-semibold text-foreground text-center mb-2">
            Sign In
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">
            Enter your credentials to access your account
          </Text>

          {/* Error Alert */}
          {error && (
            <View className="flex-row items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
              <AlertCircle
                size={16}
                className="text-destructive"
                color="#ef4444"
              />
              <Text className="text-sm text-destructive flex-1">{error}</Text>
            </View>
          )}

          <View className="flex flex-col gap-4">
            {/* Email Field */}
            <View className="flex flex-col gap-2">
              <Text className="text-sm font-medium text-foreground">Email</Text>
              <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                <Mail size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 p-3 text-sm text-foreground"
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="flex flex-col gap-2">
              <Text className="text-sm font-medium text-foreground">
                Password
              </Text>
              <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                <Lock size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 p-3 text-sm text-foreground"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#9ca3af" />
                  ) : (
                    <Eye size={16} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-lg p-3.5 items-center mt-2 flex-row justify-center gap-2 ${isDisabled ? "bg-primary/50" : "bg-primary"}`}
              onPress={handleLogin}
              disabled={isDisabled}
            >
              {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
              <Text className="text-primary-foreground text-sm font-semibold">
                {isLoading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View className="mt-6 items-center flex flex-col gap-3">
            <TouchableOpacity onPress={() => router.push("/forgot-password" as any)}>
              <Text className="text-primary text-sm font-medium underline">
                Forgot your password?
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center flex-wrap justify-center gap-1">
              <Text className="text-muted-foreground text-sm">
                Don't have an account?
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary text-sm font-medium underline">
                    Sign up
                  </Text>
                </TouchableOpacity>
              </Link>
              <Text className="text-muted-foreground text-sm">or</Text>
              <Link href="/(auth)/seller-register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary text-sm font-medium underline">
                    Become a seller
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

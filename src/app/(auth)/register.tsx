import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Mail, Phone, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, XCircle } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { getApiError } from '@/api';

// --- Password Policy Component ---
function PasswordPolicy({ password }: { password: string }) {
  const rules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <View className="mt-2 flex flex-col gap-1">
      {rules.map((rule) => (
        <View key={rule.label} className="flex-row items-center gap-1.5">
          {rule.met
            ? <CheckCircle2 size={13} color="#22c55e" />
            : <XCircle size={13} color="#9ca3af" />
          }
          <Text className={`text-xs ${rule.met ? 'text-green-500' : 'text-muted-foreground'}`}>
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// --- Field Component ---
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View className="flex flex-col gap-2">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      {children}
      {error && <Text className="text-xs text-destructive">{error}</Text>}
    </View>
  );
}

// --- Main Register Screen ---
export default function Register() {
  const router = useRouter();
  const { registerCustomer, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<typeof form>>({});

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.password) errs.password = 'Password is required';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setError(null);
    try {
      await registerCustomer({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      // Send to email verification screen before entering the app
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(form.email.trim())}` as any);
    } catch (e) {
      setError(getApiError(e));
    }
  };

  const allFilled =
    !!form.name && !!form.email && !!form.phone && !!form.password && !!form.confirmPassword;
  const passwordsMatch = form.password === form.confirmPassword;
  const isDisabled = isLoading || !allFilled || !passwordsMatch || false;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center items-center p-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="mb-8 items-center">
          <Image
            source={require('../../../assets/images/logo.png')}
            style={{ width: 180, height: 60 }}
            contentFit="contain"
          />
        </View>

        <View className="w-full max-w-[400px] bg-card rounded-xl p-6 shadow-sm border border-border">
          <Text className="text-2xl font-semibold text-foreground text-center mb-1">Create Account</Text>
          <Text className="text-sm text-muted-foreground text-center mb-6">Join our marketplace today</Text>

          {/* Error Alert */}
          {error && (
            <View className="flex-row items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-sm text-destructive flex-1">{error}</Text>
            </View>
          )}

          <View className="flex flex-col gap-4">
            {/* Full Name */}
            <Field label="Full Name" error={fieldErrors.name}>
              <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                <User size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 p-3 text-sm text-foreground"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                  value={form.name}
                  onChangeText={set('name')}
                  autoCapitalize="words"
                />
              </View>
            </Field>

            {/* Email */}
            <Field label="Email" error={fieldErrors.email}>
              <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                <Mail size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 p-3 text-sm text-foreground"
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={form.email}
                  onChangeText={set('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Field>

            {/* Phone */}
            <Field label="Phone Number" error={fieldErrors.phone}>
              <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                <Phone size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 p-3 text-sm text-foreground"
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9ca3af"
                  value={form.phone}
                  onChangeText={set('phone')}
                  keyboardType="phone-pad"
                />
              </View>
            </Field>

            {/* Password */}
            <Field label="Password" error={fieldErrors.password}>
              <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                <Lock size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 p-3 text-sm text-foreground"
                  placeholder="Create a password"
                  placeholderTextColor="#9ca3af"
                  value={form.password}
                  onChangeText={set('password')}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                </TouchableOpacity>
              </View>
              {form.password.length > 0 && <PasswordPolicy password={form.password} />}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
              <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                <Lock size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 p-3 text-sm text-foreground"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9ca3af"
                  value={form.confirmPassword}
                  onChangeText={set('confirmPassword')}
                  secureTextEntry
                />
              </View>
            </Field>

            {/* Submit */}
            <TouchableOpacity
              className={`rounded-lg p-3.5 items-center mt-2 flex-row justify-center gap-2 ${isDisabled ? 'bg-primary/50' : 'bg-primary'}`}
              onPress={handleRegister}
              disabled={isDisabled}
            >
              {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
              <Text className="text-primary-foreground text-sm font-semibold">
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View className="mt-6 items-center">
            <View className="flex-row items-center gap-1">
              <Text className="text-muted-foreground text-sm">Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-primary text-sm font-medium underline">Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
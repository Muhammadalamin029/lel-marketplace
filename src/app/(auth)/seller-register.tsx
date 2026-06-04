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
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import {
  Mail, Lock, Building2, Phone, Globe, FileText,
  Eye, EyeOff, AlertCircle, CheckCircle2, XCircle,
  Store, Car, Home,
} from 'lucide-react-native';

// --- Password Policy ---
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
            : <XCircle size={13} color="#9ca3af" />}
          <Text className={`text-xs ${rule.met ? 'text-green-500' : 'text-muted-foreground'}`}>
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// --- Section Header ---
function SectionHeader({ title }: { title: string }) {
  return (
    <View className="border-b border-border pb-2 mb-1">
      <Text className="text-base font-semibold text-foreground">{title}</Text>
    </View>
  );
}

// --- Field wrapper ---
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View className="flex flex-col gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      {children}
      {error && <Text className="text-xs text-destructive">{error}</Text>}
    </View>
  );
}

// --- Seller Type Option ---
type SellerType = 'retailer' | 'car_dealer' | 'real_agent';

const SELLER_TYPES: { value: SellerType; label: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { value: 'retailer',   label: 'Retail Business',   Icon: Store },
  { value: 'car_dealer', label: 'Car Dealer',         Icon: Car },
  { value: 'real_agent', label: 'Real Estate Agent',  Icon: Home },
];

function SellerTypeCard({
  value, label, Icon, selected, onPress,
}: {
  value: SellerType; label: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 min-w-[44%] flex-col items-center justify-center rounded-xl border-2 p-4 gap-2
        ${selected ? 'border-amber-400 bg-amber-50' : 'border-border bg-card'}`}
    >
      <Icon size={24} color={selected ? '#f59e0b' : '#9ca3af'} />
      <Text className={`text-xs font-medium text-center ${selected ? 'text-amber-600' : 'text-muted-foreground'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// --- Main Screen ---
export default function SellerRegister() {
  const [sellerType, setSellerType] = useState<SellerType | null>(null);
  const [form, setForm] = useState({
    businessName: '', contactPhone: '', contactEmail: '',
    websiteUrl: '', description: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<typeof form & { sellerType: string }>>({});

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    const errs: Partial<typeof form & { sellerType: string }> = {};
    if (!sellerType)                       errs.sellerType    = 'Please select a business category';
    if (!form.businessName.trim())         errs.businessName  = 'Business name is required';
    if (!form.contactPhone.trim())         errs.contactPhone  = 'Contact phone is required';
    if (!form.contactEmail.trim())         errs.contactEmail  = 'Business email is required';
    else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) errs.contactEmail = 'Enter a valid email';
    if (!form.description.trim())          errs.description   = 'Business description is required';
    if (!form.password)                    errs.password      = 'Password is required';
    if (!form.confirmPassword)             errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setError(null);
    try {
      console.log('SellerRegister', { sellerType, ...form });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const allFilled = !!sellerType && !!form.businessName && !!form.contactPhone &&
    !!form.contactEmail && !!form.description && !!form.password && !!form.confirmPassword;
  const isDisabled = isLoading || !allFilled || form.password !== form.confirmPassword;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow items-center p-6 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View className="mt-4 mb-8 items-center">
          <Image
            source={require('../../../assets/images/logo.png')}
            style={{ width: 180, height: 60 }}
            contentFit="contain"
          />
        </View>

        <View className="w-full max-w-[480px] bg-card rounded-xl p-6 shadow-sm border border-border">

          {/* Header */}
          <View className="flex-row items-center justify-center gap-2 mb-1">
            <Store size={24} color="#f59e0b" />
            <Text className="text-2xl font-semibold text-foreground">Start Selling</Text>
          </View>
          <Text className="text-sm text-muted-foreground text-center mb-6">
            Join our marketplace and grow your business
          </Text>

          {/* Error Alert */}
          {error && (
            <View className="flex-row items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-5">
              <AlertCircle size={16} color="#ef4444" />
              <Text className="text-sm text-destructive flex-1">{error}</Text>
            </View>
          )}

          <View className="flex flex-col gap-6">

            {/* ── Business Category ── */}
            <View className="flex flex-col gap-3">
              <SectionHeader title="Business Category *" />
              <View className="flex-row flex-wrap gap-3">
                {SELLER_TYPES.map(({ value, label, Icon }) => (
                  <SellerTypeCard
                    key={value}
                    value={value}
                    label={label}
                    Icon={Icon}
                    selected={sellerType === value}
                    onPress={() => setSellerType(value)}
                  />
                ))}
              </View>
              {fieldErrors.sellerType && (
                <Text className="text-xs text-destructive">{fieldErrors.sellerType}</Text>
              )}
            </View>

            {/* ── Business Information ── */}
            <View className="flex flex-col gap-4">
              <SectionHeader title="Business Information" />

              {/* Business Name + Phone row */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field label="Business Name *" error={fieldErrors.businessName}>
                    <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                      <Building2 size={16} color="#9ca3af" />
                      <TextInput
                        className="flex-1 p-3 text-sm text-foreground"
                        placeholder="Your business name"
                        placeholderTextColor="#9ca3af"
                        value={form.businessName}
                        onChangeText={set('businessName')}
                      />
                    </View>
                  </Field>
                </View>
                <View className="flex-1">
                  <Field label="Contact Phone *" error={fieldErrors.contactPhone}>
                    <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                      <Phone size={16} color="#9ca3af" />
                      <TextInput
                        className="flex-1 p-3 text-sm text-foreground"
                        placeholder="+1234567890"
                        placeholderTextColor="#9ca3af"
                        value={form.contactPhone}
                        onChangeText={set('contactPhone')}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </Field>
                </View>
              </View>

              {/* Business Email */}
              <Field label="Business Email *" error={fieldErrors.contactEmail}>
                <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                  <Mail size={16} color="#9ca3af" />
                  <TextInput
                    className="flex-1 p-3 text-sm text-foreground"
                    placeholder="business@example.com"
                    placeholderTextColor="#9ca3af"
                    value={form.contactEmail}
                    onChangeText={set('contactEmail')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </Field>

              {/* Website URL */}
              <Field label="Website URL (Optional)" error={fieldErrors.websiteUrl}>
                <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                  <Globe size={16} color="#9ca3af" />
                  <TextInput
                    className="flex-1 p-3 text-sm text-foreground"
                    placeholder="https://yourbusiness.com"
                    placeholderTextColor="#9ca3af"
                    value={form.websiteUrl}
                    onChangeText={set('websiteUrl')}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </Field>

              {/* Description */}
              <Field label="Business Description *" error={fieldErrors.description}>
                <View className="flex-row items-start border border-border rounded-lg bg-card px-3 pt-1">
                  <FileText size={16} color="#9ca3af" style={{ marginTop: 12 }} />
                  <TextInput
                    className="flex-1 p-3 text-sm text-foreground"
                    placeholder="Tell us about your business, what you sell, and what makes you unique..."
                    placeholderTextColor="#9ca3af"
                    value={form.description}
                    onChangeText={set('description')}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{ minHeight: 100 }}
                  />
                </View>
              </Field>
            </View>

            {/* ── Account Security ── */}
            <View className="flex flex-col gap-4">
              <SectionHeader title="Account Security" />

              <View className="flex-row gap-3">
                {/* Password */}
                <View className="flex-1">
                  <Field label="Password *" error={fieldErrors.password}>
                    <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                      <Lock size={16} color="#9ca3af" />
                      <TextInput
                        className="flex-1 p-3 text-sm text-foreground"
                        placeholder="Create a strong password"
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
                </View>

                {/* Confirm Password */}
                <View className="flex-1">
                  <Field label="Confirm Password *" error={fieldErrors.confirmPassword}>
                    <View className="flex-row items-center border border-border rounded-lg bg-card px-3">
                      <Lock size={16} color="#9ca3af" />
                      <TextInput
                        className="flex-1 p-3 text-sm text-foreground"
                        placeholder="Confirm your password"
                        placeholderTextColor="#9ca3af"
                        value={form.confirmPassword}
                        onChangeText={set('confirmPassword')}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1">
                        {showConfirmPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                      </TouchableOpacity>
                    </View>
                  </Field>
                </View>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              className={`rounded-lg p-3.5 items-center flex-row justify-center gap-2 ${isDisabled ? 'bg-primary/50' : 'bg-primary'}`}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
              <Text className="text-primary-foreground text-sm font-semibold">
                {isLoading ? 'Creating Seller Account...' : 'Create Seller Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View className="mt-6 items-center flex flex-col gap-3">
            <View className="flex-row items-center flex-wrap justify-center gap-1">
              <Text className="text-muted-foreground text-sm">Want to shop instead?</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-primary text-sm font-medium underline">Create customer account</Text>
                </TouchableOpacity>
              </Link>
            </View>
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
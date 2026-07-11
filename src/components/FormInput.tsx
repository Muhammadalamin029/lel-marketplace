import { View, Text, TextInput, TextInputProps } from "react-native";

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormInput({ label, error, required, ...inputProps }: FormInputProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`border rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 ${
          error ? "border-red-300" : "border-gray-200"
        }`}
        placeholderTextColor="#9ca3af"
        {...inputProps}
      />
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}

import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from "react-native";
import { shadow } from "@/constants/shadows";

interface PrimaryButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: "primary" | "dark";
}

export function PrimaryButton({ label, loading, variant = "primary", disabled, style, ...rest }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const bg = variant === "dark" ? "bg-gray-900" : isDisabled ? "bg-amber-300" : "bg-amber-400";

  return (
    <TouchableOpacity
      disabled={isDisabled}
      className={`py-4 rounded-2xl items-center justify-center flex-row gap-2 ${bg}`}
      style={[shadow.btn, style]}
      {...rest}
    >
      {loading && <ActivityIndicator color="#fff" size="small" />}
      <Text className="text-white font-bold text-sm">{label}</Text>
    </TouchableOpacity>
  );
}

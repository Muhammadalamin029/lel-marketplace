import { View, Text } from "react-native";

interface EmptyStateProps {
  Icon: any;
  title: string;
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
}

export function EmptyState({
  Icon,
  title,
  subtitle,
  iconBg = "#f3f4f6",
  iconColor = "#9ca3af",
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center pt-20 pb-10">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={32} color={iconColor} />
      </View>
      <Text className="text-lg font-bold text-gray-900 mb-1">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-gray-500 text-center px-8">{subtitle}</Text>
      )}
    </View>
  );
}

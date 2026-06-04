import { View, Text } from "react-native";

type StatusConfig = {
  bg: string;
  text: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  delivered: { bg: "#f0fdf4", text: "#16a34a" },
  completed: { bg: "#f0fdf4", text: "#16a34a" },
  confirmed: { bg: "#f0fdf4", text: "#16a34a" },
  shipped: { bg: "#eff6ff", text: "#2563eb" },
  processing: { bg: "#fffbeb", text: "#d97706" },
  pending: { bg: "#fffbeb", text: "#d97706" },
  cancelled: { bg: "#fef2f2", text: "#dc2626" },
  failed: { bg: "#fef2f2", text: "#dc2626" },
  rejected: { bg: "#fef2f2", text: "#dc2626" },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  const display = label ?? status;

  return (
    <View
      className="px-2.5 py-1 rounded-md"
      style={{ backgroundColor: config.bg }}
    >
      <Text
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: config.text }}
      >
        {display}
      </Text>
    </View>
  );
}

import { ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, rightSlot }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-4 bg-white border-b border-gray-100">
      <View className="flex-row items-center gap-3 flex-1">
        <TouchableOpacity
          onPress={onBack ?? (() => router.back())}
          className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center"
        >
          <ArrowLeft size={18} color="#111827" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-gray-900" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightSlot && <View className="ml-2">{rightSlot}</View>}
    </View>
  );
}

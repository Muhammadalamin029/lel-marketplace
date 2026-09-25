import { ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  hideBack?: boolean;
}

/** Mockup header: plain chevron + bold title, gray subtitle underneath. */
export function ScreenHeader({ title, subtitle, onBack, rightSlot, hideBack }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="bg-white px-5 pt-4 pb-3">
      <View className="flex-row items-center gap-2">
        {!hideBack && (
          <TouchableOpacity onPress={onBack ?? (() => router.back())} hitSlop={12} className="-ml-1">
            <ChevronLeft size={22} color="#111827" />
          </TouchableOpacity>
        )}
        <Text className="font-grotesk-extrabold text-gray-900 flex-1" style={{ fontSize: 18 }} numberOfLines={1}>
          {title}
        </Text>
        {rightSlot}
      </View>
      {!!subtitle && (
        <Text className="font-manrope text-gray-400 mt-0.5" style={{ marginLeft: hideBack ? 0 : 30, fontSize: 12 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

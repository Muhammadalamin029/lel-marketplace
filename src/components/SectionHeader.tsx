import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  showDots?: boolean;
}

export function SectionHeader({ title, onSeeAll, showDots = true }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-3.5">
      <View className="flex-row items-center gap-2">
        <Text className="text-[17px] font-extrabold text-gray-900">{title}</Text>
        {showDots && (
          <View className="flex-row gap-1">
            <View className="w-5 h-1 rounded-full bg-amber-400" />
            <View className="w-1 h-1 rounded-full bg-gray-300" />
            <View className="w-1 h-1 rounded-full bg-gray-300" />
          </View>
        )}
      </View>
      {onSeeAll && (
        <TouchableOpacity className="flex-row items-center gap-0.5" onPress={onSeeAll}>
          <Text className="text-sm text-amber-400 font-semibold">See all</Text>
          <ChevronRight size={14} color="#f59e0b" />
        </TouchableOpacity>
      )}
    </View>
  );
}

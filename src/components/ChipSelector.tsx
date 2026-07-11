import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface ChipOption<T extends string> { value: T; label: string }

interface ChipSelectorProps<T extends string> {
  label: string;
  required?: boolean;
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** Horizontal scroll (for long lists like categories) instead of wrapping. */
  scroll?: boolean;
}

/** Single/multi-option "pill" picker — replaces the repeated category/status/type chip rows across forms. */
export function ChipSelector<T extends string>({ label, required, options, value, onChange, scroll }: ChipSelectorProps<T>) {
  const chips = options.map((opt) => (
    <TouchableOpacity
      key={opt.value}
      onPress={() => onChange(opt.value)}
      className={`px-4 py-2.5 rounded-xl border ${value === opt.value ? "bg-amber-400 border-amber-400" : "bg-white border-gray-200"}`}
    >
      <Text className={`text-xs font-bold ${value === opt.value ? "text-white" : "text-gray-700"}`}>{opt.label}</Text>
    </TouchableOpacity>
  ));

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        {label}{required && <Text className="text-red-500"> *</Text>}
      </Text>
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{chips}</ScrollView>
      ) : (
        <View className="flex-row flex-wrap gap-2">{chips}</View>
      )}
    </View>
  );
}

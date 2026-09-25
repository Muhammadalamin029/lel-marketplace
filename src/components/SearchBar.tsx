import { TextInput, TouchableOpacity, View } from "react-native";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { COLORS } from "@/constants/brand";

/** Mockup search bar: gray rounded field + sliders button. */
export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onFilterPress,
  placeholder = "Search,Product,Autos,Real estate",
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View
        className="flex-1 flex-row items-center gap-2 px-3.5 rounded-lg"
        style={{ backgroundColor: COLORS.inputBg, minHeight: 44 }}
      >
        <Search size={16} color="#9ca3af" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          className="flex-1 font-manrope text-sm text-gray-900 py-2.5"
        />
      </View>
      <TouchableOpacity
        onPress={onFilterPress ?? onSubmit}
        className="items-center justify-center rounded-lg bg-white border border-gray-100"
        style={{ width: 44, height: 44 }}
      >
        <SlidersHorizontal size={18} color="#374151" />
      </TouchableOpacity>
    </View>
  );
}

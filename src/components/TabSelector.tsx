import { View, Text, TouchableOpacity } from "react-native";

interface TabSelectorProps<T extends string> {
  tabs: readonly T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export function TabSelector<T extends string>({ tabs, activeTab, onTabChange }: TabSelectorProps<T>) {
  return (
    <View className="flex-row bg-gray-50 rounded-xl p-1">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onTabChange(tab)}
          className={`flex-1 py-2.5 items-center justify-center rounded-lg ${
            activeTab === tab ? "bg-white shadow-sm" : "bg-transparent"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === tab ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

import { ReactNode } from "react";
import { View, Text } from "react-native";
import { shadow } from "@/constants/shadows";

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

/** Groups related form fields into a labeled card — used to break up long stacked forms. */
export function FormSection({ title, children }: FormSectionProps) {
  return (
    <View className="gap-3">
      <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{title}</Text>
      <View className="bg-white rounded-2xl p-4 gap-4" style={shadow.card}>
        {children}
      </View>
    </View>
  );
}

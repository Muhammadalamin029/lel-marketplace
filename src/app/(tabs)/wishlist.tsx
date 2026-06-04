import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart } from "lucide-react-native";

export default function WishlistScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 bg-white">
        <View>
          <Text className="text-xs text-gray-400 font-medium">
            Items you love
          </Text>
          <Text className="text-xl font-extrabold text-gray-900 tracking-tight">
            My <Text className="text-amber-400">Wishlist</Text>
          </Text>
        </View>
        <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center">
          <Heart size={20} color="#374151" strokeWidth={1.8} />
        </View>
      </View>

      {/* Empty state */}
      <View className="flex-1 items-center justify-center gap-3 px-8">
        <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center">
          <Heart size={36} color="#ef4444" strokeWidth={1.5} />
        </View>
        <Text className="text-lg font-extrabold text-gray-900">
          No saved items yet
        </Text>
        <Text className="text-sm text-gray-400 text-center">
          Tap the heart icon on any listing to save it here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

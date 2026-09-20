import { useRef, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BRAND, BRAND_ASSETS, COLORS } from "@/constants/brand";

const SLIDES = [
  {
    id: "products",
    title: "Shop Electronics, Gadgets & more",
    accent: "Gadgets",
    description: "Discover products you love and get them delivered with a simple, seamless shopping experience.",
    image: BRAND_ASSETS.gadgets,
  },
  {
    id: "cars",
    title: "Find Your Next Dream Car",
    accent: "Car",
    description: "Explore quality vehicles and flexible payment options designed to make getting your next car easier.",
    image: BRAND_ASSETS.car,
  },
  {
    id: "properties",
    title: "Find Your Next Dream Properties",
    accent: "Properties",
    description: "Explore apartments and properties that fit your lifestyle, location, and budget.",
    image: BRAND_ASSETS.property,
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-8 pt-6 flex-row items-center justify-between">
        <Text className="text-base font-black text-gray-950">{BRAND.name}</Text>
        <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
          <Text style={{ color: COLORS.primary }} className="text-sm font-bold">Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width }} className="px-8 pt-9">
            <Image source={item.image} style={{ width: "100%", height: 330, borderRadius: 10 }} resizeMode="cover" />
            <View className="flex-row gap-2 mt-7 mb-8">
              {SLIDES.map((slide, i) => (
                <View
                  key={slide.id}
                  className="h-1 rounded-full flex-1"
                  style={{ backgroundColor: i === index ? COLORS.primary : "#f1f1f1" }}
                />
              ))}
            </View>
            <Text className="text-2xl font-black text-gray-950 leading-8">
              {item.title.replace(item.accent, "")}
              <Text style={{ color: COLORS.primary }}>{item.accent}</Text>
            </Text>
            <Text className="text-sm text-gray-400 leading-6 mt-4">{item.description}</Text>
          </View>
        )}
      />

      <View className="px-8 pb-10 gap-3">
        <TouchableOpacity onPress={goNext} className="h-14 rounded-full items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
          <Text className="text-white text-sm font-black">Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity className="h-14 rounded-full border border-gray-200 items-center justify-center">
          <Text className="text-gray-950 text-sm font-bold">Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

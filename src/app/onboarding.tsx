import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ShieldCheck, Banknote, Building2 } from 'lucide-react-native';

const SLIDES = [
  {
    id: '1',
    title: 'Premium Assets',
    description: 'Discover verified automotive and real estate listings curated just for you.',
    Icon: Building2,
    accent: '#b45309',
    bg: '#fffbeb',
    iconBg: '#fde68a',
  },
  {
    id: '2',
    title: 'Secure Financing',
    description: 'Access structured and flexible installment plans that fit your needs.',
    Icon: Banknote,
    accent: '#1d4ed8',
    bg: '#eff6ff',
    iconBg: '#bfdbfe',
  },
  {
    id: '3',
    title: 'Trusted Platform',
    description: 'Buy and sell with confidence on a fully verified and secure marketplace.',
    Icon: ShieldCheck,
    accent: '#f59e0b',
    bg: '#fffbeb',
    iconBg: '#fcd34d',
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => router.replace('/(auth)/login');

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const current = SLIDES[currentIndex];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top bar */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
        <Image
          source={require('../../assets/images/logo.png')}
          style={{ width: 120, height: 40 }}
          contentFit="contain"
        />
        <TouchableOpacity onPress={handleSkip} className="py-1 px-2">
          <Text className="text-sm text-muted-foreground font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 justify-center px-6">
            {/* Illustration card */}
            <View
              className="w-full rounded-3xl items-center justify-center mb-8"
              style={{
                backgroundColor: item.bg,
                height: width * 0.72,
              }}
            >
              {/* Decorative rings */}
              <View
                className="absolute rounded-full"
                style={{
                  width: width * 0.52,
                  height: width * 0.52,
                  backgroundColor: item.iconBg,
                  opacity: 0.45,
                }}
              />
              <View
                className="absolute rounded-full"
                style={{
                  width: width * 0.36,
                  height: width * 0.36,
                  backgroundColor: item.iconBg,
                  opacity: 0.7,
                }}
              />
              {/* Icon circle */}
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: 88,
                  height: 88,
                  backgroundColor: item.accent,
                }}
              >
                <item.Icon size={44} color="#ffffff" strokeWidth={1.5} />
              </View>
            </View>

            {/* Text */}
            <Text className="text-3xl font-bold text-foreground text-center mb-3">
              {item.title}
            </Text>
            <Text className="text-base text-muted-foreground text-center leading-7 px-2">
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View className="px-6 pb-10 flex flex-col gap-6">
        {/* Dots */}
        <View className="flex-row justify-center items-center gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                height: 6,
                width: currentIndex === i ? 28 : 6,
                borderRadius: 99,
                backgroundColor: currentIndex === i ? current.accent : '#d1d5db',
              }}
            />
          ))}
        </View>

        {/* Next / Get Started */}
        <TouchableOpacity
          onPress={handleNext}
          className="rounded-2xl p-4 items-center"
          style={{ backgroundColor: current.accent }}
        >
          <Text className="text-white text-base font-semibold">
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {/* Step counter */}
        <Text className="text-center text-xs text-muted-foreground">
          {currentIndex + 1} of {SLIDES.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}
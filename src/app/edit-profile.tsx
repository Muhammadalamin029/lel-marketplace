import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { shadow } from "@/constants/shadows";
import { Camera, User, Mail, Phone, FileText, CheckCircle } from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import * as ImagePicker from "expo-image-picker";

type Field = { label: string; key: string; placeholder: string; icon: any; keyboard?: any; multiline?: boolean };

const FIELDS: Field[] = [
  { label: "Full Name", key: "name", placeholder: "Your full name", icon: User },
  { label: "Email", key: "email", placeholder: "Email address", icon: Mail, keyboard: "email-address" },
  { label: "Phone Number", key: "phone", placeholder: "+234 800 000 0000", icon: Phone, keyboard: "phone-pad" },
  { label: "Bio", key: "bio", placeholder: "Tell us a bit about yourself…", icon: FileText, multiline: true },
];

export default function EditProfileScreen() {
  useRequireAuth();
  const router = useRouter();
  const { user, profile, updateProfile, isLoading } = useAuthStore();

  const p = profile as any;
  const [form, setForm] = useState({
    name: p?.name ?? "",
    email: user?.email ?? "",
    phone: p?.phone ?? "",
    bio: p?.bio ?? "",
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(p?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const set = (key: string) => (val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
    setAvatarUri(dataUrl);
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatar_url: dataUrl });
    } catch {
      Alert.alert("Error", "Failed to save profile picture. Please try again.");
      setAvatarUri(p?.avatar_url ?? null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim(), bio: form.bio.trim() });
      Alert.alert("Saved", "Profile updated successfully!");
      router.back();
    } catch {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const displayInitial = form.name.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Edit Profile" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-6 gap-6">

          {/* Avatar */}
          <View className="items-center">
            <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} className="relative">
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-indigo-900 items-center justify-center">
                  <Text className="text-white text-3xl font-bold">{displayInitial}</Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 w-8 h-8 bg-amber-400 rounded-full items-center justify-center" style={shadow.md}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Camera size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text className="text-xs text-gray-400 mt-2">Tap to change photo</Text>
          </View>

          {/* Fields */}
          <View className="bg-white rounded-2xl overflow-hidden" style={shadow.md}>
            {FIELDS.map((field, i) => {
              const Icon = field.icon;
              const isEmail = field.key === "email";
              return (
                <View key={field.key} className={`px-4 py-4 ${i < FIELDS.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{field.label}</Text>
                  <View className="flex-row items-start gap-3">
                    <Icon size={16} color={isEmail ? "#d1d5db" : "#9ca3af"} style={{ marginTop: field.multiline ? 2 : 0 }} />
                    <TextInput
                      className="flex-1 text-sm text-gray-900"
                      placeholder={field.placeholder}
                      placeholderTextColor="#d1d5db"
                      value={(form as any)[field.key]}
                      onChangeText={set(field.key)}
                      keyboardType={field.keyboard || "default"}
                      multiline={field.multiline}
                      numberOfLines={field.multiline ? 3 : 1}
                      editable={!isEmail}
                      style={field.multiline ? { minHeight: 64, textAlignVertical: "top" } : {}}
                    />
                  </View>
                  {isEmail && (
                    <Text className="text-[10px] text-gray-400 mt-1 pl-7">Email cannot be changed here</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className="bg-amber-400 py-4 rounded-2xl flex-row items-center justify-center gap-2"
            style={shadow.btn}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <><CheckCircle size={16} color="#fff" /><Text className="text-white font-bold">Save Changes</Text></>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

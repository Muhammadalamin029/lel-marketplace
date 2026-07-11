import { useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImagePlus, X } from "lucide-react-native";

const CLOUDINARY_CLOUD_NAME = "da49y9eyl";
const CLOUDINARY_UPLOAD_PRESET = "alhaq_product_images";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

async function uploadOne(uri: string): Promise<string> {
  const form = new FormData();
  const extension = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const mimeType = extension === "png" ? "image/png" : extension === "heic" ? "image/heic" : "image/jpeg";
  form.append("file", { uri, name: `upload.${extension}`, type: mimeType } as any);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("folder", "alhaq/products");

  const res = await fetch(CLOUDINARY_URL, { method: "POST", body: form });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || `Upload failed (${res.status})`);
  if (!json?.secure_url) throw new Error("Upload succeeded but no image URL was returned");
  return json.secure_url as string;
}

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

export function ImageUploader({ images, onChange, max = 6 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Needed", "Allow photo library access to add images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, max - images.length),
        quality: 0.7,
      });
      if (result.canceled || result.assets.length === 0) return;

      setUploading(true);
      const urls = await Promise.all(result.assets.map((a) => uploadOne(a.uri)));
      onChange([...images, ...urls].slice(0, max));
    } catch (e) {
      console.error("ImageUploader failed:", e);
      const message = e instanceof Error ? e.message : "Could not upload one or more images.";
      Alert.alert("Upload Failed", message);
    } finally {
      setUploading(false);
    }
  };

  const remove = (url: string) => onChange(images.filter((u) => u !== url));

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">
        Images {images.length > 0 && `(${images.length}/${max})`}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {images.map((url) => (
          <View key={url} className="relative">
            <Image source={{ uri: url }} className="w-20 h-20 rounded-xl" resizeMode="cover" />
            <TouchableOpacity
              onPress={() => remove(url)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 items-center justify-center"
            >
              <X size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        {images.length < max && (
          <TouchableOpacity
            onPress={pick}
            disabled={uploading}
            className="w-20 h-20 rounded-xl bg-gray-50 border border-dashed border-gray-300 items-center justify-center"
          >
            {uploading ? <ActivityIndicator color="#f59e0b" /> : <ImagePlus size={22} color="#9ca3af" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

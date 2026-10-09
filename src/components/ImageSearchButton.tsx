import { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { imageSearchApi, getApiError } from "@/api";

const MAX_BYTES = 5 * 1024 * 1024;

function mimeFromUri(uri: string, fallback?: string | null): string {
  if (fallback) return fallback;
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Camera button: snap/pick a photo → detect product → open browse results. */
export function ImageSearchButton() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);

  const runSearch = async (asset: ImagePicker.ImagePickerAsset) => {
    const mime = mimeFromUri(asset.uri, asset.mimeType);
    if (asset.fileSize != null && asset.fileSize > MAX_BYTES) {
      Alert.alert("Too large", "Please choose an image under 5MB.");
      return;
    }
    setAnalyzing(true);
    try {
      const result = await imageSearchApi.analyze(asset.uri, mime);
      const query = result.searched_query || result.detected.detected_name;
      if (!query || query.toLowerCase() === "unknown") {
        Alert.alert("No match", "Couldn't recognize a product in that photo — try another angle.");
        return;
      }
      if (result.pagination.total === 0) {
        Alert.alert("No close matches", `Detected "${result.detected.detected_name}". Showing the search so you can refine it.`);
      }
      router.push(
        `/browse?search=${encodeURIComponent(query)}&detected=${encodeURIComponent(result.detected.detected_name)}&confidence=${Math.round(result.detected.confidence * 100)}` as any
      );
    } catch (e) {
      Alert.alert("Image search failed", getApiError(e));
    } finally {
      setAnalyzing(false);
    }
  };

  const fromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo library access to search by photo.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) await runSearch(res.assets[0]);
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow camera access to search by photo.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) await runSearch(res.assets[0]);
  };

  const onPress = () => {
    if (analyzing) return;
    Alert.alert("Search by photo", undefined, [
      { text: "Take photo", onPress: fromCamera },
      { text: "Choose from library", onPress: fromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} accessibilityLabel="Search by photo" disabled={analyzing}>
      {analyzing ? <ActivityIndicator size="small" color="#9ca3af" /> : <Camera size={16} color="#9ca3af" />}
    </TouchableOpacity>
  );
}

import { Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useImageSearchPendingStore } from "@/store/imageSearchStore";

const MAX_BYTES = 5 * 1024 * 1024;

function mimeFromUri(uri: string, fallback?: string | null): string {
  if (fallback) return fallback;
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Camera button: stash the photo → jump to Browse immediately → analysis runs there. */
export function ImageSearchButton() {
  const router = useRouter();
  const startPending = useImageSearchPendingStore((s) => s.start);

  const handleAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const mime = mimeFromUri(asset.uri, asset.mimeType);
    if (asset.fileSize != null && asset.fileSize > MAX_BYTES) {
      Alert.alert("Too large", "Please choose an image under 5MB.");
      return;
    }
    startPending(asset.uri, mime);
    router.push("/browse?image-search=analyzing" as any);
  };

  const fromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo library access to search by photo.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) handleAsset(res.assets[0]);
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow camera access to search by photo.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) handleAsset(res.assets[0]);
  };

  const onPress = () => {
    Alert.alert("Search by photo", undefined, [
      { text: "Take photo", onPress: fromCamera },
      { text: "Choose from library", onPress: fromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} accessibilityLabel="Search by photo">
      <Camera size={16} color="#9ca3af" />
    </TouchableOpacity>
  );
}

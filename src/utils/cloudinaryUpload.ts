const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

// Cloudinary's /auto/upload endpoint detects image vs. raw (PDF) automatically -
// financing documents (payslips, bank statements) are often PDFs, not photos.
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

export interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string | null;
}

/**
 * Direct unsigned upload from React Native. Browser `File` objects don't exist here,
 * so the FormData part is built from {uri, name, type} - the standard Expo/RN pattern.
 */
export async function uploadDocumentToCloudinary(file: PickedFile, folder = "alhaq/financing-documents"): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/octet-stream",
  } as unknown as Blob);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || "Upload failed");
  }

  const data = await response.json();
  return data.secure_url as string;
}

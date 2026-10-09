import { api } from "./client";

export interface ImageSearchDetection {
  detected_name: string;
  keywords: string[];
  category_hint: string | null;
  confidence: number;
}

export interface ImageSearchResult {
  success: boolean;
  message: string;
  detected: ImageSearchDetection;
  searched_query: string | null;
  data: unknown[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export const imageSearchApi = {
  async analyze(uri: string, mimeType = "image/jpeg", fileName = "photo.jpg"): Promise<ImageSearchResult> {
    const form = new FormData();
    form.append("image", { uri, name: fileName, type: mimeType } as any);
    const res = await api.post<ImageSearchResult>("/public/image-search", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return res.data;
  },
};

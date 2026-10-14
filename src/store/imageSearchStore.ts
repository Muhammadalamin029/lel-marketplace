import { create } from "zustand";

export type ImageSearchStatus = "idle" | "analyzing" | "done" | "error";

interface ImageSearchPendingState {
  uri: string | null;
  mimeType: string;
  fileName: string;
  status: ImageSearchStatus;
  /** Increments on every new upload; Browse uses it to trigger (and de-dupe) analysis. */
  analysisId: number;
  start: (uri: string, mimeType: string, fileName?: string) => number;
  markDone: () => void;
  clear: () => void;
}

let nextId = 0;

/**
 * Holds the pending photo across the immediate navigation to /browse.
 * The analysis itself runs on the Browse screen so the spinner +
 * skeletons render there instead of on the previous screen.
 */
export const useImageSearchPendingStore = create<ImageSearchPendingState>((set) => ({
  uri: null,
  mimeType: "image/jpeg",
  fileName: "photo.jpg",
  status: "idle",
  analysisId: 0,

  start: (uri, mimeType, fileName = "photo.jpg") => {
    nextId += 1;
    const analysisId = nextId;
    set({ uri, mimeType, fileName, status: "analyzing", analysisId });
    return analysisId;
  },
  markDone: () => set({ status: "done" }),
  clear: () => set({ uri: null, status: "idle" }),
}));

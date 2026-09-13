import { create } from "zustand";
import { financingApi, getApiError } from "@/api";
import type { FinancingApplication, FinancingDocumentRequirement, FinancingApplicationSubmitPayload } from "@/api";

interface FinancingState {
  documentRequirements: FinancingDocumentRequirement[];
  myApplication: FinancingApplication | null;
  isLoading: boolean;
  error: string | null;

  isEligible: () => boolean;
  fetchDocumentRequirements: () => Promise<void>;
  fetchMyApplication: () => Promise<void>;
  submitApplication: (payload: FinancingApplicationSubmitPayload) => Promise<FinancingApplication>;
}

export const useFinancingStore = create<FinancingState>((set, get) => ({
  documentRequirements: [],
  myApplication: null,
  isLoading: false,
  error: null,

  isEligible: () => get().myApplication?.status === "approved",

  fetchDocumentRequirements: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financingApi.getDocumentRequirements();
      set({ documentRequirements: data, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: getApiError(e) });
    }
  },

  fetchMyApplication: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financingApi.getMyApplication();
      set({ myApplication: data, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: getApiError(e) });
    }
  },

  submitApplication: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await financingApi.submitApplication(payload);
      set({ myApplication: data, isLoading: false });
      return data;
    } catch (e) {
      set({ isLoading: false, error: getApiError(e) });
      throw e;
    }
  },
}));

export { api, getApiError, authEventEmitter } from "./client";
export { storage } from "./storage";
export { authApi } from "./auth";
export { productsApi } from "./products";
export { ordersApi } from "./orders";
export { inspectionsApi } from "./inspections";
export { addressesApi } from "./addresses";
export { wishlistApi } from "./wishlist";
export { disputesApi } from "./disputes";
export { notificationsApi } from "./notifications";
export { paymentsApi } from "./payments";
export { reviewsApi } from "./reviews";
export { categoriesApi, publicApi, legalApi } from "./public";
export type { LegalSlug, LegalDocumentResponse } from "./public";
export { dashboardApi } from "./dashboard";
export type { CustomerStats } from "./dashboard";
export { financingApi } from "./financing";

export type { LoginPayload, RegisterPayload, UserProfile, CustomerProfileData, PasswordPolicy, PasswordStrength } from "./auth";
export type { Product, Car, Property, ProductImage, CarUnit, PropertyUnit } from "./products";
export type { Order, OrderItem, OrderBuyer, OrderAddress, CheckoutConfirmation, CheckoutSummary, InstallmentEligibility } from "./orders";
export type { Inspection, Agreement, AssetMini, UserMini, CompleteInspectionPayload } from "./inspections";
export type { Address, AddressPayload } from "./addresses";
export type { WishlistItem } from "./wishlist";
export type { Dispute } from "./disputes";
export type { Notification, NotificationPreferences, NotificationStats } from "./notifications";
export type { Payment } from "./payments";
export type { Review, ReviewUser } from "./reviews";
export type { Category, DeliverySettings, DeliveryState, PromoBanner, CampaignBanner } from "./public";
export type {
  FinancingDocumentRequirement,
  FinancingApplication,
  FinancingApplicationDocument,
  FinancingApplicationStatus,
  FinancingApplicationSubmitPayload,
} from "./financing";

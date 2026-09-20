export const BRAND = {
  legalName: "Lamzy Elite Store",
  name: "LEL Store",
  tagline: "The Digital Atelier",
  subtitle: "Curated Luxury, Unrivaled Choice",
  supportEmail: "support@lelstore.com",
  phone: "+234 800 123 4567",
  location: "Osun State, Nigeria",
} as const;

export const COLORS = {
  primary: "#ff4b26",
  primaryDark: "#ea3f1e",
  accent: "#f97316",
  ink: "#111827",
  muted: "#6b7280",
  line: "#eeeeee",
  bg: "#fafafa",
  success: "#22c55e",
} as const;

export const BRAND_ASSETS = {
  hero: require("../../assets/brand/hero-banner.jpg"),
  gadgets: require("../../assets/brand/gadgets-tile.jpg"),
  car: require("../../assets/brand/hero-car-tile.jpg"),
  property: require("../../assets/brand/real-estate-tile.jpg"),
  login: require("../../assets/brand/login-page.png"),
  signup: require("../../assets/brand/signup.png"),
  forgotPassword: require("../../assets/brand/forgot-password.png"),
  verifyCode: require("../../assets/brand/verify-code.png"),
  setNewPassword: require("../../assets/brand/set-new-password.png"),
} as const;

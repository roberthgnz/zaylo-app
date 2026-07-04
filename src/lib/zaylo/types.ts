/**
 * Scoped subset of the web app's lib/zaylo/types.ts — profile-only.
 * Closet, item, bag, asset, analytics and lead types are intentionally
 * NOT ported here (out of scope: closet is excluded entirely; the rest
 * belong to later phases — dashboard/bag/public-store).
 */

export type UserRole = "buyer" | "seller" | "admin" | "showcase";
export type ClosetVisibility = "private" | "public";
export type TemperatureUnit = "celsius" | "fahrenheit";

export type ProfilePreferences = {
  stylePreferences?: string[];
  brands?: string[];
  budgetMin?: number;
  budgetMax?: number;
  temperatureUnit?: TemperatureUnit;
  notificationsEnabled?: boolean;
  aboutYou?: string;
};

export type DbProfile = {
  id: string;
  email: string | null;
  roles: UserRole[];
  closet_visibility: ClosetVisibility;
  store_name: string | null;
  username: string | null;
  description: string | null;
  shipping_policy: string | null;
  instagram: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  accent_color: string | null;
  currency: string;
  avatar_url: string | null;
  preferences: ProfilePreferences | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type ZayloUserProfile = {
  id: string;
  email: string | null;
  roles: UserRole[];
  closetVisibility: ClosetVisibility;
  storeName?: string;
  username?: string;
  description?: string;
  shippingPolicy?: string;
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  accentColor?: string;
  currency?: string;
  avatarUrl?: string;
  preferences?: ProfilePreferences;
  onboardingComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Scoped subset of the web app's lib/zaylo/types.ts — profile + bag + catalog
 * (items) + analytics + assets. Closet types are intentionally NOT ported
 * (permanent exclusion). Public-store-only types (ZayloPublicClosetItem etc,
 * store-by-username aggregates) stay out until that phase lands.
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

export type ZayloBagItem = {
  bagItemId: string;
  itemId: string;
  slug?: string;
  sellerId: string;
  sellerUsername: string;
  name: string;
  selectedSize: string | null;
  price: number;
  mainPhoto?: string;
  mainMediaType?: "image" | "video";
  mainMediaPoster?: string;
  sellerWhatsapp: string;
  currency: string;
  addedAt: string;
};

export type ZayloBagStoreGroup = {
  sellerId: string;
  sellerUsername: string;
  sellerWhatsapp: string;
  currency: string;
  items: ZayloBagItem[];
};

export type ZayloBag = {
  id: string;
  buyerUserId: string;
  items: ZayloBagItem[];
  storeGroups: ZayloBagStoreGroup[];
};

export type ItemStatus = "available" | "reserved" | "sold" | "archived";

export const ITEM_STATUS_VALUES: ItemStatus[] = ["available", "reserved", "sold", "archived"];

export type ZayloItem = {
  id: string;
  slug?: string;
  userId: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  size: string[];
  brand?: string;
  condition?: string;
  description?: string;
  tags?: string;
  sessionType?: string;
  promoType?: string;
  requiresShipping?: boolean;
  shippingWeightKg?: number;
  collections?: string;
  variants?: string;
  mainPhoto?: string;
  mainMediaType?: "image" | "video";
  mainMediaPoster?: string;
  mainMediaThumbnails?: string[];
  photo1?: string;
  photo2?: string;
  photo3?: string;
  photo4?: string;
  status: ItemStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ItemInput = Omit<ZayloItem, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type BusinessAnalyticsSummary = {
  days: number;
  totals: {
    viewStore: number;
    viewProduct: number;
    addToBag: number;
    startWhatsappCheckout: number;
  };
  conversionRates: {
    addToBagFromProductView: number;
    whatsappFromAddToBag: number;
    whatsappFromProductView: number;
  };
};

export type ZayloAsset = {
  id: string;
  userId: string;
  url: string;
  storagePath: string;
  type: "image" | "video";
  name?: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
};

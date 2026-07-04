import type { DbProfile, UserRole, ZayloUserProfile } from "./types";

export function clean(value: string | null | undefined) {
  return value || undefined;
}

function normalizeRoles(roles: UserRole[] | null | undefined): UserRole[] {
  return roles ?? [];
}

export function mapProfile(row: DbProfile | null): ZayloUserProfile | null {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    roles: normalizeRoles(row.roles),
    closetVisibility: row.closet_visibility ?? "private",
    storeName: clean(row.store_name),
    username: clean(row.username),
    description: clean(row.description),
    shippingPolicy: clean(row.shipping_policy),
    instagram: clean(row.instagram),
    tiktok: clean(row.tiktok),
    whatsapp: clean(row.whatsapp),
    accentColor: clean(row.accent_color),
    currency: row.currency || "$",
    avatarUrl: clean(row.avatar_url),
    preferences: row.preferences ?? undefined,
    onboardingComplete: row.onboarding_complete,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

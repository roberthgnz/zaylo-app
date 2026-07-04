import { z } from "zod";

export const storeSettingsSchema = z.object({
  shopName: z.string().min(2, "Store name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  bio: z.string().optional(),
  shippingPolicy: z.string().max(1200, "Keep it under 1200 characters").optional(),
  currency: z.string().max(5, "Max 5 characters").optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  whatsapp: z.string().optional(),
});

export type StoreSettingsValues = z.infer<typeof storeSettingsSchema>;

export const ACCENT_COLORS = [
  { id: "black", hex: "#000000" },
  { id: "red", hex: "#dc2626" },
  { id: "blue", hex: "#2563eb" },
  { id: "green", hex: "#16a34a" },
];

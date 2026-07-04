import { z } from "zod";

export const itemFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  price: z.string().min(1, "Price is required"),
  stock: z
    .string()
    .min(1, "Stock is required")
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1, {
      message: "Stock must be at least 1",
    }),
  category: z.string().min(1, "Category is required"),
  size: z.array(z.string()).min(1, "Select at least one size"),
  brand: z.string().optional(),
  condition: z.string().min(1, "Select a condition"),
  description: z.string().min(10, "Add a more detailed description"),
  tags: z.string().optional(),
  promoType: z.string().optional(),
  requiresShipping: z.boolean(),
  shippingWeightKg: z.string().optional(),
  collections: z.string().optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

import { z } from "zod";

export function buildStep1Schema(messages: { nameRequired: string }) {
  return z.object({
    storeName: z.string().min(2, messages.nameRequired),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
    description: z.string().optional(),
  });
}

export type Step1Schema = z.infer<ReturnType<typeof buildStep1Schema>>;

import { z } from "zod";

export const step2Schema = z.object({
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
});

export type Step2Schema = z.infer<typeof step2Schema>;

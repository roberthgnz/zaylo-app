import { apiRequest } from "@/lib/api/client";

export async function submitOnboardingRole(choice: "buyer" | "seller" | "showcase") {
  return apiRequest<{ redirectTo: string }>("/api/onboarding/role", {
    method: "POST",
    body: JSON.stringify({ choice }),
  });
}

export async function submitOnboardingStep1(values: {
  storeName: string;
  username: string;
  description?: string;
}) {
  return apiRequest<{ redirectTo: string }>("/api/onboarding/step-1", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function submitOnboardingStep2(values: {
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
}) {
  return apiRequest<{ redirectTo: string }>("/api/onboarding/step-2", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

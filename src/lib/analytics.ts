import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
const ANON_ID_KEY = "zaylo_anon_id_v1";

export type BusinessEventName =
  | "view_store"
  | "view_product"
  | "add_to_bag"
  | "start_whatsapp_checkout";

type BusinessEventPayload = {
  eventName: BusinessEventName;
  userId?: string | null;
  storeUsername?: string | null;
  itemId?: string | null;
  itemSlug?: string | null;
  sourcePath?: string | null;
  metadata?: Record<string, unknown>;
};

async function getAnonymousId() {
  const existing = await AsyncStorage.getItem(ANON_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  await AsyncStorage.setItem(ANON_ID_KEY, generated);
  return generated;
}

// Web uses `navigator.sendBeacon` (fire-and-forget on page unload) and reads
// `window.location.pathname` for sourcePath — neither exists in RN. Callers
// pass sourcePath explicitly (e.g. from `usePathname()`); this just does a
// best-effort fetch and swallows errors, since analytics must never block UI.
export async function trackBusinessEvent(payload: BusinessEventPayload) {
  const anonymousId = await getAnonymousId();
  const body = JSON.stringify({ ...payload, anonymousId });

  try {
    await fetch(`${API_BASE_URL}/api/analytics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (error) {
    console.error("Error tracking business event:", error);
  }
}

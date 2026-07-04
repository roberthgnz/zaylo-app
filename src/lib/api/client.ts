import Constants from "expo-constants";

// In dev, "localhost" in EXPO_PUBLIC_API_BASE_URL only resolves on the device
// itself — unreachable from an Android emulator/physical device, which need
// the dev machine's actual LAN address (or 10.0.2.2 for the AVD emulator).
// Expo already knows that address (it's how Metro/the dev client connects),
// so derive it from there instead of hardcoding one per device.
function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

  if (__DEV__ && /^https?:\/\/localhost(:|\/|$)/.test(configured)) {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
    const devHost = hostUri?.split(":")[0];
    if (devHost) {
      return configured.replace("localhost", devHost);
    }
  }

  return configured;
}

const API_BASE_URL = resolveApiBaseUrl();

type ApiEnvelope<T> = { data?: T; error?: string | { message?: string } } | T;

function isErrorPayload(
  payload: ApiEnvelope<unknown>
): payload is { error?: string | { message?: string } } {
  return typeof payload === "object" && payload !== null && "error" in payload;
}

function getErrorMessage(payload: ApiEnvelope<unknown>) {
  if (!isErrorPayload(payload)) {
    return undefined;
  }

  const error = payload.error;
  if (typeof error === "string") {
    return error;
  }

  return error?.message;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload) || "Request failed.");
  }

  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

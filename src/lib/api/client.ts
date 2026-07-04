const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

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

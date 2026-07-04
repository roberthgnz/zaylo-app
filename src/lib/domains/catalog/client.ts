import { apiRequest } from "@/lib/api/client";
import { supabase } from "@/lib/supabase/client";
import type { ItemInput, ZayloItem } from "@/lib/domains/catalog/types";

const inflightItemsByUserRequests = new Map<string, Promise<ZayloItem[]>>();

function uniqueItemsChannelName(userId: string) {
  return `items:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function cleanupItemChannels(userId: string) {
  const marker = `items:${userId}`;
  for (const channel of supabase.getChannels()) {
    if (channel.topic.includes(marker)) {
      void supabase.removeChannel(channel);
    }
  }
}

export async function getItemById(itemId: string) {
  const { item } = await apiRequest<{ item: ZayloItem | null }>(
    `/api/items/${encodeURIComponent(itemId)}`
  );
  return item;
}

export async function getItemBySlug(slug: string) {
  const { item } = await apiRequest<{ item: ZayloItem | null }>(
    `/api/items/by-slug/${encodeURIComponent(slug)}`
  );
  return item;
}

export async function getItemsByUserId(
  userId: string,
  options: { limit?: number; orderByCreated?: boolean } = {}
) {
  const requestKey = `${userId}|${options.limit ?? "none"}|${options.orderByCreated ? "created" : "default"}`;
  const inflightRequest = inflightItemsByUserRequests.get(requestKey);
  if (inflightRequest) {
    return inflightRequest;
  }

  const request = (async () => {
    const searchParams = new URLSearchParams({ userId });

    if (options.limit) {
      searchParams.set("limit", String(options.limit));
    }

    if (options.orderByCreated) {
      searchParams.set("orderByCreated", "true");
    }

    const { items } = await apiRequest<{ items: ZayloItem[] }>(`/api/items?${searchParams.toString()}`);
    return items;
  })();

  inflightItemsByUserRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    inflightItemsByUserRequests.delete(requestKey);
  }
}

export function subscribeItemsByUserId(
  userId: string,
  onChange: (items: ZayloItem[]) => void,
  onError?: (error: unknown) => void
) {
  cleanupItemChannels(userId);

  let active = true;
  const refetch = async () => {
    try {
      const items = await getItemsByUserId(userId, { orderByCreated: true });
      if (active) {
        onChange(items);
      }
    } catch (error) {
      onError?.(error);
    }
  };

  const channel = supabase
    .channel(uniqueItemsChannelName(userId))
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "items", filter: `user_id=eq.${userId}` },
      () => {
        void refetch();
      }
    )
    .subscribe((_status, error) => {
      if (error) {
        onError?.(error);
      }
    });

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function createItem(values: ItemInput) {
  const item = await apiRequest<{ id: string; slug?: string }>("/api/items", {
    method: "POST",
    body: JSON.stringify(values),
  });
  return item;
}

export async function updateItem(itemId: string, values: Partial<ZayloItem>) {
  await apiRequest<{ ok: true }>(`/api/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function deleteItem(itemId: string) {
  await apiRequest<{ ok: true }>(`/api/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
}

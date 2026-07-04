import { useEffect } from "react";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { getItemById, getItemsByUserId, subscribeItemsByUserId } from "@/lib/domains/catalog/client";
import type { ZayloItem } from "@/lib/domains/catalog/types";

type ItemsByUserOptions = {
  limit?: number;
  orderByCreated?: boolean;
};

function normalizeItemsByUserOptions(options: ItemsByUserOptions = {}) {
  return {
    limit: options.limit ?? undefined,
    orderByCreated: Boolean(options.orderByCreated),
  };
}

function updateItemInCollection(
  items: ZayloItem[] | undefined,
  itemId: string,
  updater: (item: ZayloItem) => ZayloItem
) {
  if (!items) {
    return items;
  }

  let changed = false;
  const nextItems = items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    changed = true;
    return updater(item);
  });

  return changed ? nextItems : items;
}

export const catalogQueryKeys = {
  itemsByUser: (userId: string, options: ItemsByUserOptions = {}) => {
    const normalized = normalizeItemsByUserOptions(options);
    return ["items", "by-user", userId, normalized] as const;
  },
  itemById: (itemId: string) => ["items", "by-id", itemId] as const,
};

export function setItemStatusInCaches(
  queryClient: QueryClient,
  values: { itemId: string; userId?: string; status: ZayloItem["status"] }
) {
  const { itemId, userId, status } = values;

  queryClient.setQueryData<ZayloItem | null | undefined>(
    catalogQueryKeys.itemById(itemId),
    (currentItem) => (currentItem ? { ...currentItem, status } : currentItem)
  );

  if (userId) {
    queryClient.setQueriesData<ZayloItem[]>(
      { queryKey: ["items", "by-user", userId] },
      (items) => updateItemInCollection(items, itemId, (item) => ({ ...item, status }))
    );
  }
}

export function useItemsByUserQuery(userId?: string, options: ItemsByUserOptions = {}) {
  const normalized = normalizeItemsByUserOptions(options);

  return useQuery({
    queryKey: userId
      ? catalogQueryKeys.itemsByUser(userId, normalized)
      : (["items", "by-user", "missing-user"] as const),
    queryFn: () => getItemsByUserId(userId!, normalized),
    enabled: Boolean(userId),
  });
}

export function useItemsByUserRealtime(userId?: string, options: ItemsByUserOptions = {}) {
  const queryClient = useQueryClient();
  const limit = options.limit ?? null;
  const orderByCreated = Boolean(options.orderByCreated);

  useEffect(() => {
    if (!userId) {
      return;
    }

    return subscribeItemsByUserId(
      userId,
      (items) => {
        queryClient.setQueryData(
          catalogQueryKeys.itemsByUser(userId, { limit: limit ?? undefined, orderByCreated }),
          items
        );
      },
      (error) => {
        console.error("Realtime items sync error:", error);
      }
    );
  }, [limit, orderByCreated, queryClient, userId]);
}

export function useItemByIdQuery(itemId?: string) {
  return useQuery({
    queryKey: itemId ? catalogQueryKeys.itemById(itemId) : (["items", "by-id", "missing-id"] as const),
    queryFn: () => getItemById(itemId!),
    enabled: Boolean(itemId),
  });
}

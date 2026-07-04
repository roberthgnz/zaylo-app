import { QueryClient, useQuery } from "@tanstack/react-query";
import {
  addBagItem,
  clearBag,
  clearBagStore,
  getBag,
  mergeBag,
  removeBagItem,
} from "@/lib/domains/bag/client";

export const bagQueryKeys = {
  bag: () => ["bag"] as const,
};

export function useBagQuery(enabled = true) {
  return useQuery({
    queryKey: bagQueryKeys.bag(),
    queryFn: () => getBag(),
    enabled,
  });
}

export async function invalidateBagQuery(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: bagQueryKeys.bag() });
}

export async function addBagItemMutation(
  queryClient: QueryClient,
  values: { itemId: string; selectedSize?: string | null }
) {
  await addBagItem(values);
  await invalidateBagQuery(queryClient);
}

export async function removeBagItemMutation(queryClient: QueryClient, bagItemId: string) {
  await removeBagItem(bagItemId);
  await invalidateBagQuery(queryClient);
}

export async function clearBagMutation(queryClient: QueryClient) {
  await clearBag();
  await invalidateBagQuery(queryClient);
}

export async function clearBagStoreMutation(queryClient: QueryClient, sellerId: string) {
  await clearBagStore(sellerId);
  await invalidateBagQuery(queryClient);
}

export async function mergeBagMutation(
  queryClient: QueryClient,
  items: Array<{ id?: string; selectedSize?: string | null }>
) {
  await mergeBag(items);
  await invalidateBagQuery(queryClient);
}

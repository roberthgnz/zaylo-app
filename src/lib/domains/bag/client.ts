import { apiRequest } from "@/lib/api/client";
import type { ZayloBag } from "@/lib/domains/bag/types";

export async function getBag() {
  const { bag } = await apiRequest<{ bag: ZayloBag }>("/api/bag");
  return bag;
}

export async function addBagItem(values: { itemId: string; selectedSize?: string | null }) {
  await apiRequest<{ ok: true }>("/api/bag/items", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function removeBagItem(bagItemId: string) {
  await apiRequest<{ ok: true }>(`/api/bag/items/${encodeURIComponent(bagItemId)}`, {
    method: "DELETE",
  });
}

export async function clearBag() {
  await apiRequest<{ ok: true }>("/api/bag", {
    method: "DELETE",
  });
}

export async function clearBagStore(sellerId: string) {
  await apiRequest<{ ok: true }>(`/api/bag/stores/${encodeURIComponent(sellerId)}`, {
    method: "DELETE",
  });
}

export async function mergeBag(items: Array<{ id?: string; selectedSize?: string | null }>) {
  await apiRequest<{ ok: true }>("/api/bag/merge", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

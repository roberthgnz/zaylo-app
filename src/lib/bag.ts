import type { ZayloBagItem } from "@/lib/zaylo/types";
import type { BagItem as GuestBagItem } from "@/lib/stores/useBagStore";

type BagMediaFields = {
  mainMediaType?: "image" | "video";
  mainMediaPoster?: string | null;
};

export type AnyBagItem =
  | (GuestBagItem & BagMediaFields)
  | (ZayloBagItem & {
      id?: string;
      username?: string;
      sellerUsername?: string;
      sellerWhatsapp?: string;
    } & BagMediaFields);

export function formatBagPrice(value: number | string | null | undefined, currency = "$") {
  if (value == null || value === "") return "-";
  return `${currency}${value}`;
}

function itemUsername(item: AnyBagItem) {
  if ("sellerUsername" in item && item.sellerUsername) return item.sellerUsername;
  if ("username" in item && item.username) return item.username;
  return "";
}

function itemWhatsapp(item: AnyBagItem) {
  if ("sellerWhatsapp" in item && item.sellerWhatsapp) return item.sellerWhatsapp;
  return null;
}

function itemName(item: AnyBagItem) {
  return item.name;
}

function itemSelectedSize(item: AnyBagItem) {
  return item.selectedSize ?? null;
}

function itemPrice(item: AnyBagItem) {
  return item.price;
}

function itemCurrency(item: AnyBagItem) {
  if ("currency" in item && item.currency) return item.currency;
  return "$";
}

export function getBagItemsByUsername(items: AnyBagItem[], username: string) {
  return items.filter((item) => itemUsername(item) === username);
}

export function groupBagItemsByStore(items: AnyBagItem[]) {
  const groups = new Map<string, AnyBagItem[]>();

  for (const item of items) {
    const username = itemUsername(item);
    const current = groups.get(username) ?? [];
    current.push(item);
    groups.set(username, current);
  }

  return Array.from(groups.entries()).map(([username, storeItems]) => ({
    username,
    items: storeItems,
  }));
}

export function buildStoreWhatsappUrl(items: AnyBagItem[]) {
  const firstWithPhone = items.find((item) => itemWhatsapp(item));
  const whatsapp = firstWithPhone ? itemWhatsapp(firstWithPhone) : null;
  if (!whatsapp) return null;

  const phone = whatsapp.replace(/\D/g, "");
  if (!phone) return null;

  const currency = items[0] ? itemCurrency(items[0]) : "$";
  const lines = items.map((item, index) => {
    const selectedSize = itemSelectedSize(item);
    const sizeLine = selectedSize ? ` - Size: ${selectedSize}` : "";
    return `${index + 1}. ${itemName(item)}${sizeLine} (${formatBagPrice(itemPrice(item), currency)})`;
  });
  const message = `Hi! I'd like to buy these items from your store:\n\n${lines.join("\n")}`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

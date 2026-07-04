import { Text, View } from "react-native";

import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/domains/catalog/types";

const LABELS: Record<ItemStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  archived: "Archived",
};

const TONE_CLASSNAMES: Record<ItemStatus, string> = {
  available: "bg-black dark:bg-white",
  reserved: "bg-neutral-200 dark:bg-neutral-700",
  sold: "bg-neutral-200 dark:bg-neutral-700",
  archived: "bg-neutral-200 dark:bg-neutral-700",
};

const TEXT_CLASSNAMES: Record<ItemStatus, string> = {
  available: "text-white dark:text-black",
  reserved: "text-neutral-700 dark:text-neutral-200",
  sold: "text-neutral-400 dark:text-neutral-500 line-through",
  archived: "text-neutral-400 dark:text-neutral-500",
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <View className={cn("self-start rounded px-2 py-0.5", TONE_CLASSNAMES[status])}>
      <Text className={cn("text-[11px] font-bold", TEXT_CLASSNAMES[status])}>{LABELS[status]}</Text>
    </View>
  );
}

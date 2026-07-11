import { View } from "react-native";

import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/domains/catalog/types";
import { Text } from "@/components/ui/text";

const LABELS: Record<ItemStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  archived: "Archived",
};

const TONE_CLASSNAMES: Record<ItemStatus, string> = {
  available: "bg-electric-blue",
  reserved: "bg-signal-red",
  sold: "bg-carbon",
  archived: "bg-zinc-200",
};

const TEXT_CLASSNAMES: Record<ItemStatus, string> = {
  available: "text-white",
  reserved: "text-white",
  sold: "text-bone line-through",
  archived: "text-zinc-600",
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <View className={cn("self-start rounded px-2 py-0.5", TONE_CLASSNAMES[status])}>
      <Text className={cn("text-[11px] font-bold", TEXT_CLASSNAMES[status])}>{LABELS[status]}</Text>
    </View>
  );
}

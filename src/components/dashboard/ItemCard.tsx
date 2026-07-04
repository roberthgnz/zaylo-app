import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { cn } from "@/lib/utils";
import type { ZayloItem } from "@/lib/domains/catalog/types";
import { ItemStatusBadge } from "./ItemStatusBadge";

export function ItemCard({
  item,
  selected,
  selectionMode,
  onPress,
  onToggleSelect,
}: {
  item: ZayloItem;
  selected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onToggleSelect: () => void;
}) {
  const isDimmed = item.status === "sold" || item.status === "archived";

  return (
    <Pressable
      onPress={selectionMode ? onToggleSelect : onPress}
      onLongPress={onToggleSelect}
      className="flex-row items-center gap-3 border-b border-neutral-100 py-3 dark:border-neutral-800"
    >
      {selectionMode ? (
        <View
          className={cn(
            "h-5 w-5 items-center justify-center rounded border",
            selected ? "border-black bg-black dark:border-white dark:bg-white" : "border-neutral-300 dark:border-neutral-600"
          )}
        >
          {selected ? <Text className="text-[11px] font-bold text-white dark:text-black">✓</Text> : null}
        </View>
      ) : null}

      <View className={cn("h-14 w-14 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800", isDimmed && "opacity-50")}>
        {item.mainPhoto ? (
          <Image source={{ uri: item.mainPhoto }} alt={item.name} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : null}
      </View>

      <View className="min-w-0 flex-1">
        <Text className="font-semibold text-text-light dark:text-text-dark" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          ${item.price}
        </Text>
        <View className="mt-1">
          <ItemStatusBadge status={item.status} />
        </View>
      </View>
    </Pressable>
  );
}

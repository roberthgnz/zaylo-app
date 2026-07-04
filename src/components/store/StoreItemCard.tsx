import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ItemStatusBadge } from "@/components/dashboard/ItemStatusBadge";
import { getMainMediaPreview } from "@/lib/core/media";
import type { ItemStatus, ZayloItem } from "@/lib/domains/catalog/types";

function formatSize(size?: string[]) {
  if (!size || size.length === 0) return "";
  return size.filter(Boolean).join(", ");
}

export function StoreItemCard({
  item,
  username,
  currency = "$",
}: {
  item: Pick<ZayloItem, "id" | "slug" | "name" | "price" | "status" | "size" | "mainPhoto" | "mainMediaType" | "mainMediaPoster">;
  username: string;
  currency?: string;
}) {
  const router = useRouter();
  const isSold = item.status === ("sold" as ItemStatus);
  const previewMedia = getMainMediaPreview(item.mainPhoto ?? null, item.mainMediaType, item.mainMediaPoster);
  const sizeLabel = formatSize(item.size);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/store/[username]/product/[itemId]",
          params: { username, itemId: item.slug ?? item.id },
        })
      }
      className="w-[48%] gap-2"
    >
      <View className="aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
        {previewMedia ? (
          <Image
            source={{ uri: previewMedia }}
            alt={item.name}
            style={{ width: "100%", height: "100%", opacity: isSold ? 0.6 : 1 }}
            contentFit="cover"
          />
        ) : null}
        <View className="absolute left-2 top-2">
          <ItemStatusBadge status={item.status} />
        </View>
      </View>
      <View>
        <View className="flex-row items-center justify-between gap-2">
          <Text className={isSold ? "text-sm font-semibold text-neutral-400 line-through" : "text-sm font-semibold text-text-light dark:text-text-dark"}>
            {currency}
            {item.price}
          </Text>
          {sizeLabel ? (
            <Text className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-text-secondary-light dark:bg-neutral-800 dark:text-text-secondary-dark">
              {sizeLabel}
            </Text>
          ) : null}
        </View>
        <Text
          className={isSold ? "text-sm text-neutral-400" : "text-sm text-text-secondary-light dark:text-text-secondary-dark"}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </View>
    </Pressable>
  );
}

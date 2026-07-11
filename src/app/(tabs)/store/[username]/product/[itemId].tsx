import { Image } from "expo-image";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Text } from "@/components/ui/text";
import { ItemStatusBadge } from "@/components/dashboard/ItemStatusBadge";
import { StoreItemCard } from "@/components/store/StoreItemCard";
import { trackBusinessEvent } from "@/lib/analytics";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { updateItem } from "@/lib/domains/catalog/client";
import {
  setItemStatusInCaches,
  useItemBySlugQuery,
  useItemsByUserQuery,
  useItemsByUserRealtime,
} from "@/lib/domains/catalog/queries";
import type { ItemStatus } from "@/lib/domains/catalog/types";
import { useProfileByIdQuery } from "@/lib/domains/profile/queries";
import { addBagItemMutation } from "@/lib/domains/bag/queries";
import { useBagStore } from "@/lib/stores/useBagStore";
import { getMainMediaPreview } from "@/lib/core/media";

const STATUS_OPTIONS: ItemStatus[] = ["available", "reserved", "sold", "archived"];

export default function ProductDetailScreen() {
  const { username, itemId } = useLocalSearchParams<{ username: string; itemId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const addOrUpdateBagItem = useBagStore((state) => state.addOrUpdateItem);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [bagError, setBagError] = useState("");
  const [bagMessage, setBagMessage] = useState("");
  const hasTrackedView = useRef(false);

  const itemQuery = useItemBySlugQuery(itemId);
  const item = itemQuery.data;
  const sellerQuery = useProfileByIdQuery(item?.userId);
  const seller = sellerQuery.data;
  const catalogQuery = useItemsByUserQuery(item?.userId, { limit: 20 });
  useItemsByUserRealtime(item?.userId, { limit: 20 });

  const isLoading = itemQuery.isLoading || (Boolean(item?.userId) && (sellerQuery.isLoading || catalogQuery.isLoading));

  const storeCatalog = useMemo(
    () => (catalogQuery.data ?? []).filter((catalogItem) => catalogItem.id !== item?.id && catalogItem.status !== "archived"),
    [catalogQuery.data, item?.id]
  );

  const photos = useMemo(() => {
    if (!item) return [];
    const mainPreview = getMainMediaPreview(item.mainPhoto ?? null, item.mainMediaType, item.mainMediaPoster);
    return [mainPreview, item.photo1, item.photo2, item.photo3, item.photo4].filter((url): url is string => Boolean(url));
  }, [item]);

  const tags = useMemo(
    () => (item?.tags ? item.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : []),
    [item]
  );

  const availableSizes = useMemo(() => (item?.size ?? []).filter(Boolean), [item?.size]);
  const requiresSizeSelection = availableSizes.length > 1;
  const activeSize = availableSizes.includes(selectedSize ?? "") ? selectedSize : (availableSizes[0] ?? null);

  const lowStockLabel = useMemo(() => {
    if (!item || item.status !== "available" || item.stock <= 0 || item.stock > 3) return null;
    return item.stock === 1 ? "Last one" : `Only ${item.stock} left`;
  }, [item]);

  const isOwner = Boolean(user?.uid && item?.userId && user.uid === item.userId);
  const canAddToBag = Boolean(seller?.whatsapp) && item?.status === "available" && (item?.stock ?? 0) > 0;

  useEffect(() => {
    if (!item || hasTrackedView.current) return;
    void trackBusinessEvent({
      eventName: "view_product",
      userId: user?.uid ?? null,
      storeUsername: username,
      itemId: item.id,
      itemSlug: item.slug ?? null,
      sourcePath: pathname,
      metadata: { status: item.status, stock: item.stock, price: item.price },
    });
    hasTrackedView.current = true;
  }, [item, pathname, user?.uid, username]);

  const handleUpdateStatus = async (nextStatus: ItemStatus) => {
    if (!item || isUpdatingStatus || item.status === nextStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateItem(item.id, { status: nextStatus });
      setItemStatusInCaches(queryClient, { itemId: item.id, slug: item.slug, userId: user?.uid, status: nextStatus });
    } catch (error) {
      console.error("Error updating item status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddToBag = async () => {
    if (!item) return;
    setBagError("");
    setBagMessage("");

    if (requiresSizeSelection && !activeSize) {
      setBagError("Please select a size.");
      return;
    }

    if (user?.uid) {
      try {
        await addBagItemMutation(queryClient, { itemId: item.id, selectedSize: activeSize });
      } catch (error) {
        setBagError(error instanceof Error ? error.message : "Failed to add to bag.");
        return;
      }
    } else {
      addOrUpdateBagItem({
        bagItemId: `${username}:${item.id}:${activeSize ?? "no-size"}`,
        id: item.id,
        slug: item.slug,
        username,
        name: item.name,
        selectedSize: activeSize,
        price: item.price,
        mainPhoto: item.mainPhoto,
        mainMediaType: item.mainMediaType,
        mainMediaPoster: item.mainMediaPoster,
        sellerWhatsapp: seller?.whatsapp ?? null,
        currency: seller?.currency ?? "$",
        addedAt: Date.now(),
      });
    }

    void trackBusinessEvent({
      eventName: "add_to_bag",
      userId: user?.uid ?? null,
      storeUsername: username,
      itemId: item.id,
      itemSlug: item.slug ?? null,
      sourcePath: pathname,
      metadata: { selectedSize: activeSize, hasWhatsapp: Boolean(seller?.whatsapp) },
    });
    setBagMessage("Added to bag.");
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${item?.name ?? "Check this out"} on Zaylo: https://zaylo.bio/${username}/product/${itemId}` });
    } catch (error) {
      console.error("Error sharing product:", error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!item || (item.status === "archived" && !isOwner)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-3 bg-background-light px-5 dark:bg-background-dark">
        <Text className="text-xl font-bold text-text-light dark:text-text-dark">Item not found</Text>
        <Pressable onPress={() => router.replace({ pathname: "/store/[username]", params: { username } })}>
          <Text className="text-sm text-text-secondary-light underline dark:text-text-secondary-dark">Back to store</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-4 px-5 pt-6 pb-32">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">←</Text>
          <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Back</Text>
        </Pressable>

        <View className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800">
          {photos.length > 0 ? (
            <Image source={{ uri: photos[photoIndex] }} alt={item.name} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : null}
          {lowStockLabel ? (
            <View className="absolute right-3 top-3 rounded-full bg-signal-red px-3 py-1.5">
              <Text className="text-[11px] font-bold uppercase text-white">{lowStockLabel}</Text>
            </View>
          ) : null}
          {photos.length > 1 ? (
            <>
              <Pressable
                onPress={() => setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)}
                className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80"
              >
                <Text>‹</Text>
              </Pressable>
              <Pressable
                onPress={() => setPhotoIndex((photoIndex + 1) % photos.length)}
                className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80"
              >
                <Text>›</Text>
              </Pressable>
              <View className="absolute bottom-3 w-full flex-row justify-center gap-2">
                {photos.map((_, index) => (
                  <View key={index} className={index === photoIndex ? "h-1.5 w-1.5 rounded-full bg-carbon" : "h-1.5 w-1.5 rounded-full bg-carbon/30"} />
                ))}
              </View>
            </>
          ) : null}
        </View>

        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Product
            </Text>
            <Text className="font-display text-2xl text-text-light dark:text-text-dark">{item.name}</Text>
            <Text className="font-display text-3xl text-text-light dark:text-text-dark">
              {seller?.currency ?? "$"}
              {item.price}
            </Text>
          </View>
          <ItemStatusBadge status={item.status} />
        </View>
        <Text className="-mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          From @{username} · {item.category}
        </Text>

        {availableSizes.length > 0 ? (
          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Select size
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {availableSizes.map((size) => (
                <Pressable
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  className={
                    activeSize === size
                      ? "h-9 min-w-[44px] items-center justify-center rounded-lg bg-carbon px-3 dark:bg-bone"
                      : "h-9 min-w-[44px] items-center justify-center rounded-lg border border-neutral-300 px-3 dark:border-neutral-700"
                  }
                >
                  <Text className={activeSize === size ? "text-sm text-bone dark:text-carbon" : "text-sm text-text-light dark:text-text-dark"}>
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {item.brand ? (
          <View className="rounded-lg border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark">
            <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Brand
            </Text>
            <Text className="font-semibold text-text-light dark:text-text-dark">{item.brand}</Text>
          </View>
        ) : null}

        {item.condition ? (
          <View className="flex-row flex-wrap gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <View className="rounded-full bg-carbon px-3 py-1.5 dark:bg-bone">
              <Text className="text-xs font-semibold capitalize text-bone dark:text-carbon">{item.condition}</Text>
            </View>
          </View>
        ) : null}

        {item.description ? (
          <View className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Description
            </Text>
            <Text className="leading-6 text-text-light dark:text-text-dark">{item.description}</Text>
          </View>
        ) : null}

        {seller?.shippingPolicy ? (
          <View className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Shipping policy
            </Text>
            <Text className="leading-6 text-text-light dark:text-text-dark">{seller.shippingPolicy}</Text>
          </View>
        ) : null}

        {tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => (
              <View key={tag} className="rounded-full border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-text-light dark:text-text-dark">#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {seller ? (
          <Pressable
            onPress={() => router.push({ pathname: "/store/[username]", params: { username } })}
            className="flex-row items-center gap-3 rounded-xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark"
          >
            <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              {seller.avatarUrl ? (
                <Image source={{ uri: seller.avatarUrl }} alt={seller.storeName ?? "Seller"} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : (
                <Text className="text-sm font-black text-neutral-400">{seller.storeName?.charAt(0) ?? "S"}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-text-light dark:text-text-dark" numberOfLines={1}>
                {seller.storeName}
              </Text>
              <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">@{seller.username}</Text>
            </View>
            <Text className="text-xs font-bold text-text-light underline dark:text-text-dark">View Store</Text>
          </Pressable>
        ) : null}

        {storeCatalog.length > 0 ? (
          <View className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              More from this store
            </Text>
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {storeCatalog.slice(0, 4).map((catalogItem) => (
                <StoreItemCard key={catalogItem.id} item={catalogItem} username={username} currency={seller?.currency} />
              ))}
            </View>
          </View>
        ) : null}

        {isOwner ? (
          <View className="rounded-2xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark">
            <Text className="mb-3 text-[11px] font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Manage listing
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Pressable
                  key={status}
                  disabled={isUpdatingStatus || item.status === status}
                  onPress={() => handleUpdateStatus(status)}
                  className="h-10 items-center justify-center rounded-lg border border-neutral-300 px-3 disabled:opacity-50 dark:border-neutral-700"
                >
                  <Text className="text-xs font-semibold capitalize text-text-light dark:text-text-dark">{status}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {bagError ? <FormBanner message={bagError} variant="error" /> : null}
        {bagMessage ? <FormBanner message={bagMessage} variant="info" /> : null}
      </ScrollView>

      <View className="flex-row gap-3 border-t border-neutral-200 bg-background-light/90 p-4 dark:border-neutral-800 dark:bg-background-dark/90">
        <Pressable onPress={handleShare} className="h-12 w-12 items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700">
          <Text className="text-text-light dark:text-text-dark">↗</Text>
        </Pressable>
        {isOwner ? (
          <>
            <Pressable
              onPress={() => router.push({ pathname: "/dashboard-store/[itemId]/edit", params: { itemId: item.id } })}
              className="h-12 flex-1 items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700"
            >
              <Text className="text-xs font-semibold text-text-light dark:text-text-dark">Edit item</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/new-item/format")} className="h-12 flex-1 items-center justify-center rounded-lg bg-black dark:bg-white">
              <Text className="text-xs font-semibold text-white dark:text-black">Add new item</Text>
            </Pressable>
          </>
        ) : canAddToBag ? (
          <Button label="Add to bag" onPress={handleAddToBag} variant="cta" className="flex-1" />
        ) : (
          <View className="h-12 flex-1 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-800">
            <Text className="text-xs font-semibold text-neutral-500">Add to bag</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

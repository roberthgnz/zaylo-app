import { Image } from "expo-image";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { trackBusinessEvent } from "@/lib/analytics";
import { buildStoreWhatsappUrl, formatBagPrice, getBagItemsByUsername } from "@/lib/bag";
import { getMainMediaPreview } from "@/lib/core/media";
import { clearBagStoreMutation, removeBagItemMutation } from "@/lib/domains/bag/queries";
import { useBagStore } from "@/lib/stores/useBagStore";
import { useBagData } from "@/lib/useBagData";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function StoreBagScreen() {
  const { t } = useTranslation("StoreBagPage");
  const router = useRouter();
  const pathname = usePathname();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { items, isAuthenticated, bag } = useBagData();
  const removeItem = useBagStore((state) => state.removeItem);
  const clearStore = useBagStore((state) => state.clearStore);
  const queryClient = useQueryClient();

  const storeItems = useMemo(() => getBagItemsByUsername(items, username), [items, username]);
  const whatsappUrl = useMemo(() => buildStoreWhatsappUrl(storeItems), [storeItems]);
  const sellerId = bag?.storeGroups.find((group) => group.sellerUsername === username)?.sellerId ?? null;

  const handleRemove = (bagItemId: string) => {
    if (isAuthenticated) {
      void removeBagItemMutation(queryClient, bagItemId);
      return;
    }
    removeItem(bagItemId);
  };

  const handleClearStore = () => {
    if (isAuthenticated && sellerId) {
      void clearBagStoreMutation(queryClient, sellerId);
      return;
    }
    clearStore(username);
  };

  const handleCheckout = () => {
    if (!whatsappUrl) return;
    void trackBusinessEvent({
      eventName: "start_whatsapp_checkout",
      storeUsername: username,
      sourcePath: pathname,
      metadata: { source: "store_bag_footer", itemCount: storeItems.length },
    });
    void Linking.openURL(whatsappUrl);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-4 px-5 pt-6 pb-32">
        <Pressable onPress={() => router.push("/bag")} className="flex-row items-center gap-2">
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">←</Text>
          <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
            {t("title")}
          </Text>
        </Pressable>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              @{username}
            </Text>
            <Text className="text-2xl font-black font-display tracking-tight text-text-light dark:text-text-dark">
              {t("heading")}
            </Text>
          </View>
          {storeItems.length > 0 ? (
            <Pressable onPress={handleClearStore}>
              <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                {t("clear")}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {storeItems.length === 0 ? (
          <View className="rounded-3xl border border-neutral-200 bg-background-element-light p-6 dark:border-neutral-800 dark:bg-background-element-dark">
            <Text className="mb-3 text-center text-xl font-bold font-display text-text-light dark:text-text-dark">
              {t("emptyTitle")}
            </Text>
            <Pressable onPress={() => router.push("/bag")}>
              <Text className="text-center text-sm font-semibold text-text-light underline dark:text-text-dark">
                {t("backToStore")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {storeItems.map((item, index) => {
              const previewMedia = getMainMediaPreview(item.mainPhoto, item.mainMediaType, item.mainMediaPoster);
              const key = item.bagItemId || `${item.id}-${item.selectedSize ?? "no-size"}-${item.addedAt}-${index}`;

              return (
                <View
                  key={key}
                  className="flex-row gap-3 rounded-2xl border border-neutral-200 bg-background-element-light p-3 dark:border-neutral-800 dark:bg-background-element-dark"
                >
                  <View className="h-24 w-20 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    {previewMedia ? (
                      <Image
                        source={{ uri: previewMedia }}
                        alt={item.name}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {t("noImage")}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-semibold text-text-light dark:text-text-dark" numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.selectedSize ? (
                      <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {t("sizeLine", { size: item.selectedSize })}
                      </Text>
                    ) : null}
                    <Text className="mb-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {formatBagPrice(item.price, item.currency)}
                    </Text>
                    <View className="flex-row gap-4">
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/store/[username]/product/[itemId]",
                            params: {
                              username,
                              itemId: item.slug ?? ("itemId" in item ? item.itemId : item.id),
                            },
                          })
                        }
                      >
                        <Text className="text-xs text-text-secondary-light underline dark:text-text-secondary-dark">
                          {t("viewProduct")}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemove(item.bagItemId)}>
                        <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {t("remove")}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="border-t border-neutral-200 bg-background-light/90 p-4 dark:border-neutral-800 dark:bg-background-dark/90">
        {whatsappUrl ? (
          <Button variant="cta" label={t("continueWith", { username })} onPress={handleCheckout} />
        ) : (
          <View className="h-12 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-800">
            <Text className="text-sm font-semibold text-neutral-500">{t("sellerContactUnavailable")}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

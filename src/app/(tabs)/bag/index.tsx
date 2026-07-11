import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { groupBagItemsByStore } from "@/lib/bag";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { getMainMediaPreview } from "@/lib/core/media";
import { clearBagMutation } from "@/lib/domains/bag/queries";
import { useBagStore } from "@/lib/stores/useBagStore";
import { useBagData } from "@/lib/useBagData";
import { useQueryClient } from "@tanstack/react-query";

export default function BagScreen() {
  const { t } = useTranslation("BagPage");
  const router = useRouter();
  const { items, grouped, isAuthenticated } = useBagData();
  const clear = useBagStore((state) => state.clear);
  const queryClient = useQueryClient();

  const storeGroups = useMemo(() => {
    if (isAuthenticated) return grouped;
    return groupBagItemsByStore(items);
  }, [grouped, isAuthenticated, items]);

  const handleClear = () => {
    if (isAuthenticated) {
      void clearBagMutation(queryClient);
      return;
    }
    clear();
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-4 px-5 pt-6" contentContainerStyle={{ paddingBottom: BottomTabInset }}>
        <Pressable onPress={() => router.push("/profile")} className="flex-row items-center gap-2">
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">←</Text>
          <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
            {t("title")}
          </Text>
        </Pressable>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              {t("eyebrow")}
            </Text>
            <Text className="text-3xl font-black font-display tracking-tight text-text-light dark:text-text-dark">
              {t("heading")}
            </Text>
          </View>
          {items.length > 0 ? (
            <Pressable onPress={handleClear}>
              <Text className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                {t("clear")}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {storeGroups.length === 0 ? (
          <View className="rounded-3xl border border-neutral-200 bg-background-element-light p-6 dark:border-neutral-800 dark:bg-background-element-dark">
            <Text className="mb-2 text-center text-xl font-bold font-display text-text-light dark:text-text-dark">
              {t("emptyTitle")}
            </Text>
            <Text className="text-center text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
              {t("emptyDescription")}
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {storeGroups.map(({ username, items: storeItems }) => {
              const preview = storeItems.slice(0, 3);

              return (
                <Pressable
                  key={username}
                  onPress={() => router.push({ pathname: "/bag/[username]", params: { username } })}
                  className="rounded-3xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark"
                >
                  <View className="mb-4 flex-row items-start justify-between gap-3">
                    <View>
                      <Text className="text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
                        @{username}
                      </Text>
                      <Text className="mt-1 text-2xl font-black font-display text-text-light dark:text-text-dark">
                        {t("itemsCount", { count: storeItems.length })}
                      </Text>
                    </View>
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-black dark:bg-white">
                      <Text className="text-white dark:text-black">›</Text>
                    </View>
                  </View>

                  <View className="flex-row">
                    {preview.map((item, index) => {
                      const previewMedia = getMainMediaPreview(
                        item.mainPhoto ?? null,
                        item.mainMediaType,
                        item.mainMediaPoster
                      );

                      return (
                        <View
                          key={item.bagItemId}
                          className="h-16 w-14 overflow-hidden rounded-2xl border-2 border-background-light bg-neutral-100 dark:border-background-dark dark:bg-neutral-800"
                          style={{ marginLeft: index === 0 ? 0 : -12 }}
                        >
                          {previewMedia ? (
                            <Image
                              source={{ uri: previewMedia }}
                              alt={item.name}
                              style={{ width: "100%", height: "100%" }}
                              contentFit="cover"
                            />
                          ) : (
                            <View className="h-full w-full items-center justify-center">
                              <Text className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">
                                {t("noImage")}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <Text className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {t("groupFooter")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

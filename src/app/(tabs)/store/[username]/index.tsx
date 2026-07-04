import { Image } from "expo-image";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StoreItemCard } from "@/components/store/StoreItemCard";
import { trackBusinessEvent } from "@/lib/analytics";
import { useStoreByUsernameQuery } from "@/lib/domains/public-store/queries";

const CATEGORY_CHIPS = [
  { label: "All", value: "all" },
  { label: "Tops", value: "tops" },
  { label: "Bottoms", value: "bottoms" },
  { label: "Outerwear", value: "outer" },
  { label: "Accessories", value: "acc" },
];

export default function StorefrontScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const storeQuery = useStoreByUsernameQuery(username);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const hasTrackedView = useRef(false);

  const profile = storeQuery.data?.profile ?? null;
  const items = useMemo(() => storeQuery.data?.items ?? [], [storeQuery.data]);
  const notFound = !storeQuery.isLoading && !profile;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.status === "archived") return false;
      const matchCategory = category === "all" || item.category === category;
      const matchSearch = !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [items, category, search]);

  useEffect(() => {
    if (!profile || hasTrackedView.current) return;
    void trackBusinessEvent({
      eventName: "view_store",
      storeUsername: username,
      sourcePath: pathname,
      metadata: { catalogCount: items.length },
    });
    hasTrackedView.current = true;
  }, [profile, items.length, username, pathname]);

  const whatsappUrl = useMemo(() => {
    const phone = (profile?.whatsapp ?? "").replace(/\D/g, "");
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent("Hi! I found your store on Zaylo and want to shop.")}`;
  }, [profile?.whatsapp]);

  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out ${profile?.storeName ?? "this store"} on Zaylo: https://zaylo.bio/${username}` });
    } catch (error) {
      console.error("Error sharing store:", error);
    }
  };

  const handleWhatsapp = () => {
    if (!whatsappUrl) return;
    void trackBusinessEvent({
      eventName: "start_whatsapp_checkout",
      storeUsername: username,
      sourcePath: pathname,
      metadata: { source: "store_header_whatsapp" },
    });
    void Linking.openURL(whatsappUrl);
  };

  if (storeQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-light px-5 dark:bg-background-dark">
        <Text className="text-xl font-bold text-text-light dark:text-text-dark">Store not found</Text>
        <Text className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          @{username} doesn&apos;t exist.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-4 px-5 pt-6 pb-10">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">←</Text>
          <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Back</Text>
        </Pressable>

        <View className="items-center rounded-2xl border border-neutral-200 bg-background-element-light p-5 dark:border-neutral-800 dark:bg-background-element-dark">
          <View className="mb-3 h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-black">
            {profile?.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                alt={profile.storeName ?? "Store"}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-lg font-black text-white">ZY</Text>
            )}
          </View>
          <Text className="text-xl font-bold text-text-light dark:text-text-dark">{profile?.storeName}</Text>
          <Text className="mb-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">@{profile?.username}</Text>
          {profile?.description ? (
            <Text className="mb-3 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {profile.description}
            </Text>
          ) : null}
          <View className="w-full flex-row gap-2">
            <Pressable
              onPress={handleShare}
              className="h-10 flex-1 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700"
            >
              <Text className="text-sm font-bold text-text-light dark:text-text-dark">Share</Text>
            </Pressable>
            {whatsappUrl ? (
              <Pressable onPress={handleWhatsapp} className="h-10 flex-1 items-center justify-center rounded-full bg-black dark:bg-white">
                <Text className="text-sm font-bold text-white dark:text-black">WhatsApp</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search the drop..."
          placeholderTextColor="#9CA3AF"
          className="h-11 rounded-full border border-neutral-300 px-4 text-[15px] text-text-light dark:border-neutral-700 dark:text-text-dark"
        />

        <View className="flex-row flex-wrap gap-2">
          {CATEGORY_CHIPS.map((chip) => (
            <Pressable
              key={chip.value}
              onPress={() => setCategory(chip.value)}
              className={
                category === chip.value
                  ? "rounded-full bg-black px-4 py-1.5 dark:bg-white"
                  : "rounded-full bg-neutral-100 px-4 py-1.5 dark:bg-neutral-800"
              }
            >
              <Text
                className={
                  category === chip.value
                    ? "text-xs font-bold uppercase text-white dark:text-black"
                    : "text-xs font-bold uppercase text-text-secondary-light dark:text-text-secondary-dark"
                }
              >
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {filteredItems.length === 0 ? (
          <Text className="py-10 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {items.length === 0 ? "No items in this store yet." : "No items match your search."}
          </Text>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {filteredItems.map((item) => (
              <StoreItemCard key={item.id} item={item} username={username} currency={profile?.currency} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

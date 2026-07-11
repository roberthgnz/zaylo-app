import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { ItemList } from "@/components/dashboard/ItemList";
import { BottomTabInset } from "@/constants/theme";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { useItemsByUserQuery, useItemsByUserRealtime } from "@/lib/domains/catalog/queries";

export default function DashboardStoreScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const userId = user?.uid;

  const itemsQuery = useItemsByUserQuery(userId, { orderByCreated: true });
  useItemsByUserRealtime(userId, { orderByCreated: true });

  const [search, setSearch] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const items = useMemo(() => {
    const all = itemsQuery.data ?? [];
    const filtered = search.trim()
      ? all.filter(
          (item) =>
            item.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            item.tags?.toLowerCase().includes(search.trim().toLowerCase())
        )
      : all;

    return sortNewestFirst ? filtered : [...filtered].reverse();
  }, [itemsQuery.data, search, sortNewestFirst]);

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-4 px-5 pt-6" contentContainerStyle={{ paddingBottom: BottomTabInset }}>
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-2xl font-black text-text-light dark:text-text-dark">Store</Text>
          <Button label="New item" variant="cta" size="sm" onPress={() => router.push("/new-item/format")} />
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your items..."
          placeholderTextColor="#9CA3AF"
          className="h-11 rounded-lg border border-neutral-300 px-4 text-[15px] font-sans text-text-light dark:border-neutral-700 dark:text-text-dark"
        />

        <Pressable onPress={() => setSortNewestFirst((prev) => !prev)} className="self-start">
          <Text className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
            Sort: {sortNewestFirst ? "Newest first" : "Oldest first"}
          </Text>
        </Pressable>

        <ItemList items={items} isLoading={itemsQuery.isLoading} emptyText="No items match your filters." />
      </ScrollView>
    </SafeAreaView>
  );
}

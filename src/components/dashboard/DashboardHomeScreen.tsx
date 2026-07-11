import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { useItemsByUserQuery, useItemsByUserRealtime } from "@/lib/domains/catalog/queries";
import { useBusinessAnalyticsSummaryQuery } from "@/lib/domains/analytics/queries";
import { DashboardAnalyticsWidget } from "./DashboardAnalyticsWidget";
import { DashboardStats } from "./DashboardStats";
import { ItemList } from "./ItemList";

export function DashboardHomeScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const userId = user?.uid;

  const itemsQuery = useItemsByUserQuery(userId, { orderByCreated: true });
  useItemsByUserRealtime(userId, { orderByCreated: true });
  const analyticsQuery = useBusinessAnalyticsSummaryQuery(7);

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const counts = useMemo(
    () => ({
      active: items.filter((item) => item.status === "available").length,
      reserved: items.filter((item) => item.status === "reserved").length,
      sold: items.filter((item) => item.status === "sold").length,
    }),
    [items]
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView
        contentContainerClassName="gap-5 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: BottomTabInset }}>
        <View>
          <Text className="font-display mb-1 text-2xl font-black text-text-light dark:text-text-dark">
            Hello, {user?.profile?.storeName || "seller"} 👋
          </Text>
          <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Here is how your store is doing.
          </Text>
        </View>

        {items.length < 4 ? (
          <View className="rounded-2xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark">
            <Text className="mb-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Store setup in progress. {items.length}/4 items uploaded.
            </Text>
            <Button label="Add new item" variant="cta" onPress={() => router.push("/new-item/format")} />
          </View>
        ) : (
          <Button label="Add new item" variant="cta" onPress={() => router.push("/new-item/format")} />
        )}

        {user?.profile?.username ? (
          <Button
            label="Go to store"
            variant="outline"
            onPress={() =>
              router.push({ pathname: "/store/[username]", params: { username: user.profile!.username! } })
            }
          />
        ) : null}

        <DashboardStats activeCount={counts.active} reservedCount={counts.reserved} soldCount={counts.sold} />

        <DashboardAnalyticsWidget
          summary={analyticsQuery.data}
          isLoading={analyticsQuery.isLoading}
          username={user?.profile?.username}
        />

        <View>
          <Text className="font-display mb-3 text-lg font-bold text-text-light dark:text-text-dark">Your items</Text>
          <ItemList items={items} isLoading={itemsQuery.isLoading} emptyText="No items yet — add your first one above." />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { Share, View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { BusinessAnalyticsSummary } from "@/lib/domains/analytics/types";

function MetricRow({ label, value, percentOf }: { label: string; value: number; percentOf?: number }) {
  const pct = percentOf && percentOf > 0 ? Math.round((value / percentOf) * 100) : null;
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-100 py-3 dark:border-neutral-800">
      <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="font-semibold text-text-light dark:text-text-dark">{value}</Text>
        {pct !== null ? (
          <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">({pct}%)</Text>
        ) : null}
      </View>
    </View>
  );
}

export function DashboardAnalyticsWidget({
  summary,
  isLoading,
  username,
}: {
  summary: BusinessAnalyticsSummary | undefined;
  isLoading: boolean;
  username?: string;
}) {
  const router = useRouter();
  const totals = summary?.totals;
  const isEmpty = !isLoading && (!totals || totals.viewStore === 0);

  const handleShare = async () => {
    if (!username) return;
    try {
      await Share.share({ message: `Check out my store on Zaylo: https://zaylo.bio/${username}` });
    } catch (error) {
      console.error("Error sharing store link:", error);
    }
  };

  return (
    <View className="rounded-2xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-display text-base font-bold text-text-light dark:text-text-dark">Analytics</Text>
        <Button label="Full analytics" variant="ghost" size="sm" onPress={() => router.push("/profile/analytics")} />
      </View>

      {isEmpty ? (
        <View className="items-center gap-3 py-4">
          <Text className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            No store views yet. Share your store to start getting traffic.
          </Text>
          <Button label="Share store" variant="cta" onPress={handleShare} size="sm" />
        </View>
      ) : (
        <>
          <MetricRow label="Store views" value={totals?.viewStore ?? 0} />
          <MetricRow label="Product views" value={totals?.viewProduct ?? 0} percentOf={totals?.viewStore} />
          <MetricRow label="Add to bag" value={totals?.addToBag ?? 0} percentOf={totals?.viewProduct} />
          <MetricRow label="WhatsApp checkouts" value={totals?.startWhatsappCheckout ?? 0} percentOf={totals?.addToBag} />
        </>
      )}
    </View>
  );
}

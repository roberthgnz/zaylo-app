import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Chip } from "@/components/ui/chip";
import { Text } from "@/components/ui/text";
import { useBusinessAnalyticsSummaryQuery } from "@/lib/domains/analytics/queries";

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-100 py-4 dark:border-neutral-800">
      <Text className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{label}</Text>
      <Text className="text-lg font-bold text-text-light dark:text-text-dark">{value}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [days, setDays] = useState<7 | 30>(7);
  const analyticsQuery = useBusinessAnalyticsSummaryQuery(days);
  const totals = analyticsQuery.data?.totals;

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-5 px-5 pt-6 pb-10">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">←</Text>
          <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Back</Text>
        </Pressable>

        <Text className="text-2xl font-display font-black text-text-light dark:text-text-dark">Analytics</Text>

        <View className="flex-row gap-2">
          {([7, 30] as const).map((option) => (
            <Chip
              key={option}
              label={`${option} days`}
              selected={days === option}
              onPress={() => setDays(option)}
            />
          ))}
        </View>

        <View className="rounded-2xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark">
          <StatRow label="Store views" value={totals?.viewStore ?? 0} />
          <StatRow label="Product views" value={totals?.viewProduct ?? 0} />
          <StatRow label="Add to bag" value={totals?.addToBag ?? 0} />
          <StatRow label="WhatsApp checkouts" value={totals?.startWhatsappCheckout ?? 0} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

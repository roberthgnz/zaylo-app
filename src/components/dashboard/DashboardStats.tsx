import { View } from "react-native";

import { Text } from "@/components/ui/text";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 rounded-2xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark">
      <Text className="font-display text-2xl font-black text-text-light dark:text-text-dark">{value}</Text>
      <Text className="text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
        {label}
      </Text>
    </View>
  );
}

export function DashboardStats({
  activeCount,
  reservedCount,
  soldCount,
}: {
  activeCount: number;
  reservedCount: number;
  soldCount: number;
}) {
  return (
    <View className="flex-row gap-3">
      <StatTile label="Active" value={activeCount} />
      <StatTile label="Reserved" value={reservedCount} />
      <StatTile label="Sold" value={soldCount} />
    </View>
  );
}

import { Pressable } from "react-native";

import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "h-8 items-center justify-center rounded-full px-3.5",
        selected
          ? "bg-carbon"
          : "bg-white border border-zinc-300 dark:bg-transparent dark:border-zinc-700"
      )}
    >
      <Text className={cn("text-[13px] font-semibold", selected ? "text-bone" : "text-carbon dark:text-bone")}>
        {label}
      </Text>
    </Pressable>
  );
}

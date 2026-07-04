import { Text, View } from "react-native";

import { cn } from "@/lib/utils";

export function FormBanner({
  message,
  variant = "error",
}: {
  message: string;
  variant?: "error" | "info";
}) {
  return (
    <View
      className={cn(
        "rounded-lg border px-4 py-3",
        variant === "error"
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
          : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
      )}
    >
      <Text
        className={cn(
          "text-[13px]",
          variant === "error"
            ? "text-red-700 dark:text-red-300"
            : "text-blue-700 dark:text-blue-300"
        )}
      >
        {message}
      </Text>
    </View>
  );
}

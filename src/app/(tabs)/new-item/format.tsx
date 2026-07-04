import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";

type SessionType = "solo" | "model";

const OPTIONS: Array<{ id: SessionType; title: string; description: string }> = [
  { id: "solo", title: "Quick Upload", description: "Simple form. 1 main photo, up to 4 details." },
  { id: "model", title: "Model Session", description: "For modeled items. Front, back, and detail photos." },
];

export default function NewItemFormatScreen() {
  const router = useRouter();
  const [sessionType, setSessionType] = useState<SessionType>("solo");

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="flex-grow px-5 pt-6">
        <Text className="mb-2 text-2xl font-black text-text-light dark:text-text-dark">New Drop Session</Text>
        <Text className="mb-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Choose how you want to upload items.
        </Text>

        <View className="gap-3">
          {OPTIONS.map((option) => {
            const isSelected = sessionType === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setSessionType(option.id)}
                className={
                  isSelected
                    ? "rounded-xl border border-neutral-300 bg-background-element-light p-4 dark:border-neutral-600 dark:bg-background-element-dark"
                    : "rounded-xl border border-transparent bg-neutral-50 p-4 dark:bg-neutral-900"
                }
              >
                <Text className="mb-0.5 text-[15px] font-semibold text-text-light dark:text-text-dark">{option.title}</Text>
                <Text className="text-[13px] text-text-secondary-light dark:text-text-secondary-dark">{option.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        <Button label="Continue" onPress={() => router.push({ pathname: "/new-item/details", params: { type: sessionType } })} />
      </View>
    </SafeAreaView>
  );
}

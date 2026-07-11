import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { submitOnboardingRole } from "@/lib/domains/onboarding/client";
import { useOnboardingNav } from "@/lib/navigation/useOnboardingNav";

type AccountChoice = "buyer" | "seller" | "showcase";

export default function OnboardingRoleScreen() {
  const { t } = useTranslation("OnboardingRole");
  const { refreshProfile } = useCurrentUser();
  const { advance } = useOnboardingNav();
  const [selected, setSelected] = useState<AccountChoice>("seller");
  const [isSaving, setIsSaving] = useState(false);

  const choices: Array<{ id: AccountChoice; title: string; description: string }> = [
    { id: "seller", title: t("sellerTitle"), description: t("sellerDescription") },
    { id: "buyer", title: t("buyerTitle"), description: t("buyerDescription") },
    { id: "showcase", title: t("showcaseTitle"), description: t("showcaseDescription") },
  ];

  const continueOnboarding = async () => {
    setIsSaving(true);
    try {
      const { redirectTo } = await submitOnboardingRole(selected);
      await refreshProfile();
      advance(redirectTo);
    } catch (error) {
      console.error("Error saving account type:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="flex-grow px-5 pt-6" keyboardShouldPersistTaps="handled">
        <Text className="mb-2 font-display text-[22px] text-text-light dark:text-text-dark">{t("title")}</Text>
        <Text className="mb-6 text-[14px] leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
          {t("subtitle")}
        </Text>

        <View className="gap-3">
          {choices.map((choice) => {
            const isSelected = selected === choice.id;
            return (
              <Pressable
                key={choice.id}
                onPress={() => setSelected(choice.id)}
                className={
                  isSelected
                    ? "flex-row items-center justify-between rounded-xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-700 dark:bg-background-element-dark"
                    : "flex-row items-center justify-between rounded-xl border border-transparent bg-neutral-50 p-4 dark:bg-neutral-900"
                }
              >
                <View className="flex-1 pr-4">
                  <Text className="mb-0.5 text-[15px] font-semibold text-text-light dark:text-text-dark">
                    {choice.title}
                  </Text>
                  <Text className="text-[13px] leading-snug text-text-secondary-light dark:text-text-secondary-dark">
                    {choice.description}
                  </Text>
                </View>
                <View
                  className={
                    isSelected
                      ? "h-5 w-5 items-center justify-center rounded border border-black bg-black dark:border-white dark:bg-white"
                      : "h-5 w-5 items-center justify-center rounded border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-black"
                  }
                >
                  {isSelected ? (
                    <Text className="text-[11px] font-bold text-white dark:text-black">✓</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        <Button
          label={
            isSaving
              ? t("saving")
              : selected === "seller"
                ? t("continueSeller")
                : selected === "showcase"
                  ? t("continueShowcase")
                  : t("continueBuyer")
          }
          isLoading={isSaving}
          onPress={continueOnboarding}
        />
      </View>
    </SafeAreaView>
  );
}

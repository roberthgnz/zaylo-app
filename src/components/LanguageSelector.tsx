import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Locale } from "@/lib/i18n/config";
import { setPersistedLocale } from "@/lib/i18n/persistLocale";

export function LanguageSelector() {
  const { t, i18n } = useTranslation("LanguageSelector");
  const [open, setOpen] = useState(false);

  const options: Array<{ value: Locale; label: string }> = [
    { value: "en", label: t("english") },
    { value: "es", label: t("spanish") },
  ];

  const selectedLabel = i18n.language === "es" ? t("spanish") : t("english");

  const handleSelect = async (locale: Locale) => {
    setOpen(false);
    await setPersistedLocale(locale);
  };

  return (
    <View className="flex-row items-center justify-between py-4">
      <Text className="text-sm font-semibold text-text-light dark:text-text-dark">{t("language")}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="h-10 min-w-[120px] items-center justify-center rounded-lg border border-neutral-300 px-3 dark:border-neutral-700"
      >
        <Text className="text-sm font-semibold text-text-light dark:text-text-dark">{selectedLabel}</Text>
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)} />
        <SafeAreaView
          edges={["bottom"]}
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-background-light dark:bg-background-dark"
        >
          <View className="p-5">
            <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                className="flex-row items-center justify-between border-b border-neutral-100 py-3.5 dark:border-neutral-800"
              >
                <Text className="text-[15px] font-medium text-text-light dark:text-text-dark">{option.label}</Text>
                {i18n.language === option.value ? <Text>✓</Text> : null}
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { PhoneInput } from "@/components/ui/phone-input";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { submitOnboardingStep2 } from "@/lib/domains/onboarding/client";
import { step2Schema, type Step2Schema } from "@/lib/domains/onboarding/step2-schema";
import { useOnboardingNav } from "@/lib/navigation/useOnboardingNav";

export default function OnboardingStep2Screen() {
  const { t } = useTranslation("OnboardingStep2");
  const router = useRouter();
  const { user, refreshProfile } = useCurrentUser();
  const { advance } = useOnboardingNav();

  const roles = user?.profile?.roles ?? [];
  const isSeller = roles.includes("seller");

  const [isLoading, setIsLoading] = useState(false);
  const [rootError, setRootError] = useState("");

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Step2Schema>({
    resolver: zodResolver(step2Schema),
    mode: "onBlur",
    defaultValues: {
      whatsapp: user?.profile?.whatsapp ?? "",
      instagram: user?.profile?.instagram ?? "",
      tiktok: user?.profile?.tiktok ?? "",
    },
  });

  useEffect(() => {
    // Contact/social details only make sense for sellers; showcase-only
    // users finish onboarding at step-1 (mirrors web's step-2 page.tsx guard).
    if (!isSeller) {
      router.replace("/step-1");
    }
  }, [isSeller, router]);

  if (!isSeller) {
    return null;
  }

  const onSubmit = async (data: Step2Schema) => {
    setIsLoading(true);
    setRootError("");

    try {
      const { redirectTo } = await submitOnboardingStep2({
        whatsapp: data.whatsapp?.trim() ?? "",
        instagram: data.instagram || "",
        tiktok: data.tiktok || "",
      });

      await refreshProfile();
      advance(redirectTo);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes("Invalid phone number format")) {
        setError("whatsapp", { type: "server", message: t("invalidPhoneFormat") });
      } else if (error instanceof Error) {
        setRootError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="flex-grow px-5 pt-6" keyboardShouldPersistTaps="handled">
          <Text className="mb-2 font-display text-[22px] text-text-light dark:text-text-dark">{t("title")}</Text>
          <Text className="mb-6 text-[14px] leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
            {t("description")}
          </Text>

          {rootError ? (
            <View className="mb-4">
              <FormBanner message={rootError} variant="error" />
            </View>
          ) : null}

          <View className="gap-5">
            <Controller
              control={control}
              name="whatsapp"
              render={({ field }) => (
                <PhoneInput
                  label={`${t("whatsapp")} *`}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.whatsapp?.message}
                />
              )}
            />
            {!errors.whatsapp ? (
              <Text className="-mt-3 text-[13px] text-text-secondary-light dark:text-text-secondary-dark">
                {t("whatsappHint")}
              </Text>
            ) : null}

            <Text className="text-sm font-medium text-text-light dark:text-text-dark">{t("socialProfiles")}</Text>

            <Controller
              control={control}
              name="instagram"
              render={({ field }) => (
                <TextField
                  label={t("instagram")}
                  placeholder={t("username")}
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.instagram?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="tiktok"
              render={({ field }) => (
                <TextField
                  label={t("tiktok")}
                  placeholder={t("username")}
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.tiktok?.message}
                />
              )}
            />
          </View>
        </ScrollView>

        <View className="flex-row gap-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <Pressable
            onPress={() => router.push("/step-1")}
            className="h-11 items-center justify-center rounded-lg border border-neutral-300 px-6 dark:border-neutral-700"
          >
            <Text className="text-[15px] font-semibold text-text-light dark:text-text-dark">{t("back")}</Text>
          </Pressable>
          <Button
            label={isLoading ? t("finishing") : t("finish")}
            isLoading={isLoading}
            onPress={handleSubmit(onSubmit)}
            className="flex-1"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

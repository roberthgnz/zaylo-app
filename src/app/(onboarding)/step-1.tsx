import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { TextField } from "@/components/ui/text-field";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { isUsernameAvailable } from "@/lib/domains/profile/client";
import { submitOnboardingStep1 } from "@/lib/domains/onboarding/client";
import { buildStep1Schema, type Step1Schema } from "@/lib/domains/onboarding/step1-schema";
import { useOnboardingNav } from "@/lib/navigation/useOnboardingNav";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

type UsernameCheck = {
  username: string;
  status: "idle" | "checking" | "available" | "taken" | "error";
  errorMessage: string;
};

export default function OnboardingStep1Screen() {
  const { t } = useTranslation("OnboardingStep1");
  const router = useRouter();
  const { user, refreshProfile } = useCurrentUser();
  const { advance } = useOnboardingNav();

  const roles = user?.profile?.roles ?? [];
  const isShowcaseOnly = roles.includes("showcase") && !roles.includes("seller");

  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>({
    username: "",
    status: "idle",
    errorMessage: "",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Schema>({
    resolver: zodResolver(
      buildStep1Schema({
        nameRequired: isShowcaseOnly ? t("showcaseNameRequired") : t("storeNameRequired"),
      })
    ),
    mode: "onBlur",
    defaultValues: {
      storeName: user?.profile?.storeName ?? "",
      username: user?.profile?.username ?? "",
      description: user?.profile?.description ?? "",
    },
  });

  const usernameValue = useWatch({ control, name: "username" });
  const normalizedUsername = (usernameValue || "").trim().toLowerCase();
  const canCheckUsername = normalizedUsername.length >= 3 && USERNAME_PATTERN.test(normalizedUsername);
  const isCurrentUsernameCheck = usernameCheck.username === normalizedUsername;
  const isCheckingUsername = canCheckUsername && isCurrentUsernameCheck && usernameCheck.status === "checking";
  const usernameStatus =
    canCheckUsername && isCurrentUsernameCheck && (usernameCheck.status === "available" || usernameCheck.status === "taken")
      ? usernameCheck.status
      : "idle";
  const usernameError =
    canCheckUsername && isCurrentUsernameCheck && usernameCheck.status === "error" ? usernameCheck.errorMessage : "";

  useEffect(() => {
    if (!canCheckUsername) return;

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setUsernameCheck({ username: normalizedUsername, status: "checking", errorMessage: "" });
      try {
        const available = await isUsernameAvailable(normalizedUsername);
        if (isCancelled) return;
        setUsernameCheck({ username: normalizedUsername, status: available ? "available" : "taken", errorMessage: "" });
      } catch (error) {
        if (isCancelled) return;
        console.error("Error checking username:", error);
        setUsernameCheck({ username: normalizedUsername, status: "error", errorMessage: t("usernameCheckError") });
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [canCheckUsername, normalizedUsername, t]);

  const publicLink = useMemo(() => `zaylo.bio/${usernameValue || t("usernamePlaceholder")}`, [t, usernameValue]);

  const onSubmit = async (data: Step1Schema) => {
    setErrorMsg("");
    setIsPending(true);
    try {
      const normalizedUsernameValue = data.username.trim().toLowerCase();
      const available = await isUsernameAvailable(normalizedUsernameValue);

      if (!available) {
        setUsernameCheck({ username: normalizedUsernameValue, status: "error", errorMessage: t("usernameInUse") });
        return;
      }

      const { redirectTo } = await submitOnboardingStep1({
        storeName: data.storeName,
        username: normalizedUsernameValue,
        description: data.description || "",
      });

      await refreshProfile();
      advance(redirectTo);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : t("failedSaveProfile"));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="flex-grow px-5 pt-6" keyboardShouldPersistTaps="handled">
          <Text className="mb-2 text-[22px] font-semibold text-text-light dark:text-text-dark">
            {isShowcaseOnly ? t("showcaseTitle") : t("title")}
          </Text>
          <Text className="mb-6 text-[14px] leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
            {isShowcaseOnly ? t("showcaseDescription") : t("description")}
          </Text>

          {errorMsg ? (
            <View className="mb-4">
              <FormBanner message={errorMsg} variant="error" />
            </View>
          ) : null}

          <View className="gap-5">
            <Controller
              control={control}
              name="storeName"
              render={({ field }) => (
                <TextField
                  label={isShowcaseOnly ? t("showcaseName") : t("storeName")}
                  placeholder={isShowcaseOnly ? t("showcaseNamePlaceholder") : undefined}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.storeName?.message}
                />
              )}
            />

            <View>
              <Controller
                control={control}
                name="username"
                render={({ field }) => (
                  <TextField
                    label={t("uniqueUsername")}
                    placeholder={t("usernamePlaceholder")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.username?.message || usernameError}
                  />
                )}
              />
              {!errors.username && !usernameError && isCheckingUsername ? (
                <Text className="mt-1.5 text-[13px] text-text-secondary-light dark:text-text-secondary-dark">
                  {t("checkingUsername")}
                </Text>
              ) : null}
              {!errors.username && !usernameError && !isCheckingUsername && usernameStatus === "taken" ? (
                <Text className="mt-1.5 text-[13px] text-red-500">{t("usernameInUse")}</Text>
              ) : null}
              {!errors.username && !usernameError && !isCheckingUsername && usernameStatus === "available" ? (
                <Text className="mt-1.5 text-[13px] text-green-600">{t("usernameAvailable")}</Text>
              ) : null}
              <Text className="mt-2.5 text-[13px] text-text-secondary-light dark:text-text-secondary-dark">
                {t("publicLinkHint")}{"\n"}
                <Text className="font-medium text-text-light dark:text-text-dark">{publicLink}</Text>
              </Text>
            </View>

            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextField
                  label={isShowcaseOnly ? t("showcaseBio") : t("storeDescription")}
                  placeholder={isShowcaseOnly ? t("showcaseBioPlaceholder") : undefined}
                  multiline
                  numberOfLines={3}
                  className="h-auto min-h-24 py-2.5 text-left"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.description?.message}
                />
              )}
            />
          </View>
        </ScrollView>

        <View className="flex-row gap-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <Pressable
            onPress={() => router.push("/role")}
            className="h-11 items-center justify-center rounded-lg border border-neutral-300 px-6 dark:border-neutral-700"
          >
            <Text className="text-[15px] font-semibold text-text-light dark:text-text-dark">{t("back")}</Text>
          </Pressable>
          <Button
            label={isPending ? t("saving") : isShowcaseOnly ? t("finish") : t("nextStep")}
            isLoading={isPending}
            disabled={isCheckingUsername || usernameStatus === "taken"}
            onPress={handleSubmit(onSubmit)}
            className="flex-1"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

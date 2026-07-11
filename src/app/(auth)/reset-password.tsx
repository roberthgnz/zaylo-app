import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { supabase } from "@/lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const { t } = useTranslation("ResetPassword");
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isReady, setIsReady] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const establishRecoverySession = async () => {
      // The reset-password email link opens the app via a PKCE deep link
      // (zayloapp://reset-password?code=...). Unlike web (implicit/cookie
      // session via @supabase/ssr), the RN client uses flowType: "pkce" and
      // detectSessionInUrl: false, so the code must be exchanged manually.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(t("errors.invalidOrExpiredLink"));
          setIsReady(true);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMsg(t("errors.invalidOrExpiredLink"));
      }

      setIsReady(true);
    };

    void establishRecoverySession();
  }, [code, t]);

  const onSubmit = async (data: ResetPasswordSchema) => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;

      setSuccessMsg(t("success"));
      setTimeout(() => {
        router.replace("/sign-in");
      }, 2500);
    } catch {
      setErrorMsg(t("errors.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="flex-grow px-6 py-8" keyboardShouldPersistTaps="handled">
          <Text className="mb-2 font-bold text-2xl text-text-light dark:text-text-dark">{t("title")}</Text>
          <Text className="mb-8 text-base text-text-secondary-light dark:text-text-secondary-dark">
            {t("subtitle")}
          </Text>

          {errorMsg ? (
            <View className="mb-4">
              <FormBanner message={errorMsg} variant="error" />
            </View>
          ) : null}
          {successMsg ? (
            <View className="mb-4">
              <FormBanner message={successMsg} variant="info" />
            </View>
          ) : null}
          {!isReady && !errorMsg ? (
            <Text className="mb-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {t("verifyingLink")}
            </Text>
          ) : null}

          <View className="gap-5">
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  label={t("newPassword")}
                  secureToggle
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <TextField
                  label={t("confirmPassword")}
                  secureToggle
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              label={isLoading ? t("updating") : t("updatePassword")}
              isLoading={isLoading}
              disabled={!isReady}
              onPress={handleSubmit(onSubmit)}
            />

            <Button label={t("needNewLink")} variant="ghost" onPress={() => router.replace("/forgot-password")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

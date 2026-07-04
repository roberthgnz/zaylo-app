import { zodResolver } from "@hookform/resolvers/zod";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { TextField } from "@/components/ui/text-field";
import { supabase } from "@/lib/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation("ForgotPassword");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const redirectTo = Linking.createURL("/reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      });

      if (error) throw error;

      setSuccessMsg(t("sentMessage", { email: data.email }));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : t("sendFailed"));
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
            {t("description")}
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

          <View className="gap-5">
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextField
                  label={t("emailAddress")}
                  placeholder={t("emailPlaceholder")}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Button
              label={isLoading ? t("sending") : t("sendLink")}
              isLoading={isLoading}
              onPress={handleSubmit(onSubmit)}
            />

            <Button label={t("backToLogin")} variant="ghost" onPress={() => router.replace("/sign-in")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

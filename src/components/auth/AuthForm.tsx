import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { getUserProfile } from "@/lib/domains/profile/client";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AuthSchema = z.infer<typeof authSchema>;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useTranslation("AuthPage");
  const router = useRouter();
  const isLogin = mode === "login";

  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthSchema>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: AuthSchema) => {
    setIsLoading(true);
    setErrorMsg("");
    setInfoMsg("");
    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;

        // CurrentUserProvider reacts to the auth state change and flips the
        // Stack.Protected guard in the root layout — no manual profile
        // fetch/redirect here. Role-based routing (dashboard/closet/profile)
        // is deferred until those screens are ported (see migration-roadmap.md).
        if (authData.user) {
          await getUserProfile(authData.user.id).catch(() => null);
        }
      } else {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;

        if (!authData.session) {
          setInfoMsg(t("checkEmail"));
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mb-2 font-display text-4xl text-text-light dark:text-text-dark">
            {isLogin ? t("login") : t("signup")}
          </Text>
          <Text className="mb-8 text-base text-text-secondary-light dark:text-text-secondary-dark">
            {isLogin ? t("loginSubtitle") : t("signupSubtitle")}
          </Text>

          {errorMsg ? (
            <View className="mb-4">
              <FormBanner message={errorMsg} variant="error" />
            </View>
          ) : null}
          {infoMsg ? (
            <View className="mb-4">
              <FormBanner message={infoMsg} variant="info" />
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

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  label={t("password")}
                  placeholder="••••••••"
                  secureToggle
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  textContentType={isLogin ? "password" : "newPassword"}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.password?.message}
                />
              )}
            />
            {!isLogin && !errors.password ? (
              <Text className="-mt-3 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {t("atLeast8")}
              </Text>
            ) : null}

            <Button
              label={isLoading ? t("processing") : isLogin ? t("continue") : t("createAccount")}
              isLoading={isLoading}
              onPress={handleSubmit(onSubmit)}
              className="mt-2"
            />

            {isLogin ? (
              <Button
                label={t("forgotPassword")}
                variant="link"
                onPress={() => router.push("/forgot-password")}
              />
            ) : null}

            <Button
              label={isLogin ? t("signup") : t("login")}
              variant="ghost"
              onPress={() => router.replace(isLogin ? "/sign-up" : "/sign-in")}
            />
          </View>

          <Text className="mt-8 text-center text-[11px] leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
            {t("agreeTermsPrefix")} {t("terms")} {t("and")} {t("privacyPolicy")}.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

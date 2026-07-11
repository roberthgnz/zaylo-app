import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { supabase } from "@/lib/supabase/client";

const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ChangePasswordSchema) => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;

      setSuccessMsg("Password updated.");
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch {
      setErrorMsg("Could not update your password. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="gap-6 px-5 pt-6 pb-10" keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
            <Text className="text-text-secondary-light dark:text-text-secondary-dark">←</Text>
            <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
              Back to settings
            </Text>
          </Pressable>

          <View>
            <Text className="mb-2 text-3xl font-black tracking-tight text-text-light dark:text-text-dark">
              Change password
            </Text>
            <Text className="text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
              You&apos;re signed in, so you can set a new password directly — no email link needed.
            </Text>
          </View>

          {errorMsg ? <FormBanner message={errorMsg} variant="error" /> : null}
          {successMsg ? <FormBanner message={successMsg} variant="info" /> : null}

          <View className="gap-5">
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  label="New password"
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
                  label="Confirm new password"
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
              label={isLoading ? "Updating..." : "Update password"}
              isLoading={isLoading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

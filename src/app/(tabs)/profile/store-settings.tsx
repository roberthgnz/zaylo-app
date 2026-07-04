import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { PhoneInput } from "@/components/ui/phone-input";
import { TextField } from "@/components/ui/text-field";
import { PhotoSlot, type PhotoValue } from "@/components/dashboard/PhotoSlot";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { updateUserProfile } from "@/lib/domains/profile/client";
import { uploadPublicFile } from "@/lib/core/storage";
import { ACCENT_COLORS, storeSettingsSchema, type StoreSettingsValues } from "@/lib/domains/profile/store-settings-schema";

function logoUploadPath(userId: string) {
  return `users/${userId}/store-logo-${Date.now()}`;
}

export default function StoreSettingsScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useCurrentUser();
  const profile = user?.profile;

  const [logo, setLogo] = useState<PhotoValue>(profile?.avatarUrl ? { uri: profile.avatarUrl, name: "logo", type: "image/jpeg" } : null);
  const [accent, setAccent] = useState(profile?.accentColor ?? "#000000");
  const [customHexOpen, setCustomHexOpen] = useState(false);
  const [customHex, setCustomHex] = useState(profile?.accentColor ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreSettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    mode: "onBlur",
    defaultValues: {
      shopName: profile?.storeName ?? "",
      username: profile?.username ?? "",
      bio: profile?.description ?? "",
      shippingPolicy: profile?.shippingPolicy ?? "",
      currency: profile?.currency ?? "$",
      instagram: profile?.instagram ?? "",
      tiktok: profile?.tiktok ?? "",
      whatsapp: profile?.whatsapp ?? "",
    },
  });

  const onSubmit = async (data: StoreSettingsValues) => {
    if (!user?.uid) return;

    setIsSaving(true);
    setSaveError("");
    try {
      let avatarUrl = profile?.avatarUrl;
      if (logo && logo.uri !== profile?.avatarUrl) {
        avatarUrl = await uploadPublicFile(logoUploadPath(user.uid), logo, {
          contentType: logo.type || "image/jpeg",
        });
      }

      await updateUserProfile(user.uid, {
        storeName: data.shopName,
        username: data.username,
        description: data.bio,
        shippingPolicy: data.shippingPolicy,
        currency: data.currency || "$",
        instagram: data.instagram,
        tiktok: data.tiktok,
        whatsapp: data.whatsapp,
        accentColor: accent,
        avatarUrl,
      });

      await refreshProfile();
      router.back();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save store settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="gap-5 px-5 pt-6 pb-10" keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
            <Text className="text-text-secondary-light dark:text-text-secondary-dark">←</Text>
            <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Back to settings</Text>
          </Pressable>

          <Text className="text-2xl font-black text-text-light dark:text-text-dark">Store settings</Text>

          {saveError ? <FormBanner message={saveError} variant="error" /> : null}

          <PhotoSlot label="Logo" value={logo} onChange={setLogo} />

          <Controller
            control={control}
            name="shopName"
            render={({ field }) => (
              <TextField label="Shop name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.shopName?.message} />
            )}
          />

          <Controller
            control={control}
            name="username"
            render={({ field }) => (
              <TextField
                label="Username"
                autoCapitalize="none"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.username?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="bio"
            render={({ field }) => (
              <TextField label="Bio" multiline numberOfLines={3} className="h-auto min-h-20 py-2.5 text-left" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
            )}
          />

          <Controller
            control={control}
            name="shippingPolicy"
            render={({ field }) => (
              <TextField
                label="Shipping policy"
                placeholder="Tell buyers about your shipping process..."
                multiline
                numberOfLines={4}
                className="h-auto min-h-24 py-2.5 text-left"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.shippingPolicy?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <TextField label="Currency symbol" placeholder="$" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.currency?.message} />
            )}
          />

          <View>
            <Text className="mb-1.5 text-[13px] font-medium text-text-secondary-light dark:text-text-secondary-dark">Accent color</Text>
            <View className="flex-row items-center gap-2">
              {ACCENT_COLORS.map((color) => (
                <Pressable
                  key={color.id}
                  onPress={() => {
                    setAccent(color.hex);
                    setCustomHexOpen(false);
                  }}
                  className="h-9 w-9 items-center justify-center rounded-full border-2"
                  style={{ backgroundColor: color.hex, borderColor: accent === color.hex ? "#3b82f6" : "transparent" }}
                >
                  {accent === color.hex ? <Text className="text-xs font-bold text-white">✓</Text> : null}
                </Pressable>
              ))}
              <Pressable
                onPress={() => setCustomHexOpen((prev) => !prev)}
                className="h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700"
              >
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">#</Text>
              </Pressable>
            </View>
            {customHexOpen ? (
              <TextField
                containerClassName="mt-2"
                placeholder="#000000"
                autoCapitalize="none"
                value={customHex}
                onChangeText={(value) => {
                  setCustomHex(value);
                  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                    setAccent(value);
                  }
                }}
              />
            ) : null}
          </View>

          <Text className="text-sm font-medium text-text-light dark:text-text-dark">Social links</Text>

          <Controller
            control={control}
            name="instagram"
            render={({ field }) => (
              <TextField label="Instagram" placeholder="username" autoCapitalize="none" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
            )}
          />

          <Controller
            control={control}
            name="tiktok"
            render={({ field }) => (
              <TextField label="TikTok" placeholder="username" autoCapitalize="none" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
            )}
          />

          <Controller
            control={control}
            name="whatsapp"
            render={({ field }) => <PhoneInput label="WhatsApp" value={field.value ?? ""} onChange={field.onChange} />}
          />

          <Button label={isSaving ? "Saving..." : "Save changes"} isLoading={isSaving} onPress={handleSubmit(onSubmit)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

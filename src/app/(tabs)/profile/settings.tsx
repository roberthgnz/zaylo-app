import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { supabase } from "@/lib/supabase/client";

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    // No explicit navigation: signing out clears the session, CurrentUserProvider
    // picks it up via onAuthStateChange, and the root Stack.Protected guard
    // swaps to (auth) on its own — same pattern as onboarding completion.
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-6 pb-10">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
          <Text className="text-text-secondary-light dark:text-text-secondary-dark">←</Text>
          <Text className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
            Back to profile
          </Text>
        </Pressable>

        <View>
          <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
            Buyer account
          </Text>
          <Text className="mb-2 text-3xl font-black tracking-tight text-text-light dark:text-text-dark">
            Settings
          </Text>
          <Text className="text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
            Manage the basics for your buyer account. Seller settings stay inside the dashboard once you open a store.
          </Text>
        </View>

        <View className="rounded-3xl border border-neutral-200 bg-background-element-light p-5 dark:border-neutral-800 dark:bg-background-element-dark">
          <Text className="mb-4 text-xl font-bold text-text-light dark:text-text-dark">Account details</Text>

          <View className="flex-row items-center justify-between border-b border-neutral-200 py-4 dark:border-neutral-800">
            <Text className="text-sm font-semibold text-text-light dark:text-text-dark">Email</Text>
            <Text
              className="max-w-[190px] text-right text-sm text-text-secondary-light dark:text-text-secondary-dark"
              numberOfLines={1}
            >
              {user?.email || "Not available"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between border-b border-neutral-200 py-4 dark:border-neutral-800">
            <Text className="text-sm font-semibold text-text-light dark:text-text-dark">Role</Text>
            <View className="rounded-full bg-background-element-light px-3 py-1 dark:bg-neutral-800">
              <Text className="text-xs font-black uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
                Buyer
              </Text>
            </View>
          </View>

          <LanguageSelector />
        </View>

        <View className="rounded-3xl border border-neutral-200 bg-background-element-light p-5 dark:border-neutral-800 dark:bg-background-element-dark">
          <Text className="mb-4 text-xl font-bold text-text-light dark:text-text-dark">Actions</Text>
          <Pressable
            onPress={handleSignOut}
            disabled={isSigningOut}
            className="flex-row items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"
          >
            <View>
              <Text className="text-sm font-bold text-red-700 dark:text-red-300">
                {isSigningOut ? "Signing out..." : "Log out"}
              </Text>
              <Text className="text-xs text-red-700/70 dark:text-red-300/70">End this session.</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

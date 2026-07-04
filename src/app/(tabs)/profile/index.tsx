import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { useBagData } from "@/lib/useBagData";

function getInitial(email?: string | null) {
  return email?.charAt(0).toUpperCase() || "Z";
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { count: bagCount } = useBagData();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-6 pb-10">
        <View className="overflow-hidden rounded-[2rem] bg-black p-6">
          <View className="mb-8 flex-row items-center justify-between">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white">
              <Text className="text-2xl font-black text-black">{getInitial(user?.email)}</Text>
            </View>
            <View className="rounded-full bg-white/10 px-3 py-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-white/80">Buyer</Text>
            </View>
          </View>

          <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-white/50">
            Your account
          </Text>
          <Text className="mb-3 text-3xl font-black tracking-tight text-white">
            {user?.email || "Zaylo profile"}
          </Text>
          <Text className="max-w-[30ch] text-sm leading-6 text-white/65">
            Your buyer space for saved actions, bag handoff, and account settings.
          </Text>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/bag")}
            className="flex-1 rounded-3xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark"
          >
            <Text className="mb-5 text-lg">🛍️</Text>
            <Text className="text-2xl font-black text-text-light dark:text-text-dark">{bagCount}</Text>
            <Text className="text-xs font-semibold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Bag items
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/profile/settings")}
            className="flex-1 rounded-3xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark"
          >
            <Text className="mb-5 text-lg">✅</Text>
            <Text className="text-2xl font-black text-text-light dark:text-text-dark">Ready</Text>
            <Text className="text-xs font-semibold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
              Account
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          <Pressable
            onPress={() => router.push("/bag")}
            className="flex-row items-center justify-between rounded-3xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-black">
                <Text className="text-lg">🛍️</Text>
              </View>
              <View>
                <Text className="text-sm font-bold text-text-light dark:text-text-dark">Review your bag</Text>
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Continue with WhatsApp checkout.
                </Text>
              </View>
            </View>
            <Text className="text-text-secondary-light dark:text-text-secondary-dark">›</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/profile/settings")}
            className="flex-row items-center justify-between rounded-3xl border border-neutral-200 bg-background-element-light p-4 dark:border-neutral-800 dark:bg-background-element-dark"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-black">
                <Text className="text-lg">⚙️</Text>
              </View>
              <View>
                <Text className="text-sm font-bold text-text-light dark:text-text-dark">Account settings</Text>
                <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Security, role, and session actions.
                </Text>
              </View>
            </View>
            <Text className="text-text-secondary-light dark:text-text-secondary-dark">›</Text>
          </Pressable>
        </View>

        <View className="rounded-3xl border border-neutral-200 bg-background-element-light p-5 dark:border-neutral-800 dark:bg-background-element-dark">
          <Text className="mb-2 text-xl font-bold text-text-light dark:text-text-dark">
            More buyer tools coming next
          </Text>
          <Text className="text-sm leading-6 text-text-secondary-light dark:text-text-secondary-dark">
            Saved items, follows, orders, and becoming a seller are on the way.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

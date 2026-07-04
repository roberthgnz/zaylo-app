import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { mergeBagMutation } from "@/lib/domains/bag/queries";
import { useBagStore } from "@/lib/stores/useBagStore";

const MERGE_KEY = "zaylo_bag_merge_v1";

function mergeMarker(userId: string) {
  return `${MERGE_KEY}:${userId}`;
}

export function BagSyncProvider() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;
    const key = mergeMarker(user.uid);

    const run = async () => {
      const alreadyMerged = await AsyncStorage.getItem(key);
      if (cancelled || alreadyMerged === "done") return;

      const guestItems = useBagStore.getState().items;
      const payload = guestItems.map((item) => ({
        id: item.id,
        selectedSize: item.selectedSize ?? null,
      }));

      if (payload.length > 0) {
        await mergeBagMutation(queryClient, payload);
      }
      useBagStore.getState().clear();
      await AsyncStorage.setItem(key, "done");
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [queryClient, user?.uid]);

  return null;
}

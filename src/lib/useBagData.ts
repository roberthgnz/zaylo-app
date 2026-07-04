import { useMemo } from "react";

import { groupBagItemsByStore } from "@/lib/bag";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { useBagQuery } from "@/lib/domains/bag/queries";
import { useBagStore } from "@/lib/stores/useBagStore";

export function useBagData() {
  const { user } = useCurrentUser();
  const isAuthenticated = Boolean(user?.uid);
  const guestItems = useBagStore((state) => state.items);
  const bagQuery = useBagQuery(isAuthenticated);
  const authItems = bagQuery.data?.items ?? [];

  const items = isAuthenticated ? authItems : guestItems;
  const count = items.length;
  const grouped = useMemo(() => groupBagItemsByStore(items), [items]);

  return {
    isAuthenticated,
    items,
    count,
    grouped,
    bag: bagQuery.data ?? null,
    isLoading: isAuthenticated ? bagQuery.isLoading : false,
  };
}

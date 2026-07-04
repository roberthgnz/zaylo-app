import { useQuery } from "@tanstack/react-query";

import { getItemsByUserId } from "@/lib/domains/catalog/client";
import { getUserByUsername } from "@/lib/domains/profile/client";

export const publicStoreQueryKeys = {
  storeByUsername: (username: string) => ["stores", "by-username", username] as const,
};

// Web's version branches for showcase-only sellers into a second query
// against `/api/closet/public/{username}` (closet looks/lookbooks/items) —
// that branch is skipped entirely here, closet is excluded from this app.
// A showcase-only profile's catalog is legitimately empty (their content
// lives in closet tables, not `items`), so this just renders the normal
// empty state for them — no special-casing, no closet data ever fetched.
export function useStoreByUsernameQuery(username?: string) {
  return useQuery({
    queryKey: username
      ? publicStoreQueryKeys.storeByUsername(username)
      : (["stores", "by-username", "missing-username"] as const),
    queryFn: async () => {
      const profile = await getUserByUsername(username!);
      if (!profile) {
        return { profile: null, items: [] };
      }

      const items = await getItemsByUserId(profile.id);
      return { profile, items };
    },
    enabled: Boolean(username),
  });
}

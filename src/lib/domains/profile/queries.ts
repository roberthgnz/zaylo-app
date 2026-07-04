import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/domains/profile/client";

export const profileQueryKeys = {
  profileById: (userId: string) => ["profiles", "by-id", userId] as const,
};

export function useProfileByIdQuery(userId?: string) {
  return useQuery({
    queryKey: userId ? profileQueryKeys.profileById(userId) : (["profiles", "by-id", "missing-id"] as const),
    queryFn: () => getUserProfile(userId!),
    enabled: Boolean(userId),
  });
}

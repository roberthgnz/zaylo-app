import { QueryClient, useQuery } from "@tanstack/react-query";
import { deleteAsset, getAssets, uploadAsset } from "@/lib/domains/assets/client";
import type { LocalFile } from "@/lib/core/storage";

export const assetsQueryKeys = {
  assets: (userId: string) => ["assets", "by-user", userId] as const,
};

export function useAssetsQuery(userId?: string) {
  return useQuery({
    queryKey: userId ? assetsQueryKeys.assets(userId) : (["assets", "no-user"] as const),
    queryFn: () => getAssets(),
    enabled: Boolean(userId),
  });
}

export async function invalidateAssetsQuery(queryClient: QueryClient, userId: string) {
  await queryClient.invalidateQueries({ queryKey: assetsQueryKeys.assets(userId) });
}

export async function uploadAssetMutation(
  queryClient: QueryClient,
  userId: string,
  file: LocalFile,
  options: { name?: string } = {}
) {
  const asset = await uploadAsset(file, options);
  await invalidateAssetsQuery(queryClient, userId);
  return asset;
}

export async function deleteAssetMutation(queryClient: QueryClient, userId: string, assetId: string) {
  await deleteAsset(assetId);
  await invalidateAssetsQuery(queryClient, userId);
}

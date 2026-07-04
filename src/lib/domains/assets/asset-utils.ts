import type { ZayloItem } from "@/lib/domains/catalog/types";
import type { ZayloAsset } from "@/lib/domains/assets/types";

export type DisplayAsset = ZayloAsset & { deletable: boolean; previewUrl?: string };

export function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function itemPhotosToAssets(items: ZayloItem[]): DisplayAsset[] {
  const assets: DisplayAsset[] = [];

  for (const item of items) {
    const photos: Array<{ url?: string; index: number }> = [
      { url: item.mainPhoto, index: 0 },
      { url: item.photo1, index: 1 },
      { url: item.photo2, index: 2 },
      { url: item.photo3, index: 3 },
      { url: item.photo4, index: 4 },
    ];

    for (const photo of photos) {
      if (!photo.url) continue;
      assets.push({
        id: `${item.id}:photo:${photo.index}`,
        userId: item.userId,
        url: photo.url,
        storagePath: photo.url,
        type: photo.index === 0 ? (item.mainMediaType ?? "image") : "image",
        name: item.name,
        createdAt: item.createdAt ?? new Date(0).toISOString(),
        deletable: false,
        previewUrl: photo.index === 0 ? item.mainMediaPoster : undefined,
      });
    }
  }

  return assets;
}

export function mergeUniqueAssets(dbAssets: ZayloAsset[], itemAssets: DisplayAsset[]): DisplayAsset[] {
  const byUrl = new Map<string, DisplayAsset>();

  for (const asset of itemAssets) {
    byUrl.set(asset.url, asset);
  }

  for (const asset of dbAssets) {
    byUrl.set(asset.url, { ...asset, deletable: true });
  }

  return Array.from(byUrl.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

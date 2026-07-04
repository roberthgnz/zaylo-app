import { apiRequest } from "@/lib/api/client";
import type { LocalFile } from "@/lib/core/storage";
import type { ZayloAsset } from "@/lib/domains/assets/types";

export async function getAssets() {
  return apiRequest<ZayloAsset[]>("/api/assets");
}

export async function uploadAsset(file: LocalFile, options: { name?: string } = {}) {
  const formData = new FormData();
  formData.append("file", file as unknown as Blob);
  formData.append("contentType", file.type);
  if (options.name) {
    formData.append("name", options.name);
  }

  return apiRequest<ZayloAsset>("/api/assets", {
    method: "POST",
    body: formData,
  });
}

export async function deleteAsset(assetId: string) {
  await apiRequest<{ ok: true }>(`/api/assets/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });
}

import { apiRequest } from "@/lib/api/client";

// Web builds a Blob from a `blob:`/`data:` URL and appends it to FormData.
// RN has no Blob-from-local-file story the same way — fetch's FormData
// instead accepts a `{ uri, name, type }` object directly for the file part,
// which is the standard RN upload pattern (works with Metro's fetch/FormData
// polyfill against a multipart endpoint like this one).
export type LocalFile = { uri: string; name: string; type: string };

export async function uploadPublicFile(
  path: string,
  file: LocalFile,
  options: { contentType?: string; upsert?: boolean } = {}
) {
  const formData = new FormData();
  formData.append("path", path);
  formData.append("file", file as unknown as Blob);

  if (options.contentType) {
    formData.append("contentType", options.contentType);
  }

  if (typeof options.upsert === "boolean") {
    formData.append("upsert", String(options.upsert));
  }

  const { publicUrl } = await apiRequest<{ publicUrl: string }>("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  return publicUrl;
}

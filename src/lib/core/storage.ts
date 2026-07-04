import { apiRequest } from "@/lib/api/client";

export type LocalFile = { uri: string; name: string; type: string };

export async function localFileToBlob(file: LocalFile) {
  const response = await fetch(file.uri);

  if (!response.ok) {
    throw new Error("Could not read selected file.");
  }

  return response.blob();
}

export async function uploadPublicFile(
  path: string,
  file: LocalFile,
  options: { contentType?: string; upsert?: boolean } = {}
) {
  const blob = await localFileToBlob(file);
  const formData = new FormData();
  formData.append("path", path);
  formData.append("file", blob, file.name);

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

export type MediaKind = "image" | "video";

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm"]);
const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export function isVideoMimeType(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return VIDEO_MIME_TYPES.has(value.trim().toLowerCase());
}

export function getMediaKindFromUrl(value: string | null | undefined): MediaKind {
  if (!value) {
    return "image";
  }

  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();
    const extension = pathname.split(".").pop() ?? "";
    return VIDEO_EXTENSIONS.has(extension) ? "video" : "image";
  } catch {
    return "image";
  }
}

export function isVideoUrl(value: string | null | undefined) {
  return getMediaKindFromUrl(value) === "video";
}

export function getMainMediaPreview(
  mainPhoto?: string | null,
  mainMediaType?: MediaKind | null,
  mainMediaPoster?: string | null,
  mainMediaThumbnails?: string[] | null
) {
  if (mainMediaType === "video") {
    return mainMediaPoster || mainMediaThumbnails?.[0] || null;
  }

  return mainPhoto || null;
}

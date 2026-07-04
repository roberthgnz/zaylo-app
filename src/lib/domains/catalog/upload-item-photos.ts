import { uploadPublicFile } from "@/lib/core/storage";
import type { ItemPhotos } from "@/components/dashboard/ItemForm";

function isStoredUrl(uri: string) {
  return /^https?:\/\//i.test(uri);
}

async function resolvePhoto(photo: NonNullable<ItemPhotos["main"]>, path: string) {
  if (isStoredUrl(photo.uri)) {
    return photo.uri;
  }

  return uploadPublicFile(path, photo, { contentType: photo.type || "image/jpeg" });
}

export async function uploadItemPhotos(photos: ItemPhotos, userId: string, itemId: string) {
  const storageRoot = `users/${userId}`;
  const timestamp = Date.now();

  if (!photos.main) {
    throw new Error("Main photo is required.");
  }

  const mainPhoto = await resolvePhoto(photos.main, `${storageRoot}/items/${itemId}/mainPhoto_${timestamp}`);

  const secondaryUrls = await Promise.all(
    photos.secondary.map((photo, index) =>
      photo ? resolvePhoto(photo, `${storageRoot}/items/${itemId}/photo${index + 1}_${timestamp}`) : Promise.resolve("")
    )
  );

  return {
    mainPhoto,
    photo1: secondaryUrls[0] ?? "",
    photo2: secondaryUrls[1] ?? "",
    photo3: secondaryUrls[2] ?? "",
    photo4: secondaryUrls[3] ?? "",
  };
}

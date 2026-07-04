import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { ItemForm } from "@/components/dashboard/ItemForm";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { createItem } from "@/lib/domains/catalog/client";
import type { ItemInput, ItemStatus } from "@/lib/domains/catalog/types";
import type { ItemFormValues } from "@/lib/domains/catalog/item-form-schema";
import { uploadItemPhotos } from "@/lib/domains/catalog/upload-item-photos";

function newItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function NewItemDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { type } = useLocalSearchParams<{ type?: string }>();

  const handleSubmit = async (data: ItemFormValues, photos: Parameters<typeof uploadItemPhotos>[0], status: ItemStatus) => {
    if (!user?.uid) {
      throw new Error("You must be logged in to create an item.");
    }

    const itemId = newItemId();
    const photoUrls = await uploadItemPhotos(photos, user.uid, itemId);

    const itemData: ItemInput = {
      userId: user.uid,
      name: data.name,
      price: parseFloat(data.price),
      stock: Number.parseInt(data.stock, 10),
      category: data.category,
      size: data.size,
      brand: data.brand || undefined,
      condition: data.condition,
      description: data.description,
      tags: data.tags || undefined,
      promoType: data.promoType || undefined,
      requiresShipping: data.requiresShipping,
      shippingWeightKg:
        !data.requiresShipping || !data.shippingWeightKg ? undefined : Number.parseFloat(data.shippingWeightKg),
      collections: data.collections || undefined,
      sessionType: type || "solo",
      mainPhoto: photoUrls.mainPhoto,
      mainMediaType: "image",
      mainMediaPoster: photoUrls.mainPhoto,
      photo1: photoUrls.photo1,
      photo2: photoUrls.photo2,
      photo3: photoUrls.photo3,
      photo4: photoUrls.photo4,
      status,
    };

    await createItem({ ...itemData, id: itemId });
    await queryClient.invalidateQueries({ queryKey: ["items", "by-user", user.uid] });
    router.replace("/dashboard-store");
  };

  return (
    <ItemForm
      defaultValues={{
        name: "",
        price: "",
        stock: "1",
        category: "",
        size: [],
        brand: "",
        condition: "",
        description: "",
        tags: "",
        promoType: "",
        requiresShipping: true,
        shippingWeightKg: "",
        collections: "",
      }}
      defaultPhotos={{ main: null, secondary: [null, null, null, null] }}
      submitLabel="Publish item"
      submittingLabel="Publishing..."
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}

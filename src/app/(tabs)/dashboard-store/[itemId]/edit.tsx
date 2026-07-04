import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { ItemForm, type ItemPhotos } from "@/components/dashboard/ItemForm";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { updateItem } from "@/lib/domains/catalog/client";
import { useItemByIdQuery } from "@/lib/domains/catalog/queries";
import type { ItemStatus } from "@/lib/domains/catalog/types";
import type { ItemFormValues } from "@/lib/domains/catalog/item-form-schema";
import { uploadItemPhotos } from "@/lib/domains/catalog/upload-item-photos";

function photoValueFor(url?: string): ItemPhotos["main"] {
  return url ? { uri: url, name: "existing", type: "image/jpeg" } : null;
}

export default function EditItemScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const itemQuery = useItemByIdQuery(itemId);
  const item = itemQuery.data;

  const handleSubmit = async (data: ItemFormValues, photos: ItemPhotos, status: ItemStatus) => {
    if (!user?.uid || !item) return;

    const photoUrls = await uploadItemPhotos(photos, user.uid, item.id);

    await updateItem(item.id, {
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
      mainPhoto: photoUrls.mainPhoto,
      mainMediaPoster: photoUrls.mainPhoto,
      photo1: photoUrls.photo1,
      photo2: photoUrls.photo2,
      photo3: photoUrls.photo3,
      photo4: photoUrls.photo4,
      status,
    });

    await queryClient.invalidateQueries({ queryKey: ["items", "by-user", user.uid] });
    await queryClient.invalidateQueries({ queryKey: ["items", "by-id", item.id] });
    router.back();
  };

  if (itemQuery.isLoading || !item) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <View>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ItemForm
      defaultValues={{
        name: item.name,
        price: String(item.price),
        stock: String(item.stock),
        category: item.category,
        size: item.size,
        brand: item.brand ?? "",
        condition: item.condition ?? "",
        description: item.description ?? "",
        tags: item.tags ?? "",
        promoType: item.promoType ?? "",
        requiresShipping: item.requiresShipping ?? true,
        shippingWeightKg: item.shippingWeightKg ? String(item.shippingWeightKg) : "",
        collections: item.collections ?? "",
      }}
      defaultPhotos={{
        main: photoValueFor(item.mainPhoto),
        secondary: [photoValueFor(item.photo1), photoValueFor(item.photo2), photoValueFor(item.photo3), photoValueFor(item.photo4)],
      }}
      defaultStatus={item.status}
      submitLabel="Save changes"
      submittingLabel="Saving..."
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}

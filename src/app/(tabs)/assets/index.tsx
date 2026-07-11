import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { itemPhotosToAssets, mergeUniqueAssets, formatSize, type DisplayAsset } from "@/lib/domains/assets/asset-utils";
import { deleteAssetMutation, uploadAssetMutation, useAssetsQuery } from "@/lib/domains/assets/queries";
import { useItemsByUserQuery } from "@/lib/domains/catalog/queries";

export default function AssetsScreen() {
  const { user } = useCurrentUser();
  const userId = user?.uid;
  const queryClient = useQueryClient();

  const assetsQuery = useAssetsQuery(userId);
  const itemsQuery = useItemsByUserQuery(userId);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [previewAsset, setPreviewAsset] = useState<DisplayAsset | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const assets = useMemo(() => {
    const dbAssets = assetsQuery.data ?? [];
    const itemAssets = itemPhotosToAssets(itemsQuery.data ?? []);
    return mergeUniqueAssets(dbAssets, itemAssets);
  }, [assetsQuery.data, itemsQuery.data]);

  const handleUpload = async () => {
    if (!userId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload assets.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) return;

    setIsUploading(true);
    setUploadError("");
    try {
      for (const asset of result.assets) {
        await uploadAssetMutation(queryClient, userId, {
          uri: asset.uri,
          name: asset.fileName || `asset-${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload asset.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (asset: DisplayAsset) => {
    if (!userId) return;
    Alert.alert("Delete asset", "Remove this asset from your library?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingIds((current) => new Set(current).add(asset.id));
          try {
            await deleteAssetMutation(queryClient, userId, asset.id);
            setPreviewAsset(null);
          } finally {
            setDeletingIds((current) => {
              const next = new Set(current);
              next.delete(asset.id);
              return next;
            });
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <ScrollView contentContainerClassName="gap-4 px-5 pt-6" contentContainerStyle={{ paddingBottom: BottomTabInset }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-black text-text-light dark:text-text-dark">Assets</Text>
          <Button label={isUploading ? "Uploading..." : "Upload"} isLoading={isUploading} onPress={handleUpload} size="sm" />
        </View>

        {uploadError ? <Text className="text-xs text-red-500">{uploadError}</Text> : null}

        {assetsQuery.isLoading ? (
          <ActivityIndicator className="py-8" />
        ) : assets.length === 0 ? (
          <Text className="py-8 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            No assets yet. Upload photos to reuse across items.
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {assets.map((asset) => (
              <Pressable
                key={asset.id}
                onPress={() => setPreviewAsset(asset)}
                className="aspect-square w-[31%] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800"
              >
                <Image
                  source={{ uri: asset.previewUrl || asset.url }}
                  alt={asset.name ?? "asset"}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                {asset.size ? (
                  <View className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5">
                    <Text className="text-[10px] text-white">{formatSize(asset.size)}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!previewAsset} transparent animationType="fade" onRequestClose={() => setPreviewAsset(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/90" onPress={() => setPreviewAsset(null)}>
          {previewAsset ? (
            <View className="w-[90%] gap-3">
              <Image
                source={{ uri: previewAsset.previewUrl || previewAsset.url }}
                alt={previewAsset.name ?? "asset"}
                style={{ width: "100%", aspectRatio: 1 }}
                contentFit="contain"
              />
              <Text className="text-center text-sm text-white">{previewAsset.name}</Text>
              {previewAsset.deletable ? (
                <Button
                  label={deletingIds.has(previewAsset.id) ? "Deleting..." : "Delete"}
                  variant="outline"
                  isLoading={deletingIds.has(previewAsset.id)}
                  onPress={() => handleDelete(previewAsset)}
                />
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

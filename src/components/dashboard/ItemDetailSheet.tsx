import { Image } from "expo-image";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import type { ItemStatus, ZayloItem } from "@/lib/domains/catalog/types";
import { ItemStatusBadge } from "./ItemStatusBadge";

type ItemDetailSheetProps = {
  item: ZayloItem | null;
  onClose: () => void;
  onEdit: (item: ZayloItem) => void;
  onUpdateStatus: (item: ZayloItem, status: ItemStatus) => void;
  onDuplicate: (item: ZayloItem) => void;
  onDelete: (item: ZayloItem) => void;
  isUpdatingStatus?: boolean;
  isDeleting?: boolean;
};

function ActionRow({ label, onPress, tone = "default" }: { label: string; onPress: () => void; tone?: "default" | "danger" }) {
  return (
    <Pressable onPress={onPress} className="border-b border-neutral-100 py-4 dark:border-neutral-800">
      <Text className={tone === "danger" ? "text-[15px] font-semibold text-red-600" : "text-[15px] font-medium text-text-light dark:text-text-dark"}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ItemDetailSheet({
  item,
  onClose,
  onEdit,
  onUpdateStatus,
  onDuplicate,
  onDelete,
  isUpdatingStatus,
  isDeleting,
}: ItemDetailSheetProps) {
  if (!item) return null;

  const confirmDelete = () => {
    Alert.alert("Delete item", `Delete "${item.name}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(item) },
    ]);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <SafeAreaView edges={["bottom"]} className="rounded-t-2xl bg-background-light dark:bg-background-dark">
        <ScrollView className="max-h-[80vh] p-5">
          <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />

          <View className="mb-4 flex-row gap-3">
            <View className="h-16 w-16 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
              {item.mainPhoto ? (
                <Image source={{ uri: item.mainPhoto }} alt={item.name} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="font-display text-lg font-bold text-text-light dark:text-text-dark" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="mb-1 text-text-secondary-light dark:text-text-secondary-dark">${item.price}</Text>
              <ItemStatusBadge status={item.status} />
            </View>
          </View>

          <ActionRow label="Edit" onPress={() => onEdit(item)} />
          {item.status !== "available" ? (
            <ActionRow label="Mark available" onPress={() => onUpdateStatus(item, "available")} />
          ) : (
            <>
              <ActionRow label="Mark reserved" onPress={() => onUpdateStatus(item, "reserved")} />
              <ActionRow label="Mark sold" onPress={() => onUpdateStatus(item, "sold")} />
            </>
          )}
          <ActionRow
            label={item.status === "archived" ? "Unarchive" : "Archive"}
            onPress={() => onUpdateStatus(item, item.status === "archived" ? "available" : "archived")}
          />
          <ActionRow label="Duplicate" onPress={() => onDuplicate(item)} />
          <ActionRow label={isDeleting ? "Deleting..." : "Delete"} onPress={confirmDelete} tone="danger" />

          <Text className="mt-2 text-center text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {isUpdatingStatus ? "Updating..." : " "}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

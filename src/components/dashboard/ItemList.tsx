import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import {
  createItem,
  deleteItem as deleteItemRequest,
  updateItem as updateItemRequest,
} from "@/lib/domains/catalog/client";
import { setItemStatusInCaches } from "@/lib/domains/catalog/queries";
import type { ItemStatus, ZayloItem } from "@/lib/domains/catalog/types";
import { useCurrentUser } from "@/lib/current-user/CurrentUserProvider";
import { Chip } from "@/components/ui/chip";
import { Text } from "@/components/ui/text";
import { ItemCard } from "./ItemCard";
import { ItemDetailSheet } from "./ItemDetailSheet";

const STATUS_FILTERS: Array<{ id: ItemStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "reserved", label: "Reserved" },
  { id: "sold", label: "Sold" },
  { id: "archived", label: "Archived" },
];

export function ItemList({
  items,
  isLoading,
  emptyText = "No items yet.",
}: {
  items: ZayloItem[];
  isLoading: boolean;
  emptyText?: string;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingItem, setViewingItem] = useState<ZayloItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredItems = useMemo(
    () => (statusFilter === "all" ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter]
  );

  const toggleSelection = (itemId: string) => {
    setSelectionMode(true);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleUpdateStatus = async (item: ZayloItem, status: ItemStatus) => {
    setIsUpdatingStatus(true);
    setErrorMsg("");
    try {
      await updateItemRequest(item.id, { status });
      setItemStatusInCaches(queryClient, { itemId: item.id, userId: user?.uid, status });
      setViewingItem(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDuplicate = async (item: ZayloItem) => {
    if (!user?.uid) return;
    try {
      await createItem({ ...item, userId: user.uid, name: `${item.name} (copy)`, status: "available" });
      await queryClient.invalidateQueries({ queryKey: ["items", "by-user", user.uid] });
      setViewingItem(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to duplicate item.");
    }
  };

  const handleDelete = async (item: ZayloItem) => {
    setIsDeleting(true);
    try {
      await deleteItemRequest(item.id);
      await queryClient.invalidateQueries({ queryKey: ["items", "by-user", user?.uid] });
      setViewingItem(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = () => {
    Alert.alert("Delete items", `Delete ${selectedIds.size} item(s)? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            await Promise.all(Array.from(selectedIds).map((id) => deleteItemRequest(id)));
            await queryClient.invalidateQueries({ queryKey: ["items", "by-user", user?.uid] });
            cancelSelection();
          } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : "Failed to delete items.");
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleBulkStatusUpdate = async (status: ItemStatus) => {
    setIsUpdatingStatus(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => updateItemRequest(id, { status })));
      await queryClient.invalidateQueries({ queryKey: ["items", "by-user", user?.uid] });
      cancelSelection();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to update items.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <View>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Chip
            key={filter.id}
            label={filter.label}
            selected={statusFilter === filter.id}
            onPress={() => setStatusFilter(filter.id)}
          />
        ))}
      </View>

      {errorMsg ? <Text className="mb-2 text-xs text-red-500">{errorMsg}</Text> : null}

      {selectionMode ? (
        <View className="mb-3 flex-row items-center justify-between rounded-xl bg-neutral-900 px-4 py-2.5 dark:bg-neutral-100">
          <Text className="text-sm font-semibold text-white dark:text-black">{selectedIds.size} selected</Text>
          <View className="flex-row gap-4">
            <Pressable onPress={() => handleBulkStatusUpdate("archived")}>
              <Text className="text-sm font-semibold text-white dark:text-black">Archive</Text>
            </Pressable>
            <Pressable onPress={handleBulkDelete}>
              <Text className="text-sm font-semibold text-red-400">Delete</Text>
            </Pressable>
            <Pressable onPress={cancelSelection}>
              <Text className="text-sm font-semibold text-white dark:text-black">Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator className="py-8" />
      ) : filteredItems.length === 0 ? (
        <Text className="py-8 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {emptyText}
        </Text>
      ) : (
        filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            selectionMode={selectionMode}
            onPress={() => setViewingItem(item)}
            onToggleSelect={() => toggleSelection(item.id)}
          />
        ))
      )}

      <ItemDetailSheet
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onEdit={(item) => {
          setViewingItem(null);
          router.push({ pathname: "/dashboard-store/[itemId]/edit", params: { itemId: item.id } });
        }}
        onUpdateStatus={handleUpdateStatus}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        isUpdatingStatus={isUpdatingStatus}
        isDeleting={isDeleting}
      />
    </View>
  );
}

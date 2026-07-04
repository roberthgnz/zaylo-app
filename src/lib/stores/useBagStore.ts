import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type BagItem = {
  bagItemId: string;
  id: string;
  slug?: string;
  username: string;
  name: string;
  selectedSize?: string | null;
  price: string | number | null | undefined;
  mainPhoto?: string | null;
  mainMediaType?: "image" | "video";
  mainMediaPoster?: string | null;
  sellerWhatsapp?: string | null;
  currency?: string;
  addedAt: number;
};

type LegacyBagItem = Omit<BagItem, "bagItemId"> & { bagItemId?: string };

type BagState = {
  items: BagItem[];
  addOrUpdateItem: (item: BagItem) => void;
  removeItem: (bagItemId: string) => void;
  clearStore: (username: string) => void;
  clear: () => void;
};

export const useBagStore = create<BagState>()(
  persist(
    (set) => ({
      items: [],
      addOrUpdateItem: (item) =>
        set((state) => ({
          items: [item, ...state.items.filter((existing) => existing.bagItemId !== item.bagItemId)],
        })),
      removeItem: (bagItemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.bagItemId !== bagItemId),
        })),
      clearStore: (username) =>
        set((state) => ({
          items: state.items.filter((item) => item.username !== username),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "zaylo_bag_v1",
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => {
        const state = persistedState as { items?: LegacyBagItem[] } | undefined;
        const items = (state?.items ?? []).map((item) => {
          const computedId = `${item.username}:${item.id}:${item.selectedSize ?? "no-size"}`;
          return {
            ...item,
            bagItemId: item.bagItemId?.startsWith(`${item.username}:`)
              ? item.bagItemId
              : computedId,
          };
        });

        return { items } as BagState;
      },
    }
  )
);

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/ui/form-banner";
import { TextField } from "@/components/ui/text-field";
import { CATEGORIES, CONDITIONS, PROMO_TYPES, SIZE_OPTIONS } from "@/lib/domains/catalog/constants";
import { itemFormSchema, type ItemFormValues } from "@/lib/domains/catalog/item-form-schema";
import type { ItemStatus } from "@/lib/domains/catalog/types";
import { PhotoSlot, type PhotoValue } from "./PhotoSlot";

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={selected ? "rounded-full bg-black px-3 py-1.5 dark:bg-white" : "rounded-full bg-neutral-100 px-3 py-1.5 dark:bg-neutral-800"}
    >
      <Text className={selected ? "text-xs font-semibold text-white dark:text-black" : "text-xs font-semibold text-text-light dark:text-text-dark"}>
        {label}
      </Text>
    </Pressable>
  );
}

export type ItemPhotos = {
  main: PhotoValue;
  secondary: [PhotoValue, PhotoValue, PhotoValue, PhotoValue];
};

export function ItemForm({
  defaultValues,
  defaultPhotos,
  defaultStatus = "available",
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues: ItemFormValues;
  defaultPhotos: ItemPhotos;
  defaultStatus?: ItemStatus;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (data: ItemFormValues, photos: ItemPhotos, status: ItemStatus) => Promise<void>;
  onCancel: () => void;
}) {
  const [mainPhoto, setMainPhoto] = useState<PhotoValue>(defaultPhotos.main);
  const [secondaryPhotos, setSecondaryPhotos] = useState<[PhotoValue, PhotoValue, PhotoValue, PhotoValue]>(
    defaultPhotos.secondary
  );
  const [status, setStatus] = useState<ItemStatus>(defaultStatus);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    mode: "onBlur",
    defaultValues,
  });

  const requiresShipping = watch("requiresShipping");
  const categoryValue = watch("category");

  const submit = async (data: ItemFormValues) => {
    if (!mainPhoto) {
      setErrorMsg("Main photo is required.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await onSubmit(data, { main: mainPhoto, secondary: secondaryPhotos }, status);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to save item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark" edges={["top", "bottom"]}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerClassName="gap-5 px-5 pt-6 pb-6" keyboardShouldPersistTaps="handled">
          {errorMsg ? <FormBanner message={errorMsg} variant="error" /> : null}

          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Status
            </Text>
            <View className="flex-row gap-2">
              {(["available", "reserved", "sold"] as ItemStatus[]).map((s) => (
                <Chip key={s} label={s} selected={status === s} onPress={() => setStatus(s)} />
              ))}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Photos
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <PhotoSlot label="Main" value={mainPhoto} onChange={setMainPhoto} required />
              {(["Photo 2", "Photo 3", "Photo 4", "Photo 5"] as const).map((label, index) => (
                <PhotoSlot
                  key={label}
                  label={label}
                  value={secondaryPhotos[index]}
                  onChange={(value) =>
                    setSecondaryPhotos((current) => {
                      const next = [...current] as typeof current;
                      next[index] = value;
                      return next;
                    })
                  }
                />
              ))}
            </View>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <TextField label="Name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.name?.message} />
              )}
            />

            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <TextField
                  label="Price"
                  keyboardType="decimal-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.price?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="stock"
              render={({ field }) => (
                <TextField
                  label="Stock"
                  keyboardType="number-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.stock?.message}
                />
              )}
            />

            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-text-secondary-light dark:text-text-secondary-dark">
                Category
              </Text>
              <Pressable
                onPress={() => setCategoryPickerOpen(true)}
                className="h-11 flex-row items-center justify-between rounded-lg border border-neutral-300 px-4 dark:border-neutral-700"
              >
                <Text className="text-[15px] text-text-light dark:text-text-dark">
                  {CATEGORIES.find((c) => c.id === categoryValue)?.label || categoryValue || "Select a category"}
                </Text>
                <Text className="text-text-secondary-light dark:text-text-secondary-dark">›</Text>
              </Pressable>
              {errors.category ? <Text className="mt-1.5 text-[13px] text-red-500">{errors.category.message}</Text> : null}
            </View>

            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-text-secondary-light dark:text-text-secondary-dark">Size</Text>
              <Controller
                control={control}
                name="size"
                render={({ field }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {SIZE_OPTIONS.map((size) => {
                      const selected = field.value?.includes(size);
                      return (
                        <Chip
                          key={size}
                          label={size}
                          selected={!!selected}
                          onPress={() =>
                            field.onChange(selected ? field.value.filter((s) => s !== size) : [...(field.value ?? []), size])
                          }
                        />
                      );
                    })}
                  </View>
                )}
              />
              {errors.size ? <Text className="mt-1.5 text-[13px] text-red-500">{errors.size.message}</Text> : null}
            </View>

            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-text-secondary-light dark:text-text-secondary-dark">Condition</Text>
              <Controller
                control={control}
                name="condition"
                render={({ field }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {CONDITIONS.map((condition) => (
                      <Chip
                        key={condition.id}
                        label={condition.label}
                        selected={field.value === condition.id}
                        onPress={() => field.onChange(condition.id)}
                      />
                    ))}
                  </View>
                )}
              />
              {errors.condition ? <Text className="mt-1.5 text-[13px] text-red-500">{errors.condition.message}</Text> : null}
            </View>

            <Controller
              control={control}
              name="brand"
              render={({ field }) => (
                <TextField label="Brand (optional)" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextField
                  label="Description"
                  multiline
                  numberOfLines={4}
                  className="h-auto min-h-28 py-2.5 text-left"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.description?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TextField
                  label="Tags (comma-separated, optional)"
                  placeholder="y2k, oversized, archive"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Controller
              control={control}
              name="collections"
              render={({ field }) => (
                <TextField
                  label="Collections (comma-separated, optional)"
                  placeholder="Drop inicial, Bestsellers"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <View>
              <Text className="mb-2 text-[13px] font-medium text-text-secondary-light dark:text-text-secondary-dark">
                Promo type (optional)
              </Text>
              <Controller
                control={control}
                name="promoType"
                render={({ field }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {PROMO_TYPES.map((promo) => (
                      <Chip
                        key={promo.id}
                        label={promo.label}
                        selected={field.value === promo.id}
                        onPress={() => field.onChange(field.value === promo.id ? "" : promo.id)}
                      />
                    ))}
                  </View>
                )}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-[15px] font-medium text-text-light dark:text-text-dark">Requires shipping</Text>
              <Controller
                control={control}
                name="requiresShipping"
                render={({ field }) => <Switch value={field.value} onValueChange={field.onChange} />}
              />
            </View>

            {requiresShipping ? (
              <Controller
                control={control}
                name="shippingWeightKg"
                render={({ field }) => (
                  <TextField
                    label="Shipping weight (kg, optional)"
                    keyboardType="decimal-pad"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            ) : null}
          </View>
        </ScrollView>

        <View className="flex-row gap-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <Pressable onPress={onCancel} className="h-11 items-center justify-center rounded-lg border border-neutral-300 px-6 dark:border-neutral-700">
            <Text className="text-[15px] font-semibold text-text-light dark:text-text-dark">Cancel</Text>
          </Pressable>
          <Button
            label={isSubmitting ? submittingLabel : submitLabel}
            isLoading={isSubmitting}
            onPress={handleSubmit(submit)}
            className="flex-1"
          />
        </View>
      </KeyboardAvoidingView>

      <Modal visible={categoryPickerOpen} animationType="slide" transparent onRequestClose={() => setCategoryPickerOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setCategoryPickerOpen(false)} />
        <SafeAreaView edges={["bottom"]} className="rounded-t-2xl bg-background-light dark:bg-background-dark">
          <View className="p-5">
            <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <>
                  {CATEGORIES.map((category) => (
                    <Pressable
                      key={category.id}
                      onPress={() => {
                        field.onChange(category.id);
                        setCategoryPickerOpen(false);
                      }}
                      className="border-b border-neutral-100 py-3.5 dark:border-neutral-800"
                    >
                      <Text className="text-[15px] font-medium text-text-light dark:text-text-dark">{category.label}</Text>
                    </Pressable>
                  ))}
                </>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

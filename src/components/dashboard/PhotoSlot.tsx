import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Alert, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export type PhotoValue = { uri: string; name: string; type: string } | null;

async function pickImage(): Promise<PhotoValue> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission needed", "Allow photo library access to add item photos.");
    return null;
  }

  // Web's crop UI is a custom react-easy-crop canvas flow (pick → drag/zoom →
  // canvas render). No RN equivalent without a new dependency — using
  // ImagePicker's native OS crop UI (allowsEditing) instead, same trade-off
  // as the tab icons (native platform affordance over pixel-identical parity).
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 5],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const name = asset.fileName || `photo-${Date.now()}.jpg`;
  const type = asset.mimeType || "image/jpeg";
  return { uri: asset.uri, name, type };
}

export function PhotoSlot({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: PhotoValue;
  onChange: (value: PhotoValue) => void;
  required?: boolean;
}) {
  const handlePress = async () => {
    const picked = await pickImage();
    if (picked) {
      onChange(picked);
    }
  };

  return (
    <View className="w-[30%]">
      <Pressable
        onPress={handlePress}
        className={cn(
          "aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900",
          value && "border-solid"
        )}
      >
        {value ? (
          <Image source={{ uri: value.uri }} alt={label} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <Text className="text-2xl text-neutral-400">+</Text>
        )}
      </Pressable>
      {value ? (
        <Pressable onPress={() => onChange(null)} className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/60">
          <Text className="text-xs font-bold text-white">✕</Text>
        </Pressable>
      ) : null}
      <Text className="mt-1 text-center text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
        {label}
        {required ? " *" : ""}
      </Text>
    </View>
  );
}

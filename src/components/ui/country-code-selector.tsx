import { useMemo, useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";

export interface CountryOption {
  code: CountryCode;
  callingCode: string;
  name: string;
}

interface CountryCodeSelectorProps {
  countries: CountryOption[];
  selectedCountry: CountryCode;
  onSelect: (country: CountryCode) => void;
}

function countryCodeToFlagEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function CountryCodeSelector({ countries, selectedCountry, onSelect }: CountryCodeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => countries.find((country) => country.code === selectedCountry),
    [countries, selectedCountry]
  );

  const filteredCountries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return countries;

    return countries.filter((country) => {
      const codeMatch = country.code.toLowerCase().includes(normalized);
      const dialMatch = country.callingCode.includes(normalized.replace("+", ""));
      const nameMatch = country.name.toLowerCase().includes(normalized);
      return codeMatch || dialMatch || nameMatch;
    });
  }, [countries, query]);

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  const handleSelect = (code: CountryCode) => {
    onSelect(code);
    handleClose();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1.5 px-3 py-2.5"
        accessibilityRole="button"
        accessibilityLabel="Select country code"
      >
        <Text className="text-[18px] leading-none">
          {countryCodeToFlagEmoji(selected?.code ?? selectedCountry)}
        </Text>
        <Text className="text-text-secondary-light dark:text-text-secondary-dark">▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
        <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
        <SafeAreaView
          edges={["bottom"]}
          className="absolute bottom-0 left-0 right-0 max-h-[85%] rounded-t-2xl bg-background-light dark:bg-background-dark"
        >
          <View className="p-5">
            <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <Text className="mb-3 text-xl font-bold text-text-light dark:text-text-dark">
              Country code
            </Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              className="mb-3 h-11 rounded-lg border border-neutral-300 px-3.5 text-[15px] font-sans text-text-light dark:border-neutral-700 dark:text-text-dark"
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              className="max-h-[60vh]"
              ListEmptyComponent={
                <Text className="py-8 text-center text-[15px] text-text-secondary-light dark:text-text-secondary-dark">
                  No countries found.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item.code)}
                  className="flex-row items-center gap-3 border-b border-neutral-100 py-3.5 dark:border-neutral-800"
                >
                  <Text className="text-[20px] leading-none">{countryCodeToFlagEmoji(item.code)}</Text>
                  <Text className="flex-1 text-[15px] font-medium text-text-light dark:text-text-dark" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-[14px] text-text-secondary-light dark:text-text-secondary-dark">
                    +{item.callingCode}
                  </Text>
                  {item.code === selectedCountry ? <Text>✓</Text> : null}
                </Pressable>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

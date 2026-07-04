import { useMemo } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";
import { CountryCodeSelector } from "./country-code-selector";

interface PhoneInputProps extends Omit<TextInputProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: CountryCode;
  label?: string;
  error?: string;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const COUNTRIES = getCountries().map((code) => ({
  code,
  callingCode: getCountryCallingCode(code),
  name: regionNames.of(code) ?? code,
}));

function parsePhoneValue(rawValue: string, fallbackCountry: CountryCode) {
  if (!rawValue) {
    return { country: fallbackCountry, localNumber: "" };
  }

  if (!rawValue.startsWith("+")) {
    return { country: fallbackCountry, localNumber: rawValue };
  }

  const withSpace = COUNTRIES.find((country) => rawValue.startsWith(`+${country.callingCode} `));
  if (withSpace) {
    return {
      country: withSpace.code,
      localNumber: rawValue.slice(withSpace.callingCode.length + 2),
    };
  }

  const withoutSpace = COUNTRIES.find((country) => rawValue.startsWith(`+${country.callingCode}`));
  if (withoutSpace) {
    return {
      country: withoutSpace.code,
      localNumber: rawValue.slice(withoutSpace.callingCode.length + 1).trimStart(),
    };
  }

  return { country: fallbackCountry, localNumber: rawValue.replace(/^\+\d+\s?/, "") };
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "US",
  label,
  error,
  ...rest
}: PhoneInputProps) {
  const parsedValue = useMemo(() => parsePhoneValue(value, defaultCountry), [defaultCountry, value]);
  const country = parsedValue.country;
  const inputValue = parsedValue.localNumber;
  const selectedCountry = useMemo(() => COUNTRIES.find((c) => c.code === country), [country]);
  const selectedCallingCode = selectedCountry?.callingCode ?? getCountryCallingCode(defaultCountry);

  const handleCountrySelect = (c: CountryCode) => {
    const callingCode = `+${getCountryCallingCode(c)}`;
    onChange(`${callingCode} ${inputValue}`);
  };

  const handleInputChange = (text: string) => {
    onChange(`+${selectedCallingCode} ${text}`);
  };

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-[13px] font-medium text-text-secondary-light dark:text-text-secondary-dark">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          "h-11 flex-row items-center rounded-lg border border-neutral-300 dark:border-neutral-700",
          error && "border-red-500"
        )}
      >
        <CountryCodeSelector countries={COUNTRIES} selectedCountry={country} onSelect={handleCountrySelect} />
        <Text className="text-[15px] font-medium text-text-light dark:text-text-dark">
          +{selectedCallingCode}
        </Text>
        <TextInput
          value={inputValue}
          onChangeText={handleInputChange}
          keyboardType="phone-pad"
          placeholderTextColor="#9CA3AF"
          className="ml-2 flex-1 pr-3.5 text-[15px] text-text-light dark:text-text-dark"
          {...rest}
        />
      </View>
      {error ? <Text className="text-[13px] text-red-500">{error}</Text> : null}
    </View>
  );
}

import { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

export type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  containerClassName?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, secureToggle, secureTextEntry, containerClassName, className, ...rest }, ref) => {
    const [revealed, setRevealed] = useState(false);
    const isSecure = secureToggle ? !revealed : secureTextEntry;

    return (
      <View className={cn("gap-1.5", containerClassName)}>
        {label ? (
          <Text className="text-[13px] font-medium text-text-secondary-light dark:text-text-secondary-dark">
            {label}
          </Text>
        ) : null}
        <View className="flex-row items-center">
          <TextInput
            ref={ref}
            className={cn(
              "h-11 flex-1 rounded-lg border border-neutral-300 px-4 text-[15px] text-text-light dark:border-neutral-700 dark:text-text-dark",
              error && "border-red-500",
              className
            )}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={isSecure}
            autoCapitalize="none"
            autoCorrect={false}
            {...rest}
          />
          {secureToggle ? (
            <Pressable
              onPress={() => setRevealed((prev) => !prev)}
              className="absolute right-3"
              accessibilityRole="button"
              accessibilityLabel={revealed ? "Hide password" : "Show password"}
            >
              <Text className="text-[13px] text-text-secondary-light dark:text-text-secondary-dark">
                {revealed ? "Hide" : "Show"}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {error ? <Text className="text-[13px] text-red-500">{error}</Text> : null}
      </View>
    );
  }
);

TextField.displayName = "TextField";

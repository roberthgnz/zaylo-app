import { cva, type VariantProps } from "class-variance-authority";
import { ActivityIndicator, Pressable, type PressableProps } from "react-native";

import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-lg active:opacity-80 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-black dark:bg-white",
        outline: "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black",
        ghost: "bg-transparent",
        link: "bg-transparent",
        cta: "bg-acid-lime active:opacity-80",
      },
      size: {
        default: "h-11 px-8",
        sm: "h-9 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const buttonTextVariants = cva("font-semibold text-[15px]", {
  variants: {
    variant: {
      default: "text-white dark:text-black",
      outline: "text-black dark:text-white",
      ghost: "text-black dark:text-white",
      link: "text-black dark:text-white underline",
      cta: "text-carbon font-semibold",
    },
    size: {
      default: "",
      sm: "text-[13px]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    label: string;
    isLoading?: boolean;
    className?: string;
  };

export function Button({
  label,
  variant,
  size,
  isLoading,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading }}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "cta" ? "#0B0B0B" : variant === "default" ? "#ffffff" : "#000000"}
        />
      ) : (
        <Text className={buttonTextVariants({ variant, size })}>{label}</Text>
      )}
    </Pressable>
  );
}

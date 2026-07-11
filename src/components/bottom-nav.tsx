import { Feather } from '@expo/vector-icons';
import { Children, isValidElement } from 'react';
import { usePathname } from 'expo-router';
import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cn } from '@/lib/utils';

// Full-screen forms/editors where the floating nav would overlap the content
// (matches web's MainLayout `hideBottomNavByRoute`, e.g. new-item steps, item edit).
// Product detail also has its own fixed bottom CTA bar (share/edit/add-to-bag),
// same overlap concern.
const FULLSCREEN_ROUTE_PATTERNS = [
  /^\/new-item\/(format|details)/,
  /^\/dashboard-store\/[^/]+\/edit/,
  /^\/store\/[^/]+\/product\/[^/]+/,
];

/**
 * The floating pill nav bar itself (web parity: `components/BottomNav.tsx`).
 * Renders as the `asChild` target of `<TabList>` — `expo-router/ui` only scans
 * the JSX authored inside `<TabList>` (not this component's own render output)
 * to register tab routes, so it's safe to reshuffle the already-registered
 * `TabTrigger` elements into separate visual groups here.
 */
export function BottomNavList({ children }: TabListProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (FULLSCREEN_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return null;
  }

  const triggers = Children.toArray(children).filter(isValidElement);
  const profileTrigger = triggers.at(-1);
  const groupTriggers = triggers.slice(0, -1);

  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: insets.bottom + Spacing.two }}
      className="absolute bottom-0 w-full flex-row items-center justify-between px-4">
      <View className="flex-row items-center gap-1 rounded-full border border-zinc-200/60 bg-zinc-100/90 px-1.5 py-1.5 shadow-lg dark:border-zinc-800/60 dark:bg-zinc-900/90">
        {groupTriggers}
      </View>
      {profileTrigger}
    </View>
  );
}

type NavIconProps = { icon: keyof typeof Feather.glyphMap; variant?: 'default' | 'cta' };

/** One button inside the floating pill (Home / Store / New Item / Assets). */
export function NavPillButton({
  isFocused,
  icon,
  variant = 'default',
  ...props
}: TabTriggerSlotProps & NavIconProps) {
  const scheme = useColorScheme();

  if (variant === 'cta') {
    return (
      <Pressable
        {...props}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
        className="h-[42px] w-11 items-center justify-center rounded-full bg-acid-lime">
        <Feather name={icon} color="#0B0B0B" size={22} />
      </Pressable>
    );
  }

  const tint = isFocused ? (scheme === 'dark' ? '#ffffff' : '#000000') : '#71717a';

  return (
    <Pressable
      {...props}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      className={cn(
        'h-[42px] w-11 items-center justify-center rounded-full',
        isFocused && 'bg-white shadow-sm dark:bg-black'
      )}>
      <Feather name={icon} color={tint} size={22} />
    </Pressable>
  );
}

/** The standalone circular button (Profile) — mirrors web's right-side "User" circle. */
export function NavCircleButton({ icon, ...props }: TabTriggerSlotProps & NavIconProps) {
  const scheme = useColorScheme();
  const tint = scheme === 'dark' ? '#ffffff' : '#000000';

  return (
    <Pressable
      {...props}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      className="h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-black">
      <Feather name={icon} color={tint} size={20} />
    </Pressable>
  );
}

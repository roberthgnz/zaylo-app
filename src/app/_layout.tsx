import '../global.css';

import { Geist_400Regular, Geist_700Bold, useFonts } from '@expo-google-fonts/geist';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BagSyncProvider } from '@/components/BagSyncProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { CurrentUserProvider, useCurrentUser } from '@/lib/current-user/CurrentUserProvider';
import i18n from '@/lib/i18n';
import { applyPersistedLocale } from '@/lib/i18n/persistLocale';

SplashScreen.preventAutoHideAsync();
void applyPersistedLocale();

function RootNavigator() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return null;
  }

  const onboardingComplete = user?.profile?.onboardingComplete ?? false;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!user && !onboardingComplete}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={!!user && onboardingComplete}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_700Bold,
  });

  // tailwind.config.js sets darkMode: 'class' (avoids a NativeWind web-preview
  // dev-only crash under 'media' — see migration-roadmap.md). 'class' mode
  // doesn't auto-follow the OS the way 'media' did, so bridge it here: this
  // app wants automatic theming (app.json userInterfaceStyle: "automatic"),
  // not a manual toggle, so mirror RN's own useColorScheme() into NativeWind's
  // class flag on every change instead of leaving dark: classes dead.
  useEffect(() => {
    nativewindColorScheme.set(colorScheme === 'dark' ? 'dark' : 'light');
  }, [colorScheme]);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryProvider>
          <CurrentUserProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              {(fontsLoaded || fontError) && <AnimatedSplashOverlay />}
              <BagSyncProvider />
              <RootNavigator />
            </ThemeProvider>
          </CurrentUserProvider>
        </QueryProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

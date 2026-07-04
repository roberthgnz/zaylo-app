import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <QueryProvider>
          <CurrentUserProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AnimatedSplashOverlay />
              <BagSyncProvider />
              <RootNavigator />
            </ThemeProvider>
          </CurrentUserProvider>
        </QueryProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

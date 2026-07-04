import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useCurrentUser } from '@/lib/current-user/CurrentUserProvider';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useCurrentUser();
  const isSeller = user?.profile?.roles?.includes('seller') ?? false;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {isSeller ? (
        <NativeTabs.Trigger name="dashboard-store">
          <NativeTabs.Trigger.Label>Store</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="bag" md="storefront" />
        </NativeTabs.Trigger>
      ) : null}

      {isSeller ? (
        <NativeTabs.Trigger name="new-item">
          <NativeTabs.Trigger.Label>New Item</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="plus.circle" md="add_circle" />
        </NativeTabs.Trigger>
      ) : null}

      {isSeller ? (
        <NativeTabs.Trigger name="assets">
          <NativeTabs.Trigger.Label>Assets</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="photo.on.rectangle" md="photo_library" />
        </NativeTabs.Trigger>
      ) : null}

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

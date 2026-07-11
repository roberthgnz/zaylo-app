import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { BottomNavList, NavCircleButton, NavPillButton } from '@/components/bottom-nav';
import { useCurrentUser } from '@/lib/current-user/CurrentUserProvider';

/**
 * Which tabs exist, for which role — the design/layout itself lives in
 * `bottom-nav.tsx`. Kept as one custom nav (not `NativeTabs`) on every
 * platform so the app always matches the web app's floating pill design
 * (`components/BottomNav.tsx` in the root Next.js repo), not the OS's
 * native tab bar chrome.
 */
export default function AppTabs() {
  const { user } = useCurrentUser();
  const isSeller = user?.profile?.roles?.includes('seller') ?? false;

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <BottomNavList>
          <TabTrigger name="home" href="/" asChild>
            <NavPillButton icon="home" />
          </TabTrigger>

          {isSeller ? (
            <TabTrigger name="dashboard-store" href="/dashboard-store" asChild>
              <NavPillButton icon="grid" />
            </TabTrigger>
          ) : null}

          {isSeller ? (
            <TabTrigger name="new-item" href="/new-item/format" asChild>
              <NavPillButton icon="plus" variant="cta" />
            </TabTrigger>
          ) : null}

          {isSeller ? (
            <TabTrigger name="assets" href="/assets" asChild>
              <NavPillButton icon="image" />
            </TabTrigger>
          ) : null}

          <TabTrigger name="profile" href="/profile" asChild>
            <NavCircleButton icon="user" />
          </TabTrigger>
        </BottomNavList>
      </TabList>
    </Tabs>
  );
}

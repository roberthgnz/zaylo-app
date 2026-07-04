import { DashboardHomeScreen } from '@/components/dashboard/DashboardHomeScreen';
import { HomePlaceholder } from '@/components/home-placeholder';
import { useCurrentUser } from '@/lib/current-user/CurrentUserProvider';

export default function HomeScreen() {
  const { user } = useCurrentUser();
  const isSeller = user?.profile?.roles?.includes('seller') ?? false;

  return isSeller ? <DashboardHomeScreen /> : <HomePlaceholder />;
}

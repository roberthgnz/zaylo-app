import { useRouter } from "expo-router";

/**
 * Web's onboarding API returns a `redirectTo` web path (e.g. "/profile",
 * "/dashboard", "/closet") chosen server-side based on role + completion
 * state. None of those destination screens exist in this app yet (profile,
 * dashboard, and closet are all separate/deferred/excluded phases) — only
 * the onboarding steps themselves do. So: if the response points at another
 * onboarding step, push there; otherwise treat it as "onboarding finished"
 * and do nothing — the root layout's Stack.Protected guard reacts to
 * `onboardingComplete` flipping true (already refreshed by the caller) and
 * swaps away from the (onboarding) group on its own.
 */
export function useOnboardingNav() {
  const router = useRouter();

  const advance = (redirectTo: string) => {
    if (redirectTo === "/onboarding/step-1") {
      router.push("/step-1");
    } else if (redirectTo === "/onboarding/step-2") {
      router.push("/step-2");
    }
  };

  return { advance };
}

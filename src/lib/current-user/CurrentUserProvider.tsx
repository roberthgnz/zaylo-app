import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import { getUserProfile, subscribeUserProfile } from "@/lib/domains/profile/client";
import { toAppUser, type AppUser } from "./current-user";

type CurrentUserState = {
  user: AppUser | null;
  loading: boolean;
};

type AuthUserLike = Pick<User, "id" | "email">;

const CurrentUserContext = createContext<CurrentUserState | null>(null);

function useCurrentUserState(): CurrentUserState {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    userIdRef.current = user?.uid ?? null;
  }, [user?.uid]);

  useEffect(() => {
    let active = true;
    let unsubscribeProfile: (() => void) | undefined;
    let requestId = 0;

    const clearProfileSubscription = () => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
    };

    const loadProfile = async (authUser: AuthUserLike) => {
      const currentRequestId = ++requestId;
      clearProfileSubscription();

      try {
        const profile = await getUserProfile(authUser.id);

        if (!active || currentRequestId !== requestId) {
          return;
        }

        setUser(toAppUser(authUser, profile));
        setLoading(false);

        unsubscribeProfile = subscribeUserProfile(
          authUser.id,
          (nextProfile) => {
            if (active && currentRequestId === requestId) {
              setUser(toAppUser(authUser, nextProfile));
            }
          },
          (profileError) => {
            console.error("Error fetching user profile:", profileError);
          }
        );
      } catch (profileError) {
        if (!active || currentRequestId !== requestId) {
          return;
        }

        console.error("Error fetching user profile:", profileError);
        setUser(toAppUser(authUser, null));
        setLoading(false);
      }
    };

    const loadSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching auth session:", error);
      }

      if (!active) {
        return;
      }

      if (session?.user) {
        await loadProfile(session.user);
      } else {
        ++requestId;
        clearProfileSubscription();
        setUser(null);
        setLoading(false);
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        ++requestId;
        clearProfileSubscription();
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED" && userIdRef.current === session.user.id) {
        return;
      }

      await loadProfile(session.user);
    });

    return () => {
      active = false;
      ++requestId;
      clearProfileSubscription();
      subscription.unsubscribe();
    };
  }, []);

  return useMemo(() => ({ user, loading }), [loading, user]);
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const value = useCurrentUserState();
  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const contextValue = useContext(CurrentUserContext);
  if (!contextValue) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return contextValue;
}

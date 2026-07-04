import type { User } from "@supabase/supabase-js";

import type { ZayloUserProfile } from "@/lib/zaylo/types";

export interface AppUser {
  uid: string;
  email: string | null;
  profile?: ZayloUserProfile | null;
}

export function toAppUser(
  user: Pick<User, "id" | "email">,
  profile?: ZayloUserProfile | null
): AppUser {
  return {
    uid: user.id,
    email: user.email ?? null,
    profile,
  };
}

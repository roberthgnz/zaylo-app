import { apiRequest } from "@/lib/api/client";
import { supabase } from "@/lib/supabase/client";
import { mapProfile } from "@/lib/zaylo/mappers";
import type { DbProfile, ZayloUserProfile } from "@/lib/zaylo/types";

function uniqueChannelName(prefix: "profiles", userId: string) {
  return `${prefix}:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function cleanupChannels(prefix: "profiles", userId: string) {
  const marker = `${prefix}:${userId}`;
  for (const channel of supabase.getChannels()) {
    if (channel.topic.includes(marker)) {
      void supabase.removeChannel(channel);
    }
  }
}

export async function getUserProfile(userId: string) {
  const { profile } = await apiRequest<{ profile: ZayloUserProfile | null }>(
    `/api/profiles/${encodeURIComponent(userId)}`
  );
  return profile;
}

export async function updateUserProfile(userId: string, values: Partial<ZayloUserProfile>) {
  await apiRequest<{ ok: true }>(`/api/profiles/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function isUsernameAvailable(username: string, currentUserId?: string) {
  const searchParams = new URLSearchParams({ username });
  if (currentUserId) {
    searchParams.set("currentUserId", currentUserId);
  }

  const { available } = await apiRequest<{ available: boolean }>(
    `/api/profiles/username-available?${searchParams.toString()}`
  );
  return available;
}

export function subscribeUserProfile(
  userId: string,
  onChange: (profile: ZayloUserProfile | null) => void,
  onError?: (error: unknown) => void
) {
  cleanupChannels("profiles", userId);

  const channel = supabase
    .channel(uniqueChannelName("profiles", userId))
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
      (payload) => {
        onChange(mapProfile((payload.new as DbProfile) || null));
      }
    )
    .subscribe((_status, error) => {
      if (error) {
        onError?.(error);
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

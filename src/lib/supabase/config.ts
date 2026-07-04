export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseStorageBucket =
  process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || "zaylo";

export function assertSupabaseConfigured() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
}

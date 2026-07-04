import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseAnonKey, supabaseUrl } from "./config";
import type { Database } from "./database.types";

export const supabase = createSupabaseClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  }
);

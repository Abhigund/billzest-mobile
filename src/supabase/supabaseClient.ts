import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "../config";
import { logger } from "../utils/logger";

if (__DEV__) {
  logger.log("[Supabase] Initializing client...");
  logger.log("[Supabase] URL:", CONFIG.SUPABASE_URL);
}

export const supabase = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
if (__DEV__) {
  logger.log("[Supabase] Client initialized:", !!supabase);
}

// Optional: specific setup for AppState change handling if needed for refresh
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

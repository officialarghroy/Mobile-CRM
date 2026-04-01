import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/supabaseEnv";

/** Server Components and anon requests (no request-scoped auth cookies). */
export const supabase = createSupabaseJsClient(supabaseUrl, supabaseAnonKey);

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Client Components only: session is stored in browser cookies per Supabase SSR. */
export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient is only available in the browser");
  }
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrlEnv || !supabaseAnonKeyEnv) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseUrl: string = supabaseUrlEnv;
const supabaseAnonKey: string = supabaseAnonKeyEnv;

/** Browser or simple anon usage (no request cookies). Prefer `createSupabaseServerClient` in Server Components and Server Actions. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Called from a Server Component where cookies are read-only. */
        }
      },
    },
  });
}

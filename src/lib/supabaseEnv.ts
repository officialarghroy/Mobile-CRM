const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKeyEnv = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrlEnv || !supabaseAnonKeyEnv) {
  throw new Error(
    "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, save the file, then restart `next dev`."
  );
}

export const supabaseUrl: string = supabaseUrlEnv;
export const supabaseAnonKey: string = supabaseAnonKeyEnv;

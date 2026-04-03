import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_ID = "avatars";

/** Ensures the public avatars bucket exists (idempotent). Requires service-role client. */
export async function ensureAvatarsBucket(admin: SupabaseClient): Promise<void> {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    throw new Error(listError.message);
  }
  if (buckets?.some((b) => b.id === BUCKET_ID)) {
    return;
  }
  const { error: createError } = await admin.storage.createBucket(BUCKET_ID, {
    public: true,
  });
  if (createError) {
    throw new Error(createError.message);
  }
}
